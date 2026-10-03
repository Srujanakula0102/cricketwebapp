const API_BASE = import.meta.env.VITE_API_URL ?? ''

export async function uploadImage(file, token, folder = 'general') {
  const body = new FormData()
  body.append('image', file)
  const response = await fetch(`${API_BASE}/api/uploads/images?folder=${encodeURIComponent(folder)}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body })
  if (!response.ok) throw new Error((await response.text()) || 'Image upload failed.')
  return (await response.json()).url
}
