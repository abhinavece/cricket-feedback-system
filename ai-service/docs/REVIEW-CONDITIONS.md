# Payment Review Conditions

This document lists all conditions under which a payment screenshot is flagged for admin review (`requiresReview: true`).

## Overview

The `requiresReview` flag indicates that a payment needs manual verification by an admin before being applied. This is a safety mechanism to prevent incorrect payments from being auto-applied.

## Review Reasons (review_reason field)

### 1. AI Service Level Conditions

These are set by the AI Payment Parser service (`ai-service/services/payment_parser.py`):

| Reason | Description | Trigger Condition |
|--------|-------------|-------------------|
| `not_payment_screenshot` | Image is not a valid payment screenshot | AI determines the image doesn't contain payment information |
| `validation_failed` | Payment data validation failed | Extracted amount is 0 or negative |
| `date_mismatch` | Payment date doesn't match expected | Payment date is before the match date |
| `date_too_old` | Payment is too old | Payment date is more than 7 days before match date |
| `low_confidence` | AI confidence score is too low | Confidence < 0.7 (MIN_CONFIDENCE_THRESHOLD) |
| `ai_error` | AI processing error | Any exception during AI processing |

### 2. Backend Service Level Conditions

These are set by the backend payment distribution service (`backend/services/paymentDistributionService.js`):

| Reason | Description | Trigger Condition |
|--------|-------------|-------------------|
| `partial_payment` | Payment amount is less than expected | `totalAmount < pendingDueAmount` AND difference > ₹50 |
| `overpayment` | Payment amount exceeds expected | `totalAmount > pendingDueAmount` AND difference > ₹50 |

### 3. Screenshot Model Level Conditions

These are set by the PaymentScreenshot model (`backend/models/PaymentScreenshot.js`):

| Reason | Description | Trigger Condition |
|--------|-------------|-------------------|
| `duplicate_image` | Duplicate screenshot detected | Image hash matches an existing screenshot |

## Decision Flow

```
Payment Screenshot Received
        │
        ▼
┌───────────────────────┐
│ AI Service Processing │
└───────────────────────┘
        │
        ├── Is it a payment screenshot?
        │   └── NO → requiresReview=true, reason="not_payment_screenshot"
        │
        ├── Is amount > 0?
        │   └── NO → requiresReview=true, reason="validation_failed"
        │
        ├── Is payment date valid?
        │   └── NO → requiresReview=true, reason="date_mismatch" or "date_too_old"
        │
        ├── Is confidence >= 0.7?
        │   └── NO → requiresReview=true, reason="low_confidence"
        │
        ▼
┌───────────────────────┐
│ Backend Distribution  │
└───────────────────────┘
        │
        ├── Is image duplicate?
        │   └── YES → requiresReview=true, reason="duplicate_image"
        │
        ├── Is payment amount significantly different from expected?
        │   ├── Too low (>₹50 diff) → requiresReview=true, reason="partial_payment"
        │   └── Too high (>₹50 diff) → requiresReview=true, reason="overpayment"
        │
        ▼
┌───────────────────────┐
│ Auto-Applied or       │
│ Flagged for Review    │
└───────────────────────┘
```

## Bypass Flags (Development Only)

For testing purposes, the following environment flags can bypass certain checks:

| Flag | Description | Location |
|------|-------------|----------|
| `BYPASS_PAYMENT_REVIEW` | Bypasses admin review requirement | `backend/.env` |
| `BYPASS_DUPLICATE_CHECK` | Bypasses duplicate image detection | `backend/.env` |

⚠️ **WARNING**: These flags should NEVER be enabled in production!

## Admin Review Workflow

When a payment is flagged for review:

1. Screenshot appears in "Pending Review" list in admin dashboard
2. Admin can view the screenshot, AI analysis, and detected amount
3. Admin can:
   - **Approve**: Apply the payment as detected
   - **Modify**: Adjust the amount before applying
   - **Reject**: Mark the screenshot as invalid

## Configuration

### AI Service Configuration

```python
# ai-service/config.py
MIN_CONFIDENCE_THRESHOLD = 0.7  # Minimum confidence to auto-approve
```

### Backend Configuration

```javascript
// backend/services/paymentDistributionService.js
const AMOUNT_DIFF_THRESHOLD = 50;  // ₹50 tolerance for amount mismatch
```

## Related Files

- `ai-service/services/payment_parser.py` - AI parsing and validation
- `backend/services/paymentDistributionService.js` - Payment distribution logic
- `backend/models/PaymentScreenshot.js` - Screenshot model with duplicate detection
- `backend/routes/whatsapp.js` - WhatsApp webhook processing
