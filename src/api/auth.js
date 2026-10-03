const API_BASE = import.meta.env.VITE_API_URL ?? ''

export async function login(email, password) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password
    })
  })

  if (!response.ok) {
    throw new Error('Login failed')
  }

  return response.json()
}

export async function requestPasswordReset(email) {
  const response = await fetch(`${API_BASE}/api/auth/password-reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
  if (!response.ok) throw new Error('Unable to request a password reset.')
}

export async function completePasswordReset(email, token, password) {
  const response = await fetch(`${API_BASE}/api/auth/password-reset/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, token, password }) })
  if (!response.ok) throw new Error((await response.text()) || 'Unable to reset the password.')
}
