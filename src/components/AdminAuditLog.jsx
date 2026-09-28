import { useEffect, useState } from 'react'
import { getAuditLogs } from '../api/auditLogs'

export default function AdminAuditLog({ session }) {
  const [items, setItems] = useState([]); const [status, setStatus] = useState('loading'); const [message, setMessage] = useState('')
  const load = () => { setStatus('loading'); getAuditLogs(session.accessToken).then(data => { setItems(data); setStatus('ready') }).catch(error => { setMessage(error.message); setStatus('error') }) }
  useEffect(() => { load() }, [])
  return <div className="admin-block"><div className="manage-head"><h2>Audit log</h2><button onClick={load}>Refresh</button></div><p className="admin-help">The latest 100 successful staff changes are shown. Passwords and request contents are never recorded.</p>{message && <p className="admin-message">{message}</p>}{status === 'loading' && <div className="admin-empty">Loading audit activity…</div>}{status === 'error' && <div className="admin-empty">Audit activity could not be loaded.</div>}{status === 'ready' && !items.length && <div className="admin-empty">No staff changes have been recorded yet.</div>}{items.length > 0 && <div className="admin-list audit-list">{items.map(item => <article key={item.id}><div><b>{item.actorName}</b><span>{item.action} {item.resource}{item.targetId ? ` · ${item.targetId}` : ''}</span></div><time>{new Date(item.occurredAt).toLocaleString()}</time></article>)}</div>}</div>
}
