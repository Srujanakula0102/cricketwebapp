const API_BASE = import.meta.env.VITE_API_URL ?? ''
async function request(path, token, options = {}) { const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }); if (!response.ok) { if (response.status === 401 || response.status === 403) throw new Error('Your admin session has expired. Please sign in again.'); throw new Error((await response.text()) || 'The match could not be saved.') } return response.status === 204 ? null : response.json() }
export async function getAdminMatches() { const response = await fetch(`${API_BASE}/api/matches?page=1&pageSize=100`); if (!response.ok) throw new Error('Unable to load matches.'); return response.json() }
export function createMatch(data, token) { return request('/api/matches', token, { method: 'POST', body: JSON.stringify(data) }) }
export function updateMatch(id, data, token) { return request(`/api/matches/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }) }
export function deleteMatch(id, token) { return request(`/api/matches/${id}`, token, { method: 'DELETE' }) }
