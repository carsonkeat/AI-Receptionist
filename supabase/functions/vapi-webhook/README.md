# VAPI Webhook Handler - Supabase Edge Function

This Edge Function receives webhook events from VAPI and syncs call data to your Supabase database.

## Deployment

### Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link to your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

### Deploy

```bash
supabase functions deploy vapi-webhook
```

### Get Webhook URL

After deployment, your webhook URL will be:
```
https://your-project-ref.supabase.co/functions/v1/vapi-webhook
```

Use this URL in your VAPI Dashboard → Settings → Webhooks.

## Environment Variables

The function uses these environment variables (set in Supabase Dashboard):

- `SUPABASE_URL` - Automatically set
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically set

## Testing Locally

```bash
# Start local Supabase
supabase start

# Serve function locally
supabase functions serve vapi-webhook

# Test with curl
curl -X POST http://localhost:54321/functions/v1/vapi-webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"call-end","call":{"id":"test","assistantId":"asst_123"}}'
```

## Security

For production, consider:
- Verifying webhook signatures
- Rate limiting
- IP whitelisting

