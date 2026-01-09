# Utility Scripts and Tools

This directory contains utility scripts and temporary files organized by category.

## 📁 Directory Structure

### 🔐 [Authentication Utilities](./auth/)
- **[get-id-token.js](./auth/get-id-token.js)** - Utility for getting ID tokens for authentication

### 🗄️ [Database Utilities](./database/)
- **[debug-availability.js](./database/debug-availability.js)** - Debug script for availability tracking
- **[mongodb-connection.sh](./database/mongodb-connection.sh)** - MongoDB connection testing script
- **[mongo-init.js](./database/mongo-init.js)** - MongoDB initialization script

### 🚀 [Deployment Utilities](./deployment/)
- *(Helm deployment scripts - coming soon)*

### 🔄 [Migration Utilities](./migration/)
- **[migrate-to-helm.sh](./migration/migrate-to-helm.sh)** - Migration script from YAML deployments to Helm

## 📋 Usage Guidelines

### Running Database Utilities
```bash
# Debug availability tracking
node utils/database/debug-availability.js

# Test MongoDB connection
./utils/database/mongodb-connection.sh

# Initialize MongoDB
mongo < utils/database/mongo-init.js
```

### Running Authentication Utilities
```bash
# Get ID token
node utils/auth/get-id-token.js
```

### Running Migration Utilities
```bash
# Migrate to Helm
./utils/migration/migrate-to-helm.sh
```

## ⚠️ Important Notes

- These are utility scripts and not part of the core application
- Some scripts may require environment variables to be set
- Always test utilities in a development environment first
- Refer to individual script documentation for specific requirements

## 🏏 Project Structure

For the main project structure, see the [project README](../README.md).
