import { useEffect, useState } from 'react'
import { getCatalog } from '../api/catalog'

const config = {
  Teams: { resource: 'teams', eyebrow: 'CLUBS & COUNTRIES', title: 'Teams', search: true },
  Players: { resource: 'players', eyebrow: 'THE PLAYERS', title: 'Players', search: true },
  Tournaments: { resource: 'tournaments', eyebrow: 'COMPETITIONS', title: 'Tournaments', search: false },
  Venues: { resource: 'venues', eyebrow: 'THE GROUNDS', title: 'Venues', search: true }
}

export default function CataloguePage({ kind, select }) {
  const options = config[kind]; const [items, setItems] = useState([]); const [search, setSearch] = useState(''); const [status, setStatus] = useState('loading')
  useEffect(() => { setStatus('loading'); const delay = window.setTimeout(() => getCatalog(options.resource, search).then(data => { setItems(data.items || []); setStatus('ready') }).catch(() => setStatus('error')), search ? 250 : 0); return () => window.clearTimeout(delay) }, [options.resource, search])
  return <main className="listing"><p>{options.eyebrow}</p><h1>{options.title}</h1>{options.search && <input className="catalogue-search" value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${options.title.toLowerCase()}…`} />}{status === 'loading' && <div className="state-card">Loading {options.title.toLowerCase()}…</div>}{status === 'error' && <div className="state-card">{options.title} are unavailable while the local API is offline.</div>}{status === 'ready' && items.length === 0 && <div className="state-card">No {options.title.toLowerCase()} match this view.</div>}{items.length > 0 && <div className="catalogue-grid">{items.map(item => <Card key={item.id} kind={kind} item={item} select={() => select({ kind, id: item.id })} />)}</div>}</main>
}

function Card({ kind, item, select }) {
  if (kind === 'Teams') return <button className="catalogue-card catalogue-button" onClick={select}><div className="initials">{item.shortName}</div><small>{item.countryOrRegion}</small><h2>{item.name}</h2><p>{item.isActive ? 'Active squad' : 'Inactive squad'}</p><b>View team →</b></button>
  if (kind === 'Players') return <button className="catalogue-card catalogue-button" onClick={select}><div className="initials">{item.fullName.split(' ').map(part => part[0]).join('').slice(0, 2)}</div><small>{item.role}</small><h2>{item.fullName}</h2><p>{item.teamName || item.countryOrRegion || 'Independent player'}</p><b>View player →</b></button>
  if (kind === 'Venues') return <button className="catalogue-card catalogue-button" onClick={select}><div className="initials">⌖</div><small>{item.city}, {item.country}</small><h2>{item.name}</h2><p>{item.capacity ? `${item.capacity.toLocaleString()} capacity` : 'Capacity not listed'}</p><b>View venue →</b></button>
  return <button className="catalogue-card catalogue-button tournament-card" onClick={select}><small>{item.format} · {item.season}</small><h2>{item.name}</h2><p>{new Date(item.startDate).toLocaleDateString()} — {new Date(item.endDate).toLocaleDateString()}</p><b>{item.teams.length} participating teams · View tournament →</b></button>
}
