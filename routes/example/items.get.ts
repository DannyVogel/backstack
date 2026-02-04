import type { H3Event } from 'nitro/deps/h3'
import { defineHandler } from 'nitro/h3'
import { getAllItems } from '~/server/example/controllers/items.controller'

export default defineHandler(async (event: H3Event) => {
  const items = getAllItems(event)
  return {
    success: true,
    data: items,
    count: items.length,
  }
})
