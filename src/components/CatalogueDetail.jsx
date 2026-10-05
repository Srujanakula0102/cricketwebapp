import { useEffect, useState } from 'react'
import { getCatalog, getCatalogItem, getPlayerTournamentStats, getTournamentStandings } from '../api/catalog'
import { getMatches } from '../api/matches'
import { getScorecard } from '../api/scoring'

const config = {
  Teams: { resource: 'teams', label: 'Team' },
  Players: { resource: 'players', label: 'Player' },
  Tournaments: { resource: 'tournaments', label: 'Tournament' },
  Venues: { resource: 'venues', label: 'Venue' }
}

export default function CatalogueDetail({ selection, back }) {
  const options = config[selection.kind]; const [item, setItem] = useState(null); const [status, setStatus] = useState('loading')
  useEffect(() => { let active = true; setStatus('loading'); setItem(null); getCatalogItem(options.resource, selection.id).then(data => { if (!active) return; setItem(data); setStatus('ready') }).catch(() => { if (active) setStatus('error') }); return () => { active = false } }, [options.resource, selection.id])
  return <main className="listing detail-page"><button className="back" onClick={back}>← All {selection.kind.toLowerCase()}</button>{status === 'loading' && <div className="state-card">Loading {options.label.toLowerCase()}…</div>}{status === 'error' && <div className="state-card">This {options.label.toLowerCase()} could not be loaded.</div>}{status === 'ready' && <Detail kind={selection.kind} item={item} />}</main>
}

function ImageWithFallback({ url, name, className, fallback }) {
  const [failed, setFailed] = useState(false)
  if (!url || failed) return <div className={className.includes('profile') ? 'initials large' : 'initials'}>{fallback || name.split(' ').map(part => part[0]).join('').slice(0, 2)}</div>
  return <img className={className} src={url} alt={name} loading="lazy" onError={() => setFailed(true)} />
}

function Detail({ kind, item }) {
  if (kind === 'Teams') return <><section className="profile"><p>TEAM PROFILE</p><div className="profile-heading"><ImageWithFallback url={item.logoUrl} name={item.name} fallback={item.shortName} className="team-profile-photo" /><div><h1>{item.name}</h1><span>{item.countryOrRegion}</span></div></div><div className="profile-stats"><article><small>SHORT NAME</small><b>{item.shortName}</b></article><article><small>STATUS</small><b>{item.isActive ? 'Active squad' : 'Inactive squad'}</b></article><article><small>REGION</small><b>{item.countryOrRegion}</b></article></div></section><TeamForm teamId={item.id} teamName={item.name}/><TeamSquad teamId={item.id} teamName={item.name}/><RelatedMatches teamId={item.id} teamName={item.name}/></>
  if (kind === 'Players') return <><section className="profile player-profile"><p>PLAYER PROFILE</p><div className="profile-heading"><ImageWithFallback url={item.profileImageUrl} name={item.fullName} className="player-profile-photo" /><div><h1>{item.fullName}</h1><span>{item.role} · {item.teamName || item.countryOrRegion || 'Independent player'}</span></div></div><div className="profile-stats"><article><small>ROLE</small><b>{item.role}</b></article><article><small>TEAM</small><b>{item.teamName || 'Not assigned'}</b></article><article><small>BATTING STYLE</small><b>{item.battingStyle || 'Not listed'}</b></article><article><small>BOWLING STYLE</small><b>{item.bowlingStyle || 'Not listed'}</b></article></div></section><PlayerTournamentStats playerId={item.id} />{item.teamId ? <RelatedMatches teamId={item.teamId} teamName={item.teamName} playerName={item.fullName}/> : <section className="profile-related"><h2>Team match history</h2><p>This player is not assigned to a team yet.</p></section>}</>
  if (kind === 'Venues') return <><section className="profile"><p>VENUE PROFILE</p><div className="profile-heading"><div className="initials large">⌖</div><div><h1>{item.name}</h1><span>{item.city}, {item.country}</span></div></div><div className="profile-stats"><article><small>CITY</small><b>{item.city}</b></article><article><small>COUNTRY</small><b>{item.country}</b></article><article><small>CAPACITY</small><b>{item.capacity ? item.capacity.toLocaleString() : 'Not listed'}</b></article></div>{item.imageUrl && <img className="venue-image" src={item.imageUrl} alt={`${item.name} ground`} />}</section><RelatedMatches venueId={item.id} venueName={item.name}/></>
  return <TournamentProfile item={item} />
}

