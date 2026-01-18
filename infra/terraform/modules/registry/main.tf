# Container Registry Module - OCI Container Registry
# Cricket Feedback System

# ============================================================================
# Backend Container Repository
# ============================================================================

resource "oci_artifacts_container_repository" "backend" {
  compartment_id = var.compartment_ocid
  display_name   = "${var.project_name}-backend"
  is_public      = var.is_public
  is_immutable   = false

  readme {
    content = base64encode("Backend container images for ${var.project_name}")
    format  = "text/plain"
  }
}

# ============================================================================
# Frontend Container Repository
# ============================================================================

resource "oci_artifacts_container_repository" "frontend" {
  compartment_id = var.compartment_ocid
  display_name   = "${var.project_name}-frontend"
  is_public      = var.is_public
  is_immutable   = false

  readme {
    content = base64encode("Frontend container images for ${var.project_name}")
    format  = "text/plain"
  }
}

# ============================================================================
# MongoDB Container Repository (optional, for custom MongoDB images)
# ============================================================================

resource "oci_artifacts_container_repository" "mongodb" {
  count          = var.create_mongodb_repo ? 1 : 0
  compartment_id = var.compartment_ocid
  display_name   = "${var.project_name}-mongodb"
  is_public      = var.is_public
  is_immutable   = false

  readme {
    content = base64encode("MongoDB container images for ${var.project_name}")
    format  = "text/plain"
  }
}
