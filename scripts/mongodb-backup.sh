#!/bin/bash

# MongoDB Backup and Restore Script
# Usage: ./mongodb-backup.sh [backup|restore] [namespace]

NAMESPACE=${2:-cricket-feedback}
MONGO_POD=$(kubectl get pods -n $NAMESPACE -l app=cricket-feedback-mongodb -o jsonpath='{.items[0].metadata.name}')
BACKUP_DIR="/tmp/mongodb-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mongodb_backup_$DATE.gz"

case $1 in
  backup)
    echo "🔄 Creating MongoDB backup..."
    kubectl exec -n $NAMESPACE $MONGO_POD -- mongodump --gzip --archive=/tmp/$BACKUP_FILE
    kubectl cp $NAMESPACE/$MONGO_POD:/tmp/$BACKUP_FILE $BACKUP_DIR/$BACKUP_FILE
    echo "✅ Backup saved to: $BACKUP_DIR/$BACKUP_FILE"
    
    # Upload to OCI Object Storage (optional)
    if [ -n "$OCI_BUCKET" ]; then
      oci os object put --bucket-name $OCI_BUCKET --name $BACKUP_FILE --file $BACKUP_DIR/$BACKUP_FILE
      echo "☁️  Backup uploaded to OCI Object Storage"
    fi
    ;;
    
  restore)
    if [ -z "$3" ]; then
      echo "❌ Please provide backup file: ./mongodb-backup.sh restore $NAMESPACE backup_file.gz"
      exit 1
    fi
    
    echo "🔄 Restoring MongoDB from backup..."
    kubectl cp $3 $NAMESPACE/$MONGO_POD:/tmp/restore.gz
    kubectl exec -n $NAMESPACE $MONGO_POD -- mongorestore --gzip --archive=/tmp/restore.gz --drop
    echo "✅ MongoDB restored from backup"
    ;;
    
  list)
    echo "📋 Available backups:"
    ls -la $BACKUP_DIR/
    ;;
    
  *)
    echo "Usage: $0 [backup|restore|list] [namespace] [backup_file]"
    echo "Examples:"
    echo "  $0 backup cricket-feedback"
    echo "  $0 restore cricket-feedback mongodb_backup_20260109_020000.gz"
    echo "  $0 list"
    ;;
esac
