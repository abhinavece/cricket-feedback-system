# OKE Module Outputs

output "cluster_id" {
  description = "OKE Cluster OCID"
  value       = oci_containerengine_cluster.main.id
}

output "cluster_name" {
  description = "OKE Cluster name"
  value       = oci_containerengine_cluster.main.name
}

output "cluster_endpoint" {
  description = "Kubernetes API endpoint"
  value       = oci_containerengine_cluster.main.endpoints[0].public_endpoint
}

output "cluster_ca_certificate" {
  description = "Cluster CA certificate (base64 encoded)"
  value       = oci_containerengine_cluster.main.endpoints[0].public_endpoint != "" ? base64encode(lookup(data.oci_containerengine_cluster_kube_config.main.content, "certificate-authority-data", "")) : ""
  sensitive   = true
}

output "cluster_kubernetes_version" {
  description = "Kubernetes version"
  value       = oci_containerengine_cluster.main.kubernetes_version
}

output "node_pool_id" {
  description = "Node pool OCID"
  value       = oci_containerengine_node_pool.main.id
}

output "node_pool_name" {
  description = "Node pool name"
  value       = oci_containerengine_node_pool.main.name
}

output "kubeconfig" {
  description = "Kubeconfig content"
  value       = data.oci_containerengine_cluster_kube_config.main.content
  sensitive   = true
}
