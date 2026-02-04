/**
 * Logger Client for BackStack
 */
class LoggerClient {
  constructor(config) {
    this.baseUrl = config.baseUrl
    this.apiKey = config.apiKey
    this.clientId = this.getClientId()
  }

  getClientId() {
    let id = localStorage.getItem('backstack_client_id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('backstack_client_id', id)
    }
    return id
  }

  async log(level, message, metadata = {}) {
    const response = await fetch(`${this.baseUrl}/logger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'X-API-Key': this.apiKey } : {})
      },
      body: JSON.stringify({
        level,
        message,
        source: 'client',
        client_id: this.clientId,
        metadata
      })
    })

    if (!response.ok) {
      console.error('Failed to log:', response.statusText)
      return null
    }

    return response.json()
  }

  async debug(message, metadata) {
    return this.log('debug', message, metadata)
  }

  async info(message, metadata) {
    return this.log('info', message, metadata)
  }

  async warn(message, metadata) {
    return this.log('warn', message, metadata)
  }

  async error(message, metadata) {
    return this.log('error', message, metadata)
  }

  async critical(message, metadata) {
    return this.log('critical', message, metadata)
  }

  // Convenience method to log errors with stack trace
  async logError(error, additionalMetadata = {}) {
    return this.error(error.message, {
      ...additionalMetadata,
      stack: error.stack,
      name: error.name
    })
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoggerClient
}
