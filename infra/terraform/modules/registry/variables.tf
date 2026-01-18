# Registry Module Variables

variable "compartment_ocid" {
  description = "OCI Compartment OCID"
  type        = string
}

variable "project_name" {
  description = "Project name for repository naming"
  type        = string
}

variable "is_public" {
  description = "Whether repositories are public"
  type        = bool
  default     = false
}

variable "create_mongodb_repo" {
  description = "Whether to create MongoDB repository"
  type        = bool
  default     = false
}

variable "freeform_tags" {
  description = "Freeform tags"
  type        = map(string)
  default     = {}
}
