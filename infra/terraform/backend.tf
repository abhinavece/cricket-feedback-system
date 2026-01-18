# Terraform Backend Configuration
# Cricket Feedback System - Remote State Management

# ============================================================================
# OCI Object Storage Backend (Recommended for OCI)
# ============================================================================
# Uncomment and configure for remote state storage in OCI Object Storage

# terraform {
#   backend "s3" {
#     bucket                      = "terraform-state-cricket-feedback"
#     key                         = "cricket-feedback/terraform.tfstate"
#     region                      = "us-phoenix-1"
#     endpoint                    = "https://axkw6whnjncs.compat.objectstorage.us-phoenix-1.oraclecloud.com"
#     skip_region_validation      = true
#     skip_credentials_validation = true
#     skip_metadata_api_check     = true
#     force_path_style            = true
#     # Authentication via environment variables:
#     # AWS_ACCESS_KEY_ID = <OCI Customer Secret Key Access Key>
#     # AWS_SECRET_ACCESS_KEY = <OCI Customer Secret Key>
#   }
# }

# ============================================================================
# Local Backend (Default - for development)
# ============================================================================
# State is stored locally in terraform.tfstate
# This is the default when no backend is configured

# ============================================================================
# HTTP Backend (Alternative)
# ============================================================================
# For GitLab or other HTTP-based state storage

# terraform {
#   backend "http" {
#     address        = "https://gitlab.com/api/v4/projects/<project-id>/terraform/state/cricket-feedback"
#     lock_address   = "https://gitlab.com/api/v4/projects/<project-id>/terraform/state/cricket-feedback/lock"
#     unlock_address = "https://gitlab.com/api/v4/projects/<project-id>/terraform/state/cricket-feedback/lock"
#     username       = "<gitlab-username>"
#     password       = "<gitlab-personal-access-token>"
#     lock_method    = "POST"
#     unlock_method  = "DELETE"
#   }
# }

# ============================================================================
# Setup Instructions for OCI Object Storage Backend
# ============================================================================
# 
# 1. Create an Object Storage bucket:
#    oci os bucket create --compartment-id <compartment-ocid> --name terraform-state-cricket-feedback
#
# 2. Create Customer Secret Keys for S3 compatibility:
#    oci iam customer-secret-key create --user-id <user-ocid> --display-name "terraform-state"
#
# 3. Set environment variables:
#    export AWS_ACCESS_KEY_ID="<access-key-from-step-2>"
#    export AWS_SECRET_ACCESS_KEY="<secret-key-from-step-2>"
#
# 4. Uncomment the s3 backend configuration above and update:
#    - bucket name
#    - region
#    - endpoint (replace 'axkw6whnjncs' with your namespace)
#
# 5. Initialize Terraform:
#    terraform init -reconfigure
