# Quick Start Guide

Get BackStack running in under 5 minutes.

## Prerequisites

- Node.js 20+
- npm or yarn

## Installation

```bash
# Clone the repository
git clone https://github.com/DannyVogel/backstack.git
cd backstack

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

## Configuration

Edit `.env` with your settings:

```env
# Required for push notifications
NITRO_PUSHER_API_KEY=your_secure_api_key
NITRO_VAPID_PRIVATE_KEY=generate_with_web_push
NITRO_VAPID_PUBLIC_KEY=generate_with_web_push
NITRO_VAPID_EMAIL=you@example.com

# Required for logging
NITRO_LOGGER_API_KEY=your_logger_key
NITRO_LOGGER_VIEWER_KEY=your_viewer_key

# CORS origins (comma-separated)
NITRO_ALLOWED_ORIGINS=http://localhost:3000
```

### Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

## Start the Server

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run preview
```

## Verify Installation

### Check Server Status

```bash
curl http://localhost:3000/example/items
```

### View Logs

Open `http://localhost:3000/logs?api_key=your_viewer_key` in your browser.

### Create a Test Item

```bash
curl -X POST http://localhost:3000/example/items \
  -H "Content-Type: application/json" \
  -d '{"title": "Hello BackStack!"}'
```

## Next Steps

- [Configuration Guide](./CONFIGURATION.md)
- [Creating Services](../guides/CREATING_SERVICES.md)
- [Push Notifications](../services/PUSHER.md)
