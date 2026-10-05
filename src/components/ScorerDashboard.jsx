import { useEffect, useMemo, useState } from "react";
import { getMatches } from "../api/matches";
import {
  changeBowler,
  getCurrentInnings,
  startInnings,
  recordDelivery,
  undoDelivery,
  endInnings,
  endMatch,
} from "../api/scoring";
import { login } from "../api/auth";
import { clearSession, getValidSession, saveSession } from "../api/session";
import ScorerNews from "./ScorerNews";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const emptyDelivery = {
  runsOffBat: 0,
  extraRuns: 0,
  extraType: 0,
  isWicket: false,
  wicketType: null,
  dismissedPlayerId: null,
  incomingBatterId: null,
  commentary: null,
};
const fourShots = ["Cover Drive", "Straight Drive", "Square Drive", "Off Drive", "Cut", "Late Cut", "Pull", "Flick", "Glance", "Sweep", "Paddle Sweep", "Reverse Sweep", "Inside-Out", "Upper Cut", "Lofted Drive", "Slog", "Other"];
const sixShots = ["Straight Six", "Cover Six", "Mid-Wicket Six", "Pull Six", "Hook Six", "Slog Six", "Sweep Six", "Reverse Sweep Six", "Lofted Six", "Flick Six", "Other"];
const wicketChoices = [
  ["Bowled", 0], ["Caught", 1], ["LBW", 2], ["Run Out", 3], ["Stumped", 4], ["Hit Wicket", 5],
  ["Obstructing the Field", 3], ["Retired Out", 6],
];
const caughtTypes = ["Caught Behind", "Slip Catch", "Close Catch", "Outfield Catch", "Boundary Catch"];
const extras = [["Wide", 1], ["No Ball", 2], ["Bye", 3], ["Leg Bye", 4]];
const specialEvents = [
  ["Six + No Ball", { runsOffBat: 6, extraRuns: 1, extraType: 2 }],
  ["Four + No Ball", { runsOffBat: 4, extraRuns: 1, extraType: 2 }],
  ["Bye Four", { extraRuns: 4, extraType: 3 }],
  ["Leg Bye Four", { extraRuns: 4, extraType: 4 }],
];

