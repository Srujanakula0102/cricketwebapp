import { useState } from 'react'
import { createNews } from '../api/adminNews'
import { uploadImage } from '../api/uploads'

const initialForm = () => ({ title: '', summary: '', content: '', imageUrl: '', isFeatured: false, publishedAt: new Date().toISOString().slice(0, 16) })

export default function ScorerNews({ session, close }) {
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const upload = async file => {
    if (!file) return
    try {
      setMessage('Uploading the story image…')
      const imageUrl = await uploadImage(file, session.accessToken, 'news')
      setForm(current => ({ ...current, imageUrl }))
      setMessage('Image uploaded. Publish the story when ready.')
    } catch (error) { setMessage(error.message || 'The image could not be uploaded.') }
  }

  const publish = async event => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await createNews({ ...form, imageUrl: form.imageUrl.trim() || null, publishedAt: new Date(form.publishedAt).toISOString() }, session.accessToken)
      setForm(initialForm())
      setMessage('News story published to the public site.')
    } catch (error) { setMessage(error.message || 'The story could not be published.') }
    finally { setSaving(false) }
  }

  return <section className="scorer-news">
    <div className="manage-head"><div><p>SCORER NEWS DESK</p><h2>Publish a match update</h2></div><button type="button" onClick={close}>Close</button></div>
    <p>Publish match reports, results, and announcements. Admins remain responsible for editing or deleting published stories.</p>
    {message && <div className="state-card">{message}</div>}
    <form className="admin-form" onSubmit={publish}>
      <label className="wide-field">Headline<input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} required /></label>
      <label className="wide-field">Short summary<input value={form.summary} onChange={event => setForm({ ...form, summary: event.target.value })} required /></label>
      <label className="wide-field">Full story<textarea rows="7" value={form.content} onChange={event => setForm({ ...form, content: event.target.value })} required /></label>
      <label>Publication date and time<input type="datetime-local" value={form.publishedAt} onChange={event => setForm({ ...form, publishedAt: event.target.value })} required /></label>
      <label>Upload story image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => upload(event.target.files?.[0])} /></label>
      {form.imageUrl && <div className="news-image-preview"><img src={form.imageUrl} alt="Story preview" /><button type="button" onClick={() => setForm({ ...form, imageUrl: '' })}>Remove image</button></div>}
      <label className="wide-field">Image address (optional)<input type="url" value={form.imageUrl} onChange={event => setForm({ ...form, imageUrl: event.target.value })} placeholder="Cloudinary URL appears here after upload" /></label>
      <div><button className="cta" disabled={saving}>{saving ? 'Publishing…' : 'Publish story'}</button></div>
    </form>
  </section>
}
