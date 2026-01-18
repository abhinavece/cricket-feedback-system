# Kubernetes Module Outputs

output "namespace" {
  description = "Kubernetes namespace"
  value       = kubernetes_namespace.app.metadata[0].name
}

output "helm_release_name" {
  description = "Helm release name"
  value       = helm_release.cricket_feedback.name
}

output "helm_release_status" {
  description = "Helm release status"
  value       = helm_release.cricket_feedback.status
}

output "helm_release_version" {
  description = "Helm release version"
  value       = helm_release.cricket_feedback.version
}

output "secrets_created" {
  description = "List of created secrets"
  value = [
    kubernetes_secret.ocir_creds.metadata[0].name,
    kubernetes_secret.app_secrets.metadata[0].name,
    kubernetes_secret.whatsapp_creds.metadata[0].name,
    kubernetes_secret.mongodb_creds.metadata[0].name
  ]
}
