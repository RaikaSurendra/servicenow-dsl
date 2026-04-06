/**
 * now.config.js — Template for all ServiceNow Fluent SDK projects
 *
 * USAGE:
 *   1. Copy this file to your project root as now.config.js
 *   2. Copy .env.example → .env and fill in your PDI credentials
 *   3. Never commit .env or any file with real credentials
 *
 * The SDK reads this file before every CLI operation.
 */

import 'dotenv/config'

function requireEnv(name) {
  const val = process.env[name]
  if (!val) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Copy .env.example → .env and set your PDI credentials.`
    )
  }
  return val
}

export default {
  instance: {
    url: requireEnv('SN_INSTANCE_URL'),
    credentials: {
      username: requireEnv('SN_USERNAME'),
      password: requireEnv('SN_PASSWORD'),
    },
  },
}
