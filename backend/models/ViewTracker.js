/**
 * @fileoverview View Tracker Model
 * 
 * Tracks views for homepage and public links across organizations.
 * Simple and efficient tracking system for analytics.
 * 
 * @module models/ViewTracker
 */

const mongoose = require('mongoose');

const viewTrackerSchema = new mongoose.Schema({
  // Multi-tenant isolation
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },

  // Type of view being tracked
  viewType: {
    type: String,
    enum: ['homepage', 'public-link'],
    required: true,
    index: true
  },

  // For public links - reference to the resource
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
  },

  // Resource type for public links
  resourceType: {
    type: String,
    enum: ['match', 'payment', 'tournament'],
    default: null
  },

  // Token for public links
  token: {
    type: String,
    default: null,
    index: true
  },

  // View counts
  totalViews: {
    type: Number,
    default: 0,
    min: 0
  },

  // Unique visitor tracking (using IP + User-Agent hash)
  uniqueViews: {
    type: Number,
    default: 0,
    min: 0
  },

  // Recent view timestamps (for analytics)
  lastViewedAt: {
    type: Date,
    default: null
  },

  // Daily view tracking (last 30 days)
  dailyViews: [{
    date: {
      type: Date,
      required: true
    },
    views: {
      type: Number,
      default: 0,
      min: 0
    },
    uniqueViews: {
      type: Number,
      default: 0,
      min: 0
    }
  }],

  // Metadata
  metadata: {
    userAgent: String,
    referrer: String,
    country: String,
    city: String
  },

  // Tracking status
  isActive: {
    type: Boolean,
    default: true
  },

  // Created/Updated timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
viewTrackerSchema.index({ organizationId: 1, viewType: 1 });
viewTrackerSchema.index({ organizationId: 1, viewType: 1, token: 1 });
viewTrackerSchema.index({ organizationId: 1, viewType: 1, resourceId: 1 });
viewTrackerSchema.index({ 'dailyViews.date': 1 });

// Instance method to record a view
viewTrackerSchema.methods.recordView = async function(visitorFingerprint = null, metadata = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day

  // Update total views
  this.totalViews += 1;
  this.lastViewedAt = new Date();

  // Update metadata
  if (metadata.userAgent) this.metadata.userAgent = metadata.userAgent;
  if (metadata.referrer) this.metadata.referrer = metadata.referrer;
  if (metadata.country) this.metadata.country = metadata.country;
  if (metadata.city) this.metadata.city = metadata.city;

  // Find or create today's daily view record
  let todayRecord = this.dailyViews.find(dv => 
    dv.date.toDateString() === today.toDateString()
  );

  if (!todayRecord) {
    // Add new day record
    this.dailyViews.push({
      date: today,
      views: 1,
      uniqueViews: visitorFingerprint ? 1 : 0
    });
  } else {
    // Update existing day record
    todayRecord.views += 1;
    if (visitorFingerprint) {
      todayRecord.uniqueViews += 1;
      this.uniqueViews += 1;
    }
  }

  // Keep only last 30 days of daily data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  this.dailyViews = this.dailyViews.filter(dv => dv.date >= thirtyDaysAgo);

  return this.save();
};

// Static method to find or create tracker
viewTrackerSchema.statics.findOrCreateTracker = async function(organizationId, viewType, options = {}) {
  const { resourceId, resourceType, token } = options;

  let tracker = await this.findOne({
    organizationId,
    viewType,
    ...(resourceId && { resourceId }),
    ...(token && { token })
  });

  if (!tracker) {
    tracker = new this({
      organizationId,
      viewType,
      ...(resourceId && { resourceId }),
      ...(resourceType && { resourceType }),
      ...(token && { token })
    });
    await tracker.save();
  }

  return tracker;
};

// Static method to get organization analytics
viewTrackerSchema.statics.getOrganizationAnalytics = async function(organizationId) {
  const trackers = await this.find({
    organizationId,
    isActive: true
  }).select('viewType totalViews uniqueViews lastViewedAt dailyViews token resourceType');

  const homepageViews = trackers.find(t => t.viewType === 'homepage');
  const publicLinkViews = trackers.filter(t => t.viewType === 'public-link');

  // Calculate totals
  const totalHomepageViews = homepageViews?.totalViews || 0;
  const totalPublicLinkViews = publicLinkViews.reduce((sum, t) => sum + t.totalViews, 0);
  const totalUniqueViews = trackers.reduce((sum, t) => sum + t.uniqueViews, 0);

  // Get views in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentViews = trackers.reduce((sum, t) => {
    const recent = t.dailyViews
      .filter(dv => dv.date >= sevenDaysAgo)
      .reduce((daySum, dv) => daySum + dv.views, 0);
    return sum + recent;
  }, 0);

  return {
    homepage: {
      totalViews: totalHomepageViews,
      uniqueViews: homepageViews?.uniqueViews || 0,
      lastViewedAt: homepageViews?.lastViewedAt
    },
    publicLinks: {
      totalViews: totalPublicLinkViews,
      links: publicLinkViews.map(t => ({
        token: t.token,
        resourceType: t.resourceType,
        totalViews: t.totalViews,
        uniqueViews: t.uniqueViews,
        lastViewedAt: t.lastViewedAt
      }))
    },
    summary: {
      totalViews: totalHomepageViews + totalPublicLinkViews,
      uniqueViews: totalUniqueViews,
      recentViews: recentViews
    }
  };
};

module.exports = mongoose.model('ViewTracker', viewTrackerSchema);
