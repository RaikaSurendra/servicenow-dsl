import 'dotenv/config'

function requireEnv(name) {
  const val = process.env[name]
  if (!val) throw new Error(`Missing env var: ${name} — copy .env.example → .env`)
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
