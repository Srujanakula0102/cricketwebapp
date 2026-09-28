const API_BASE = import.meta.env.VITE_API_URL ?? 'https://localhost:44336'
export async function getNews() { const response = await fetch(`${API_BASE}/api/news?take=20`); if (!response.ok) throw new Error('Unable to load news'); return response.json() }
export async function getNewsArticle(slug) { const response = await fetch(`${API_BASE}/api/news/${encodeURIComponent(slug)}`); if (!response.ok) throw new Error('Unable to load article'); return response.json() }
