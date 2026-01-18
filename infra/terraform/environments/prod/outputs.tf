# Production Environment Outputs

output "cluster_id" {
  description = "OKE Cluster OCID"
  value       = module.cricket_feedback.cluster_id
}

output "cluster_endpoint" {
  description = "Kubernetes API endpoint"
  value       = module.cricket_feedback.cluster_endpoint
}

output "kubeconfig_command" {
  description = "Command to configure kubectl"
  value       = module.cricket_feedback.cluster_kubeconfig_command
}

output "application_url" {
  description = "Application URL"
  value       = module.cricket_feedback.application_url
}

output "registry_url" {
  description = "Container registry URL"
  value       = module.cricket_feedback.registry_url
}

output "quick_start" {
  description = "Quick start commands"
  value       = module.cricket_feedback.quick_start_commands
}
