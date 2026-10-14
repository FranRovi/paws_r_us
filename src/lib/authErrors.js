export function friendlyAuthError(error) {
  const message = (error?.message || '').toLowerCase()

  if (message.includes('already registered')) {
    return 'An account with this email already exists. Try logging in.'
  }
  if (message.includes('database error saving new user')) {
    return 'That username may already be taken. Try a different one.'
  }
  if (message.includes('password')) {
    return 'Choose a stronger password and try again.'
  }
  if (error?.status === 429 || message.includes('rate limit')) {
    return 'Too many attempts. Wait a minute and try again.'
  }
  return 'We could not create your account. Please try again.'
}