function PlayerTournamentStats({ playerId }) {
  const [stats, setStats] = useState(null)
  useEffect(() => { getPlayerTournamentStats(playerId).then(setStats).catch(() => setStats([])) }, [playerId])
  const overs = balls => `${Math.floor(balls / 6)}.${balls % 6}`
  return <section className="profile-related player-tournament-stats"><p>TOURNAMENT PERFORMANCE</p><h2>Career totals by tournament</h2>{stats === null && <span>Loading player statistics…</span>}{stats?.length === 0 && <span>Statistics will appear after recorded deliveries are available.</span>}{stats?.length > 0 && <div className="stats-table-wrap"><table><thead><tr><th>Tournament</th><th>Mat</th><th>Runs</th><th>4s</th><th>6s</th><th>Wkts</th><th>Overs</th></tr></thead><tbody>{stats.map(row => <tr key={row.tournamentId || row.tournamentName}><td>{row.tournamentName}</td><td>{row.matches}</td><td><b>{row.runs}</b></td><td>{row.fours}</td><td>{row.sixes}</td><td><b>{row.wickets}</b></td><td>{overs(row.legalBallsBowled)}</td></tr>)}</tbody></table></div>}</section>
}

function RelatedMatches({ teamId, teamName, playerName, tournamentId, tournamentName, venueId, venueName }) {
  const [matches, setMatches] = useState(null); const labels = ['Scheduled', 'Live', 'Completed', 'Cancelled', 'Abandoned']
  const title = teamName || tournamentName || venueName; const isMatch = match => teamId ? match.homeTeam.id === teamId || match.awayTeam.id === teamId : tournamentId ? match.tournamentId === tournamentId : match.venueId === venueId
  useEffect(() => { getMatches().then(data => setMatches((data.items || []).filter(isMatch).sort((first, second) => new Date(second.startsAt) - new Date(first.startsAt)))).catch(() => setMatches([])) }, [teamId, tournamentId, venueId])
  return <section className="profile-related"><p>{playerName ? `${playerName.toUpperCase()} · TEAM FIXTURES` : tournamentName ? 'TOURNAMENT FIXTURES & RESULTS' : venueName ? 'VENUE FIXTURES & RESULTS' : 'TEAM FIXTURES & RESULTS'}</p><h2>{title} matches</h2>{matches === null && <span>Loading matches…</span>}{matches?.length === 0 && <span>No matches for this {tournamentName ? 'tournament' : venueName ? 'venue' : 'team'} have been scheduled yet.</span>}{matches?.length > 0 && <div className="profile-match-list">{matches.map(match => <article key={match.id}><b>{labels[match.status] || match.status}</b><div><strong>{match.homeTeam.name} vs {match.awayTeam.name}</strong><span>{new Date(match.startsAt).toLocaleString()}{match.venueName ? ` · ${match.venueName}` : ''}</span></div></article>)}</div>}</section>
}

function TeamSquad({ teamId, teamName }) {
  const [players, setPlayers] = useState(null); const roles = ['Batter', 'Bowler', 'All-rounder', 'Wicketkeeper']
  useEffect(() => { getCatalog('players').then(data => setPlayers((data.items || []).filter(player => player.teamId === teamId).sort((first, second) => first.fullName.localeCompare(second.fullName)))).catch(() => setPlayers([])) }, [teamId])
  return <section className="profile-related squad-list"><p>TEAM SQUAD</p><h2>{teamName} players</h2>{players === null && <span>Loading squad…</span>}{players?.length === 0 && <span>No players have been assigned to this team yet.</span>}{players?.length > 0 && <div>{players.map(player => <article key={player.id}><ImageWithFallback url={player.profileImageUrl} name={player.fullName} className="squad-photo" /><div><strong>{player.fullName}</strong><span>{roles[player.role] || player.role}{player.battingStyle ? ` · ${player.battingStyle}` : ''}</span></div></article>)}</div>}</section>
}

