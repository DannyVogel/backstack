# Configuration Guide

BackStack uses environment variables for configuration.

## Environment Variables

### Push Notifications

| Variable | Required | Description |
|----------|----------|-------------|
| `NITRO_PUSHER_API_KEY` | Yes | API key for push service |
| `NITRO_VAPID_PRIVATE_KEY` | Yes | VAPID private key |
| `NITRO_VAPID_PUBLIC_KEY` | Yes | VAPID public key |
| `NITRO_VAPID_EMAIL` | Yes | Contact email for VAPID |

### Logging

| Variable | Required | Description |
|----------|----------|-------------|
| `NITRO_LOGGER_API_KEY` | Yes | API key for log ingestion |
| `NITRO_LOGGER_VIEWER_KEY` | Yes | API key for log viewer |

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NITRO_DATABASE_PATH` | No | `./data/backstack.db` | SQLite database path |

### CORS

| Variable | Required | Description |
|----------|----------|-------------|
| `NITRO_ALLOWED_ORIGINS` | Yes | Comma-separated allowed origins |

## Generating Secure Keys

### API Keys

```bash
# Generate a random 32-byte key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### VAPID Keys

```bash
npx web-push generate-vapid-keys
```

## Development vs Production

### Development

In development, localhost origins are automatically allowed:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`

### Production

Set `NODE_ENV=production` and configure explicit origins:

```env
NODE_ENV=production
NITRO_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

## Configuration Files

### nitro.config.ts

Nitro framework configuration:

```typescript
import { defineNitroConfig } from 'nitro/config'

export default defineNitroConfig({
  serverDir: './',
})
```

### server/config/

Service-specific configuration modules:

- `database.ts` - Database path
- `cors.ts` - CORS settings
- `pusher.ts` - Push notification settings
- `logger.ts` - Logging settings
