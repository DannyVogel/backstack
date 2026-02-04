export const loggerConfig = {
  apiKey: process.env.NITRO_LOGGER_API_KEY || '',
  // viewerKey must be explicitly configured - no default value for security
  viewerKey: process.env.NITRO_LOGGER_VIEWER_KEY || '',
}