function TeamForm({ teamId, teamName }) {
  const [form, setForm] = useState(null)
  useEffect(() => {
    getMatches().then(async data => {
      const completed = (data.items || []).filter(match => match.status === 2 && (match.homeTeam.id === teamId || match.awayTeam.id === teamId)).sort((first, second) => new Date(second.startsAt) - new Date(first.startsAt)).slice(0, 5)
      const cards = await Promise.all(completed.map(async match => ({ match, innings: await getScorecard(match.id).catch(() => []) })))
      setForm(cards.map(({ match, innings }) => {
        if (innings.length < 2) return { id: match.id, result: '—', opponent: match.homeTeam.id === teamId ? match.awayTeam.name : match.homeTeam.name }
        const [first, second] = innings; const winner = first.totalRuns === second.totalRuns ? null : (first.totalRuns > second.totalRuns ? first.battingTeamName : second.battingTeamName)
        return { id: match.id, result: winner === null ? 'T' : winner === teamName ? 'W' : 'L', opponent: match.homeTeam.id === teamId ? match.awayTeam.name : match.homeTeam.name }
      }))
    }).catch(() => setForm([]))
  }, [teamId, teamName])
  return <section className="profile-related team-form"><p>RECENT FORM</p><h2>{teamName} last five</h2>{form === null && <span>Loading recent form…</span>}{form?.length === 0 && <span>No completed matches are available yet.</span>}{form?.length > 0 && <div>{form.map(item => <article key={item.id}><b className={item.result === 'W' ? 'won' : item.result === 'L' ? 'lost' : 'tied'}>{item.result}</b><span>vs {item.opponent}</span></article>)}</div>}<small>W = win · L = loss · T = tie</small></section>
}

function TournamentProfile({ item }) {
  const [standings, setStandings] = useState(null); const formats = ['Test', 'ODI', 'T20', 'T10']; const format = typeof item.format === 'number' ? formats[item.format] : item.format
  useEffect(() => { getTournamentStandings(item.id).then(setStandings).catch(() => setStandings([])) }, [item.id])
  return <><section className="profile"><p>TOURNAMENT PROFILE</p><div className="profile-heading"><ImageWithFallback url={item.logoUrl} name={item.name} fallback="🏆" className="team-profile-photo" /><div><h1>{item.name}</h1><span>{format} · {item.season}</span></div></div><div className="profile-stats"><article><small>DATES</small><b>{new Date(item.startDate).toLocaleDateString()} — {new Date(item.endDate).toLocaleDateString()}</b></article><article><small>FORMAT</small><b>{format}</b></article><article><small>TEAMS</small><b>{item.teams.length} participating</b></article></div><h2 className="squad-title">Standings</h2>{standings === null && <p>Loading standings…</p>}{standings?.some(team => team.played) ? <table className="profile-standings"><thead><tr><th>Team</th><th>P</th><th>W</th><th>L</th><th>T</th><th>+/-</th><th>Pts</th></tr></thead><tbody>{standings.map(team => <tr key={team.teamId}><td>{team.teamName}</td><td>{team.played}</td><td>{team.won}</td><td>{team.lost}</td><td>{team.tied}</td><td>{team.runsFor - team.runsAgainst}</td><td><b>{team.points}</b></td></tr>)}</tbody></table> : standings && <p>No completed tournament matches yet.</p>}<h2 className="squad-title">Participating teams</h2><div className="team-chips">{item.teams.length ? item.teams.map(team => <span key={team.id}>{team.shortName} · {team.name}</span>) : <span>No teams have been added yet.</span>}</div></section><RelatedMatches tournamentId={item.id} tournamentName={item.name}/></>
}
