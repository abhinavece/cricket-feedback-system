# Registry Module Outputs

output "backend_repository_id" {
  description = "Backend repository OCID"
  value       = oci_artifacts_container_repository.backend.id
}

output "backend_repository_name" {
  description = "Backend repository name"
  value       = oci_artifacts_container_repository.backend.display_name
}

output "frontend_repository_id" {
  description = "Frontend repository OCID"
  value       = oci_artifacts_container_repository.frontend.id
}

output "frontend_repository_name" {
  description = "Frontend repository name"
  value       = oci_artifacts_container_repository.frontend.display_name
}

output "mongodb_repository_id" {
  description = "MongoDB repository OCID"
  value       = var.create_mongodb_repo ? oci_artifacts_container_repository.mongodb[0].id : ""
}
