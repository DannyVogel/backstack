import type { H3Event } from 'nitro/deps/h3'
import type { UpdateItemRequest } from '~/server/example/types'
import { HTTPError } from 'h3'
import { defineHandler, getRouterParam, readBody } from 'nitro/h3'
import { updateItem } from '~/server/example/controllers/items.controller'
import { logger } from '~/server/logger/logger'

export default defineHandler(async (event: H3Event) => {
  const id = getRouterParam(event, 'id')

  if (!id || Number.isNaN(Number(id))) {
    throw HTTPError.status(400, 'Bad Request: Invalid item ID')
  }

  try {
    const body = await readBody<UpdateItemRequest>(event)

    if (!body) {
      throw HTTPError.status(400, 'Bad Request: No body provided')
    }

    const item = updateItem(event, Number(id), body)

    if (!item) {
      throw HTTPError.status(404, 'Item not found')
    }

    await logger.info(event, `Updated item: ${item.id}`, {
      source: 'example',
      metadata: { item_id: item.id },
    })

    return {
      success: true,
      data: item,
      message: 'Item updated successfully',
    }
  }
  catch (error: any) {
    if (error.statusCode || error.status) {
      throw error
    }
    throw HTTPError.status(500, `Failed to update item: ${error.message}`)
  }
})
