const API_BASE = import.meta.env.VITE_API_URL ?? ''
async function request(path, token, options = {}) { const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }); if (!response.ok) { if (response.status === 401 || response.status === 403) throw new Error('Your admin session has expired. Please sign in again.'); throw new Error((await response.text()) || 'The user could not be updated.') } return response.json() }
export function getAdminUsers(token) { return request('/api/users', token) }
export function createAdminUser(payload, token) { return request('/api/users', token, { method: 'POST', body: JSON.stringify(payload) }) }
export function updateUserRoles(id, roles, token) { return request(`/api/users/${id}/roles`, token, { method: 'PUT', body: JSON.stringify({ roles }) }) }
