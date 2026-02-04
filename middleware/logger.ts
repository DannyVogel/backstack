import { defineHandler } from 'nitro/h3'
import { verifyApiKey } from '~/server/logger/utils/auth'

export default defineHandler((event) => {
  if (event.req.url?.includes('/logger/') && event.req.method !== 'OPTIONS') {
    verifyApiKey(event)
  }
})
