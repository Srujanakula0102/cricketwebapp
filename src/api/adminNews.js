const API_BASE = import.meta.env.VITE_API_URL ?? ''
async function request(path, token, options = {}) { const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }); if (!response.ok) { if (response.status === 401 || response.status === 403) throw new Error('Your admin session has expired. Please sign in again.'); throw new Error((await response.text()) || 'The article could not be saved.') } return response.status === 204 ? null : response.json() }
export async function getAdminNews() { const response = await fetch(`${API_BASE}/api/news?take=100`); if (!response.ok) throw new Error('Unable to load stories.'); return response.json() }
export function createNews(data, token) { return request('/api/news', token, { method: 'POST', body: JSON.stringify(data) }) }
export function updateNews(id, data, token) { return request(`/api/news/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }) }
export function deleteNews(id, token) { return request(`/api/news/${id}`, token, { method: 'DELETE' }) }
