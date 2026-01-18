# OKE Cluster Module - Oracle Container Engine for Kubernetes
# Cricket Feedback System

# ============================================================================
# Data Sources
# ============================================================================

# Get latest Oracle Linux image for worker nodes
data "oci_core_images" "oracle_linux" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Oracle Linux"
  operating_system_version = "8"
  shape                    = var.node_shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"

  filter {
    name   = "display_name"
    values = ["^.*-OKE-.*$"]
    regex  = true
  }
}

# ============================================================================
# OKE Cluster
# ============================================================================

resource "oci_containerengine_cluster" "main" {
  compartment_id     = var.compartment_ocid
  kubernetes_version = var.kubernetes_version
  name               = var.cluster_name
  vcn_id             = var.vcn_id

  cluster_pod_network_options {
    cni_type = "FLANNEL_OVERLAY"
  }

  endpoint_config {
    is_public_ip_enabled = true
    subnet_id            = var.public_subnet_id
  }

  options {
    add_ons {
      is_kubernetes_dashboard_enabled = false
      is_tiller_enabled               = false
    }

    admission_controller_options {
      is_pod_security_policy_enabled = false
    }

    kubernetes_network_config {
      pods_cidr     = "10.244.0.0/16"
      services_cidr = "10.96.0.0/16"
    }

    service_lb_subnet_ids = [var.service_lb_subnet_id]
  }

  freeform_tags = var.freeform_tags
}

# ============================================================================
# Node Pool
# ============================================================================

resource "oci_containerengine_node_pool" "main" {
  cluster_id         = oci_containerengine_cluster.main.id
  compartment_id     = var.compartment_ocid
  kubernetes_version = var.kubernetes_version
  name               = var.node_pool_name

  node_config_details {
    placement_configs {
      availability_domain = var.availability_domain
      subnet_id           = var.private_subnet_id
    }

    size = var.node_pool_size

    freeform_tags = var.freeform_tags
  }

  node_shape = var.node_shape

  dynamic "node_shape_config" {
    for_each = var.node_shape == "VM.Standard.A1.Flex" || can(regex("Flex$", var.node_shape)) ? [1] : []
    content {
      ocpus         = var.node_ocpus
      memory_in_gbs = var.node_memory_gb
    }
  }

  node_source_details {
    image_id    = var.node_image_id != "" ? var.node_image_id : data.oci_core_images.oracle_linux.images[0].id
    source_type = "IMAGE"
  }

  initial_node_labels {
    key   = "app"
    value = var.project_name
  }

  initial_node_labels {
    key   = "environment"
    value = var.environment
  }

  freeform_tags = var.freeform_tags
}

# ============================================================================
# Wait for cluster to be active
# ============================================================================

resource "time_sleep" "wait_for_cluster" {
  depends_on      = [oci_containerengine_cluster.main]
  create_duration = "30s"
}

# ============================================================================
# Get cluster kubeconfig
# ============================================================================

data "oci_containerengine_cluster_kube_config" "main" {
  cluster_id = oci_containerengine_cluster.main.id
  depends_on = [time_sleep.wait_for_cluster]
}
