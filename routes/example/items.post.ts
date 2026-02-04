import type { H3Event } from 'nitro/deps/h3'
import type { CreateItemRequest } from '~/server/example/types'
import { HTTPError } from 'h3'
import { defineHandler, readBody } from 'nitro/h3'
import { createItem } from '~/server/example/controllers/items.controller'
import { logger } from '~/server/logger/logger'

export default defineHandler(async (event: H3Event) => {
  try {
    const body = await readBody<CreateItemRequest>(event)

    if (!body || !body.title) {
      throw HTTPError.status(400, 'Bad Request: title is required')
    }

    const item = createItem(event, body)

    await logger.info(event, `Created item: ${item.id}`, {
      source: 'example',
      metadata: { item_id: item.id, title: item.title },
    })

    return {
      success: true,
      data: item,
      message: 'Item created successfully',
    }
  }
  catch (error: any) {
    if (error.statusCode || error.status) {
      throw error
    }
    throw HTTPError.status(500, `Failed to create item: ${error.message}`)
  }
})
