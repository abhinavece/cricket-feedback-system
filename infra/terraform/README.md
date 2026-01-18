# Terraform Infrastructure for Cricket Feedback System

Infrastructure as Code (IaC) for deploying Cricket Feedback System on Oracle Cloud Infrastructure (OCI).

## Quick Start

```bash
# 1. Navigate to environment directory
cd infra/terraform/environments/dev

# 2. Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your OCI credentials

# 3. Set secrets via environment variables
export TF_VAR_mongodb_password="your-password"
export TF_VAR_jwt_secret="your-jwt-secret"
export TF_VAR_google_client_id="your-google-client-id"
export TF_VAR_google_client_secret="your-google-secret"
export TF_VAR_whatsapp_access_token="your-whatsapp-token"
export TF_VAR_whatsapp_phone_number_id="your-phone-id"
export TF_VAR_admin_password="your-admin-password"

# 4. Initialize and apply
terraform init
terraform plan
terraform apply
```

Or use the deployment script:

```bash
chmod +x infra/terraform/deploy.sh
./infra/terraform/deploy.sh dev init
./infra/terraform/deploy.sh dev plan
./infra/terraform/deploy.sh dev apply
```

## Structure

```
terraform/
├── main.tf                 # Root module
├── variables.tf            # Variables
├── outputs.tf              # Outputs
├── versions.tf             # Provider versions
├── backend.tf              # State backend
├── deploy.sh               # Deployment script
├── modules/
│   ├── network/           # VCN, subnets, security lists
│   ├── oke/               # OKE cluster and node pool
│   ├── registry/          # Container registry
│   └── kubernetes/        # K8s namespace, secrets, Helm
└── environments/
    ├── dev/               # Development environment
    └── prod/              # Production environment
```

## Prerequisites

1. **OCI Account** with compartment created
2. **OCI CLI** configured with API key
3. **Terraform** >= 1.5.0
4. **kubectl** and **Helm** installed

## Documentation

For complete setup instructions, see:
- [Terraform OCI Setup Guide](../../docs/deployment/terraform-oci-setup.md)

## What Gets Created

- VCN with public/private subnets
- Internet Gateway and NAT Gateway
- Security Lists
- OKE Cluster with Node Pool
- Container Registry repositories
- Kubernetes namespace and secrets
- Helm release of the application

## Environments

| Environment | Config | Use Case |
|-------------|--------|----------|
| `dev` | Smaller nodes, no TLS | Development/Testing |
| `prod` | Larger nodes, TLS enabled | Production |

## Commands

```bash
# Initialize
./deploy.sh <env> init

# Plan changes
./deploy.sh <env> plan

# Apply changes
./deploy.sh <env> apply

# Destroy (careful!)
./deploy.sh <env> destroy

# View outputs
./deploy.sh <env> output
```

## Secrets

Set via environment variables (recommended):

```bash
export TF_VAR_<variable_name>="value"
```

See `terraform.tfvars.example` for all required variables.
