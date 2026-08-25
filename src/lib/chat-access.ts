import { createServerFn } from '@tanstack/react-start'

export type ChatViewer = {
  email: string
  name: string | null
}

export type ChatAccess =
  | { state: 'signed-out' }
  | { state: 'unconfigured'; user: ChatViewer }
  | { state: 'unpaid'; user: ChatViewer; hasCustomer: boolean }
  | {
      state: 'paid'
      user: ChatViewer
      subscriptionStatus: string
      cancelAtPeriodEnd: boolean
    }
  | { state: 'unavailable'; user: ChatViewer }

function viewerFromUser(user: {
  email: string
  firstName?: string | null
  lastName?: string | null
}): ChatViewer {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return { email: user.email, name: name || null }
}

export const getChatAccess = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ChatAccess> => {
    const [{ getAuth }, { getBillingAccess }] = await Promise.all([
      import('@workos/authkit-tanstack-react-start'),
      import('./billing.server'),
    ])
    const { user } = await getAuth()
    if (!user) return { state: 'signed-out' }

    const viewer = viewerFromUser(user)

    try {
      const access = await getBillingAccess({
        id: user.id,
        email: user.email,
        name: viewer.name,
      })

      if (access.state === 'unconfigured') {
        return { state: 'unconfigured', user: viewer }
      }
      if (access.state === 'unpaid') {
        return {
          state: 'unpaid',
          user: viewer,
          hasCustomer: access.customerId !== null,
        }
      }
      return {
        state: 'paid',
        user: viewer,
        subscriptionStatus: access.status,
        cancelAtPeriodEnd: access.cancelAtPeriodEnd,
      }
    } catch (error) {
      console.error('Unable to check billing access', error)
      return { state: 'unavailable', user: viewer }
    }
  },
)
