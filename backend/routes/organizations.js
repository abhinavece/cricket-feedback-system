/**
 * @fileoverview Organization Routes
 * 
 * API endpoints for organization (tenant) management:
 * - Create, read, update organizations
 * - Manage members (invite, remove, change roles)
 * - WhatsApp configuration
 * 
 * @module routes/organizations
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const OrganizationInvite = require('../models/OrganizationInvite');
const JoinRequest = require('../models/JoinRequest');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { resolveTenant, requireOrgAdmin, requireOrgOwner, skipTenant } = require('../middleware/tenantResolver');

/**
 * POST /api/organizations
 * Create a new organization
 * 
 * @body {string} name - Organization name
 * @body {string} [slug] - URL-friendly slug (auto-generated if not provided)
 * @body {string} [description] - Organization description
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name, slug, description } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        error: 'Invalid name',
        message: 'Organization name must be at least 2 characters',
      });
    }

    // Generate slug if not provided
    const orgSlug = slug || name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug is already taken
    const existingOrg = await Organization.findOne({ slug: orgSlug });
    if (existingOrg) {
      return res.status(409).json({
        error: 'Slug taken',
        message: 'An organization with this slug already exists. Please choose a different name.',
      });
    }

    // Create organization
    const organization = new Organization({
      name: name.trim(),
      slug: orgSlug,
      description: description?.trim(),
      ownerId: req.user._id,
    });

    await organization.save();

    // Add user as owner of the organization
    req.user.addToOrganization(organization._id, 'owner');
    req.user.activeOrganizationId = organization._id;
    await req.user.save();

    // Update organization stats
    organization.stats.memberCount = 1;
    await organization.save();

    console.log(`Organization created: ${organization.name} (${organization.slug}) by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      organization: {
        _id: organization._id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        plan: organization.plan,
        settings: organization.settings,
        stats: organization.stats,
      },
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create organization',
    });
  }
});

/**
 * GET /api/organizations
 * List organizations the current user belongs to
 */
router.get('/', auth, async (req, res) => {
  try {
    const orgIds = req.user.organizations.map(m => m.organizationId);
    
    const organizations = await Organization.find({
      _id: { $in: orgIds },
      isActive: true,
      isDeleted: false,
    }).select('name slug description logo plan stats settings createdAt');

    // Enrich with user's role in each org
    const enrichedOrgs = organizations.map(org => {
      const membership = req.user.organizations.find(
        m => m.organizationId.equals(org._id)
      );
      return {
        ...org.toObject(),
        userRole: membership?.role,
        isActive: req.user.activeOrganizationId?.equals(org._id),
      };
    });

    res.json({
      success: true,
      organizations: enrichedOrgs,
      activeOrganizationId: req.user.activeOrganizationId,
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch organizations',
    });
  }
});

/**
 * GET /api/organizations/current
 * Get current active organization details
 */
router.get('/current', auth, resolveTenant, async (req, res) => {
  try {
    const org = req.organization;
    
    // Handle case when no organization is set (dev mode bypass)
    if (!org) {
      return res.status(404).json({
        error: 'No organization',
        code: 'NO_ORGANIZATION',
        message: 'No active organization. Please create or join an organization.',
      });
    }
    
    // Get member count
    const memberCount = await User.countDocuments({
      'organizations.organizationId': org._id,
      'organizations.status': 'active',
    });

    res.json({
      success: true,
      organization: {
        _id: org._id,
        name: org.name,
        slug: org.slug,
        description: org.description,
        logo: org.logo,
        plan: org.plan,
        limits: org.limits,
        settings: org.settings,
        stats: { ...org.stats, memberCount },
        whatsapp: {
          enabled: org.whatsapp.enabled,
          connectionStatus: org.whatsapp.connectionStatus,
          displayPhoneNumber: org.whatsapp.displayPhoneNumber,
          // Don't expose accessToken
        },
        createdAt: org.createdAt,
      },
      userRole: req.organizationRole,
    });
  } catch (error) {
    console.error('Error fetching current organization:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch organization details',
    });
  }
});

/**
 * PUT /api/organizations/current
 * Update current organization settings
 */
