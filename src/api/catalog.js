const API_BASE = import.meta.env.VITE_API_URL ?? ''

export async function getCatalog(resource, search = '') {
  const query = new URLSearchParams({ page: '1', pageSize: '100' })
  if (search && resource !== 'tournaments') query.set('search', search)
  const response = await fetch(`${API_BASE}/api/${resource}?${query}`)
  if (!response.ok) throw new Error(`Unable to load ${resource}`)
  return response.json()
}

export async function getCatalogItem(resource, id) {
  const response = await fetch(`${API_BASE}/api/${resource}/${id}`)
  if (!response.ok) throw new Error(`Unable to load ${resource}`)
  return response.json()
}

export async function getTournamentStandings(id) {
  const response = await fetch(`${API_BASE}/api/tournaments/${id}/standings`)
  if (!response.ok) throw new Error('Unable to load standings')
  return response.json()
}

export async function getPlayerTournamentStats(id) {
  const response = await fetch(`${API_BASE}/api/players/${id}/tournament-stats`)
  if (!response.ok) throw new Error('Unable to load player statistics')
  return response.json()
}