export default function ScorerDashboard({ close }) {
  const [session, setSession] = useState(() => getValidSession());
  const [matches, setMatches] = useState([]),
    [players, setPlayers] = useState([]),
    [matchId, setMatchId] = useState(""),
    [battingTeamId, setBattingTeamId] = useState(""),
    [state, setState] = useState(null),
    [message, setMessage] = useState("Loading available matches…"),
    [commentary, setCommentary] = useState(""),
    [flow, setFlow] = useState(null),
    [wicketDetail, setWicketDetail] = useState(null),
    [newsOpen, setNewsOpen] = useState(false);
  useEffect(() => {
    Promise.all([
      getMatches(),
      fetch(`${API_BASE}/api/players?page=1&pageSize=100`).then((r) =>
        r.ok ? r.json() : Promise.reject(),
      ),
    ])
      .then(([matchData, playerData]) => {
        setMatches(matchData.items || []);
        setPlayers(playerData.items || []);
        setMessage("");
      })
      .catch(() =>
        setMessage(
          "Unable to load matches or players. Start the API and ensure its URL is set in VITE_API_URL.",
        ),
      );
  }, []);
  const match = matches.find((item) => item.id === matchId);
  const battingTeam =
    match &&
    (match.homeTeam.id === battingTeamId ? match.homeTeam : match.awayTeam);
  const fieldingTeam =
    match &&
    (battingTeam?.id === match.homeTeam.id ? match.awayTeam : match.homeTeam);
  const batters = useMemo(
    () => players.filter((player) => player.teamId === battingTeam?.id),
    [players, battingTeam],
  );
  const bowlers = useMemo(
    () => players.filter((player) => player.teamId === fieldingTeam?.id),
    [players, fieldingTeam],
  );
  const action = async (run) => {
    try {
      const result = await run();
      if (result) setState(result);
      setMessage("");
    } catch (error) {
      setMessage(
        "Action rejected: check selected match, players, innings state, and role.",
      );
    }
  };
  const confirmAction = (message, run) => {
    if (window.confirm(message)) action(run);
  };
  const start = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    action(() =>
      startInnings(matchId, session.accessToken, {
        battingTeamId,
        strikerId: form.get("striker"),
        nonStrikerId: form.get("nonStriker"),
        bowlerId: form.get("bowler"),
      }),
    );
  };
  const playerName = (id, fallback) => players.find((player) => player.id === id)?.fullName || fallback;
  const automaticCommentary = (payload, detail) => {
    const strikerName = playerName(state?.strikerId, "The batter");
    const bowlerName = playerName(state?.bowlerId, "The bowler");
    const dismissedName = playerName(payload.dismissedPlayerId, strikerName);
    let actionText;
    if (payload.isWicket) {
      actionText = `${dismissedName} is out${detail ? ` — ${detail.replace("WICKET · ", "")}` : ""}`;
    } else if (detail.startsWith("FOUR · ")) {
      actionText = `${strikerName} hits a FOUR with a ${detail.replace("FOUR · ", "")}`;
    } else if (detail.startsWith("SIX · ")) {
      actionText = `${strikerName} launches a SIX — ${detail.replace("SIX · ", "")}`;
    } else if (detail) {
      actionText = detail.replace(/^EXTRA · /, "Extra — ").replace(/^SPECIAL · /, "Special event — ");
    } else if (payload.extraType === 1) {
      actionText = `wide ball, ${payload.extraRuns} extra run${payload.extraRuns === 1 ? "" : "s"}`;
    } else if (payload.extraType === 2) {
      actionText = `no ball, ${payload.extraRuns} extra run${payload.extraRuns === 1 ? "" : "s"}`;
    } else if (payload.runsOffBat === 0) {
      actionText = "no run";
    } else {
      actionText = `${strikerName} takes ${payload.runsOffBat} run${payload.runsOffBat === 1 ? "" : "s"}`;
    }
    const prefix = actionText.startsWith(strikerName) ? `${bowlerName} to ` : `${bowlerName} to ${strikerName}, `;
    return `${prefix}${actionText}.${commentary.trim() ? ` ${commentary.trim()}` : ""}`;
  };
  const delivery = (payload, guidedCommentary = "") =>
    action(async () => {
      const result = await recordDelivery(matchId, session.accessToken, {
        ...emptyDelivery,
        ...payload,
        commentary: automaticCommentary(payload, guidedCommentary),
      });
      setCommentary("");
      return result;
    });
  const score = (runs) => delivery({ runsOffBat: runs });
  const guidedDelivery = (payload, detail) => {
    setFlow(null);
    delivery(payload, detail);
  };
  const wicket = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    guidedDelivery({
      isWicket: true,
      wicketType: wicketDetail.wicketType,
      dismissedPlayerId: form.get("dismissedPlayerId"),
      incomingBatterId: form.get("incomingBatterId"),
    }, wicketDetail.label);
    setWicketDetail(null);
  };
  const change = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    action(() =>
      changeBowler(matchId, session.accessToken, form.get("bowlerId")),
    );
  };
  useEffect(() => {
    if (!session) return;
    const delay = new Date(session.expiresAt).getTime() - Date.now();
    if (delay <= 0) {
      clearSession();
      setSession(null);
      setMessage("Your staff session has expired. Sign in again.");
      return;
    }
    const timer = window.setTimeout(() => {
      clearSession();
      setSession(null);
      setMessage("Your staff session has expired. Sign in again.");
    }, delay);
    return () => window.clearTimeout(timer);
  }, [session]);
  const signIn = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await login(form.get("email"), form.get("password"));
      saveSession(result);
      setSession(result);
    } catch {
      setMessage("Unable to sign in.");
    }
  };
  if (!session)
    return (
      <main className="admin-login">
        <button className="back" onClick={close}>
          ← Back to site
        </button>
        <form onSubmit={signIn}>
          <p>SCORER ACCESS</p>
          <h1>Scorer console</h1>
          {message && <small>{message}</small>}
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" required />
          </label>
          <button className="cta">Sign in →</button>
          <a className="text-button" href="?reset=request">
            Forgot password?
          </a>
        </form>
      </main>
    );
  if (!session.roles?.some((role) => role === "Admin" || role === "Scorer"))
    return (
      <main className="admin-login">
        <button className="back" onClick={close}>
          ← Back to site
        </button>
        <div className="denied">
          <p>ACCESS RESTRICTED</p>
          <h1>Scorer role required</h1>
          <span>Use an account assigned Admin or Scorer.</span>
          <button
            onClick={() => {
              clearSession();
              setSession(null);
            }}
          >
            Use another account
          </button>
        </div>
      </main>
    );
  const selectMatch = async (id) => {
    const selected = matches.find((item) => item.id === id);
    setMatchId(id);
    setBattingTeamId(selected?.homeTeam.id || "");
    setState(null);
    if (!id) return;
    const current = await getCurrentInnings(id);
    if (current) {
      setState(current);
      setBattingTeamId(current.battingTeamId);
    }
  };
  const finalWicket = state?.wickets >= 9;
  const dismissed = new Set(state?.dismissedPlayerIds || []);
  const fielders = bowlers;
  const strikerName = playerName(state?.strikerId, "—");
  const nonStrikerName = playerName(state?.nonStrikerId, "—");
  const bowlerName = playerName(state?.bowlerId, "—");
  const selectWicket = (label, wicketType) => {
    if (label === "Caught") {
      setFlow("caughtType");
      return;
    }
    setWicketDetail({ label: `WICKET · ${label}`, wicketType });
    setFlow("wicketPlayers");
  };
  const selectCaught = (caughtType) => {
    setWicketDetail({ label: `WICKET · Caught · ${caughtType}`, wicketType: 1 });
    setFlow("fielder");
  };
  const selectFielder = (fielder) => {
    setWicketDetail((detail) => ({ ...detail, label: `${detail.label} · Fielder: ${fielder.fullName}` }));
    setFlow("wicketPlayers");
  };
  return (
    <main className="scorer">
      <header>
        <div>
          <p>LIVE SCORING</p>
          <h1>Scorer console</h1>
        </div>
        <div className="scorer-header-actions"><button type="button" onClick={() => setNewsOpen(open => !open)}>{newsOpen ? "Close news desk" : "Publish news"}</button><button className="login" onClick={close}>View site</button></div>
      </header>
      {newsOpen && <ScorerNews session={session} close={() => setNewsOpen(false)} />}
      {message && <div className="state-card">{message}</div>}
      <section className="scoring-select">
        <label>
          Match
          <select
            value={matchId}
            onChange={(event) => selectMatch(event.target.value)}
          >
            <option value="">Choose a match</option>
            {matches.map((item) => (
              <option value={item.id} key={item.id}>
                {item.homeTeam.name} vs {item.awayTeam.name}
              </option>
            ))}
          </select>
        </label>
      </section>
      {state?.isMatchComplete && (
        <div className="state-card">This match is complete.</div>
      )}
      {match && (!state || (state.isComplete && !state.isMatchComplete)) && (
        <form className="innings-form" onSubmit={start}>
          <h2>{state?.isComplete ? "Start next innings" : "Start innings"}</h2>
          <label>
            Batting team
            <select
              value={battingTeamId}
              onChange={(event) => setBattingTeamId(event.target.value)}
              required
            >
              <option value={match.homeTeam.id}>{match.homeTeam.name}</option>
              <option value={match.awayTeam.id}>{match.awayTeam.name}</option>
            </select>
          </label>
          <label>
            Striker
            <select name="striker" required>
              <option value="">Select player</option>
              {batters.map((player) => (
                <option value={player.id} key={player.id}>
                  {player.fullName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Non-striker
            <select name="nonStriker" required>
              <option value="">Select player</option>
              {batters.map((player) => (
                <option value={player.id} key={player.id}>
                  {player.fullName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Opening bowler
            <select name="bowler" required>
              <option value="">Select player</option>
              {bowlers.map((player) => (
                <option value={player.id} key={player.id}>
                  {player.fullName}
                </option>
              ))}
            </select>
          </label>
          <button className="cta">Start innings →</button>
        </form>
      )}
      {state && !state.isComplete && (
        <section className="scoring-board">
          <div className="crease-panel" aria-label="Players currently involved in this delivery">
            <article className="on-strike"><small>ON STRIKE</small><strong>{strikerName}</strong><span>Faces the next ball</span></article>
            <article><small>NON-STRIKER</small><strong>{nonStrikerName}</strong><span>At the other end</span></article>
            <article><small>CURRENT BOWLER</small><strong>{bowlerName}</strong><span>Bowling this over</span></article>
          </div>
          <div className="scoring-score">
            <small>CURRENT SCORE</small>
            <b>
              {state.totalRuns}/{state.wickets}
            </b>
            <span>
              {state.overNumber}.{state.ballInOver} overs
            </span>
          </div>
          <h2>Record delivery</h2>
          <label className="commentary-input">
            Optional commentary for next delivery
            <input
              value={commentary}
              onChange={(event) => setCommentary(event.target.value)}
              placeholder="e.g. Driven through cover for four"
            />
          </label>
          {!flow && (
            <div className="event-menu" aria-label="Ball result">
              <p>BALL RESULT</p>
              <div className="event-menu-grid">
                {[0, 1, 2, 3].map((run) => <button type="button" onClick={() => score(run)} key={run}>{run === 0 ? "0 · Dot" : `${run} Run${run === 1 ? "" : "s"}`}</button>)}
                <button type="button" onClick={() => setFlow("four")}>FOUR</button>
                <button type="button" onClick={() => setFlow("six")}>SIX</button>
                <button type="button" className="danger" onClick={() => setFlow("wicket")}>WICKET</button>
                <button type="button" onClick={() => setFlow("extras")}>EXTRAS</button>
                <button type="button" onClick={() => setFlow("special")}>SPECIAL</button>
              </div>
            </div>
          )}
          {flow && (
            <section className="event-picker" aria-live="polite">
              <div className="event-picker-heading">
                <button type="button" className="text-button" onClick={() => { setFlow(null); setWicketDetail(null); }}>← Ball result</button>
                <h3>{flow === "four" ? "FOUR · Select shot" : flow === "six" ? "SIX · Select shot" : flow === "wicket" ? "WICKET · Select dismissal" : flow === "caughtType" ? "CAUGHT · Select catch type" : flow === "fielder" ? "CAUGHT · Select fielder" : flow === "wicketPlayers" ? "WICKET · Confirm players" : flow === "extras" ? "EXTRAS · Select type" : flow === "extraRuns" ? `${wicketDetail?.label ?? "EXTRA"} · Select runs` : "SPECIAL · Select event"}</h3>
              </div>
              {flow === "four" && <div className="option-grid">{fourShots.map((shot) => <button type="button" key={shot} onClick={() => guidedDelivery({ runsOffBat: 4 }, `FOUR · ${shot}`)}>{shot}</button>)}</div>}
              {flow === "six" && <div className="option-grid">{sixShots.map((shot) => <button type="button" key={shot} onClick={() => guidedDelivery({ runsOffBat: 6 }, `SIX · ${shot}`)}>{shot}</button>)}</div>}
              {flow === "wicket" && <div className="option-grid">{wicketChoices.map(([label, wicketType]) => <button type="button" key={label} className={label === "Caught" ? "accent" : ""} onClick={() => selectWicket(label, wicketType)}>{label}{label === "Caught" ? " →" : ""}</button>)}</div>}
              {flow === "caughtType" && <div className="option-grid">{caughtTypes.map((type) => <button type="button" key={type} onClick={() => selectCaught(type)}>{type}</button>)}</div>}
              {flow === "fielder" && <div className="option-grid">{fielders.length ? fielders.map((fielder) => <button type="button" key={fielder.id} onClick={() => selectFielder(fielder)}>{fielder.fullName}</button>) : <button type="button" onClick={() => setFlow("wicketPlayers")}>Skip fielder</button>}</div>}
              {flow === "extras" && <div className="option-grid">{extras.map(([label, extraType]) => <button type="button" key={label} onClick={() => { setWicketDetail({ label: `EXTRA · ${label}`, extraType }); setFlow("extraRuns"); }}>{label} →</button>)}</div>}
              {flow === "extraRuns" && <div className="option-grid">{[1, 2, 3, 4, 5, 6, 7].map((runs) => <button type="button" key={runs} onClick={() => guidedDelivery({ extraType: wicketDetail.extraType, extraRuns: runs }, `${wicketDetail.label} · ${runs} run${runs === 1 ? "" : "s"}`)}>{runs} {runs === 1 ? "run" : "runs"}</button>)}</div>}
              {flow === "special" && <div className="option-grid">{specialEvents.map(([label, payload]) => <button type="button" key={label} onClick={() => guidedDelivery(payload, `SPECIAL · ${label}`)}>{label}</button>)}</div>}
            </section>
          )}
          {flow === "wicketPlayers" && wicketDetail && (
          <form className="wicket-form" onSubmit={wicket}>
            <p>{wicketDetail.label}</p>
            <label>
              Dismissed batter
              <select name="dismissedPlayerId" required>
                <option value="">Select batter</option>
                {batters
                  .filter(
                    (player) =>
                      player.id === state.strikerId ||
                      player.id === state.nonStrikerId,
                  )
                  .map((player) => (
                    <option value={player.id} key={player.id}>
                      {player.fullName}
                    </option>
                  ))}
              </select>
            </label>
            {!finalWicket && (
              <label>
                Incoming batter
                <select name="incomingBatterId" required>
                  <option value="">Select incoming batter</option>
                  {batters
                    .filter(
                      (player) =>
                        player.id !== state.strikerId &&
                        player.id !== state.nonStrikerId &&
                        !dismissed.has(player.id),
                    )
                    .map((player) => (
                      <option value={player.id} key={player.id}>
                        {player.fullName}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <button className="danger">
              {finalWicket ? "Record final wicket" : "Record wicket"}
            </button>
          </form>
          )}
          {state.ballInOver === 0 && (
            <form className="bowler-form" onSubmit={change}>
              <label>
                New bowler
                <select name="bowlerId" required defaultValue="">
                  <option value="">Choose a bowler</option>
                  {bowlers
                    .filter((player) => player.id !== state.bowlerId)
                    .map((player) => (
                      <option value={player.id} key={player.id}>
                        {player.fullName}
                      </option>
                    ))}
                </select>
              </label>
              <button>Change bowler</button>
            </form>
          )}
          <div className="scoring-actions">
            <button
              type="button"
              className="danger"
              onClick={() =>
                confirmAction(
                  "Undo the last recorded delivery? The score and commentary will be recalculated.",
                  () => undoDelivery(matchId, session.accessToken),
                )
              }
            >
              Undo last ball
            </button>
            <button
              type="button"
              onClick={() =>
                confirmAction(
                  "End this innings now? No more deliveries can be added to it.",
                  () => endInnings(matchId, session.accessToken),
                )
              }
            >
              End innings
            </button>
            <button
              type="button"
              className="danger"
              onClick={() =>
                confirmAction(
                  "End this match now? This marks the match as complete.",
                  () => endMatch(matchId, session.accessToken),
                )
              }
            >
              End match
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