router.put('/current', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    const { name, description, settings } = req.body;
    const org = req.organization;

    if (name) {
      org.name = name.trim();
    }
    if (description !== undefined) {
      org.description = description?.trim() || '';
    }
    if (settings) {
      org.settings = { ...org.settings, ...settings };
    }

    await org.save();

    res.json({
      success: true,
      message: 'Organization updated successfully',
      organization: {
        _id: org._id,
        name: org.name,
        slug: org.slug,
        description: org.description,
        settings: org.settings,
      },
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update organization',
    });
  }
});

/**
 * POST /api/organizations/switch
 * Switch active organization
 * 
 * @body {string} organizationId - Organization ID to switch to
 */
router.post('/switch', auth, async (req, res) => {
  try {
    const { organizationId } = req.body;

    if (!organizationId || !mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({
        error: 'Invalid organization ID',
      });
    }

    // Validate user has access
    const membership = req.user.organizations.find(
      m => m.organizationId.toString() === organizationId && m.status === 'active'
    );

    if (!membership) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You are not a member of this organization',
      });
    }

    // Verify organization exists and is active
    const org = await Organization.findOne({
      _id: organizationId,
      isActive: true,
      isDeleted: false,
    });

    if (!org) {
      return res.status(404).json({
        error: 'Organization not found',
      });
    }

    // Update user's active organization
    req.user.activeOrganizationId = org._id;
    await req.user.save();

    res.json({
      success: true,
      message: `Switched to ${org.name}`,
      organization: {
        _id: org._id,
        name: org.name,
        slug: org.slug,
      },
      userRole: membership.role,
    });
  } catch (error) {
    console.error('Error switching organization:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to switch organization',
    });
  }
});

/**
 * GET /api/organizations/members
 * List members of current organization
 */
router.get('/members', auth, resolveTenant, async (req, res) => {
  try {
    const users = await User.find({
      'organizations.organizationId': req.organization._id,
      'organizations.status': 'active',
    }).select('name email avatar organizations');

    const members = users.map(user => {
      const membership = user.organizations.find(
        m => m.organizationId.equals(req.organization._id)
      );
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: membership?.role,
        playerId: membership?.playerId,
        joinedAt: membership?.joinedAt,
      };
    });

    // Sort by role (owner first, then admin, editor, viewer)
    const roleOrder = { owner: 0, admin: 1, editor: 2, viewer: 3 };
    members.sort((a, b) => (roleOrder[a.role] || 4) - (roleOrder[b.role] || 4));

    res.json({
      success: true,
      members,
      count: members.length,
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch organization members',
    });
  }
});

/**
 * POST /api/organizations/members/invite
 * Invite a user to the organization
 * 
 * @body {string} email - User email to invite
 * @body {string} role - Role to assign (viewer, editor, admin)
 */
router.post('/members/invite', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    const { email, role = 'viewer' } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email required',
        message: 'Please provide an email address to invite',
      });
    }

    // Validate role
    const allowedRoles = ['viewer', 'editor'];
    if (req.organizationRole === 'owner') {
      allowedRoles.push('admin');
    }
    
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: `Role must be one of: ${allowedRoles.join(', ')}`,
      });
    }

    // Find or note the user
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      // Check if already a member
      const existingMembership = user.organizations.find(
        m => m.organizationId.equals(req.organization._id)
      );
      
      if (existingMembership && existingMembership.status === 'active') {
        return res.status(409).json({
          error: 'Already a member',
          message: 'This user is already a member of the organization',
        });
      }

      // Add to organization
      user.addToOrganization(req.organization._id, role, req.user._id);
      await user.save();

      // Update org member count
      req.organization.stats.memberCount = (req.organization.stats.memberCount || 0) + 1;
      await req.organization.save();

      console.log(`User ${email} added to organization ${req.organization.name} as ${role}`);

      res.json({
        success: true,
        message: `${user.name} has been added to the organization`,
        member: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role,
        },
      });
    } else {
      // User doesn't exist - in a full implementation, we'd send an invite email
      // For now, return a message indicating the user needs to sign up first
      res.status(404).json({
        error: 'User not found',
        message: 'This user has not signed up yet. Ask them to sign up first, then you can add them.',
      });
    }
  } catch (error) {
    console.error('Error inviting member:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to invite member',
    });
  }
});

