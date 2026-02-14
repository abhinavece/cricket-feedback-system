# Auth & Registration Overhaul — Phases 3–6 Detailed Plan

Comprehensive plan for cross-product invitations, role clarity UX, enhanced authentication, and admin governance — designed to bring CricSmart to industry-standard SaaS patterns (Slack, Notion, Linear, Atlassian).

---

## Table of Contents
1. [Current State Audit](#current-state-audit)
2. [Phase 3: Cross-Product Invitation System](#phase-3-cross-product-invitation-system)
3. [Phase 4: Role Clarity UX](#phase-4-role-clarity-ux)
4. [Phase 5: Enhanced Auth](#phase-5-enhanced-auth)
5. [Phase 6: Admin Transfer & Governance](#phase-6-admin-transfer--governance)
6. [Industry Benchmarks](#industry-benchmarks)
7. [Dependencies & Sequencing](#dependencies--sequencing)

---

## Current State Audit

### What Exists Today

| Feature | Team Management (app.) | Tournament (tournament.) | Auction (auction.) |
|---------|----------------------|------------------------|--------------------|
| **Org invite links** | ✅ Full UI (TeamSettingsTab) | ❌ No UI | ❌ N/A (resource-level) |
| **Join via code** | ✅ InvitePage.tsx | ✅ TournamentOnboarding (Phase 1) | ❌ No flow |
| **Direct email invite** | ✅ Backend only (user must exist) | ❌ None | ❌ None |
| **Member management** | ✅ TeamSettingsTab (role change, remove) | ❌ None | Partial (add admin via API) |
| **Join requests** | ✅ Behind TEAM_DISCOVERY flag | ❌ None | ❌ None |
| **Role badges** | Partial (OrganizationSwitcher) | ❌ None | ❌ None |
| **Ownership transfer** | ❌ Blocked ("Cannot change owner role") | ❌ None | ❌ None |
| **Audit logging** | ❌ None | ❌ None | ✅ ActionEvent (auction actions only) |
| **Email notifications** | ❌ No email service | ❌ None | ❌ None |

### Data Models (Current)

```
User.organizations[] → { organizationId, role: owner|admin|editor|viewer, status, invitedBy }
Organization → { ownerId, limits.maxAdmins, limits.maxEditors, isDiscoverable }
OrganizationInvite → { code, role, maxUses, expiresAt, usedBy[], createdBy }
JoinRequest → { userId, organizationId, status: pending|approved|rejected, reviewedBy }
Auction.admins[] → { userId, role: owner|admin, email }
```

### Key Gaps
1. **No email service** — can't send invite emails, notifications, or magic links
2. **Tournament frontend has zero member management** — no settings page, no invite UI
3. **Auction invite flow is manual** — admin adds by email via API, no link-based flow
4. **Direct email invite fails silently** if user hasn't signed up yet (returns 404)
5. **No ownership transfer** for organizations or auctions
6. **No audit trail** for role changes in organizations
7. **Dev login is unrestricted in production** — security risk

---

## Phase 3: Cross-Product Invitation System

### 3.1 Problem Statement

Invitations only work in the team management app. A tournament admin can't invite co-admins. An auction owner has no self-service way to add co-admins. There's no email notification when you're invited — you just have to know to check.

### 3.2 Industry Standard (Slack, Notion, Linear)

| Pattern | How It Works |
|---------|-------------|
| **Invite link** | Generate a shareable link → anyone with it can join at a preset role |
| **Email invite** | Admin types email → system sends invite email → recipient clicks link → joins |
| **Pending invite** | If recipient doesn't have an account, invite is stored; on first login, auto-joined |
| **Invite preview** | Before joining, see org name, logo, who invited you, what role you'll get |
| **Cross-product** | One invite = one workspace. Products are features within the workspace, not separate invites |

### 3.3 Design Decisions

**Decision 1: Organization = Workspace (shared across products)**
- An org invite grants access to the org. The org's data spans team management AND tournament hub.
- Auction remains resource-level (separate from org membership).
- This means: invite to "Mumbai Cricket League" org → user can access both team and tournament features for that org.

**Decision 2: Pending invites for non-existent users**
- Currently: `POST /members/invite` returns 404 if user doesn't exist.
- New: Store a `PendingInvite` record with email + role. On first login, auto-process all pending invites for that email.
- Industry standard: Slack, Notion, Linear all do this.

**Decision 3: Auction admin invites via shareable link**
- Add `AuctionInvite` model (similar to `OrganizationInvite` but for auction admin access).
- Invite link: `auction.cricsmart.in/invite/:code` → preview → join as admin.

### 3.4 Implementation Plan

#### 3.4A: Email Service Infrastructure (PREREQUISITE)

**Why first**: Email invites, pending invites, and magic links all need an email sender.

- **Service**: Use **Resend** (modern, generous free tier: 3k emails/month, great DX) or **SendGrid** (more enterprise).
- **Files**:
  - `backend/services/emailService.js` — Abstraction layer (send transactional emails)
  - `backend/templates/` — HTML email templates (invite, welcome, magic link)
- **Templates needed**:
  - `invite-to-org.html` — "You've been invited to [Org] as [Role]"
  - `invite-to-auction.html` — "You've been invited to manage [Auction]"
  - `welcome.html` — "Welcome to CricSmart" (on first signup)
  - `magic-link.html` — (Phase 5)
- **Env vars**: `EMAIL_SERVICE=resend`, `EMAIL_API_KEY`, `EMAIL_FROM=noreply@cricsmart.in`

#### 3.4B: Pending Invite Model

```javascript
// backend/models/PendingInvite.js
{
  email: String,              // Invitee email (lowercased)
  type: 'organization' | 'auction',
  resourceId: ObjectId,       // Organization ID or Auction ID
  role: String,               // Role to assign
  invitedBy: ObjectId,        // User who invited
  status: 'pending' | 'accepted' | 'expired' | 'cancelled',
  expiresAt: Date,            // Auto-expire after 30 days
  emailSentAt: Date,          // When invite email was sent
  acceptedAt: Date,           // When user accepted
}
```

#### 3.4C: Backend Changes

1. **Update `POST /organizations/members/invite`**:
   - If user exists → add to org immediately (current behavior)
   - If user doesn't exist → create PendingInvite + send invite email
   - Return success either way (don't expose whether email is registered)

2. **Add auto-join on login** in `POST /auth/google`:
   - After user creation/login, check `PendingInvite.find({ email, status: 'pending' })`
   - Auto-accept all valid pending invites
   - Set `needsOnboarding: false` if any invites were accepted

3. **Add `POST /api/v1/auctions/:auctionId/admins/invite`**:
   - Invite by email to become auction co-admin
   - If user exists → add to `auction.admins[]`
   - If not → create PendingInvite (type: 'auction') + send email

4. **Add `POST /api/v1/auctions/:auctionId/admins/invite-link`**:
   - Generate shareable invite link for auction admin access
   - New model: `AuctionInvite` (code, auctionId, role, maxUses, expiresAt)
   - Join endpoint: `POST /api/v1/auctions/join/:code`

#### 3.4D: Tournament Frontend — Member Management

The tournament frontend currently has ZERO member management. Add:

1. **`tournament-frontend/src/pages/SettingsPage.tsx`** — New page with tabs:
   - **Members tab**: List members, change roles, remove members
   - **Invites tab**: Create/manage invite links, see pending invites
   - **General tab**: Org name, description

2. **API methods** in `tournament-frontend/src/services/api.ts`:
   - `organizationApi.getMembers()`
   - `organizationApi.inviteMember(email, role)`
   - `organizationApi.updateMemberRole(userId, role)`
   - `organizationApi.removeMember(userId)`
   - `organizationApi.createInviteLink(role, options)`
   - `organizationApi.getInviteLinks()`
   - `organizationApi.revokeInviteLink(inviteId)`

3. **Invite page**: `tournament-frontend/src/pages/InvitePage.tsx` — handle `/invite/:code`

#### 3.4E: Auction Frontend — Admin Invite Flow

1. **Admin page**: Add "Invite Co-Admin" section in admin overview
   - Email invite input
   - Generate shareable admin link
   - List current admins with role badges

2. **Invite page**: `auction-frontend/src/app/invite/[code]/page.tsx`
   - Preview: auction name, who invited, role
   - Join button (requires login)

#### 3.4F: Universal Invite Landing Page (seo-site)

For invite links shared outside the app (WhatsApp, email), add:
- `seo-site/app/invite/[code]/page.tsx` — Smart invite router
  - Fetches invite details from backend
  - Shows preview (org/auction name, role, who invited)
  - "Accept Invite" button → login if needed → redirect to correct subdomain

### 3.5 Files to Create/Modify

| File | Action |
|------|--------|
| `backend/services/emailService.js` | **Create** — Email abstraction |
| `backend/templates/invite-to-org.html` | **Create** — Invite email template |
| `backend/templates/invite-to-auction.html` | **Create** — Auction invite template |
| `backend/models/PendingInvite.js` | **Create** — Pending invites for non-registered users |
| `backend/models/AuctionInvite.js` | **Create** — Shareable auction admin invite links |
| `backend/routes/organizations.js` | **Modify** — Update email invite to handle non-existent users |
| `backend/routes/auth.js` | **Modify** — Auto-process pending invites on login |
| `backend/routes/auction.js` | **Modify** — Add admin invite endpoints |
| `tournament-frontend/src/pages/SettingsPage.tsx` | **Create** — Member + invite management |
| `tournament-frontend/src/pages/InvitePage.tsx` | **Create** — Invite accept page |
| `tournament-frontend/src/services/api.ts` | **Modify** — Add member/invite API methods |
| `auction-frontend/src/app/invite/[code]/page.tsx` | **Create** — Auction invite page |
| `auction-frontend/src/app/admin/*/page.tsx` | **Modify** — Add admin invite UI |
| `seo-site/app/invite/[code]/page.tsx` | **Create** — Universal invite landing |

### 3.6 User Flow Diagrams

**Flow A: Admin invites by email (user exists)**
```
Admin types email → POST /members/invite → User found → Added immediately → Email notification sent
```

**Flow B: Admin invites by email (user doesn't exist)**
```
Admin types email → POST /members/invite → User NOT found → PendingInvite created → Invite email sent
→ Recipient clicks link → Redirected to login → Google OAuth → On login, PendingInvite auto-accepted → Redirected to dashboard
```

**Flow C: Admin shares invite link**
```
Admin generates link → Copies URL → Shares via WhatsApp/email
→ Recipient opens link → Sees preview (org name, role) → Clicks "Join" → Login if needed → Joined
```

**Flow D: Auction admin invite**
```
Auction owner → "Invite Co-Admin" → Types email → POST /auctions/:id/admins/invite
→ If user exists: added to auction.admins[] immediately
→ If not: PendingInvite created → email sent → on login, auto-added
```

---

## Phase 4: Role Clarity UX

### 4.1 Problem Statement

Users don't understand what their role means. There's no visual indication of permissions. Role changes happen without confirmation. The role hierarchy isn't explained anywhere.

### 4.2 Industry Standard (Notion, Linear, GitHub)

| Pattern | How It Works |
|---------|-------------|
| **Role badge** | Colored pill next to username everywhere (member list, sidebar, profile) |
| **Permission matrix** | Settings page shows what each role can do |
| **Confirmation dialog** | "Promote John to Admin? Admins can manage members and settings." |
| **Role tooltips** | Hover on role badge → see capabilities |
| **Downgrade warning** | "Demote to Viewer? They will lose ability to edit matches." |

### 4.3 Design: Role Permission Matrix

```
                        Owner    Admin    Editor    Viewer
──────────────────────────────────────────────────────────
View data                 ✅       ✅       ✅        ✅
Edit matches/players      ✅       ✅       ✅        ❌
Create tournaments        ✅       ✅       ✅        ❌
Send WhatsApp messages    ✅       ✅       ❌        ❌
Manage members            ✅       ✅       ❌        ❌
Create invite links       ✅       ✅       ❌        ❌
Promote to admin          ✅       ❌       ❌        ❌
Change org settings       ✅       ✅       ❌        ❌
Delete organization       ✅       ❌       ❌        ❌
Transfer ownership        ✅       ❌       ❌        ❌
```

### 4.4 Implementation Plan

#### 4.4A: Shared RoleBadge Component

Create a reusable `RoleBadge` component used across ALL frontends:

```typescript
// Shared pattern (each frontend gets its own copy or shared package)
interface RoleBadgeProps {
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  size?: 'sm' | 'md';
  showTooltip?: boolean;
}
```

**Color scheme** (consistent across all products):
- **Owner**: Amber/Gold — `bg-amber-500/20 text-amber-400 border-amber-500/30`
- **Admin**: Purple — `bg-purple-500/20 text-purple-400 border-purple-500/30`
- **Editor**: Blue — `bg-blue-500/20 text-blue-400 border-blue-500/30`
- **Viewer**: Slate — `bg-slate-500/20 text-slate-400 border-slate-500/30`

#### 4.4B: Confirmation Dialogs for Role Changes

Every destructive/elevated action gets a confirmation modal:

1. **Promote to Admin**: "Make [Name] an Admin? They'll be able to manage members, create invites, and change settings."
2. **Demote to Viewer**: "Change [Name] to Viewer? They'll lose the ability to edit data."
3. **Remove member**: "Remove [Name] from [Org]? They'll lose all access. This can be undone by re-inviting."
4. **Delete invite link**: "Revoke this invite? Anyone with the link will no longer be able to join."

#### 4.4C: Permission-Aware UI

UI elements should be hidden or disabled based on role:

- **Viewer**: Sees data but no edit buttons, no settings tab
- **Editor**: Sees edit buttons but no "Manage Members" or "Team Settings"
- **Admin**: Full access except ownership transfer and org deletion
- **Owner**: Everything

Implementation: `usePermissions()` hook in each frontend:
```typescript
const { canEdit, canManageMembers, canChangeSettings, isOwner } = usePermissions();
```

#### 4.4D: Role Explanation Page

Add `/settings/roles` or in-settings tooltip that shows the permission matrix. Referenced from:
- Invite creation form ("This link will let people join as Viewer")
- Role change dropdowns
- Member list

#### 4.4E: Auction Role Badges

Auction has a separate role model (`auction.admins[].role`):
- **Owner** (creator): Full control, can delete auction
- **Admin** (invited): Can manage players, teams, run auction, but can't delete

Show these badges in:
- Admin overview page
- Admin sidebar/nav
- Auction settings

### 4.5 Files to Create/Modify

| File | Action |
|------|--------|
| `frontend/src/components/RoleBadge.tsx` | **Create** — Reusable role badge |
| `frontend/src/components/ConfirmRoleChangeModal.tsx` | **Create** — Confirmation dialog |
| `frontend/src/hooks/usePermissions.ts` | **Create** — Permission hook |
| `frontend/src/components/TeamSettingsTab.tsx` | **Modify** — Add confirmations, better role UI |
| `tournament-frontend/src/components/RoleBadge.tsx` | **Create** — Copy of role badge |
| `tournament-frontend/src/hooks/usePermissions.ts` | **Create** — Permission hook |
| `auction-frontend/src/components/RoleBadge.tsx` | **Create** — Auction role badge variant |

---

## Phase 5: Enhanced Auth

### 5.1 Problem Statement

CricSmart only supports Google OAuth. Users without Google accounts (common in India's cricket community) can't use the platform. There's no fallback if Google OAuth is down. Session management is basic (no refresh tokens, no device management).

### 5.2 Industry Standard

| Method | Adoption | Use Case |
|--------|----------|----------|
| **Google OAuth** | ✅ Already have | Primary for tech-savvy users |
| **Magic Link** | Notion, Slack, Linear | Email-based passwordless login |
| **Phone OTP** | WhatsApp, Paytm, PhonePe | Huge in India, reaches non-Google users |
| **Email + Password** | Legacy | NOT recommended (password management burden) |
| **Passkeys/WebAuthn** | Future | Biometric auth, emerging standard |

### 5.3 Design Decisions

**Decision 1: Magic Link first, Phone OTP second**
- Magic link requires only the email service (Phase 3 prerequisite)
- Phone OTP requires SMS provider (Twilio/MSG91) — higher cost, separate infrastructure

**Decision 2: No email+password**
- Password management is a liability (hashing, reset flows, breach exposure)
- Magic link provides the same email-based auth without passwords
- Industry trend: Notion dropped passwords for magic links

**Decision 3: Link accounts, don't create duplicates**
- If user logs in with Google (email: john@gmail.com), then later uses magic link with same email → same account
- Single source of truth: `User.email` is the identity anchor

### 5.4 Implementation Plan

#### 5.4A: Magic Link Login

**How it works**:
1. User enters email on login page
2. Backend generates a short-lived token (15 min), stores it
3. Email sent: "Click here to sign in to CricSmart"
4. User clicks link → backend verifies token → issues JWT → redirected to app
5. Token is single-use (consumed on verification)

**Backend changes**:
- `backend/models/MagicToken.js` — `{ email, token, expiresAt, isUsed }`
- `backend/routes/auth.js` — `POST /auth/magic-link` (request), `GET /auth/magic-link/verify/:token` (verify)
- Uses `emailService.js` from Phase 3

**Frontend changes**:
- Login page: Add "Sign in with Email" tab below Google button
- Email input → "Check your inbox" screen
- Callback page handles magic link token

**Security**:
- Token expires in 15 minutes
- Single-use (marked as used after verification)
- Rate limit: max 5 magic link requests per email per hour
- Token is cryptographically random (32 bytes)

#### 5.4B: Phone OTP Login (India-focused)

**How it works**:
1. User enters phone number (+91)
2. Backend sends OTP via SMS (6 digits, 5 min expiry)
3. User enters OTP → backend verifies → issues JWT
4. If first login, creates user with phone as identifier

**Backend changes**:
- `backend/models/OTPToken.js` — `{ phone, otp, expiresAt, attempts }`
- `backend/routes/auth.js` — `POST /auth/otp/request`, `POST /auth/otp/verify`
- `backend/services/smsService.js` — SMS provider abstraction (MSG91 or Twilio)
- `backend/models/User.js` — Add `phone` field, make `googleId` optional

**Frontend changes**:
- Login page: Add "Sign in with Phone" tab
- Phone input → OTP input → auto-verify

**Security**:
- OTP expires in 5 minutes
- Max 3 attempts per OTP
- Rate limit: max 5 OTP requests per phone per hour
- Lockout after 10 failed attempts in 24h

**Cost consideration**:
- MSG91: ₹0.16/SMS (cheapest India provider)
- Twilio: ~₹0.50/SMS for India
- Budget: ~₹500/month for 3000 OTPs

#### 5.4C: Session Management Improvements

**Current problem**: JWT tokens have fixed expiry, no refresh mechanism, no device tracking.

**Changes**:
1. **Refresh tokens**: Issue short-lived access token (1h) + long-lived refresh token (30d)
   - `POST /auth/refresh` — Exchange refresh token for new access token
   - Store refresh tokens in `RefreshToken` model with device info
2. **Device management**: Track active sessions
   - `GET /auth/sessions` — List active devices/sessions
   - `DELETE /auth/sessions/:sessionId` — Revoke a session
3. **Token rotation**: Refresh token is single-use, new one issued on each refresh

#### 5.4D: Security Hardening

1. **Disable dev-login in production**: Currently `TEMPORARILY DISABLED` — re-enable the production guard
2. **Rate limiting**: Add express-rate-limit to auth endpoints
3. **CORS tightening**: Verify allowed origins match deployed domains
4. **JWT secret rotation**: Plan for periodic rotation without invalidating all sessions

### 5.5 Files to Create/Modify

| File | Action |
|------|--------|
| `backend/models/MagicToken.js` | **Create** — Magic link tokens |
| `backend/models/OTPToken.js` | **Create** — Phone OTP tokens |
| `backend/models/RefreshToken.js` | **Create** — Refresh token storage |
| `backend/services/smsService.js` | **Create** — SMS provider abstraction |
| `backend/routes/auth.js` | **Modify** — Add magic link + OTP + refresh endpoints |
| `backend/models/User.js` | **Modify** — Add `phone` field, make `googleId` optional |
| `seo-site/app/auth/login/page.tsx` | **Modify** — Add email/phone login tabs |
| `seo-site/app/auth/magic-link/page.tsx` | **Create** — Magic link verification page |
| All frontend AuthContexts | **Modify** — Add refresh token logic |

---

## Phase 6: Admin Transfer & Governance

### 6.1 Problem Statement

Organization owners can't transfer ownership. There's no audit trail for who changed what role. No safeguards against accidental org deletion. No governance for multi-admin scenarios.

### 6.2 Industry Standard (GitHub, Atlassian, AWS)

| Pattern | How It Works |
|---------|-------------|
| **Ownership transfer** | Owner initiates → recipient confirms → ownership transfers atomically |
| **Audit log** | Every role change, member add/remove, setting change is logged with who+when+what |
| **Deletion safeguard** | "Type org name to confirm deletion" + 30-day grace period |
| **Two-person rule** | Certain actions (delete org, transfer ownership) require confirmation from another admin |
| **Activity feed** | Admins see a feed of recent org-level changes |

### 6.3 Implementation Plan

#### 6.3A: Ownership Transfer

**Organization ownership transfer**:
1. Owner navigates to Settings → Danger Zone → "Transfer Ownership"
2. Selects another admin from dropdown (only admins eligible)
3. Confirmation: "Transfer ownership of [Org] to [Name]? You'll become an Admin."
4. Backend:
   - Validates new owner is an admin of the org
   - Updates `organization.ownerId` to new owner
   - Changes old owner's role from `owner` to `admin`
   - Changes new owner's role from `admin` to `owner`
   - Creates audit log entry
   - Sends email notification to both parties

**Auction ownership transfer**:
- Same pattern but for `auction.admins[]`
- Only owner can transfer

**Endpoint**: `POST /api/organizations/transfer-ownership`
```json
{ "newOwnerId": "userId" }
```

#### 6.3B: Audit Log

**Model**: `backend/models/AuditLog.js`
```javascript
{
  organizationId: ObjectId,   // Scoped to org
  actorId: ObjectId,          // Who performed the action
  actorEmail: String,         // Denormalized for display
  action: String,             // 'member.role_changed', 'member.removed', 'invite.created', etc.
  targetType: String,         // 'user', 'invite', 'organization', 'auction'
  targetId: ObjectId,         // What was affected
  targetEmail: String,        // Denormalized
  details: Mixed,             // { oldRole: 'viewer', newRole: 'admin' }
  ip: String,                 // Request IP
  userAgent: String,          // Request user agent
  createdAt: Date,
}
```

**Actions to log**:
- `member.added`, `member.removed`, `member.role_changed`
- `invite.created`, `invite.revoked`, `invite.used`
- `organization.settings_changed`, `organization.ownership_transferred`
- `organization.deleted`
- `join_request.approved`, `join_request.rejected`

**Endpoints**:
- `GET /api/organizations/audit-log?page=1&limit=50` — List audit events (admin only)

**Frontend**: Add "Activity" tab to settings page showing audit log with:
- Timeline UI (who did what, when)
- Filterable by action type
- Exportable to CSV

#### 6.3C: Deletion Safeguards

**Organization deletion** (enhance current soft-delete):
1. Owner clicks "Delete Organization" in settings
2. Modal: "Type the organization name to confirm: [input field]"
3. Name must match exactly (case-insensitive)
4. 30-day grace period: Org is marked `isDeleted` but data preserved
5. During grace period: Owner can "Undo Deletion" to restore
6. After 30 days: Background job permanently deletes data (GDPR compliance)
7. Email notification sent to all members: "Organization [Name] was deleted by [Owner]"

**Endpoint enhancements**:
- `DELETE /api/organizations/current` — Add `confirmName` body param
- `POST /api/organizations/restore` — Undo deletion within grace period

#### 6.3D: Multi-Admin Governance

For organizations with multiple admins, add lightweight governance:

1. **Admin notification**: When one admin makes a significant change (role change, member removal), other admins get a notification (email or in-app)
2. **Change visibility**: All admins see the audit log (not just owner)
3. **Owner-only actions**: Clearly mark actions that require owner role:
   - Delete organization
   - Transfer ownership
   - Promote to admin (admins can promote to editor, only owner to admin)
   - Change billing/plan (future)

### 6.4 Files to Create/Modify

| File | Action |
|------|--------|
| `backend/models/AuditLog.js` | **Create** — Audit log model |
| `backend/services/auditService.js` | **Create** — Helper to create audit entries |
| `backend/routes/organizations.js` | **Modify** — Add transfer, restore, audit endpoints + logging |
| `backend/routes/auction.js` | **Modify** — Add auction ownership transfer |
| `frontend/src/components/AuditLogTab.tsx` | **Create** — Audit log UI |
| `frontend/src/components/TransferOwnershipModal.tsx` | **Create** — Transfer dialog |
| `frontend/src/components/DeleteOrgConfirmModal.tsx` | **Create** — Safe deletion dialog |
| `tournament-frontend/src/pages/SettingsPage.tsx` | **Modify** — Add audit + governance UI |

---

## Industry Benchmarks

### How Top SaaS Products Handle This

| Product | Invite | Roles | Auth Methods | Ownership Transfer | Audit |
|---------|--------|-------|--------------|-------------------|-------|
| **Slack** | Email + link | Owner, Admin, Member, Guest | Google, Apple, Email+Password, SAML | ✅ | ✅ Enterprise |
| **Notion** | Email + link | Owner, Admin, Member, Guest | Google, Apple, Magic Link, SAML | ✅ | ✅ |
| **Linear** | Email + link | Owner, Admin, Member | Google, Magic Link, SAML | ✅ | ✅ |
| **GitHub** | Email + link | Owner, Admin, Member, Outside Collaborator | Google, GitHub, Password, 2FA, Passkeys | ✅ | ✅ |
| **Atlassian** | Email + link | Org Admin, Site Admin, Member | Google, Microsoft, Apple, Email+Password | ✅ | ✅ |
| **CricSmart (target)** | Email + link | Owner, Admin, Editor, Viewer | Google, Magic Link, Phone OTP | ✅ | ✅ |

### Our Role Model vs Industry

CricSmart's 4-tier role model (Owner → Admin → Editor → Viewer) is more granular than most (which use 3 tiers). This is **good** — it maps well to cricket team dynamics:
- **Owner**: Team captain/organizer who created the team
- **Admin**: Co-organizers, team managers
- **Editor**: Scorekeepers, squad managers
- **Viewer**: Players who just check their availability and stats

---

## Dependencies & Sequencing

```
Phase 3A (Email Service)     ← PREREQUISITE for everything else
    ↓
Phase 3B-F (Invitations)     ← Can be done incrementally
    ↓
Phase 4 (Role Clarity UX)   ← Independent, can parallelize with 3
    ↓
Phase 5A (Magic Link)       ← Needs email service from 3A
Phase 5B (Phone OTP)        ← Independent (needs SMS provider)
Phase 5C (Session Mgmt)     ← Independent
    ↓
Phase 6 (Governance)        ← Needs stable role system from 3+4
```

### Recommended Build Order

| Step | What | Effort | Impact |
|------|------|--------|--------|
| 1 | 3A: Email service infrastructure | 1 day | Unblocks everything |
| 2 | 3B-C: Pending invites + auto-join on login | 1 day | Fixes biggest UX gap |
| 3 | 3D: Tournament member management UI | 2 days | Tournament is missing all of this |
| 4 | 4A-C: Role badges + confirmations + permission hooks | 1 day | Polish across all products |
| 5 | 3E-F: Auction admin invites + universal landing | 1 day | Completes invitation coverage |
| 6 | 6A: Ownership transfer | 0.5 day | Critical governance gap |
| 7 | 6B: Audit logging | 1 day | Enterprise readiness |
| 8 | 6C-D: Deletion safeguards + multi-admin governance | 0.5 day | Safety net |
| 9 | 5A: Magic link login | 1 day | Expands user base |
| 10 | 5B: Phone OTP | 1 day | India market expansion |
| 11 | 5C-D: Session management + security hardening | 1 day | Production hardening |

**Total estimated effort**: ~11 days of focused work

---

## Open Questions for Discussion

1. **Email provider**: Resend vs SendGrid vs AWS SES? (Recommendation: Resend for DX, SES for cost at scale)
2. **SMS provider for OTP**: MSG91 (India-optimized, cheapest) vs Twilio (global, more expensive)?
3. **Should editors be able to create tournaments?** Current plan says yes, but could be admin-only.
4. **Audit log retention**: How long to keep? 90 days? 1 year? Forever?
5. **Do we need a separate "Guest" role** (like Slack/Notion) for limited external access?
6. **Phone OTP priority**: Is this needed now, or can it wait until we have more non-Google users?
7. **Should invite links be product-specific** (e.g., different links for team vs tournament access within same org)?
