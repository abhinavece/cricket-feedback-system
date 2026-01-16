# Cricket Feedback System - Documentation

This directory contains all project documentation organized by category.

## 📁 Documentation Structure

### 🌟 [Feature Documentation](./FEATURES.md)
**Comprehensive guide to all system features** - Player profiles, WhatsApp integration, match management, payments, and more.

### 📋 [Technical Documentation](./technical/)
- **[Match Tracking Design](./technical/match-tracking-design.md)** - Complete design and flow for match availability tracking
- **[WhatsApp Response Mapping](./technical/whatsapp-response-mapping.md)** - How WhatsApp responses are mapped to matches
- **[Match Detail Modal Features](./technical/match-detail-modal-features.md)** - Technical details of the match detail modal
- **[Enhancement Summary](./technical/enhancement-summary.md)** - Summary of system enhancements

### 🚀 [Setup Guides](./setup/)
- **[Google OAuth Setup](./setup/google-oauth-setup.md)** - Complete guide for setting up Google OAuth authentication
- **[GitHub Setup](./setup/github-setup.md)** - GitHub integration and setup instructions

### 📦 [Deployment Guides](./deployment/)
- **[Data Persistence Guide](./deployment/data-persistence-guide.md)** - Data persistence and disaster recovery guide

### 📱 [Mobile Documentation](./mobile/)
- Mobile-specific implementation details and guidelines

### 👥 [User Guides](./user-guides/)
- **[Features](./user-guides/features.md)** - Complete feature documentation and user guides

### 🔧 [Troubleshooting](./troubleshooting/)
- **[Debugging Report](./troubleshooting/debugging-report.md)** - Common debugging scenarios and solutions
- **[Fixes Summary](./troubleshooting/fixes-summary.md)** - Summary of bug fixes and improvements

### 🧪 [Testing](./testing/)
- Testing documentation and guidelines

## 📝 Changelog

See the main [CHANGELOG.md](../CHANGELOG.md) in the project root for version history and recent updates.

## 🏏 Project Overview

For complete project information, see:
- Main [README.md](../README.md) - Project overview and quick start
- [CLAUDE.md](../CLAUDE.md) - Development guidelines and architecture

## 🔄 Auto-Documentation

This project uses a post-commit hook to automatically update documentation:
- Located at `.claude/scripts/generate-docs.sh`
- Runs after `feat:`, `fix:`, `refactor:`, `perf:` commits
- Updates CHANGELOG.md with new entries

## 📞 Support

For technical support or questions about the documentation, refer to the troubleshooting guides or contact the development team.
