# 🛡️ Data Persistence & Disaster Recovery Guide

## 🚨 Problem Solved
Previously, when you deleted the namespace, ALL MongoDB data was lost. This guide shows how to make your data persistent and recoverable.

## 🔧 Solutions Implemented

### 1. **Persistent Volume Protection**
```bash
# PV is now set to "Retain" policy (was "Delete")
kubectl patch pv <pv-name> -p '{"spec":{"persistentVolumeReclaimPolicy":"Retain"}}'
```

### 2. **Helm Chart Improvements**
- PVC annotations: `"helm.sh/resource-policy": keep`
- Increased storage: 50Gi (from 8Gi)
- Retain policy: Data survives namespace deletion

### 3. **Backup & Recovery Scripts**

#### 📦 **MongoDB Backup Script**
```bash
# Create backup
./scripts/mongodb-backup.sh backup cricket-feedback

# Restore from backup
./scripts/mongodb-backup.sh restore cricket-feedback backup_file.gz

# List backups
./scripts/mongodb-backup.sh list
```

#### 🚨 **Disaster Recovery Script**
```bash
# Complete backup before risky operations
./scripts/disaster-recovery.sh backup

# Full recovery from namespace deletion
./scripts/disaster-recovery.sh recover

# Safety backup before deployment
./scripts/disaster-recovery.sh pre-deploy

# Setup automated daily backups
./scripts/disaster-recovery.sh setup-cron
```

#### 🛡️ **Safe Deployment Script**
```bash
# Deploy with automatic backup and verification
./scripts/safe-deploy.sh

# Deploy with image building
./scripts/safe-deploy.sh build
```

## 📋 **Data Protection Strategy**

### **Layer 1: Volume Protection**
- ✅ PV Reclaim Policy: Retain
- ✅ PVC Annotations: helm.sh/resource-policy: keep
- ✅ Storage: 50Gi persistent block volume

### **Layer 2: Automated Backups**
- ✅ Daily MongoDB backups (2 AM)
- ✅ Optional OCI Object Storage upload
- ✅ Backup rotation and cleanup

### **Layer 3: Manual Backup Control**
- ✅ Pre-deployment safety backups
- ✅ Complete state snapshots
- ✅ One-click recovery

### **Layer 4: Disaster Recovery**
- ✅ Namespace recreation
- ✅ Secret restoration
- ✅ PV reattachment
- ✅ Data restoration

## 🚀 **Usage Examples**

### **Before Any Risky Operation**
```bash
# Always create a backup first
./scripts/disaster-recovery.sh backup
```

### **Safe Deployment**
```bash
# This creates backup, deploys, and verifies
./scripts/safe-deploy.sh
```

### **If Namespace Gets Deleted**
```bash
# Complete recovery
./scripts/disaster-recovery.sh recover
```

### **Manual MongoDB Backup**
```bash
# Quick MongoDB backup
./scripts/mongodb-backup.sh backup cricket-feedback

# Restore specific backup
./scripts/mongodb-backup.sh restore cricket-feedback mongodb_backup_20260109_020000.gz
```

## 📊 **Data Locations**

### **Primary Storage**
- **Location**: OCI Block Volume (50Gi)
- **Persistence**: Survives namespace deletion
- **Access**: ReadWriteOnce
- **Mount**: `/data/db` in MongoDB pod

### **Backup Storage**
- **Local**: `/tmp/mongodb-backups/`
- **Optional**: OCI Object Storage bucket
- **Format**: gzip compressed mongodump
- **Retention**: Manual cleanup

### **Configuration Storage**
- **Secrets**: Kubernetes secrets
- **Config**: Helm values files
- **State**: Kubernetes API server

## 🔍 **Verification Commands**

### **Check Data Persistence**
```bash
# Check PV status
kubectl get pv | grep cricket-feedback

# Check PVC binding
kubectl get pvc -n cricket-feedback

# Verify data exists
kubectl exec -n cricket-feedback cricket-feedback-mongodb-xxx -- mongo --eval "db.getCollectionNames()"
```

### **Test Recovery**
```bash
# Create test data
kubectl exec -n cricket-feedback cricket-feedback-mongodb-xxx -- mongo --eval "db.test.insert({name: 'recovery-test'})"

# Delete namespace (DANGER!)
kubectl delete namespace cricket-feedback

# Recover
./scripts/disaster-recovery.sh recover

# Verify data survived
kubectl exec -n cricket-feedback cricket-feedback-mongodb-xxx -- mongo --eval "db.test.find()"
```

## 🎯 **Best Practices**

### **Before Deployment**
1. Always run `./scripts/disaster-recovery.sh backup`
2. Verify backup exists
3. Use `./scripts/safe-deploy.sh` for deployments

### **Regular Maintenance**
1. Setup automated backups: `./scripts/disaster-recovery.sh setup-cron`
2. Clean up old backups monthly
3. Test recovery process quarterly

### **Emergency Procedures**
1. Don't panic - data is protected
2. Run `./scripts/disaster-recovery.sh recover`
3. Verify application functionality
4. Investigate root cause

## 📞 **Recovery Contacts**

If you encounter issues:
1. Check backup directory: `/tmp/cricket-feedback-backups/`
2. Verify PV exists: `kubectl get pv`
3. Check logs: `kubectl logs -n cricket-feedback`
4. Run recovery script: `./scripts/disaster-recovery.sh recover`

## 🎉 **Summary**

Your data is now protected with:
- ✅ Persistent volumes that survive namespace deletion
- ✅ Automated daily backups
- ✅ Manual backup control
- ✅ One-click disaster recovery
- ✅ Safe deployment procedures

**No more data loss!** 🎊
