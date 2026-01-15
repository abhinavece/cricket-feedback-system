# WhatsApp Webhook Proxy Setup Guide

## Overview

The Webhook Proxy allows you to test WhatsApp webhook events on your local development machine while ensuring all production events are still processed correctly.

### Key Features

1. **No Data Loss**: ALL webhook events ALWAYS go to production first
2. **Selective Local Routing**: Only events from your configured phone numbers are also forwarded to local
3. **One-Click Toggle**: Enable/disable local routing instantly from the admin UI
4. **Real-Time Stats**: Monitor routing statistics in the dashboard

## Architecture

```
                                    ┌──────────────────┐
                                    │   Production     │
                                    │   Backend        │
                         ┌─────────►│   (Always)       │
                         │          └──────────────────┘
┌──────────┐    ┌────────┴───────┐
│ WhatsApp │───►│ Webhook Proxy  │
│ Cloud    │    │ (K8s Backend)  │
└──────────┘    └────────┬───────┘
                         │          ┌──────────────────┐
                         │          │   Local Dev      │
                         └─────────►│   (If phone      │
                                    │    matches)      │
                                    └──────────────────┘
```

## Setup Steps

### Step 1: Update Meta Developer Console

1. Go to [Meta Developer Console](https://developers.facebook.com/)
2. Navigate to your WhatsApp Business App
3. Go to **WhatsApp > Configuration > Webhook**
4. Change the Callback URL from:
   ```
   https://mavericks11.duckdns.org/api/whatsapp/webhook
   ```
   To:
   ```
   https://mavericks11.duckdns.org/api/webhook-proxy/webhook
   ```
5. Keep the same Verify Token
6. Click **Verify and Save**

### Step 2: Configure Local Development Server

1. Start your local backend:
   ```bash
   cd backend
   npm run dev
   # or specify a custom port
   PORT=5002 npm run dev
   ```

2. If testing from the same machine, use `http://localhost:5002`

3. If testing from a different device on the same network:
   - Find your machine's IP: `ifconfig | grep inet` or `ipconfig`
   - Use `http://192.168.x.x:5002`

### Step 3: Configure Webhook Proxy (Admin UI)

1. Log in to the admin dashboard
2. Go to **Settings** (bottom of navigation)
3. Scroll down to **Developer Tools > Webhook Proxy**
4. Configure:
   - **Local Server URL**: Your local backend URL (e.g., `http://192.168.1.100:5002`)
   - **Test Connection**: Verify connectivity to your local server
   - **Add Phone Numbers**: Add your WhatsApp number(s) for local routing
5. **Enable Local Routing**: Toggle ON to start receiving events locally

## API Endpoints

### Admin Endpoints (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/webhook-proxy/config` | Get current proxy configuration |
| PUT | `/api/webhook-proxy/config` | Update proxy configuration |
| POST | `/api/webhook-proxy/toggle-local` | One-click toggle local routing |
| POST | `/api/webhook-proxy/add-phone` | Add phone to local routing list |
| DELETE | `/api/webhook-proxy/remove-phone/:phone` | Remove phone from local routing |
| GET | `/api/webhook-proxy/stats` | Get routing statistics |
| POST | `/api/webhook-proxy/test-local` | Test local server connectivity |

### Webhook Endpoints (No Auth - Called by WhatsApp)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/webhook-proxy/webhook` | Webhook verification |
| POST | `/api/webhook-proxy/webhook` | Receive webhook events |

## Configuration Options

### WebhookProxyConfig Schema

```javascript
{
  localRoutingEnabled: Boolean,     // Master toggle for local routing
  localServerUrl: String,           // e.g., "http://localhost:5002"
  localRoutingPhones: [String],     // e.g., ["918087102325"]
  productionWebhookUrl: String,     // Internal K8s service URL
  stats: {
    totalEventsReceived: Number,
    eventsRoutedToLocal: Number,
    eventsRoutedToProd: Number,
    lastEventAt: Date,
    lastLocalRouteAt: Date
  }
}
```

## Usage Scenarios

### Scenario 1: Test Availability Responses

1. Enable local routing
2. Add your phone number
3. Send yourself an availability request from the admin dashboard
4. Reply on WhatsApp
5. See the response in your local backend logs

### Scenario 2: Debug Payment Screenshots

1. Enable local routing
2. Add your phone number
3. Send a payment screenshot on WhatsApp
4. Debug OCR processing in your local backend

### Scenario 3: Production Issue Investigation

1. Ask a team member to reproduce the issue on WhatsApp
2. Add their phone number temporarily
3. Watch the webhook payload in your local logs
4. Remove their phone when done

## Troubleshooting

### Local server not receiving events

1. **Check local routing is enabled** in the admin UI
2. **Verify phone number format**: Must be in format `918087102325` (country code + 10 digits)
3. **Test connectivity**: Use the "Test Connection" button
4. **Check firewall**: Ensure port 5002 (or your port) is accessible
5. **Check network**: If using IP address, ensure both devices are on the same network

### Events going to production but not local

1. Verify the phone number is in the local routing list
2. Check if the message sender's phone matches (last 10 digits)
3. Look at the backend logs for routing decisions

### Webhook verification failing

1. Ensure the verify token matches in Meta Console and your environment variables
2. Check the proxy endpoint is accessible: `https://your-domain/api/webhook-proxy/webhook`

## Security Considerations

1. **Local URLs are not accessible from the internet** - this is intentional. The proxy server (running in K8s) makes outbound requests to your local machine.

2. **Phone numbers are stored in plain text** - they're needed for matching incoming webhooks.

3. **Local routing should be disabled in production** when not actively testing.

## Environment Variables

The proxy uses the same WhatsApp environment variables as the main webhook:

```env
WHATSAPP_ACCESS_TOKEN=<your-token>
WHATSAPP_PHONE_NUMBER_ID=<your-phone-id>
WHATSAPP_VERIFY_TOKEN=mavericks-xi-verify-token-2024
```

## Rolling Back

To revert to direct webhook handling (no proxy):

1. Go to Meta Developer Console
2. Change Callback URL back to:
   ```
   https://mavericks11.duckdns.org/api/whatsapp/webhook
   ```
3. Click **Verify and Save**

The proxy remains available but won't receive events until you point the webhook back to it.
