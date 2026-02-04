# Logger Service

Structured logging with database storage and web viewer.

## Overview

The Logger service provides:
- Multiple log levels (debug, info, warn, error, critical)
- Database persistence with SQLite
- Console output in JSON format
- Web-based log viewer
- Statistics and filtering

## Configuration

```env
NITRO_LOGGER_API_KEY=your_api_key
NITRO_LOGGER_VIEWER_KEY=your_viewer_key
```

## API Endpoints

### Create Log Entry

`POST /logger`

```json
{
  "level": "info",
  "message": "User logged in",
  "source": "auth",
  "client_id": "user-123",
  "metadata": {
    "ip": "192.168.1.1"
  }
}
```

### Convenience Endpoints

`POST /logger/info` - Log info message
`POST /logger/error` - Log error message

```json
{
  "message": "Something happened",
  "client_id": "optional",
  "metadata": {}
}
```

### Retrieve Logs

`GET /logger`

Query parameters:
- `level` - Filter by level
- `source` - Filter by source
- `client_id` - Filter by client
- `hours` - Time range (default: 24)
- `limit` - Max results (default: 100)

### Get Statistics

`GET /logger/stats?hours=24`

Response:
```json
{
  "period": "last_24_hours",
  "total_logs": 1250,
  "by_level": {
    "info": 800,
    "warn": 200,
    "error": 150,
    "critical": 10
  },
  "by_source": {
    "pusher": 500,
    "example": 300,
    "client": 450
  }
}
```

### Log Viewer

`GET /logs?api_key=your_viewer_key`

Web interface for browsing logs with filtering and search.

## Server-Side Usage

```typescript
import { logger } from '~/server/logger/logger'

// In a route handler
export default defineHandler(async (event) => {
  try {
    // Your logic here
    const result = await doSomething()

    await logger.info(event, 'Operation completed', {
      source: 'myservice',
      metadata: { result_id: result.id }
    })

    return result
  } catch (error) {
    await logger.error(event, `Operation failed: ${error.message}`, {
      source: 'myservice',
      metadata: { error: error.stack }
    })
    throw error
  }
})
```

### Log Levels

- `debug` - Detailed diagnostic info
- `info` - General information
- `warn` - Warning conditions
- `error` - Error conditions
- `critical` - Critical failures

### Log Sources

Default sources:
- `pusher` - Push notification service
- `logger` - Logger service
- `example` - Example service
- `client` - Client applications
- `system` - System events

Add custom sources in `server/logger/types.ts`.

## Client-Side Usage

```javascript
const API_KEY = 'your_logger_key'
const BASE_URL = 'https://api.example.com'

async function logError(message, metadata) {
  await fetch(`${BASE_URL}/logger/error`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({
      message,
      client_id: getClientId(),
      metadata
    })
  })
}

// Usage
try {
  await riskyOperation()
} catch (error) {
  await logError(error.message, { stack: error.stack })
}
```

## Database Schema

```sql
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL,
  client_id TEXT,
  user_agent TEXT,
  ip_address TEXT,
  metadata TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Best Practices

1. **Use appropriate levels** - Don't log everything as error
2. **Include context** - Add relevant metadata
3. **Set source** - Always specify the source service
4. **Avoid sensitive data** - Don't log passwords or tokens
5. **Use client IDs** - Track requests across services
