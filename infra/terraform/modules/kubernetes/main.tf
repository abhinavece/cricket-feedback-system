# Kubernetes Module - Namespace, Secrets, and Helm Release
# Cricket Feedback System

# ============================================================================
# Namespace
# ============================================================================

resource "kubernetes_namespace" "app" {
  metadata {
    name = var.namespace

    labels = {
      "app.kubernetes.io/name"       = var.project_name
      "app.kubernetes.io/managed-by" = "terraform"
      "environment"                  = var.environment
    }
  }
}

# ============================================================================
# Image Pull Secret (OCIR Credentials)
# ============================================================================

resource "kubernetes_secret" "ocir_creds" {
  metadata {
    name      = "ocir-creds"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  type = "kubernetes.io/dockerconfigjson"

  data = {
    ".dockerconfigjson" = jsonencode({
      auths = {
        "${var.registry_url}" = {
          username = "${var.registry_namespace}/${var.ocir_username}"
          password = var.ocir_auth_token
          auth     = base64encode("${var.registry_namespace}/${var.ocir_username}:${var.ocir_auth_token}")
        }
      }
    })
  }

  depends_on = [kubernetes_namespace.app]
}

# ============================================================================
# Application Secrets
# ============================================================================

resource "kubernetes_secret" "app_secrets" {
  metadata {
    name      = "cricket-secrets"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  data = {
    "jwt-secret"           = var.jwt_secret
    "google-client-id"     = var.google_client_id
    "google-client-secret" = var.google_client_secret
    "admin-password"       = var.admin_password
  }

  depends_on = [kubernetes_namespace.app]
}

# WhatsApp credentials secret
resource "kubernetes_secret" "whatsapp_creds" {
  metadata {
    name      = "whatsapp-credentials"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  data = {
    "WHATSAPP_ACCESS_TOKEN" = var.whatsapp_access_token
  }

  depends_on = [kubernetes_namespace.app]
}

# MongoDB credentials secret
resource "kubernetes_secret" "mongodb_creds" {
  metadata {
    name      = "mongodb-credentials"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  data = {
    "mongodb-root-password" = var.mongodb_password
    "mongodb-uri"           = "mongodb://admin:${var.mongodb_password}@mongodb-service:27017/cricket-feedback?authSource=admin"
  }

  depends_on = [kubernetes_namespace.app]
}

# ============================================================================
# Helm Release - Cricket Feedback Application
# ============================================================================

resource "helm_release" "cricket_feedback" {
  name       = var.project_name
  namespace  = kubernetes_namespace.app.metadata[0].name
  chart      = var.helm_chart_path
  
  create_namespace = false
  wait             = true
  timeout          = 600

  # Backend configuration
  set {
    name  = "backend.image.registry"
    value = var.registry_url
  }

  set {
    name  = "backend.image.repository"
    value = "${var.registry_namespace}/${var.project_name}-backend"
  }

  set {
    name  = "backend.image.tag"
    value = var.backend_image_tag
  }

  # Frontend configuration
  set {
    name  = "frontend.image.registry"
    value = var.registry_url
  }

  set {
    name  = "frontend.image.repository"
    value = "${var.registry_namespace}/${var.project_name}-frontend"
  }

  set {
    name  = "frontend.image.tag"
    value = var.frontend_image_tag
  }

  # Ingress configuration
  set {
    name  = "ingress.enabled"
    value = var.ingress_host != "" ? "true" : "false"
  }

  set {
    name  = "ingress.host"
    value = var.ingress_host
  }

  set {
    name  = "ingress.tls.enabled"
    value = var.enable_tls ? "true" : "false"
  }

  # Image pull secret
  set {
    name  = "imagePullSecrets[0].name"
    value = "ocir-creds"
  }

  # MongoDB configuration
  set {
    name  = "mongodb.enabled"
    value = "true"
  }

  # WhatsApp configuration
  set {
    name  = "backend.env.WHATSAPP_PHONE_NUMBER_ID"
    value = var.whatsapp_phone_number_id
  }

  # Environment
  set {
    name  = "global.environment"
    value = var.environment
  }

  values = [
    yamlencode({
      backend = {
        env = {
          NODE_ENV = "production"
          PORT     = "5001"
        }
        envFrom = [
          {
            secretRef = {
              name = "cricket-secrets"
            }
          },
          {
            secretRef = {
              name = "whatsapp-credentials"
            }
          },
          {
            secretRef = {
              name = "mongodb-credentials"
            }
          }
        ]
      }
    })
  ]

  depends_on = [
    kubernetes_namespace.app,
    kubernetes_secret.ocir_creds,
    kubernetes_secret.app_secrets,
    kubernetes_secret.whatsapp_creds,
    kubernetes_secret.mongodb_creds
  ]
}
