#!/bin/bash
# Terraform Deployment Script for Cricket Feedback System
# Usage: ./deploy.sh <environment> <action>
# Example: ./deploy.sh dev plan

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Help function
show_help() {
    echo -e "${BLUE}Cricket Feedback System - Terraform Deployment${NC}"
    echo ""
    echo "Usage: $0 <environment> <action> [options]"
    echo ""
    echo "Environments:"
    echo "  dev         Development environment"
    echo "  prod        Production environment"
    echo "  root        Root module (direct deployment)"
    echo ""
    echo "Actions:"
    echo "  init        Initialize Terraform"
    echo "  plan        Show execution plan"
    echo "  apply       Apply changes"
    echo "  destroy     Destroy infrastructure"
    echo "  output      Show outputs"
    echo "  validate    Validate configuration"
    echo "  fmt         Format Terraform files"
    echo ""
    echo "Options:"
    echo "  -auto       Auto-approve (skip confirmation)"
    echo "  -target=X   Target specific resource"
    echo ""
    echo "Examples:"
    echo "  $0 dev init"
    echo "  $0 dev plan"
    echo "  $0 dev apply -auto"
    echo "  $0 prod plan"
    echo "  $0 prod destroy"
}

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        echo -e "${RED}Error: Terraform is not installed${NC}"
        echo "Install from: https://www.terraform.io/downloads"
        exit 1
    fi
    
    # Check OCI CLI
    if ! command -v oci &> /dev/null; then
        echo -e "${YELLOW}Warning: OCI CLI is not installed${NC}"
        echo "Install from: https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm"
    fi
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        echo -e "${YELLOW}Warning: kubectl is not installed${NC}"
        echo "Install from: https://kubernetes.io/docs/tasks/tools/"
    fi
    
    echo -e "${GREEN}Prerequisites check passed${NC}"
}

# Get working directory based on environment
get_work_dir() {
    local env=$1
    case $env in
        dev)
            echo "${SCRIPT_DIR}/environments/dev"
            ;;
        prod)
            echo "${SCRIPT_DIR}/environments/prod"
            ;;
        root)
            echo "${SCRIPT_DIR}"
            ;;
        *)
            echo -e "${RED}Unknown environment: $env${NC}"
            exit 1
            ;;
    esac
}

# Initialize Terraform
tf_init() {
    local work_dir=$1
    echo -e "${BLUE}Initializing Terraform in ${work_dir}...${NC}"
    cd "$work_dir"
    terraform init -upgrade
    echo -e "${GREEN}Initialization complete${NC}"
}

# Validate configuration
tf_validate() {
    local work_dir=$1
    echo -e "${BLUE}Validating Terraform configuration...${NC}"
    cd "$work_dir"
    terraform validate
    echo -e "${GREEN}Validation complete${NC}"
}

# Format Terraform files
tf_fmt() {
    echo -e "${BLUE}Formatting Terraform files...${NC}"
    cd "${SCRIPT_DIR}"
    terraform fmt -recursive
    echo -e "${GREEN}Formatting complete${NC}"
}

# Plan
tf_plan() {
    local work_dir=$1
    shift
    echo -e "${BLUE}Planning Terraform changes...${NC}"
    cd "$work_dir"
    terraform plan "$@"
}

# Apply
tf_apply() {
    local work_dir=$1
    shift
    echo -e "${BLUE}Applying Terraform changes...${NC}"
    cd "$work_dir"
    terraform apply "$@"
    echo -e "${GREEN}Apply complete${NC}"
}

# Destroy
tf_destroy() {
    local work_dir=$1
    shift
    echo -e "${RED}WARNING: This will destroy all infrastructure!${NC}"
    cd "$work_dir"
    terraform destroy "$@"
}

# Output
tf_output() {
    local work_dir=$1
    echo -e "${BLUE}Terraform outputs:${NC}"
    cd "$work_dir"
    terraform output
}

# Main
main() {
    if [ $# -lt 2 ]; then
        show_help
        exit 1
    fi
    
    local env=$1
    local action=$2
    shift 2
    
    # Handle help
    if [ "$env" == "help" ] || [ "$env" == "-h" ] || [ "$env" == "--help" ]; then
        show_help
        exit 0
    fi
    
    check_prerequisites
    
    local work_dir=$(get_work_dir "$env")
    
    # Check if tfvars exists
    if [ ! -f "${work_dir}/terraform.tfvars" ] && [ "$action" != "init" ] && [ "$action" != "fmt" ]; then
        if [ -f "${work_dir}/terraform.tfvars.example" ]; then
            echo -e "${YELLOW}Warning: terraform.tfvars not found${NC}"
            echo "Copy terraform.tfvars.example to terraform.tfvars and fill in your values"
            echo "  cp ${work_dir}/terraform.tfvars.example ${work_dir}/terraform.tfvars"
        fi
    fi
    
    case $action in
        init)
            tf_init "$work_dir"
            ;;
        validate)
            tf_validate "$work_dir"
            ;;
        fmt)
            tf_fmt
            ;;
        plan)
            tf_plan "$work_dir" "$@"
            ;;
        apply)
            tf_apply "$work_dir" "$@"
            ;;
        destroy)
            tf_destroy "$work_dir" "$@"
            ;;
        output)
            tf_output "$work_dir"
            ;;
        *)
            echo -e "${RED}Unknown action: $action${NC}"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
