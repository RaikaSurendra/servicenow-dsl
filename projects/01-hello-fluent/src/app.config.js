import { app } from '@servicenow/sdk/metadata'

export default app({
  name: 'Hello Fluent',
  scope: 'x_learn_hello',
  version: '1.0.0',
  description: 'Chapter 1: First ServiceNow application using the Fluent SDK',
  vendorPrefix: 'x_learn',
})
