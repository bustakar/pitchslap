import { httpRouter } from 'convex/server'

import { handleChat } from './chatAction'
import { handleStripeSync, handleStripeWebhook } from './stripeWebhook'

const http = httpRouter()

http.route({ path: '/chat', method: 'POST', handler: handleChat })
http.route({
  path: '/stripe/webhook',
  method: 'POST',
  handler: handleStripeWebhook,
})
http.route({ path: '/stripe/sync', method: 'POST', handler: handleStripeSync })

export default http