/**
 * PUT /api/organizations/members/:userId/role
 * Update a member's role
 * 
 * @param {string} userId - User ID
 * @body {string} role - New role
 */
router.put('/members/:userId/role', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Can't change owner's role
    if (req.organization.ownerId.equals(userId)) {
      return res.status(403).json({
        error: 'Cannot change owner role',
        message: 'The organization owner role cannot be changed',
      });
    }

    // Can't change your own role
    if (req.user._id.equals(userId)) {
      return res.status(403).json({
        error: 'Cannot change own role',
        message: 'You cannot change your own role',
      });
    }

    // Validate role
    const allowedRoles = ['viewer', 'editor'];
    if (req.organizationRole === 'owner') {
      allowedRoles.push('admin');
    }
    
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: `Role must be one of: ${allowedRoles.join(', ')}`,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const membership = user.organizations.find(
      m => m.organizationId.equals(req.organization._id)
    );

    if (!membership) {
      return res.status(404).json({
        error: 'Not a member',
        message: 'This user is not a member of the organization',
      });
    }

    membership.role = role;
    await user.save();

    res.json({
      success: true,
      message: `${user.name}'s role updated to ${role}`,
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update member role',
    });
  }
});

/**
 * DELETE /api/organizations/members/:userId
 * Remove a member from the organization
 */
router.delete('/members/:userId', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Can't remove owner
    if (req.organization.ownerId.equals(userId)) {
      return res.status(403).json({
        error: 'Cannot remove owner',
        message: 'The organization owner cannot be removed. Transfer ownership first.',
      });
    }

    // Can't remove yourself
    if (req.user._id.equals(userId)) {
      return res.status(403).json({
        error: 'Cannot remove yourself',
        message: 'You cannot remove yourself. Use "Leave organization" instead.',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const removed = user.removeFromOrganization(req.organization._id);
    if (!removed) {
      return res.status(404).json({
        error: 'Not a member',
        message: 'This user is not a member of the organization',
      });
    }

    await user.save();

    // Update org member count
    req.organization.stats.memberCount = Math.max(0, (req.organization.stats.memberCount || 1) - 1);
    await req.organization.save();

    res.json({
      success: true,
      message: `${user.name} has been removed from the organization`,
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to remove member',
    });
  }
});

/**
 * POST /api/organizations/leave
 * Leave the current organization
 */
router.post('/leave', auth, resolveTenant, async (req, res) => {
  try {
    // Can't leave if you're the owner
    if (req.organization.ownerId.equals(req.user._id)) {
      return res.status(403).json({
        error: 'Cannot leave',
        message: 'Organization owners cannot leave. Transfer ownership or delete the organization.',
      });
    }

    req.user.removeFromOrganization(req.organization._id);
    await req.user.save();

    // Update org member count
    req.organization.stats.memberCount = Math.max(0, (req.organization.stats.memberCount || 1) - 1);
    await req.organization.save();

    res.json({
      success: true,
      message: `You have left ${req.organization.name}`,
      newActiveOrganizationId: req.user.activeOrganizationId,
    });
  } catch (error) {
    console.error('Error leaving organization:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to leave organization',
    });
  }
});

/**
 * DELETE /api/organizations/current
 * Delete (soft) the current organization - owner only
 */
router.delete('/current', auth, resolveTenant, requireOrgOwner, async (req, res) => {
  try {
    const org = req.organization;

    // Soft delete
    org.isDeleted = true;
    org.deletedAt = new Date();
    org.deletedBy = req.user._id;
    org.isActive = false;
    await org.save();

    // Remove all members from this organization
    await User.updateMany(
      { 'organizations.organizationId': org._id },
      { 
        $pull: { organizations: { organizationId: org._id } },
        $unset: { activeOrganizationId: org._id }
      }
    );

    // Update requesting user's active org
    req.user.removeFromOrganization(org._id);
    await req.user.save();

    console.log(`Organization deleted: ${org.name} by ${req.user.email}`);

    res.json({
      success: true,
      message: `Organization "${org.name}" has been deleted`,
      newActiveOrganizationId: req.user.activeOrganizationId,
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete organization',
    });
  }
});

