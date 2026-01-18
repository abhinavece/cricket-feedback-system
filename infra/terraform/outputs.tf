# Root Outputs for Cricket Feedback System
# OCI Infrastructure

# ============================================================================
# Network Outputs
# ============================================================================

output "vcn_id" {
  description = "VCN OCID"
  value       = module.network.vcn_id
}

output "public_subnet_id" {
  description = "Public subnet OCID"
  value       = module.network.public_subnet_id
}

output "private_subnet_id" {
  description = "Private subnet OCID"
  value       = module.network.private_subnet_id
}

# ============================================================================
# OKE Cluster Outputs
# ============================================================================

output "cluster_id" {
  description = "OKE Cluster OCID"
  value       = module.oke.cluster_id
}

output "cluster_name" {
  description = "OKE Cluster name"
  value       = module.oke.cluster_name
}

output "cluster_endpoint" {
  description = "OKE Cluster Kubernetes API endpoint"
  value       = module.oke.cluster_endpoint
}

output "cluster_kubeconfig_command" {
  description = "Command to configure kubectl"
  value       = "oci ce cluster create-kubeconfig --cluster-id ${module.oke.cluster_id} --file $HOME/.kube/config --region ${var.region} --token-version 2.0.0 --kube-endpoint PUBLIC_ENDPOINT"
}

output "node_pool_id" {
  description = "Node pool OCID"
  value       = module.oke.node_pool_id
}

# ============================================================================
# Container Registry Outputs
# ============================================================================

output "registry_url" {
  description = "OCI Container Registry URL"
  value       = local.registry_url
}

output "registry_namespace" {
  description = "OCI Container Registry namespace"
  value       = data.oci_objectstorage_namespace.ns.namespace
}

output "backend_repository_path" {
  description = "Full path for backend container image"
  value       = var.create_container_registry ? "${local.registry_url}/${data.oci_objectstorage_namespace.ns.namespace}/${var.project_name}-backend" : ""
}

output "frontend_repository_path" {
  description = "Full path for frontend container image"
  value       = var.create_container_registry ? "${local.registry_url}/${data.oci_objectstorage_namespace.ns.namespace}/${var.project_name}-frontend" : ""
}

# ============================================================================
# Application Outputs
# ============================================================================

output "application_url" {
  description = "Application URL"
  value       = var.deploy_application && var.ingress_host != "" ? (var.enable_tls ? "https://${var.ingress_host}" : "http://${var.ingress_host}") : "Configure ingress_host to get URL"
}

output "helm_release_name" {
  description = "Helm release name"
  value       = var.deploy_application ? module.kubernetes[0].helm_release_name : ""
}

# ============================================================================
# Quick Start Commands
# ============================================================================

output "quick_start_commands" {
  description = "Quick start commands after deployment"
  value       = <<-EOT
    
    # 1. Configure kubectl
    oci ce cluster create-kubeconfig --cluster-id ${module.oke.cluster_id} --file $HOME/.kube/config --region ${var.region} --token-version 2.0.0 --kube-endpoint PUBLIC_ENDPOINT

    # 2. Verify cluster access
    kubectl get nodes
    kubectl get pods -n cricket-feedback

    # 3. Check application status
    kubectl get ingress -n cricket-feedback
    kubectl get services -n cricket-feedback

    # 4. View logs
    kubectl logs -n cricket-feedback -l app.kubernetes.io/name=cricket-feedback-backend --tail=100

    # 5. Port forward for local testing
    kubectl port-forward service/cricket-feedback-backend-service 5001:5001 -n cricket-feedback
  EOT
}
