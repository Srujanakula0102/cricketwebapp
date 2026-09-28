import { useState } from 'react'
import { getAdminTeams } from '../api/adminTeams'
import { getAdminPlayers } from '../api/adminPlayers'
import { getAdminVenues } from '../api/adminVenues'
import { getAdminTournaments } from '../api/adminTournaments'
import { getAdminMatches } from '../api/adminMatches'

const formats = ['Test', 'ODI', 'T20', 'T10']
const statuses = ['Scheduled', 'Live', 'Completed', 'Cancelled', 'Abandoned']
const safeCell = value => {
  const text = String(value ?? '')
  const protectedText = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${protectedText.replaceAll('"', '""')}"`
}
const downloadCsv = (name, columns, rows) => {
  const csv = [columns.map(safeCell).join(','), ...rows.map(row => row.map(safeCell).join(','))].join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = `crease-${name}-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url)
}

export default function AdminReports() {
  const [message, setMessage] = useState('Choose a report to download.')
  const exportReport = async kind => {
    try {
      setMessage('Preparing report…')
      if (kind === 'teams') { const data = await getAdminTeams(); downloadCsv('teams', ['Name', 'Short name', 'Country or region', 'Active'], data.items.map(item => [item.name, item.shortName, item.countryOrRegion, item.isActive ? 'Yes' : 'No'])) }
      if (kind === 'players') { const data = await getAdminPlayers(); downloadCsv('players', ['Full name', 'Team', 'Role', 'Country or region', 'Batting style', 'Bowling style'], data.items.map(item => [item.fullName, item.teamName, item.role, item.countryOrRegion, item.battingStyle, item.bowlingStyle])) }
      if (kind === 'venues') { const data = await getAdminVenues(); downloadCsv('venues', ['Name', 'City', 'Country', 'Capacity'], data.items.map(item => [item.name, item.city, item.country, item.capacity])) }
      if (kind === 'tournaments') { const data = await getAdminTournaments(); downloadCsv('tournaments', ['Name', 'Season', 'Format', 'Start date', 'End date', 'Teams'], data.items.map(item => [item.name, item.season, formats[item.format] || item.format, item.startDate, item.endDate, item.teams.map(team => team.name).join('; ')])) }
      if (kind === 'matches') { const data = await getAdminMatches(); downloadCsv('matches', ['Home team', 'Away team', 'Status', 'Format', 'Starts at', 'Tournament', 'Venue', 'Overs limit'], data.items.map(item => [item.homeTeam.name, item.awayTeam.name, statuses[item.status] || item.status, formats[item.format] || item.format, item.startsAt, item.tournamentName, item.venueName, item.oversLimit])) }
      setMessage('CSV download started.')
    } catch (error) { setMessage(error.message || 'The report could not be created.') }
  }
  return <div className="admin-block"><div className="manage-head"><h2>Reports & exports</h2></div><p className="admin-help">Download current cricket data as CSV files for Excel, Google Sheets, or reporting tools. Staff account details are not included.</p><div className="report-grid">{[['teams', 'Teams'], ['players', 'Players'], ['venues', 'Venues'], ['tournaments', 'Tournaments'], ['matches', 'Fixtures & results']].map(([kind, label]) => <button key={kind} onClick={() => exportReport(kind)}><b>{label}</b><span>Download CSV →</span></button>)}</div><p className="admin-message">{message}</p></div>
}