// =====================================================
// INVITE LINK MANAGEMENT
// =====================================================

/**
 * POST /api/organizations/invites
 * Create an invite link for the organization
 * 
 * @body {string} [role='viewer'] - Role for invited users
 * @body {number} [maxUses] - Maximum number of uses (null = unlimited)
 * @body {number} [expiresInDays] - Expiration in days (null = never)
 * @body {string} [label] - Optional label for the invite
 */
router.post('/invites', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    const { role = 'viewer', maxUses = null, expiresInDays = null, label } = req.body;

    // Validate role
    const allowedRoles = ['viewer', 'editor'];
    if (req.organizationRole === 'owner') {
      allowedRoles.push('admin');
    }
    
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: `Role must be one of: ${allowedRoles.join(', ')}`,
      });
    }

    // Generate unique code
    let code;
    let attempts = 0;
    do {
      code = OrganizationInvite.generateCode();
      const existing = await OrganizationInvite.findOne({ code });
      if (!existing) break;
      attempts++;
    } while (attempts < 5);

    if (attempts >= 5) {
      throw new Error('Failed to generate unique invite code');
    }

    // Calculate expiration
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const invite = new OrganizationInvite({
      organizationId: req.organization._id,
      code,
      role,
      createdBy: req.user._id,
      maxUses: maxUses > 0 ? maxUses : null,
      expiresAt,
      label: label?.trim(),
    });

    await invite.save();

    console.log(`Invite created: ${code} for ${req.organization.name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Invite link created',
      invite: {
        _id: invite._id,
        code: invite.code,
        role: invite.role,
        maxUses: invite.maxUses,
        useCount: invite.useCount,
        expiresAt: invite.expiresAt,
        label: invite.label,
        inviteUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${code}`,
        createdAt: invite.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create invite link',
    });
  }
});

/**
 * GET /api/organizations/invites
 * List all invite links for the organization
 */
