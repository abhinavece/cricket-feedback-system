#!/bin/bash

# Disaster Recovery Script for Cricket Feedback System
# This script helps recover from namespace deletion scenarios

set -e

NAMESPACE="cricket-feedback"
BACKUP_DIR="/tmp/cricket-feedback-backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🚨 Cricket Feedback Disaster Recovery Script"
echo "=========================================="

# Function to backup current state
backup_current_state() {
    echo "📦 Creating backup of current state..."
    
    mkdir -p $BACKUP_DIR
    
    # Backup all resources
    kubectl get all -n $NAMESPACE -o yaml > $BACKUP_DIR/all_resources_$DATE.yaml
    kubectl get secrets -n $NAMESPACE -o yaml > $BACKUP_DIR/secrets_$DATE.yaml
    kubectl get pvc -n $NAMESPACE -o yaml > $BACKUP_DIR/pvc_$DATE.yaml
    kubectl get ingress -n $NAMESPACE -o yaml > $BACKUP_DIR/ingress_$DATE.yaml
    
    # Backup MongoDB data
    echo "🔄 Creating MongoDB backup..."
    ./scripts/mongodb-backup.sh backup $NAMESPACE
    mv /tmp/mongodb-backups/mongodb_backup_*.gz $BACKUP_DIR/
    
    echo "✅ Backup completed in $BACKUP_DIR"
}

# Function to recover from namespace deletion
recover_namespace() {
    echo "🔄 Starting recovery process..."
    
    # 1. Recreate namespace
    echo "📝 Creating namespace..."
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # 2. Recreate secrets
    echo "🔐 Recreating secrets..."
    if [ -f "$BACKUP_DIR/secrets_latest.yaml" ]; then
        kubectl apply -f $BACKUP_DIR/secrets_latest.yaml
    else
        echo "⚠️  No secrets backup found. Creating manually..."
        ./scripts/create-secrets.sh
    fi
    
    # 3. Check if PV still exists
    echo "💾 Checking for existing Persistent Volume..."
    PV_NAME=$(kubectl get pv | grep cricket-feedback-mongodb | awk '{print $1}')
    
    if [ -n "$PV_NAME" ]; then
        echo "✅ Found existing PV: $PV_NAME"
        
        # Patch PV to Retain policy if not already
        kubectl patch pv $PV_NAME -p '{"spec":{"persistentVolumeReclaimPolicy":"Retain"}}' || true
        
        # Create PVC that binds to existing PV
        echo "📝 Recreating PVC to bind to existing PV..."
        cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: cricket-feedback-mongodb
  namespace: $NAMESPACE
  annotations:
    "helm.sh/resource-policy": keep
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: oci-bv
  resources:
    requests:
      storage: 50Gi
  volumeName: $PV_NAME
EOF
    else
        echo "⚠️  No existing PV found. New storage will be created."
    fi
    
    # 4. Deploy application
    echo "🚀 Deploying application..."
    helm upgrade --install cricket-feedback ./infra/helm/cricket-feedback \
        --namespace $NAMESPACE \
        --values ./infra/helm/cricket-feedback/values.yaml \
        --values ./infra/helm/cricket-feedback/values-development.yaml \
        --wait --timeout=10m
    
    # 5. Restore MongoDB data if backup exists
    if [ -f "$BACKUP_DIR/mongodb_backup_*.gz" ]; then
        echo "🔄 Restoring MongoDB data..."
        LATEST_BACKUP=$(ls -t $BACKUP_DIR/mongodb_backup_*.gz | head -1)
        ./scripts/mongodb-backup.sh restore $NAMESPACE $LATEST_BACKUP
    fi
    
    echo "✅ Recovery completed!"
    echo "🌐 Access your application at: https://mavericks11.duckdns.org"
}

# Function to create a manual backup before risky operations
pre_deployment_backup() {
    echo "⚠️  Creating safety backup before deployment..."
    backup_current_state
    echo "✅ Safety backup created. You can proceed with deployment."
}

# Function to setup automated backups
setup_automated_backups() {
    echo "⏰ Setting up automated backups..."
    
    # Create backup cronjob
    cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: CronJob
metadata:
  name: mongodb-backup
  namespace: $NAMESPACE
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: mongodb-backup
            image: bitnami/mongodb:latest
            command:
            - /bin/bash
            - -c
            - |
              mongodump --host cricket-feedback-mongodb:27017 --gzip --archive=/backup/mongodb_\$(date +%Y%m%d_%H%M%S).gz
              # Upload to OCI Object Storage if configured
              if [ -n "\$OCI_BUCKET" ]; then
                for file in /backup/mongodb_*.gz; do
                  oci os object put --bucket-name \$OCI_BUCKET --name \$(basename \$file) --file \$file
                done
              fi
            env:
            - name: OCI_BUCKET
              value: "cricket-feedback-backups"
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: cricket-feedback-mongodb-backup
          restartPolicy: OnFailure
EOF
    
    echo "✅ Automated backup setup completed"
}

case $1 in
    backup)
        backup_current_state
        ;;
    recover)
        recover_namespace
        ;;
    pre-deploy)
        pre_deployment_backup
        ;;
    setup-cron)
        setup_automated_backups
        ;;
    *)
        echo "Usage: $0 [backup|recover|pre-deploy|setup-cron]"
        echo ""
        echo "Commands:"
        echo "  backup      - Create complete backup of current state"
        echo "  recover     - Recover from namespace deletion"
        echo "  pre-deploy  - Create safety backup before deployment"
        echo "  setup-cron  - Setup automated daily backups"
        echo ""
        echo "Examples:"
        echo "  $0 backup"
        echo "  $0 recover"
        echo "  $0 pre-deploy"
        echo "  $0 setup-cron"
        exit 1
        ;;
esac
