import type { H3Event } from 'nitro/deps/h3'
import type { CreateItemRequest, UpdateItemRequest } from '../types'
import type { ExampleItemRow } from '~/server/database/types'
import { getDatabase } from '~/server/database/index'

export function getAllItems(_event: H3Event): ExampleItemRow[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM example_items ORDER BY created_at DESC')
  return stmt.all() as ExampleItemRow[]
}

export function getItemById(_event: H3Event, id: number): ExampleItemRow | null {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM example_items WHERE id = ?')
  return (stmt.get(id) as ExampleItemRow) || null
}

export function createItem(_event: H3Event, data: CreateItemRequest): ExampleItemRow {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO example_items (title, content, created_at, updated_at)
    VALUES (?, ?, datetime('now'), datetime('now'))
    RETURNING *
  `)
  return stmt.get(data.title, data.content || null) as ExampleItemRow
}

export function updateItem(event: H3Event, id: number, data: UpdateItemRequest): ExampleItemRow | null {
  const db = getDatabase()

  // Build dynamic update query
  const updates: string[] = []
  const params: any[] = []

  if (data.title !== undefined) {
    updates.push('title = ?')
    params.push(data.title)
  }
  if (data.content !== undefined) {
    updates.push('content = ?')
    params.push(data.content)
  }

  if (updates.length === 0) {
    return getItemById(event, id)
  }

  updates.push(`updated_at = datetime('now')`)
  params.push(id)

  const stmt = db.prepare(`
    UPDATE example_items
    SET ${updates.join(', ')}
    WHERE id = ?
    RETURNING *
  `)

  return (stmt.get(...params) as ExampleItemRow) || null
}

export function deleteItem(_event: H3Event, id: number): boolean {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM example_items WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}
