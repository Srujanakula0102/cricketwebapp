const API_BASE = import.meta.env.VITE_API_URL ?? ''

export async function getAuditLogs(token) {
  const response = await fetch(`${API_BASE}/api/audit-logs`, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'Your admin session has expired. Please sign in again.' : 'Audit logs could not be loaded.')
  return response.json()
}
