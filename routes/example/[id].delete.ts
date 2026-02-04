import type { H3Event } from 'nitro/deps/h3'
import { HTTPError } from 'h3'
import { defineHandler, getRouterParam } from 'nitro/h3'
import { deleteItem } from '~/server/example/controllers/items.controller'
import { logger } from '~/server/logger/logger'

export default defineHandler(async (event: H3Event) => {
  const id = getRouterParam(event, 'id')

  if (!id || Number.isNaN(Number(id))) {
    throw HTTPError.status(400, 'Bad Request: Invalid item ID')
  }

  const deleted = deleteItem(event, Number(id))

  if (!deleted) {
    throw HTTPError.status(404, 'Item not found')
  }

  await logger.info(event, `Deleted item: ${id}`, {
    source: 'example',
    metadata: { item_id: Number(id) },
  })

  return {
    success: true,
    message: 'Item deleted successfully',
  }
})