router.get('/invites', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    const invites = await OrganizationInvite.find({
      organizationId: req.organization._id,
      isActive: true,
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    res.json({
      success: true,
      invites: invites.map(invite => ({
        _id: invite._id,
        code: invite.code,
        role: invite.role,
        maxUses: invite.maxUses,
        useCount: invite.useCount,
        expiresAt: invite.expiresAt,
        label: invite.label,
        inviteUrl: `${baseUrl}/invite/${invite.code}`,
        isValid: invite.isValid(),
        createdBy: invite.createdBy,
        createdAt: invite.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching invites:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch invite links',
    });
  }
});

/**
 * DELETE /api/organizations/invites/:inviteId
 * Revoke an invite link
 */
router.delete('/invites/:inviteId', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    const { inviteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(inviteId)) {
      return res.status(400).json({ error: 'Invalid invite ID' });
    }

    const invite = await OrganizationInvite.findOne({
      _id: inviteId,
      organizationId: req.organization._id,
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    invite.isActive = false;
    await invite.save();

    res.json({
      success: true,
      message: 'Invite link revoked',
    });
  } catch (error) {
    console.error('Error revoking invite:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to revoke invite link',
    });
  }
});

/**
 * GET /api/organizations/invite/:code
 * Get invite details by code (public - for preview before joining)
 */
router.get('/invite/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const invite = await OrganizationInvite.findValidByCode(code);
    
    if (!invite) {
      return res.status(404).json({
        error: 'Invalid invite',
        code: 'INVALID_INVITE',
        message: 'This invite link is invalid or has expired.',
      });
    }

    res.json({
      success: true,
      invite: {
        code: invite.code,
        role: invite.role,
        organization: {
          _id: invite.organizationId._id,
          name: invite.organizationId.name,
          slug: invite.organizationId.slug,
          logo: invite.organizationId.logo,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching invite:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch invite details',
    });
  }
});

/**
 * POST /api/organizations/join/:code
 * Join an organization using an invite code
 */
router.post('/join/:code', auth, async (req, res) => {
  try {
    const { code } = req.params;

    const invite = await OrganizationInvite.findValidByCode(code);
    
    if (!invite) {
      return res.status(404).json({
        error: 'Invalid invite',
        code: 'INVALID_INVITE',
        message: 'This invite link is invalid or has expired.',
      });
    }

    const organization = await Organization.findById(invite.organizationId._id);
    if (!organization || !organization.isActive || organization.isDeleted) {
      return res.status(404).json({
        error: 'Organization not found',
        message: 'The organization for this invite no longer exists.',
      });
    }

    // Check if user is already a member
    const existingMembership = req.user.organizations.find(
      m => m.organizationId.equals(organization._id)
    );

    if (existingMembership && existingMembership.status === 'active') {
      return res.status(409).json({
        error: 'Already a member',
        code: 'ALREADY_MEMBER',
        message: `You are already a member of ${organization.name}`,
        organization: {
          _id: organization._id,
          name: organization.name,
          slug: organization.slug,
        },
      });
    }

    // Add user to organization
    req.user.addToOrganization(organization._id, invite.role);
    req.user.activeOrganizationId = organization._id;
    await req.user.save();

    // Record invite use
    await invite.recordUse(req.user._id);

    // Update org member count
    organization.stats.memberCount = (organization.stats.memberCount || 0) + 1;
    await organization.save();

    console.log(`User ${req.user.email} joined ${organization.name} via invite ${code}`);

    res.json({
      success: true,
      message: `Welcome to ${organization.name}!`,
      organization: {
        _id: organization._id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
      },
      role: invite.role,
    });
  } catch (error) {
    console.error('Error joining organization:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to join organization',
    });
  }
});

// ===== TEAM DISCOVERY & JOIN REQUEST ENDPOINTS =====

/**
 * GET /api/organizations/search
 * Search for discoverable teams by name (public endpoint for logged-in users)
 * 
 * @query {string} q - Search query (team name)
 * @query {number} [page=1] - Page number
 * @query {number} [limit=10] - Results per page
 */
router.get('/search', auth, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Invalid query',
        message: 'Search query must be at least 2 characters',
      });
    }

    const result = await Organization.searchByName(q.trim(), {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 20), // Max 20 results
    });

    // Add info about whether user is already a member or has pending request
    const userOrgIds = req.user.organizations?.map(o => o.organizationId.toString()) || [];
    const pendingRequests = await JoinRequest.find({
      userId: req.user._id,
      status: 'pending',
    }).select('organizationId');
    const pendingOrgIds = pendingRequests.map(r => r.organizationId.toString());

    const enrichedOrgs = result.organizations.map(org => ({
      ...org,
      isMember: userOrgIds.includes(org._id.toString()),
      hasPendingRequest: pendingOrgIds.includes(org._id.toString()),
    }));

    res.json({
      success: true,
      organizations: enrichedOrgs,
      total: result.total,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error('Error searching organizations:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to search organizations',
    });
  }
});

/**
 * GET /api/organizations/lookup/:cricHeroesId
 * Find a team by CricHeroes team ID
 */
router.get('/lookup/:cricHeroesId', auth, async (req, res) => {
  try {
    const { cricHeroesId } = req.params;

    if (!cricHeroesId || cricHeroesId.trim().length < 3) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'CricHeroes Team ID must be at least 3 characters',
      });
    }

    const organization = await Organization.findByCricHeroesId(cricHeroesId.trim());

    if (!organization) {
      return res.status(404).json({
        error: 'Not found',
        message: 'No team found with this CricHeroes ID. The team may not have registered yet.',
      });
    }

    // Check if not discoverable
    if (!organization.isDiscoverable) {
      return res.status(404).json({
        error: 'Not found',
        message: 'This team is not accepting join requests at this time.',
      });
    }

    // Check if user is already a member
    const isMember = req.user.organizations?.some(
      o => o.organizationId.toString() === organization._id.toString()
    );

    // Check for pending request
    const hasPendingRequest = await JoinRequest.hasPendingRequest(req.user._id, organization._id);

    res.json({
      success: true,
      organization: {
        _id: organization._id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        logo: organization.logo,
        stats: {
          playerCount: organization.stats.playerCount,
          memberCount: organization.stats.memberCount,
        },
        isMember,
        hasPendingRequest,
      },
    });
  } catch (error) {
    console.error('Error looking up organization:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to lookup organization',
    });
  }
});

