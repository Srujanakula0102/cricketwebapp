const API_BASE = import.meta.env.VITE_API_URL ?? ''

export async function getCurrentInnings(matchId) {
  const response = await fetch(`${API_BASE}/api/scoring/matches/${matchId}/current`)
  if (!response.ok) return null
  return response.json()
}

export async function getScorecard(matchId) {
  const response = await fetch(`${API_BASE}/api/scoring/matches/${matchId}/scorecard`)
  if (!response.ok) throw new Error('Unable to load scorecard')
  return response.json()
}

export async function getCommentary(matchId) {
  const response = await fetch(`${API_BASE}/api/scoring/matches/${matchId}/commentary`)
  if (!response.ok) throw new Error('Unable to load commentary')
  return response.json()
}

async function request(path, token, body) {
  const response = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined })
  if (!response.ok) throw new Error(await response.text() || 'The scoring action was rejected.')
  return response.status === 204 ? null : response.json()
}

export const startInnings = (matchId, token, payload) => request(`/api/scoring/matches/${matchId}/innings/start`, token, payload)
export const recordDelivery = (matchId, token, payload) => request(`/api/scoring/matches/${matchId}/delivery`, token, payload)
export const changeBowler = (matchId, token, bowlerId) => request(`/api/scoring/matches/${matchId}/bowler`, token, { bowlerId })
export const undoDelivery = (matchId, token) => request(`/api/scoring/matches/${matchId}/undo`, token)
export const endInnings = (matchId, token) => request(`/api/scoring/matches/${matchId}/innings/end`, token)
export const endMatch = (matchId, token) => request(`/api/scoring/matches/${matchId}/end`, token)
