export const pusherConfig = {
  apiKey: process.env.NITRO_PUSHER_API_KEY || '',
  vapidPrivateKey: process.env.NITRO_VAPID_PRIVATE_KEY || '',
  vapidPublicKey: process.env.NITRO_VAPID_PUBLIC_KEY || '',
  vapidEmail: process.env.NITRO_VAPID_EMAIL || '',
  allowedOrigins: process.env.NITRO_ALLOWED_ORIGINS || '',
}
