# OKE Module Variables

variable "compartment_ocid" {
  description = "OCI Compartment OCID"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cluster_name" {
  description = "OKE cluster name"
  type        = string
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "v1.28.2"
}

variable "vcn_id" {
  description = "VCN OCID"
  type        = string
}

variable "public_subnet_id" {
  description = "Public subnet OCID for Kubernetes API endpoint"
  type        = string
}

variable "private_subnet_id" {
  description = "Private subnet OCID for worker nodes"
  type        = string
}

variable "service_lb_subnet_id" {
  description = "Subnet OCID for load balancer services"
  type        = string
}

variable "node_pool_name" {
  description = "Node pool name"
  type        = string
  default     = "default-pool"
}

variable "node_pool_size" {
  description = "Number of nodes in the pool"
  type        = number
  default     = 2
}

variable "node_shape" {
  description = "Shape for worker nodes"
  type        = string
  default     = "VM.Standard.A1.Flex"
}

variable "node_ocpus" {
  description = "Number of OCPUs per node (for flex shapes)"
  type        = number
  default     = 1
}

variable "node_memory_gb" {
  description = "Memory in GB per node (for flex shapes)"
  type        = number
  default     = 6
}

variable "node_image_id" {
  description = "OCID of the node image"
  type        = string
  default     = ""
}

variable "availability_domain" {
  description = "Availability domain for nodes"
  type        = string
}

variable "freeform_tags" {
  description = "Freeform tags"
  type        = map(string)
  default     = {}
}
