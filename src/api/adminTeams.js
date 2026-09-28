const API_BASE = import.meta.env.VITE_API_URL ?? ''

function headers(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

async function request(path, token, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...headers(token), ...options.headers } })
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error('Your admin session has expired. Please sign in again.')
    const message = await response.text()
    throw new Error(message || 'The team could not be saved.')
  }
  return response.status === 204 ? null : response.json()
}

export async function getAdminTeams(search = '') {
  const query = new URLSearchParams({ page: '1', pageSize: '100' })
  if (search) query.set('search', search)
  const response = await fetch(`${API_BASE}/api/teams?${query}`)
  if (!response.ok) throw new Error('Unable to load teams.')
  return response.json()
}

export function createTeam(data, token) { return request('/api/teams', token, { method: 'POST', body: JSON.stringify(data) }) }
export function updateTeam(id, data, token) { return request(`/api/teams/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }) }
export function deleteTeam(id, token) { return request(`/api/teams/${id}`, token, { method: 'DELETE' }) }
