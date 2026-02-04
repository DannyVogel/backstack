# Creating a New Service

This guide walks through creating a new service in BackStack.

## Service Structure

```
server/myservice/
├── types/
│   └── index.ts       # TypeScript interfaces
├── controllers/
│   └── main.controller.ts
└── utils/
    └── auth.ts        # Optional auth utilities

routes/myservice/
├── index.get.ts       # GET /myservice
├── index.post.ts      # POST /myservice
└── [id].get.ts        # GET /myservice/:id

middleware/
└── myservice.ts       # Optional middleware
```

## Step 1: Define Types

Create `server/myservice/types/index.ts`:

```typescript
export interface MyItem {
  id?: number
  name: string
  value: string
  created_at?: string
}

export interface CreateItemRequest {
  name: string
  value: string
}
```

## Step 2: Add Database Table

Update `server/database/schema.ts`:

```typescript
db.exec(`
  CREATE TABLE IF NOT EXISTS my_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`)
```

Add types to `server/database/types.ts`:

```typescript
export interface MyItemRow {
  id?: number
  name: string
  value: string
  created_at: string
}
```

## Step 3: Create Controller

Create `server/myservice/controllers/main.controller.ts`:

```typescript
import type { H3Event } from 'nitro/h3'
import type { MyItemRow } from '~/server/database/types'
import { getDatabase } from '~/server/database/index'

export function getAllItems(event: H3Event): MyItemRow[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM my_items ORDER BY created_at DESC')
  return stmt.all() as MyItemRow[]
}

export function createItem(event: H3Event, name: string, value: string): MyItemRow {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO my_items (name, value, created_at)
    VALUES (?, ?, datetime('now'))
    RETURNING *
  `)
  return stmt.get(name, value) as MyItemRow
}
```

## Step 4: Create Routes

Create `routes/myservice/index.get.ts`:

```typescript
import type { H3Event } from 'nitro/h3'
import { defineHandler } from 'nitro/h3'
import { getAllItems } from '~/server/myservice/controllers/main.controller'

export default defineHandler(async (event: H3Event) => {
  const items = getAllItems(event)
  return { success: true, data: items }
})
```

Create `routes/myservice/index.post.ts`:

```typescript
import type { H3Event } from 'nitro/h3'
import type { CreateItemRequest } from '~/server/myservice/types'
import { HTTPError } from 'h3'
import { defineHandler, readBody } from 'nitro/h3'
import { createItem } from '~/server/myservice/controllers/main.controller'

export default defineHandler(async (event: H3Event) => {
  const body = await readBody<CreateItemRequest>(event)

  if (!body?.name || !body?.value) {
    throw HTTPError.status(400, 'name and value are required')
  }

  const item = createItem(event, body.name, body.value)
  return { success: true, data: item }
})
```

## Step 5: Add Middleware (Optional)

Create `middleware/myservice.ts`:

```typescript
import { defineHandler } from 'nitro/h3'
import { HTTPError } from 'h3'
import { secureCompare } from '~/server/utils/secure-compare'

const apiKey = process.env.NITRO_MYSERVICE_API_KEY || ''

export default defineHandler((event) => {
  if (!event.req.url?.includes('/myservice/')) return
  if (event.req.method === 'OPTIONS') return

  const requestKey = event.headers.get('x-api-key')

  if (!apiKey || secureCompare(requestKey, apiKey)) {
    return
  }

  throw HTTPError.status(403, 'Invalid API key')
})
```

## Step 6: Add Configuration

Create `server/config/myservice.ts`:

```typescript
export const myserviceConfig = {
  apiKey: process.env.NITRO_MYSERVICE_API_KEY || '',
}
```

Export from `server/config/index.ts`:

```typescript
export { myserviceConfig } from './myservice'
```

## Testing

```bash
# List items
curl http://localhost:3000/myservice

# Create item
curl -X POST http://localhost:3000/myservice \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_key" \
  -d '{"name": "test", "value": "hello"}'
```

## Best Practices

1. **Validate inputs** - Check all required fields
2. **Log important actions** - Use the logger service
3. **Handle errors** - Return meaningful error messages
4. **Use types** - TypeScript for better maintainability
5. **Add tests** - Cover main functionality
