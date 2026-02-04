import { defineHandler } from 'nitro/h3'
import { verifyApiKey } from '~/server/pusher/utils/auth'

export default defineHandler((event) => {
  if (event.req.url?.includes('/pusher/') && event.req.method !== 'OPTIONS') {
    verifyApiKey(event)
  }
})
