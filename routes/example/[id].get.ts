import type { H3Event } from 'nitro/deps/h3'
import { HTTPError } from 'h3'
import { defineHandler, getRouterParam } from 'nitro/h3'
import { getItemById } from '~/server/example/controllers/items.controller'

export default defineHandler(async (event: H3Event) => {
  const id = getRouterParam(event, 'id')

  if (!id || Number.isNaN(Number(id))) {
    throw HTTPError.status(400, 'Bad Request: Invalid item ID')
  }

  const item = getItemById(event, Number(id))

  if (!item) {
    throw HTTPError.status(404, 'Item not found')
  }

  return {
    success: true,
    data: item,
  }
})
