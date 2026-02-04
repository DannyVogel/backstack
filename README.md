# BackStack

Open-source backend template for multi-service applications. Built with [Nitro](https://nitro.build), SQLite, and TypeScript.

## Features

- **Push Notifications** - Web Push API with VAPID authentication, automatic subscription cleanup
- **Structured Logging** - Database-backed logging with viewer UI
- **Rate Limiting** - Configurable rate limiters with blocking support
- **CORS Management** - Dynamic origin validation
- **Example Service** - CRUD template to build upon

**Looking for a client library?** [webpushkit](https://github.com/DannyVogel/webpushkit) is a companion npm package that simplifies push notification setup in frontend applications.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/DannyVogel/backstack.git
cd backstack

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate VAPID keys for push notifications
npx web-push generate-vapid-keys

# Add the generated keys to .env, then start
npm run dev
```

Visit `http://localhost:8000` to verify the server is running.

## Project Structure

```
backstack/
├── middleware/          # Global middleware (CORS, auth)
├── routes/              # API route handlers
│   ├── pusher/          # Push notification endpoints
│   ├── logger/          # Logging endpoints
│   ├── logs/            # Log viewer
│   └── example/         # Example CRUD service
├── server/
│   ├── config/          # Configuration modules
│   ├── database/        # SQLite database layer
│   │   └── methods/     # Database operations
│   ├── pusher/          # Push notification service
│   ├── logger/          # Logging service
│   ├── example/         # Example service
│   └── utils/           # Shared utilities
├── docs/                # Documentation
└── test/                # Test files
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
# Push Notifications
NITRO_PUSHER_API_KEY=your_pusher_api_key
NITRO_VAPID_PRIVATE_KEY=your_vapid_private_key
NITRO_VAPID_PUBLIC_KEY=your_vapid_public_key
NITRO_VAPID_EMAIL=your_email@example.com

# CORS
NITRO_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Logging
NITRO_LOGGER_API_KEY=your_logger_api_key
NITRO_LOGGER_VIEWER_KEY=your_viewer_api_key

# Database
NITRO_DATABASE_PATH=./data/backstack.db
```

### Generating Keys

```bash
# Generate VAPID keys
npx web-push generate-vapid-keys

# Generate API keys
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Push Notifications

BackStack provides a complete push notification service with automatic subscription management.

### Features

- **VAPID Authentication** - Secure Web Push Protocol implementation
- **Automatic Cleanup** - Expired and invalid (410/404) subscriptions are automatically removed
- **Parallel Delivery** - Batch notifications are sent in parallel for better performance
- **Expiration Checking** - Subscriptions are validated before sending
- **Detailed Results** - Per-device success/failure reporting with 207 Multi-Status support

### Client Integration

Use [webpushkit](https://github.com/DannyVogel/webpushkit) for easy client-side integration:

```bash
npm install webpushkit
npx webpushkit init
```

```typescript
import { PushNotificationManager } from 'webpushkit';

const pushManager = new PushNotificationManager({
  vapidPublicKey: 'your-NITRO_VAPID_PUBLIC_KEY',
  baseURL: 'http://localhost:3000/pusher', // or your deployed URL
  apiKey: 'your-NITRO_PUSHER_API_KEY', // optional if using CORS
});

await pushManager.initialize();
await pushManager.subscribe();
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/pusher/subscribe` | Subscribe device to push notifications |
| POST | `/pusher/unsubscribe` | Unsubscribe devices |
| POST | `/pusher/notify` | Send notifications to devices |

### Subscribe

**POST** `/pusher/subscribe`

```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "base64-encoded-key",
      "auth": "base64-encoded-key"
    },
    "expiration_time": "2024-12-31T23:59:59.000Z",
    "metadata": {}
  },
  "device_id": "unique-device-id"
}
```

**Response (201):**
```json
{
  "status_code": 201,
  "message": "Subscribed successfully",
  "data": {
    "endpoint": "...",
    "device_id": "unique-device-id"
  }
}
```

### Notify

**POST** `/pusher/notify`

```json
{
  "device_ids": ["device-1", "device-2"],
  "payload": {
    "title": "Hello!",
    "body": "You have a new message",
    "icon": "/icon.png",
    "data": { "url": "/messages" }
  }
}
```

**Response (200 or 207):**
```json
{
  "status_code": 207,
  "message": "1 notifications sent, 1 failed",
  "data": {
    "results": [
      { "device_id": "device-1", "success": true },
      { "device_id": "device-2", "success": false, "error": "Subscription expired (removed)" }
    ],
    "summary": {
      "total": 2,
      "successful": 1,
      "failed": 1
    }
  }
}
```

### Unsubscribe

**POST** `/pusher/unsubscribe`

```json
{
  "device_ids": ["device-1", "device-2"]
}
```

## Logging Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/logger` | Retrieve logs |
| POST | `/logger` | Create log entry |
| POST | `/logger/info` | Log info message |
| POST | `/logger/error` | Log error message |
| GET | `/logger/stats` | Get log statistics |
| GET | `/logs` | Log viewer UI |

## Example Service

A CRUD template demonstrating the service pattern:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/example/items` | List all items |
| POST | `/example/items` | Create item |
| GET | `/example/:id` | Get item by ID |
| PUT | `/example/:id` | Update item |
| DELETE | `/example/:id` | Delete item |

## Authentication

All services use API key authentication via the `X-API-Key` header:

```javascript
fetch('/pusher/subscribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key'
  },
  body: JSON.stringify(data)
})
```

Requests from configured CORS origins are also allowed without an API key.

## Development

```bash
# Run development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Creating a New Service

1. Create service directory: `server/myservice/`
2. Add types: `server/myservice/types/index.ts`
3. Add controllers: `server/myservice/controllers/`
4. Add routes: `routes/myservice/`
5. Add middleware: `middleware/myservice.ts`
6. Update database schema if needed: `server/database/schema.ts`

See the `example` service for a complete reference implementation.

## Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

### Environment Variables

Ensure all required environment variables are set in your deployment platform.

## Related Projects

- [webpushkit](https://github.com/DannyVogel/webpushkit) - Client library for push notifications

## License

MIT
