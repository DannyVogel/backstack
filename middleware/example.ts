import { defineHandler } from 'nitro/h3'
import { verifyExampleApiKey } from '~/server/example/utils/auth'

export default defineHandler((event) => {
  if (event.req.url?.includes('/example/') && event.req.method !== 'OPTIONS') {
    verifyExampleApiKey(event)
  }
})
