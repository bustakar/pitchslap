export function safeReturnPathname(
  value: string | null,
  fallback = '/chat',
): string {
  if (!value?.startsWith('/') || value.startsWith('//')) return fallback

  try {
    const parsed = new URL(value, 'https://pitchslap.xyz')
    return parsed.origin === 'https://pitchslap.xyz'
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : fallback
  } catch {
    return fallback
  }
}
