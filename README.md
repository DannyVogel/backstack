# BackStack

Open-source template for multi-project backends. Built with [Nitro](https://nitro.unjs.io/), SQLite, and TypeScript.

## Features

- **Push Notifications** - Web Push API support with VAPID authentication
- **Structured Logging** - Database-backed logging with viewer UI
- **Rate Limiting** - Configurable rate limiters with blocking support
- **CORS Management** - Dynamic origin validation
- **Example Service** - CRUD template to build upon

## Quick Start

```bash
# Clone the repository
git clone https://github.com/DannyVogel/backstack.git
cd backstack

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

Visit `http://localhost:3000` to verify the server is running.

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

### Generating VAPID Keys

```bash
npx web-push generate-vapid-keys
```

## API Endpoints

### Push Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/pusher/subscribe` | Subscribe device |
| POST | `/pusher/unsubscribe` | Unsubscribe devices |
| POST | `/pusher/notify` | Send notifications |

### Logging

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/logger` | Retrieve logs |
| POST | `/logger` | Create log entry |
| POST | `/logger/info` | Log info message |
| POST | `/logger/error` | Log error message |
| GET | `/logger/stats` | Get log statistics |
| GET | `/logs` | Log viewer UI |

### Example Service

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

## License

MIT
