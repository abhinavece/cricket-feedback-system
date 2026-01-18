# Terraform OCI Infrastructure Setup Guide

Complete guide for deploying Cricket Feedback System infrastructure on Oracle Cloud Infrastructure (OCI) using Terraform.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [OCI Account Setup (Manual Steps)](#oci-account-setup-manual-steps)
4. [Terraform Configuration](#terraform-configuration)
5. [Secrets Management](#secrets-management)
6. [Deployment Steps](#deployment-steps)
7. [Post-Deployment Configuration](#post-deployment-configuration)
8. [Troubleshooting](#troubleshooting)
9. [Resource Reference](#resource-reference)

---

## Overview

### What Terraform Creates

| Resource | Description |
|----------|-------------|
| **VCN** | Virtual Cloud Network with public/private subnets |
| **OKE Cluster** | Oracle Container Engine for Kubernetes |
| **Node Pool** | Worker nodes for running containers |
| **Container Registry** | OCI Container Registry repositories |
| **Kubernetes Resources** | Namespace, secrets, Helm release |

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                              OCI Region                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                         VCN (10.0.0.0/16)                      │  │
│  │                                                                 │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │  │
│  │  │  Public Subnet  │  │ Private Subnet  │  │   LB Subnet    │  │  │
│  │  │   10.0.1.0/24   │  │   10.0.2.0/24   │  │  10.0.3.0/24   │  │  │
│  │  │                 │  │                 │  │                │  │  │
│  │  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌────────────┐ │  │  │
│  │  │ │   K8s API   │ │  │ │Worker Nodes │ │  │ │Load Balancer│ │  │  │
│  │  │ │  Endpoint   │ │  │ │   (OKE)     │ │  │ │  (Ingress) │ │  │  │
│  │  │ └─────────────┘ │  │ └─────────────┘ │  │ └────────────┘ │  │  │
│  │  └─────────────────┘  └─────────────────┘  └────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    OCI Container Registry                        ││
│  │  ┌─────────────────────┐  ┌─────────────────────┐               ││
│  │  │ cricket-feedback-   │  │ cricket-feedback-   │               ││
│  │  │     backend         │  │     frontend        │               ││
│  │  └─────────────────────┘  └─────────────────────┘               ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Tools

| Tool | Version | Installation |
|------|---------|--------------|
| **Terraform** | >= 1.5.0 | [terraform.io/downloads](https://www.terraform.io/downloads) |
| **OCI CLI** | Latest | [OCI CLI Install](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm) |
| **kubectl** | >= 1.28 | [kubernetes.io/docs/tasks/tools](https://kubernetes.io/docs/tasks/tools/) |
| **Helm** | >= 3.0 | [helm.sh/docs/intro/install](https://helm.sh/docs/intro/install/) |

### Verify Installation

```bash
# Check Terraform
terraform version

# Check OCI CLI
oci --version

# Check kubectl
kubectl version --client

# Check Helm
helm version
```

---

## OCI Account Setup (Manual Steps)

### ⚠️ These steps MUST be completed manually before running Terraform

### Step 1: Create OCI Account

1. Go to [cloud.oracle.com](https://cloud.oracle.com)
2. Sign up for an account (Free Tier available)
3. Complete identity verification

### Step 2: Create Compartment

1. Navigate to **Identity & Security** → **Compartments**
2. Click **Create Compartment**
3. Name: `cricket-feedback` (or your preferred name)
4. Note the **Compartment OCID** (starts with `ocid1.compartment.oc1..`)

### Step 3: Create API Key

1. Navigate to **Profile** (top-right) → **User Settings**
2. Under **API Keys**, click **Add API Key**
3. Choose **Generate API Key Pair**
4. Download both private and public keys
5. Move private key to `~/.oci/oci_api_key.pem`
6. Set permissions: `chmod 600 ~/.oci/oci_api_key.pem`
7. Note the **Fingerprint** shown after adding the key

### Step 4: Configure OCI CLI

```bash
# Run OCI setup
oci setup config

# This will prompt for:
# - User OCID (from User Settings page)
# - Tenancy OCID (from Tenancy Details page)
# - Region (e.g., us-phoenix-1)
# - Path to API key
```

### Step 5: Create Auth Token (for Container Registry)

1. Navigate to **Profile** → **User Settings**
2. Under **Auth Tokens**, click **Generate Token**
3. Description: `terraform-ocir`
4. **COPY THE TOKEN IMMEDIATELY** - it won't be shown again!
5. Store securely (you'll need this for pushing images)

### Step 6: Gather Required OCIDs

| Value | Where to Find |
|-------|---------------|
| **Tenancy OCID** | Governance → Tenancy Details |
| **User OCID** | Profile → User Settings |
| **Compartment OCID** | Identity → Compartments → Your Compartment |
| **Fingerprint** | Profile → User Settings → API Keys |

---

## Terraform Configuration

### Directory Structure

```
infra/terraform/
├── main.tf                 # Root module configuration
├── variables.tf            # Input variables
├── outputs.tf              # Output values
├── versions.tf             # Provider versions
├── backend.tf              # State backend config
├── terraform.tfvars.example # Example variables
├── deploy.sh               # Deployment script
├── .gitignore             # Git ignore rules
├── modules/
│   ├── network/           # VCN, subnets, security
│   ├── oke/               # OKE cluster
│   ├── registry/          # Container registry
│   └── kubernetes/        # K8s resources & Helm
└── environments/
    ├── dev/               # Development config
    │   ├── main.tf
    │   ├── variables.tf
    │   ├── outputs.tf
    │   └── terraform.tfvars.example
    └── prod/              # Production config
        ├── main.tf
        ├── variables.tf
        ├── outputs.tf
        └── terraform.tfvars.example
```

### Configure Variables

```bash
# Navigate to environment directory
cd infra/terraform/environments/dev

# Copy example file
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
vim terraform.tfvars
```

---

## Secrets Management

### ⚠️ IMPORTANT: Never commit secrets to version control!

### Option 1: Environment Variables (Recommended)

```bash
# Export secrets before running Terraform
export TF_VAR_mongodb_password="your-secure-password"
export TF_VAR_jwt_secret="your-jwt-secret-min-32-chars"
export TF_VAR_google_client_id="your-google-oauth-client-id"
export TF_VAR_google_client_secret="your-google-oauth-secret"
export TF_VAR_whatsapp_access_token="your-whatsapp-api-token"
export TF_VAR_whatsapp_phone_number_id="your-phone-number-id"
export TF_VAR_admin_password="your-admin-password"

# For OCIR authentication
export TF_VAR_ocir_username="your-oci-username"
export TF_VAR_ocir_auth_token="your-auth-token"
```

### Option 2: Secrets File (Development Only)

Create `secrets.tfvars` (add to .gitignore):

```hcl
mongodb_password         = "your-password"
jwt_secret               = "your-jwt-secret"
google_client_id         = "your-client-id"
google_client_secret     = "your-client-secret"
whatsapp_access_token    = "your-token"
whatsapp_phone_number_id = "your-phone-id"
admin_password           = "your-admin-password"
```

Then run: `terraform apply -var-file="secrets.tfvars"`

### Option 3: OCI Vault (Production)

For production, consider using OCI Vault for secrets management:

1. Create vault in OCI Console
2. Store secrets in vault
3. Reference secrets using data sources in Terraform

### Required Secrets Reference

| Secret | Description | Where to Get |
|--------|-------------|--------------|
| `mongodb_password` | MongoDB root password | Generate secure password |
| `jwt_secret` | JWT signing key (32+ chars) | Generate random string |
| `google_client_id` | Google OAuth Client ID | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `google_client_secret` | Google OAuth Secret | Google Cloud Console |
| `whatsapp_access_token` | WhatsApp API Token | [Meta for Developers](https://developers.facebook.com) |
| `whatsapp_phone_number_id` | WhatsApp Phone ID | Meta for Developers |
| `admin_password` | Admin dashboard password | Generate secure password |
| `ocir_username` | OCI username | Your OCI login |
| `ocir_auth_token` | OCIR auth token | Created in Step 5 above |

---

## Deployment Steps

### Quick Start

```bash
# Navigate to Terraform directory
cd infra/terraform

# Make deploy script executable
chmod +x deploy.sh

# Initialize (first time only)
./deploy.sh dev init

# Preview changes
./deploy.sh dev plan

# Apply changes
./deploy.sh dev apply

# Or with auto-approve
./deploy.sh dev apply -auto-approve
```

### Step-by-Step Deployment

#### 1. Initialize Terraform

```bash
cd infra/terraform/environments/dev
terraform init
```

#### 2. Validate Configuration

```bash
terraform validate
```

#### 3. Review Plan

```bash
terraform plan -out=tfplan
```

#### 4. Apply Changes

```bash
# Interactive (recommended for first deployment)
terraform apply tfplan

# Or auto-approve (for CI/CD)
terraform apply -auto-approve
```

#### 5. Configure kubectl

After successful apply, configure kubectl:

```bash
# Get the command from Terraform output
terraform output kubeconfig_command

# Run the outputted command, e.g.:
oci ce cluster create-kubeconfig \
  --cluster-id <cluster-ocid> \
  --file $HOME/.kube/config \
  --region us-phoenix-1 \
  --token-version 2.0.0 \
  --kube-endpoint PUBLIC_ENDPOINT
```

#### 6. Verify Deployment

```bash
# Check nodes
kubectl get nodes

# Check pods
kubectl get pods -n cricket-feedback

# Check services
kubectl get services -n cricket-feedback

# Check ingress
kubectl get ingress -n cricket-feedback
```

---

## Post-Deployment Configuration

### 1. Push Container Images

```bash
# Login to OCIR
docker login phx.ocir.io -u "<namespace>/<username>"
# Enter auth token when prompted

# Tag and push backend
docker tag cricket-feedback-backend:latest \
  phx.ocir.io/<namespace>/cricket-feedback-backend:v1
docker push phx.ocir.io/<namespace>/cricket-feedback-backend:v1

# Tag and push frontend
docker tag cricket-feedback-frontend:latest \
  phx.ocir.io/<namespace>/cricket-feedback-frontend:v1
docker push phx.ocir.io/<namespace>/cricket-feedback-frontend:v1
```

### 2. Update Image Tags

```bash
# Update to use new image tags
terraform apply -var="backend_image_tag=v1" -var="frontend_image_tag=v1"
```

### 3. Configure DNS (Production)

1. Get Load Balancer IP:
   ```bash
   kubectl get ingress -n cricket-feedback -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}'
   ```

2. Create DNS A record pointing your domain to this IP

### 4. Enable TLS (Production)

1. Install cert-manager:
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

2. Update Terraform with `enable_tls = true`

3. Apply changes:
   ```bash
   terraform apply -var="enable_tls=true"
   ```

---

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

```
Error: 401 - Not Authenticated
```

**Solution**: Verify OCI CLI configuration:
```bash
oci iam user get --user-id <your-user-ocid>
```

#### 2. Quota Exceeded

```
Error: Out of host capacity
```

**Solution**: 
- Try different availability domain
- Request quota increase in OCI Console
- Use smaller node shape

#### 3. Image Pull Errors

```
Error: ImagePullBackOff
```

**Solution**:
1. Verify OCIR credentials secret exists
2. Check image path is correct
3. Ensure image is pushed to registry

```bash
# Check secret
kubectl get secret ocir-creds -n cricket-feedback -o yaml

# Check pod events
kubectl describe pod <pod-name> -n cricket-feedback
```

#### 4. Cluster Not Ready

```
Error: cluster is not active
```

**Solution**: Wait for cluster provisioning (can take 10-15 minutes)

```bash
# Check cluster status
oci ce cluster get --cluster-id <cluster-ocid> --query 'data."lifecycle-state"'
```

### Useful Debug Commands

```bash
# View all Terraform outputs
terraform output

# Check Terraform state
terraform state list

# View specific resource
terraform state show module.oke.oci_containerengine_cluster.main

# Force unlock state (if locked)
terraform force-unlock <lock-id>
```

---

## Resource Reference

### Destroying Infrastructure

```bash
# Preview destruction
./deploy.sh dev plan -destroy

# Destroy all resources
./deploy.sh dev destroy

# Or with auto-approve (DANGEROUS!)
./deploy.sh dev destroy -auto-approve
```

### Updating Infrastructure

```bash
# Update image tags
terraform apply -var="backend_image_tag=v16" -var="frontend_image_tag=v11"

# Scale node pool
terraform apply -var="node_pool_size=3"

# Update Kubernetes version (with caution)
terraform apply -var="kubernetes_version=v1.29.0"
```

### Cost Estimation

| Resource | Free Tier | Approximate Cost |
|----------|-----------|------------------|
| OKE Cluster | Control plane free | $0 |
| VM.Standard.A1.Flex | 4 OCPUs, 24GB free | $0 (within limits) |
| Load Balancer | 1 flexible LB | ~$10/month |
| Block Storage | 200GB free | $0 (within limits) |
| Container Registry | 500MB free | $0 (within limits) |

### Support Resources

- [OCI Documentation](https://docs.oracle.com/en-us/iaas/Content/home.htm)
- [Terraform OCI Provider](https://registry.terraform.io/providers/oracle/oci/latest/docs)
- [OKE Documentation](https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm)
- [OCI Free Tier](https://www.oracle.com/cloud/free/)

---

## Quick Reference Commands

```bash
# Initialize
./deploy.sh dev init

# Plan
./deploy.sh dev plan

# Apply
./deploy.sh dev apply

# Destroy
./deploy.sh dev destroy

# Get outputs
./deploy.sh dev output

# Configure kubectl
$(terraform output -raw kubeconfig_command)

# Check cluster
kubectl get nodes
kubectl get pods -n cricket-feedback

# View logs
kubectl logs -n cricket-feedback -l app.kubernetes.io/name=cricket-feedback-backend
```
