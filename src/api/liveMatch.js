import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'

const API_BASE = import.meta.env.VITE_API_URL ?? ''
const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function subscribeToMatch(matchId, handlers) {
  if (!guid.test(matchId)) { handlers.onConnection?.('offline'); return () => {} }
  const connection = new HubConnectionBuilder().withUrl(`${API_BASE}/hubs/matches`).withAutomaticReconnect().configureLogging(LogLevel.Warning).build()
  if (handlers.onScore) connection.on('ScoreUpdated', handlers.onScore)
  if (handlers.onDelivery) connection.on('DeliveryRecorded', handlers.onDelivery)
  if (handlers.onMatchCompleted) connection.on('MatchCompleted', handlers.onMatchCompleted)
  connection.onreconnecting(() => handlers.onConnection?.('connecting'))
  connection.onreconnected(() => connection.invoke('JoinMatch', matchId).then(() => handlers.onConnection?.('live')).catch(() => handlers.onConnection?.('offline')))
  connection.onclose(() => handlers.onConnection?.('offline'))
  connection.start().then(() => connection.invoke('JoinMatch', matchId)).then(() => handlers.onConnection?.('live')).catch(() => handlers.onConnection?.('offline'))
  return () => { connection.stop().catch(() => {}) }
}
