import type { H3Event } from 'nitro/h3'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getDatabase, resetDatabase } from '~/server/database/index'
import {
  createItem,
  deleteItem,
  getAllItems,
  getItemById,
  updateItem,
} from '~/server/example/controllers/items.controller'

function mockEvent(): H3Event {
  return {} as H3Event
}

describe('example items controller', () => {
  beforeEach(() => {
    const db = getDatabase()
    db.exec('DELETE FROM example_items')
  })

  afterEach(() => {
    resetDatabase()
  })

  describe('createItem', () => {
    it('should create an item with title only', () => {
      const item = createItem(mockEvent(), { title: 'Test Item' })

      expect(item).toBeDefined()
      expect(item.id).toBeGreaterThan(0)
      expect(item.title).toBe('Test Item')
      expect(item.content).toBeNull()
      expect(item.created_at).toBeDefined()
      expect(item.updated_at).toBeDefined()
    })

    it('should create an item with title and content', () => {
      const item = createItem(mockEvent(), {
        title: 'With Content',
        content: 'Some content here',
      })

      expect(item.title).toBe('With Content')
      expect(item.content).toBe('Some content here')
    })

    it('should assign unique ids', () => {
      const item1 = createItem(mockEvent(), { title: 'First' })
      const item2 = createItem(mockEvent(), { title: 'Second' })

      expect(item1.id).not.toBe(item2.id)
    })
  })

  describe('getAllItems', () => {
    it('should return empty array when no items exist', () => {
      const items = getAllItems(mockEvent())
      expect(items).toEqual([])
    })

    it('should return all created items', () => {
      createItem(mockEvent(), { title: 'Item 1' })
      createItem(mockEvent(), { title: 'Item 2' })
      createItem(mockEvent(), { title: 'Item 3' })

      const items = getAllItems(mockEvent())
      expect(items).toHaveLength(3)
    })

    it('should order items by created_at descending', () => {
      createItem(mockEvent(), { title: 'First' })
      createItem(mockEvent(), { title: 'Second' })
      createItem(mockEvent(), { title: 'Third' })

      const items = getAllItems(mockEvent())
      // Items are ordered by created_at DESC; when timestamps match (same second),
      // SQLite's implicit rowid ordering applies. Verify ordering is consistent.
      const titles = items.map(i => i.title)
      expect(titles).toContain('First')
      expect(titles).toContain('Second')
      expect(titles).toContain('Third')
      // Verify timestamps are in non-ascending order
      for (let i = 0; i < items.length - 1; i++) {
        expect(items[i].created_at >= items[i + 1].created_at).toBe(true)
      }
    })
  })

  describe('getItemById', () => {
    it('should return the item when it exists', () => {
      const created = createItem(mockEvent(), { title: 'Find Me' })
      const found = getItemById(mockEvent(), created.id!)

      expect(found).not.toBeNull()
      expect(found!.title).toBe('Find Me')
      expect(found!.id).toBe(created.id)
    })

    it('should return null for non-existent id', () => {
      const found = getItemById(mockEvent(), 99999)
      expect(found).toBeNull()
    })
  })

  describe('updateItem', () => {
    it('should update the title', () => {
      const created = createItem(mockEvent(), { title: 'Original' })
      const updated = updateItem(mockEvent(), created.id!, { title: 'Updated' })

      expect(updated).not.toBeNull()
      expect(updated!.title).toBe('Updated')
      expect(updated!.id).toBe(created.id)
    })

    it('should update the content', () => {
      const created = createItem(mockEvent(), { title: 'Title', content: 'Old' })
      const updated = updateItem(mockEvent(), created.id!, { content: 'New content' })

      expect(updated).not.toBeNull()
      expect(updated!.content).toBe('New content')
      expect(updated!.title).toBe('Title') // title unchanged
    })

    it('should update both title and content', () => {
      const created = createItem(mockEvent(), { title: 'Old Title', content: 'Old Content' })
      const updated = updateItem(mockEvent(), created.id!, {
        title: 'New Title',
        content: 'New Content',
      })

      expect(updated!.title).toBe('New Title')
      expect(updated!.content).toBe('New Content')
    })

    it('should return the existing item when no fields provided', () => {
      const created = createItem(mockEvent(), { title: 'Same' })
      const result = updateItem(mockEvent(), created.id!, {})

      expect(result).not.toBeNull()
      expect(result!.title).toBe('Same')
    })

    it('should return null for non-existent id', () => {
      const result = updateItem(mockEvent(), 99999, { title: 'Ghost' })
      expect(result).toBeNull()
    })

    it('should update updated_at timestamp', () => {
      const created = createItem(mockEvent(), { title: 'Timestamp' })
      const updated = updateItem(mockEvent(), created.id!, { title: 'Changed' })

      expect(updated!.updated_at).toBeDefined()
      // updated_at should be >= created_at
      expect(updated!.updated_at >= created!.created_at).toBe(true)
    })
  })

  describe('deleteItem', () => {
    it('should delete an existing item and return true', () => {
      const created = createItem(mockEvent(), { title: 'Delete Me' })
      const result = deleteItem(mockEvent(), created.id!)

      expect(result).toBe(true)

      // Verify it's gone
      const found = getItemById(mockEvent(), created.id!)
      expect(found).toBeNull()
    })

    it('should return false for non-existent id', () => {
      const result = deleteItem(mockEvent(), 99999)
      expect(result).toBe(false)
    })

    it('should only delete the specified item', () => {
      const item1 = createItem(mockEvent(), { title: 'Keep' })
      const item2 = createItem(mockEvent(), { title: 'Delete' })

      deleteItem(mockEvent(), item2.id!)

      const remaining = getAllItems(mockEvent())
      expect(remaining).toHaveLength(1)
      expect(remaining[0].id).toBe(item1.id)
    })
  })
})
