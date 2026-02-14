# Manual Payment & Checkout Flow

A centralized checkout page on the seo-site where users pay via UPI/bank transfer/QR and submit proof, with admin verification to activate features.

---

## Customer Flow (3 steps)

```
Pricing Page → "Get Started" (paid plan)
       ↓
Google Login (if not logged in)
       ↓
/checkout?plan=pro&service=team → See QR/UPI/Bank details → Pay externally → Submit UTR
       ↓
"Payment Submitted" confirmation → Admin verifies → Feature activated
```

**Free plan** → skips checkout, redirects directly to app (current behavior).

---

## Entry Points (source tracking)

| Source | URL Example |
|--------|------------|
| Pricing page | `/checkout?plan=pro&service=team&source=pricing` |
| In-app upgrade | `cricsmart.in/checkout?plan=pro&service=team&org=mavericks&source=in-app` |
| Tournament page | `/checkout?plan=tournament&service=tournament&source=tournament-page` |
| Direct link | `/checkout?plan=auction&service=auction&source=direct` |

Query params: `plan`, `service`, `org` (optional slug), `source` (analytics).

---

## Implementation

### 1. Backend: `PlatformOrder` model (`backend/models/PlatformOrder.js`)

```
- orderId          (human-readable: "CRS-20260211-001")
- userId           (ref: User)
- organizationId   (ref: Organization, optional)
- plan             (pro | tournament | auction)
- service          (team | tournament | auction)
- amount           (Number, in INR)
- paymentMethod    (upi | bank_transfer)
- transactionRef   (UTR / transaction ID from user)
- screenshotUrl    (optional)
- status           (pending | verified | activated | rejected | expired)
- source           (pricing | in-app | tournament-page | direct)
- metadata         (Object, any extra context)
- adminNotes       (String)
- verifiedBy       (ref: User)
- verifiedAt       (Date)
- activatedAt      (Date)
- expiresAt        (Date, for subscriptions)
- createdAt/updatedAt
```

### 2. Backend: Order API routes (`backend/routes/orders.js`)

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /api/orders` | User | Create payment order (submit UTR) |
| `GET /api/orders/my` | User | List my orders + statuses |
| `GET /api/orders/:id` | User | Get single order detail |
| `GET /api/admin/orders` | Platform Admin | List all orders (filterable) |
| `PATCH /api/admin/orders/:id/verify` | Platform Admin | Mark payment verified |
| `PATCH /api/admin/orders/:id/activate` | Platform Admin | Activate feature for org |
| `PATCH /api/admin/orders/:id/reject` | Platform Admin | Reject with reason |

**Activation logic** (on admin activate):
- **Pro**: `org.plan = 'pro'`, update `org.limits` (unlimited players, etc.)
- **Tournament**: Create or unlock tournament access, set 1-year expiry
- **Auction**: Enable auction feature for the org

### 3. SEO-site: `/checkout` page (`seo-site/app/checkout/page.tsx`)

Client component (needs auth from localStorage). Shows:
- **Order summary card** — plan name, features included, price
- **Payment details section**:
  - UPI QR code image (static image you provide)
  - UPI ID: `cricsmart@upi` (or your actual UPI)
  - Bank transfer details: account number, IFSC, bank name
- **Payment confirmation form**:
  - Transaction/UTR reference (required text input)
  - Payment method (UPI / Bank Transfer radio)
  - Amount (pre-filled from plan, read-only)
  - Submit button
- **Post-submit**: Success state with order ID, "We'll verify within 24 hours" message

### 4. SEO-site: `/orders` page (`seo-site/app/orders/page.tsx`)

Simple page showing user's order history with status badges:
- 🟡 Pending → 🔵 Verified → 🟢 Activated
- 🔴 Rejected (with reason)

### 5. Update pricing page CTA links

Change paid plan "Get Started" buttons:
```
// Before (goes directly to app)
/auth/login?redirect=https://app.cricsmart.in&service=team

// After (goes to checkout via login)  
/auth/login?redirect=/checkout?plan=pro&service=team&source=pricing
```

Free plan stays as-is (direct to app).

### 6. Admin panel: Orders tab

Add an "Orders" section in the existing admin dashboard:
- Table: Order ID, User, Plan, Amount, UTR, Status, Date
- Actions per row: Verify / Activate / Reject
- Filter by status (pending/verified/activated/rejected)

---

## What You Need to Provide

Before implementation, I'll need from you:
1. **UPI ID** to display on checkout page
2. **QR code image** (or I generate a placeholder)
3. **Bank account details** (account number, IFSC, bank name) — or skip bank transfer for now
4. Which admin dashboard to add the orders tab to (main frontend app admin?)

---

## What This Does NOT Include (keep simple)
- No payment gateway integration
- No automatic payment verification
- No email/WhatsApp notifications (can add later)
- No recurring billing automation (admin manually re-activates)

---

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `backend/models/PlatformOrder.js` |
| Create | `backend/routes/orders.js` |
| Modify | `backend/index.js` (register orders route) |
| Create | `seo-site/app/checkout/page.tsx` |
| Create | `seo-site/app/orders/page.tsx` |
| Modify | `seo-site/app/pricing/page.tsx` (update CTA links) |
| Modify | Admin dashboard (add orders management tab) |
