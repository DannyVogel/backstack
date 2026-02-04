#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'
import { program } from 'commander'
import ora from 'ora'
import prompts from 'prompts'
import { generateEnvFile, generatePackageJson } from './generators/config.js'
import { getProjectFiles } from './templates/index.js'

interface ProjectOptions {
  name: string
  pusher: boolean
  logger: boolean
  example: boolean
}

async function main() {
  console.log()
  console.log(chalk.bold.blue('  BackStack  '))
  console.log(chalk.gray('  Open-source backend template'))
  console.log()

  program
    .name('create-backstack')
    .description('Create a new BackStack project')
    .argument('[name]', 'Project name')
    .option('--pusher', 'Include push notification service')
    .option('--logger', 'Include logging service')
    .option('--example', 'Include example CRUD service')
    .option('-y, --yes', 'Skip prompts and use defaults')
    .parse()

  const args = program.args
  const opts = program.opts()

  let projectName = args[0]

  // Get project name if not provided
  if (!projectName) {
    const response = await prompts({
      type: 'text',
      name: 'name',
      message: 'Project name:',
      initial: 'my-backend',
    })

    if (!response.name) {
      console.log(chalk.red('Project name is required'))
      process.exit(1)
    }

    projectName = response.name
  }

  // Check if directory exists
  const targetDir = path.resolve(process.cwd(), projectName)
  if (existsSync(targetDir)) {
    console.log(chalk.red(`Directory ${projectName} already exists`))
    process.exit(1)
  }

  let options: ProjectOptions

  if (opts.yes) {
    // Use defaults
    options = {
      name: projectName,
      pusher: true,
      logger: true,
      example: true,
    }
  }
  else {
    // Prompt for services
    const response = await prompts([
      {
        type: 'multiselect',
        name: 'services',
        message: 'Select services to include:',
        choices: [
          { title: 'Push Notifications', value: 'pusher', selected: true },
          { title: 'Logging', value: 'logger', selected: true },
          { title: 'Example CRUD Service', value: 'example', selected: true },
        ],
      },
    ])

    const services = response.services || ['pusher', 'logger', 'example']

    options = {
      name: projectName,
      pusher: services.includes('pusher'),
      logger: services.includes('logger'),
      example: services.includes('example'),
    }
  }

  // Create project
  const spinner = ora('Creating project...').start()

  try {
    // Create directory
    mkdirSync(targetDir, { recursive: true })

    // Generate files
    const files = getProjectFiles(options)

    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(targetDir, filePath)
      const dir = path.dirname(fullPath)

      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      writeFileSync(fullPath, content)
    }

    // Generate package.json
    const packageJson = generatePackageJson(options)
    writeFileSync(path.join(targetDir, 'package.json'), packageJson)

    // Generate .env.example
    const envFile = generateEnvFile(options)
    writeFileSync(path.join(targetDir, '.env.example'), envFile)

    // Create data directory
    mkdirSync(path.join(targetDir, 'data'), { recursive: true })

    spinner.succeed('Project created')

    // Install dependencies
    spinner.start('Installing dependencies...')
    execSync('npm install', { cwd: targetDir, stdio: 'ignore' })
    spinner.succeed('Dependencies installed')

    console.log()
    console.log(chalk.green('Success!'), `Created ${projectName}`)
    console.log()
    console.log('Next steps:')
    console.log(chalk.cyan(`  cd ${projectName}`))
    console.log(chalk.cyan('  cp .env.example .env'))
    console.log(chalk.cyan('  npm run dev'))
    console.log()
  }
  catch (error: any) {
    spinner.fail('Failed to create project')
    console.error(chalk.red(error.message))
    process.exit(1)
  }
}

main()
