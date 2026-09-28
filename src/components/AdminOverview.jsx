import { useEffect, useState } from 'react'
import { getAdminTeams } from '../api/adminTeams'
import { getAdminPlayers } from '../api/adminPlayers'
import { getAdminVenues } from '../api/adminVenues'
import { getAdminTournaments } from '../api/adminTournaments'
import { getAdminMatches } from '../api/adminMatches'
import { getAdminNews } from '../api/adminNews'

export default function AdminOverview() {
  const [data, setData] = useState(null); const [error, setError] = useState('')
  useEffect(() => { Promise.all([getAdminMatches(), getAdminTeams(), getAdminPlayers(), getAdminTournaments(), getAdminVenues(), getAdminNews()]).then(([matches, teams, players, tournaments, venues, news]) => setData({ matches, teams, players, tournaments, venues, news })).catch(() => setError('Live dashboard data is unavailable while the local API is offline.')) }, [])
  if (error) return <div className="admin-block"><h2>Today’s activity</h2><p>{error}</p></div>
  if (!data) return <div className="admin-block"><h2>Today’s activity</h2><p>Loading live dashboard data…</p></div>
  const cards = [['Total matches', data.matches.totalCount], ['Live matches', data.matches.items.filter(match => match.status === 1 || match.status === 'Live').length], ['Total players', data.players.totalCount], ['Total teams', data.teams.totalCount], ['Tournaments', data.tournaments.totalCount], ['Venues', data.venues.totalCount], ['Published stories', data.news.length]]
  return <><div className="admin-cards live-admin-cards">{cards.map(([label, value]) => <article key={label}><small>{label}</small><b>{value}</b><span>Live API data</span></article>)}</div><div className="admin-block"><h2>Today’s activity</h2><p>These figures refresh each time you open the Admin dashboard. Use the menu to manage the data behind the public cricket site.</p></div></>
}