/**
 * POST /api/organizations/:id/join-request
 * Request to join a team
 * 
 * @body {string} [message] - Optional message to team admins
 * @body {string} [discoveryMethod] - How user found the team
 */
router.post('/:id/join-request', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, discoveryMethod = 'search' } = req.body;

    // Validate organization ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Invalid organization ID format',
      });
    }

    // Find the organization
    const organization = await Organization.findOne({
      _id: id,
      isActive: true,
      isDeleted: false,
    });

    if (!organization) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Organization not found',
      });
    }

    // Check if organization is discoverable
    if (!organization.isDiscoverable) {
      return res.status(403).json({
        error: 'Not accepting requests',
        message: 'This team is not accepting join requests. Please ask an admin for an invite link.',
      });
    }

    // Check if user is already a member
    const isMember = req.user.organizations?.some(
      o => o.organizationId.toString() === organization._id.toString() && o.status === 'active'
    );

    if (isMember) {
      return res.status(409).json({
        error: 'Already a member',
        message: 'You are already a member of this team',
      });
    }

    // Check for existing pending request
    const hasPending = await JoinRequest.hasPendingRequest(req.user._id, organization._id);

    if (hasPending) {
      return res.status(409).json({
        error: 'Request pending',
        message: 'You already have a pending request to join this team',
      });
    }

    // Create the join request
    const joinRequest = new JoinRequest({
      organizationId: organization._id,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userAvatar: req.user.avatar,
      message: message?.trim().substring(0, 500),
      discoveryMethod,
    });

    await joinRequest.save();

    console.log(`Join request created: ${req.user.email} -> ${organization.name}`);

    res.status(201).json({
      success: true,
      message: 'Join request sent! The team admins will review your request.',
      request: {
        _id: joinRequest._id,
        organizationId: joinRequest.organizationId,
        organizationName: organization.name,
        status: joinRequest.status,
        createdAt: joinRequest.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating join request:', error);
    
    // Handle duplicate request error
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Request pending',
        message: 'You already have a pending request to join this team',
      });
    }
    
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create join request',
    });
  }
});

/**
 * GET /api/organizations/join-requests
 * List pending join requests for current organization (admin only)
 * 
 * @query {string} [status=pending] - Filter by status
 * @query {number} [page=1] - Page number
 * @query {number} [limit=20] - Results per page
 */
router.get('/join-requests', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    const filter = {
      organizationId: req.organization._id,
    };

    if (status !== 'all') {
      filter.status = status;
    }

    const requests = await JoinRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const total = await JoinRequest.countDocuments(filter);

    res.json({
      success: true,
      requests,
      total,
      hasMore: parseInt(page) * parseInt(limit) < total,
    });
  } catch (error) {
    console.error('Error fetching join requests:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch join requests',
    });
  }
});

/**
 * GET /api/organizations/my-requests
 * Get current user's join requests
 */
