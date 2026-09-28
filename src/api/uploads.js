const API_BASE = import.meta.env.VITE_API_URL ?? 'https://localhost:44336'

export async function uploadImage(file, token) {
  const body = new FormData()
  body.append('image', file)
  const response = await fetch(`${API_BASE}/api/uploads/images`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body })
  if (!response.ok) throw new Error((await response.text()) || 'Image upload failed.')
  return (await response.json()).url
}
