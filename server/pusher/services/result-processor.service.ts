import type { NotificationResult } from '../types/notification-result'

export class NotificationResultProcessor {
  private results: NotificationResult[] = []

  addResult(result: NotificationResult): void {
    this.results.push(result)
  }

  getSummary(): [number, number, number] {
    const total = this.results.length
    const successful = this.results.filter(r => r.success).length
    const failed = total - successful
    return [total, successful, failed]
  }

  getStatusCodeAndMessage(): [number, string] {
    const [_, successful, failed] = this.getSummary()

    if (successful === 0) {
      return [500, 'All notifications failed']
    }
    else if (failed === 0) {
      return [200, 'All notifications sent successfully']
    }
    else {
      return [207, `${successful} notifications sent, ${failed} failed`]
    }
  }

  getResponseData(): {
    results: Array<{
      device_id: string
      success: boolean
      error?: string
    }>
    summary: {
      total: number
      successful: number
      failed: number
    }
  } {
    const [total, successful, failed] = this.getSummary()

    return {
      results: this.results.map(r => ({
        device_id: r.device_id,
        success: r.success,
        ...(r.error ? { error: r.error } : {}),
      })),
      summary: {
        total,
        successful,
        failed,
      },
    }
  }
}