router.get('/my-requests', auth, async (req, res) => {
  try {
    const requests = await JoinRequest.find({
      userId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .populate('organizationId', 'name slug logo')
      .lean();

    res.json({
      success: true,
      requests: requests.map(r => ({
        _id: r._id,
        organization: r.organizationId,
        status: r.status,
        message: r.message,
        reviewNote: r.reviewNote,
        createdAt: r.createdAt,
        reviewedAt: r.reviewedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching user join requests:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch your join requests',
    });
  }
});

/**
 * PATCH /api/organizations/join-requests/:requestId
 * Approve or reject a join request (admin only)
 * 
 * @body {string} action - 'approve' or 'reject'
 * @body {string} [role='viewer'] - Role to assign if approving
 * @body {string} [note] - Optional note
 */
router.patch('/join-requests/:requestId', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, role = 'viewer', note } = req.body;

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        error: 'Invalid action',
        message: 'Action must be "approve" or "reject"',
      });
    }

    // Validate role if approving
    if (action === 'approve' && !['viewer', 'editor'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be "viewer" or "editor"',
      });
    }

    // Find the request
    const joinRequest = await JoinRequest.findOne({
      _id: requestId,
      organizationId: req.organization._id,
      status: 'pending',
    });

    if (!joinRequest) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Join request not found or already processed',
      });
    }

    if (action === 'approve') {
      // Approve the request
      await joinRequest.approve(req.user._id, role, note);

      // Add user to organization
      const requestingUser = await User.findById(joinRequest.userId);
      
      if (requestingUser) {
        requestingUser.addToOrganization(req.organization._id, role);
        if (!requestingUser.activeOrganizationId) {
          requestingUser.activeOrganizationId = req.organization._id;
        }
        await requestingUser.save();

        // Update org member count
        req.organization.stats.memberCount = (req.organization.stats.memberCount || 0) + 1;
        await req.organization.save();

        console.log(`Join request approved: ${requestingUser.email} -> ${req.organization.name} as ${role}`);
      }

      res.json({
        success: true,
        message: `${joinRequest.userName} has been added to the team as ${role}`,
        request: {
          _id: joinRequest._id,
          status: joinRequest.status,
          reviewedAt: joinRequest.reviewedAt,
        },
      });
    } else {
      // Reject the request
      await joinRequest.reject(req.user._id, note);

      console.log(`Join request rejected: ${joinRequest.userEmail} -> ${req.organization.name}`);

      res.json({
        success: true,
        message: 'Join request has been rejected',
        request: {
          _id: joinRequest._id,
          status: joinRequest.status,
          reviewedAt: joinRequest.reviewedAt,
        },
      });
    }
  } catch (error) {
    console.error('Error processing join request:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to process join request',
    });
  }
});

/**
 * DELETE /api/organizations/join-requests/:requestId
 * Cancel a pending join request (by the requester)
 */
router.delete('/join-requests/:requestId', auth, async (req, res) => {
  try {
    const { requestId } = req.params;

    const joinRequest = await JoinRequest.findOne({
      _id: requestId,
      userId: req.user._id,
      status: 'pending',
    });

    if (!joinRequest) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Join request not found or already processed',
      });
    }

    await joinRequest.cancel();

    res.json({
      success: true,
      message: 'Join request cancelled',
    });
  } catch (error) {
    console.error('Error cancelling join request:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to cancel join request',
    });
  }
});

/**
 * PATCH /api/organizations/settings
 * Update organization settings (admin only)
 * Includes cricHeroesTeamId and isDiscoverable
 */
router.patch('/settings', auth, resolveTenant, requireOrgAdmin, async (req, res) => {
  try {
    const { cricHeroesTeamId, isDiscoverable, ...otherSettings } = req.body;
    const updateFields = {};

    // Handle cricHeroesTeamId
    if (cricHeroesTeamId !== undefined) {
      if (cricHeroesTeamId === '' || cricHeroesTeamId === null) {
        updateFields.cricHeroesTeamId = null;
      } else {
        // Check if ID is already taken by another org
        const existingOrg = await Organization.findOne({
          cricHeroesTeamId: cricHeroesTeamId.trim(),
          _id: { $ne: req.organization._id },
        });

        if (existingOrg) {
          return res.status(409).json({
            error: 'ID already taken',
            message: 'This CricHeroes Team ID is already linked to another team',
          });
        }

        updateFields.cricHeroesTeamId = cricHeroesTeamId.trim();
      }
    }

    // Handle isDiscoverable
    if (typeof isDiscoverable === 'boolean') {
      updateFields.isDiscoverable = isDiscoverable;
    }

    // Handle other settings if needed
    if (Object.keys(otherSettings).length > 0) {
      for (const [key, value] of Object.entries(otherSettings)) {
        if (['name', 'description'].includes(key)) {
          updateFields[key] = value;
        }
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        error: 'No changes',
        message: 'No valid fields to update',
      });
    }

    const updatedOrg = await Organization.findByIdAndUpdate(
      req.organization._id,
      { $set: updateFields },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Settings updated',
      organization: {
        cricHeroesTeamId: updatedOrg.cricHeroesTeamId,
        isDiscoverable: updatedOrg.isDiscoverable,
        name: updatedOrg.name,
        description: updatedOrg.description,
      },
    });
  } catch (error) {
    console.error('Error updating organization settings:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update settings',
    });
  }
});

module.exports = router;
