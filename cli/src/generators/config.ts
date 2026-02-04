interface ProjectOptions {
  name: string
  pusher: boolean
  logger: boolean
  example: boolean
}

export function generatePackageJson(options: ProjectOptions): string {
  const pkg = {
    name: options.name,
    type: 'module',
    version: '0.1.0',
    scripts: {
      build: 'nitro build',
      dev: 'nitro dev',
      preview: 'npx srvx --prod .output/',
      test: 'vitest run',
      lint: 'eslint .',
    },
    dependencies: {
      'better-sqlite3': '^11.7.0',
      ...(options.pusher ? { 'web-push': '^3.6.6' } : {}),
    },
    devDependencies: {
      '@antfu/eslint-config': '^6.2.0',
      '@types/better-sqlite3': '^7.6.11',
      'eslint': '^9.39.1',
      'nitro': 'latest',
      'rolldown': 'latest',
      'vitest': 'latest',
    },
  }

  return JSON.stringify(pkg, null, 2)
}

export function generateEnvFile(options: ProjectOptions): string {
  const lines: string[] = ['# BackStack Configuration', '']

  if (options.pusher) {
    lines.push('# Push Notifications')
    lines.push('NITRO_PUSHER_API_KEY=your_pusher_api_key')
    lines.push('NITRO_VAPID_PRIVATE_KEY=your_vapid_private_key')
    lines.push('NITRO_VAPID_PUBLIC_KEY=your_vapid_public_key')
    lines.push('NITRO_VAPID_EMAIL=your_email@example.com')
    lines.push('')
  }

  lines.push('# CORS')
  lines.push('NITRO_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173')
  lines.push('')

  if (options.logger) {
    lines.push('# Logging')
    lines.push('NITRO_LOGGER_API_KEY=your_logger_api_key')
    lines.push('NITRO_LOGGER_VIEWER_KEY=your_viewer_api_key')
    lines.push('')
  }

  lines.push('# Database')
  lines.push(`NITRO_DATABASE_PATH=./data/${options.name}.db`)

  if (options.example) {
    lines.push('')
    lines.push('# Example Service')
    lines.push('NITRO_EXAMPLE_API_KEY=your_example_api_key')
  }

  return lines.join('\n')
}
