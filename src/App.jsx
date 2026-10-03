import { useEffect, useRef, useState } from "react";
import { getMatch, getMatches } from "./api/matches";
import { getCatalog, getTournamentStandings } from "./api/catalog";
import { completePasswordReset, login, requestPasswordReset } from "./api/auth";
import { clearSession, getValidSession, saveSession } from "./api/session";
import { getCommentary, getCurrentInnings, getScorecard } from "./api/scoring";
import { subscribeToMatch } from "./api/liveMatch";
import { getNews } from "./api/news";
import ScorerDashboard from "./components/ScorerDashboard";
import CataloguePage from "./components/CataloguePage";
import CatalogueDetail from "./components/CatalogueDetail";
import NewsArticle from "./components/NewsArticle";
import AdminTeams from "./components/AdminTeams";
import AdminPlayers from "./components/AdminPlayers";
import AdminVenues from "./components/AdminVenues";
import AdminTournaments from "./components/AdminTournaments";
import AdminMatches from "./components/AdminMatches";
import AdminNews from "./components/AdminNews";
import AdminOverview from "./components/AdminOverview";
import AdminUsers from "./components/AdminUsers";
import AdminReports from "./components/AdminReports";
import AdminAuditLog from "./components/AdminAuditLog";
import "./App.css";
const nav = [
  "Home",
  "Sports",
  "Matches",
  "Teams",
  "Players",
  "Tournaments",
  "Venues",
  "News",
];
const preview = [
  {
    id: "live",
    status: "LIVE",
    teams: "India vs Australia",
    score: "186/4",
    overs: "19.2 overs",
  },
  {
    id: "upcoming",
    status: "UPCOMING",
    teams: "England vs South Africa",
    score: "Starts 19:30",
    overs: "The Oval",
  },
  {
    id: "result",
    status: "RESULT",
    teams: "Mumbai vs Chennai",
    score: "172/6",
    overs: "Mumbai won by 5 wickets",
  },
];
const toPublicMatch = (item) => ({
  id: item.id,
  status:
    ["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED", "ABANDONED"][item.status] ||
    item.status,
  teams: `${item.homeTeam.name} vs ${item.awayTeam.name}`,
  score: "Match centre",
  overs: item.startsAt ? new Date(item.startsAt).toLocaleString() : "",
  format: item.format,
  tournamentName: item.tournamentName,
  venueName: item.venueName,
  startsAt: item.startsAt,
  oversLimit: item.oversLimit,
  notes: item.notes,
  homeTeam: item.homeTeam,
  awayTeam: item.awayTeam,
});
export default function App() {
  const [page, setPage] = useState("Home"),
    [selected, setSelected] = useState(null),
    [catalogueItem, setCatalogueItem] = useState(null),
    [newsSlug, setNewsSlug] = useState(null),
    [open, setOpen] = useState(false),
    [admin, setAdmin] = useState(false),
    [scorer, setScorer] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
    [savedMatchIds, setSavedMatchIds] = useState(
      () =>
        new Set(
          JSON.parse(localStorage.getItem("crease-saved-matches") || "[]"),
        ),
    );
  const resetMode = new URLSearchParams(window.location.search).get("reset");
  const toggleSavedMatch = (id) =>
    setSavedMatchIds((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("crease-saved-matches", JSON.stringify([...next]));
      return next;
    });
  const go = (x) => {
    setPage(x);
    setSelected(null);
    setCatalogueItem(null);
    setNewsSlug(null);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.history.replaceState({}, "", window.location.pathname);
  };
  const openMatch = (match) => {
    window.history.pushState(
      {},
      "",
      `${window.location.pathname}?match=${match.id}`,
    );
    setSelected(match);
    setSearchOpen(false);
  };
  const closeMatch = () => {
    setSelected(null);
    window.history.replaceState({}, "", window.location.pathname);
  };
  const openCatalogue = (item) => {
    setCatalogueItem(item);
    setSearchOpen(false);
  };
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("match");
    if (id)
      getMatch(id)
        .then((item) => setSelected(toPublicMatch(item)))
        .catch(() =>
          window.history.replaceState({}, "", window.location.pathname),
        );
  }, []);
  if (resetMode) return <PasswordResetPage mode={resetMode} />;
  return (
    <>
      <header>
        <button className="brand" onClick={() => go("Home")}>
          <span>SPORTSMANIA</span>
          <small>OUCE SPORTS PORTAL</small>
        </button>
        <button className="menu" onClick={() => setOpen(!open)}>
          ☰
        </button>
        <nav className={open ? "open" : ""}>
          {nav.map((x) => (
            <button
              className={page === x ? "active" : ""}
              onClick={() => go(x)}
              key={x}
            >
              {x}
            </button>
          ))}
          <button
            className="search-trigger"
            onClick={() => setSearchOpen(true)}
          >
            ⌕ Search
          </button>
          <button onClick={() => setScorer(true)}>Score</button>
          <button className="login" onClick={() => setAdmin(true)}>
            Admin
          </button>
        </nav>
      </header>
      {searchOpen ? (
        <GlobalSearch
          close={() => setSearchOpen(false)}
          openMatch={openMatch}
          openCatalogue={openCatalogue}
        />
      ) : scorer ? (
        <ScorerDashboard close={() => setScorer(false)} />
      ) : admin ? (
        <AdminDashboard close={() => setAdmin(false)} />
      ) : selected ? (
        <Centre match={selected} back={closeMatch} />
      ) : catalogueItem ? (
        <CatalogueDetail
          key={`${catalogueItem.kind}-${catalogueItem.id}`}
          selection={catalogueItem}
          back={() => setCatalogueItem(null)}
        />
      ) : newsSlug ? (
        <NewsArticle key={newsSlug} slug={newsSlug} back={() => setNewsSlug(null)} />
      ) : page === "Home" ? (
        <Home
          go={go}
          select={openMatch}
          savedMatchIds={savedMatchIds}
          toggleSavedMatch={toggleSavedMatch}
        />
      ) : page === "Matches" ? (
        <Matches
          select={openMatch}
          savedMatchIds={savedMatchIds}
          toggleSavedMatch={toggleSavedMatch}
        />
      ) : page === "News" ? (
        <News key="news" select={setNewsSlug} />
      ) : page === "Sports" ? (
        <Sports key="sports" go={go} />
      ) : ["Teams", "Players", "Tournaments", "Venues"].includes(page) ? (
        <CataloguePage key={page} kind={page} select={openCatalogue} />
      ) : (
        <Listing title={page} />
      )}
      {!scorer && !admin && <PublicFooter go={go} />}
    </>
  );
}
function PublicFooter({ go }) {
  return <footer className="site-footer"><div><button className="footer-brand" onClick={() => go("Home")}>SPORTSMANIA <small>· OUCE SPORTS PORTAL</small></button><p>The public sports platform for Osmania University College of Engineering.</p></div><div className="footer-links"><button onClick={() => go("Sports")}>Sports</button><button onClick={() => go("Matches")}>Matches</button><button onClick={() => go("News")}>News</button></div><div className="footer-author"><p>Architected and developed by Srujan Akula <strong>Srujan Akula</strong>, Mining Engineering (2023–2027).</p><a href="https://in.linkedin.com/in/srujan-akula-40aa8927a" target="_blank" rel="noreferrer">For queries or technical support, contact Srujan on LinkedIn ↗</a></div></footer>;
}
function Sports({ go }) {
  const sports = [
    { name: "Cricket", icon: "🏏", status: "Live now", text: "Fixtures, live scoring, player profiles, results and tournaments.", action: () => go("Matches") },
    { name: "Football", icon: "⚽", status: "Coming soon", text: "University football fixtures, squads and result coverage." },
    { name: "Volleyball", icon: "🏐", status: "Coming soon", text: "Inter-college volleyball teams, schedules and highlights." },
    { name: "Basketball", icon: "🏀", status: "Coming soon", text: "Campus basketball fixtures and player achievements." },
    { name: "Athletics", icon: "🏃", status: "Coming soon", text: "Track, field and university meet updates." },
  ];
  return <main className="sports-page"><section className="sports-hero"><p>OSMANIA UNIVERSITY COLLEGE OF ENGINEERING</p><h1>One campus.<br /><i>Every sport.</i></h1><span>SPORTSMANIA brings OUCE students, alumni and supporters closer to the teams representing the college.</span></section><section className="sports-directory"><p>SPORTS DIRECTORY</p><h2>Follow the teams</h2><div className="sports-grid">{sports.map(sport => <article className={`sport-card ${sport.status === "Live now" ? "active-sport" : ""}`} key={sport.name}><span className="sport-icon">{sport.icon}</span><small>{sport.status}</small><h3>{sport.name}</h3><p>{sport.text}</p>{sport.action ? <button onClick={sport.action}>Explore cricket →</button> : <span className="coming-label">Launching soon</span>}</article>)}</div></section></main>;
}
function PasswordResetPage({ mode }) {
  const [message, setMessage] = useState("");
  const back = () => {
    window.history.replaceState({}, "", window.location.pathname);
    window.location.reload();
  };
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      if (mode === "request") {
        await requestPasswordReset(form.get("email"));
        setMessage(
          "If this staff email exists, a password-reset link has been sent.",
        );
      } else {
        await completePasswordReset(
          form.get("email"),
          form.get("token"),
          form.get("password"),
        );
        setMessage("Password reset. You can now sign in.");
      }
    } catch (error) {
      setMessage(error.message || "Unable to reset password.");
    }
  };
  const complete = mode === "complete";
  const params = new URLSearchParams(window.location.search);
  return (
    <main className="account-page">
      <button className="back" onClick={back}>
        ← Back to site
      </button>
      <form onSubmit={submit}>
        <p>STAFF ACCESS</p>
        <h1>{complete ? "Set a new password" : "Reset password"}</h1>
        <span>
          {complete
            ? "Choose a new password for your Admin or Scorer account."
            : "Enter your staff email address. If it is registered, we will send a reset link."}
        </span>
        <label>
          Email
          <input
            name="email"
            type="email"
            defaultValue={params.get("email") || ""}
            required
          />
        </label>
        {complete && (
          <>
            <input
              name="token"
              type="hidden"
              value={params.get("token") || ""}
            />
            <label>
              New password
              <input name="password" type="password" minLength="8" required />
            </label>
          </>
        )}
        {message && <small>{message}</small>}
        <button className="cta">
          {complete ? "Set password" : "Send reset link"}
        </button>
        {complete && (
          <button type="button" className="text-button" onClick={back}>
            Return to sign in
          </button>
        )}
      </form>
    </main>
  );
}
function GlobalSearch({ close, openMatch, openCatalogue }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [status, setStatus] = useState("idle");
  useEffect(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) {
      setResults(null);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    const timer = window.setTimeout(
      () =>
        Promise.all([
          getMatches(),
          getCatalog("teams", term),
          getCatalog("players", term),
          getCatalog("venues", term),
          getCatalog("tournaments"),
        ])
          .then(([matchData, teams, players, venues, tournaments]) => {
            if (cancelled) return;
            const labels = [
              "SCHEDULED",
              "LIVE",
              "COMPLETED",
              "CANCELLED",
              "ABANDONED",
            ];
            const matches = (matchData.items || [])
              .filter((match) =>
                `${match.homeTeam.name} ${match.awayTeam.name} ${match.venueName || ""} ${match.tournamentName || ""}`
                  .toLowerCase()
                  .includes(term),
              )
              .map((match) => ({
                id: match.id,
                status: labels[match.status] || match.status,
                teams: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
                score: labels[match.status] || "Scheduled",
                overs: new Date(match.startsAt).toLocaleString(),
                format: match.format,
                tournamentName: match.tournamentName,
                venueName: match.venueName,
                startsAt: match.startsAt,
                oversLimit: match.oversLimit,
                notes: match.notes,
              }));
            setResults({
              matches,
              teams: teams.items || [],
              players: players.items || [],
              venues: venues.items || [],
              tournaments: (tournaments.items || []).filter((item) =>
                item.name.toLowerCase().includes(term),
              ),
            });
            setStatus("ready");
          })
          .catch(() => {
            if (!cancelled) setStatus("error");
          }),
      200,
    );
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);
  const groups = results && [
    [
      "Matches",
      results.matches,
      (item) => openMatch(item),
      (item) => item.teams,
    ],
    [
      "Teams",
      results.teams,
      (item) => openCatalogue({ kind: "Teams", id: item.id }),
      (item) => `${item.name} · ${item.countryOrRegion}`,
    ],
    [
      "Players",
      results.players,
      (item) => openCatalogue({ kind: "Players", id: item.id }),
      (item) => `${item.fullName} · ${item.teamName || item.role}`,
    ],
    [
      "Venues",
      results.venues,
      (item) => openCatalogue({ kind: "Venues", id: item.id }),
      (item) => `${item.name} · ${item.city}, ${item.country}`,
    ],
    [
      "Tournaments",
      results.tournaments,
      (item) => openCatalogue({ kind: "Tournaments", id: item.id }),
      (item) => `${item.name} · ${item.season}`,
    ],
  ];
  const total =
    groups?.reduce((count, [, items]) => count + items.length, 0) || 0;
  return (
    <main className="search-page">
      <button className="back" onClick={close}>
        ← Back to site
      </button>
      <section>
        <p>SEARCH SPORTSMANIA</p>
        <h1>Find OUCE cricket</h1>
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search teams, players, venues, tournaments or matches"
        />
        {status === "idle" && (
          <div className="search-state">
            Enter at least two characters to search.
          </div>
        )}
        {status === "loading" && (
          <div className="search-state">Searching cricket data…</div>
        )}
        {status === "error" && (
          <div className="search-state">
            Search is unavailable while the local API is offline.
          </div>
        )}
        {status === "ready" && total === 0 && (
          <div className="search-state">No results for “{query}”.</div>
        )}
        {status === "ready" &&
          groups
            .filter(([, items]) => items.length)
            .map(([name, items, open, label]) => (
              <div className="search-group" key={name}>
                <h2>{name}</h2>
                {items.slice(0, 5).map((item) => (
                  <button onClick={() => open(item)} key={item.id}>
                    {label(item)}
                    <span>Open →</span>
                  </button>
                ))}
              </div>
            ))}
      </section>
    </main>
  );
}
function Home({ go, select, savedMatchIds, toggleSavedMatch }) {
  const [matches, setMatches] = useState(preview);
  useEffect(() => {
    getMatches()
      .then(async (data) => {
        const labels = [
          "SCHEDULED",
          "LIVE",
          "COMPLETED",
          "CANCELLED",
          "ABANDONED",
        ];
        const items = await Promise.all(
          (data.items || []).slice(0, 3).map(async (item) => {
            const current =
              item.status === 1 ? await getCurrentInnings(item.id) : null;
            return {
              id: item.id,
              status: labels[item.status] || item.status,
              teams: `${item.homeTeam.name} vs ${item.awayTeam.name}`,
              score: current
                ? `${current.totalRuns}/${current.wickets}`
                : labels[item.status] || "Scheduled",
              overs: current
                ? `${current.overNumber}.${current.ballInOver} overs`
                : new Date(item.startsAt).toLocaleString(),
              format: item.format,
              tournamentName: item.tournamentName,
              venueName: item.venueName,
              startsAt: item.startsAt,
              oversLimit: item.oversLimit,
              notes: item.notes,
              eventSequence: current?.eventSequence || 0,
            };
          }),
        );
        if (items.length) setMatches(items);
      })
      .catch(() => {});
  }, []);
  useLiveMatchCards(matches, setMatches);
  const featured =
    matches.find((item) => item.status === "LIVE") || matches[0] || preview[0];
  return (
    <main>
      <section className="hero">
        <p>OSMANIA UNIVERSITY COLLEGE OF ENGINEERING</p>
        <h1>
          College sport,
          <br />
          <i>live and loud.</i>
        </h1>
        <span>
          The official home for OUCE cricket—live scores, student athletes,
          fixtures, results, and tournament stories.
        </span>
        <button className="cta" onClick={() => go("Matches")}>
          Explore live cricket →
        </button>
        <aside>
          <small>{featured.status}</small>
          <h2>
            {featured.teams} <b>{featured.score}</b>
          </h2>
          <p>{featured.overs}</p>
          <strong>
            {featured.status === "LIVE"
              ? "Live scoring feed connected"
              : "Open this match for details"}
          </strong>
          <button onClick={() => select(featured)}>Open match centre →</button>
        </aside>
      </section>
      <Cards
        matches={matches}
        select={select}
        savedMatchIds={savedMatchIds}
        toggleSavedMatch={toggleSavedMatch}
      />
      <TournamentSpotlight go={go} />
    </main>
  );
}
function TournamentSpotlight({ go }) {
  const [tournament, setTournament] = useState(undefined);
  const [standings, setStandings] = useState([]);
  useEffect(() => {
    getCatalog("tournaments")
      .then((data) => {
        const item = (data.items || [])[0] || null;
        setTournament(item);
        if (item)
          return getTournamentStandings(item.id)
            .then(setStandings)
            .catch(() => setStandings([]));
      })
      .catch(() => setTournament(null));
  }, []);
  const formats = ["Test", "ODI", "T20", "T10"];
  return (
    <section className="spot">
      <div>
        <p>TOURNAMENT SPOTLIGHT</p>
        <h2>
          Where every
          <br />
          <i>run tells a story.</i>
        </h2>
        <button onClick={() => go("Tournaments")}>Explore tournaments →</button>
      </div>
      <div className="table">
        {tournament === undefined ? (
          <p>Loading tournament…</p>
        ) : tournament ? (
          <>
            <b>{tournament.name}</b>
            <small>
              {typeof tournament.format === "number"
                ? formats[tournament.format]
                : tournament.format}{" "}
              · {tournament.season}
            </small>
            {standings.some((team) => team.played) ? (
              <table className="standings">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>P</th>
                    <th>W</th>
                    <th>L</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team) => (
                    <tr key={team.teamId}>
                      <td>{team.shortName}</td>
                      <td>{team.played}</td>
                      <td>{team.won}</td>
                      <td>{team.lost}</td>
                      <td>
                        <b>{team.points}</b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : tournament.teams.length ? (
              tournament.teams.map((team, index) => (
                <p key={team.id}>
                  {String(index + 1).padStart(2, "0")} {team.name}
                  <strong>{team.shortName}</strong>
                </p>
              ))
            ) : (
              <p>No teams have been assigned yet.</p>
            )}
          </>
        ) : (
          <p>No tournament has been published yet.</p>
        )}
      </div>
    </section>
  );
}
function Matches({ select, savedMatchIds, toggleSavedMatch }) {
  const [items, setItems] = useState([]),
    [status, setStatus] = useState("loading"),
    [filter, setFilter] = useState("ALL");
  useEffect(() => {
    getMatches()
      .then(async (d) => {
        const labels = [
          "SCHEDULED",
          "LIVE",
          "COMPLETED",
          "CANCELLED",
          "ABANDONED",
        ];
        const matches = await Promise.all(
          (d.items || []).map(async (m) => {
            const current =
              m.status === 1 ? await getCurrentInnings(m.id) : null;
            return {
              id: m.id,
              status: labels[m.status] || m.status,
              teams: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
              score: current
                ? `${current.totalRuns}/${current.wickets}`
                : labels[m.status] || "Scheduled",
              overs: current
                ? `${current.overNumber}.${current.ballInOver} overs`
                : new Date(m.startsAt).toLocaleString(),
              format: m.format,
              tournamentName: m.tournamentName,
              venueName: m.venueName,
              startsAt: m.startsAt,
              oversLimit: m.oversLimit,
              notes: m.notes,
              eventSequence: current?.eventSequence || 0,
            };
          }),
        );
        setItems(matches);
        setStatus("ready");
      })
      .catch(() => {
        setItems(preview);
        setStatus("preview");
      });
  }, []);
  useLiveMatchCards(items, setItems);
  const visible =
    filter === "ALL"
      ? items
      : filter === "FOLLOWING"
        ? items.filter((item) => savedMatchIds.has(item.id))
        : items.filter((item) => item.status === filter);
  return (
    <main className="listing">
      <p>CRICKET CENTRE</p>
      <h1>Matches</h1>
      <label className="match-filter">
        Show matches
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="ALL">All matches</option>
          <option value="FOLLOWING">Following</option>
          <option value="LIVE">Live</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="ABANDONED">Abandoned</option>
        </select>
      </label>
      {status === "loading" && (
        <div className="state-card">Loading matches…</div>
      )}
      {status === "preview" && (
        <small className="notice">
          Local API unavailable — showing the design preview.
        </small>
      )}
      {status === "ready" && items.length === 0 && (
        <div className="state-card">No matches are scheduled yet.</div>
      )}
      {status === "ready" && items.length > 0 && !visible.length && (
        <div className="state-card">No matches match this filter.</div>
      )}
      {(status === "preview" || visible.length > 0) && (
        <Cards
          matches={visible}
          select={select}
          savedMatchIds={savedMatchIds}
          toggleSavedMatch={toggleSavedMatch}
        />
      )}
    </main>
  );
}
function useLiveMatchCards(items, setItems) {
  const liveMatchIds = items
    .filter((item) => item.status === "LIVE")
    .map((item) => item.id)
    .join(",");
  useEffect(() => {
    if (!liveMatchIds) return;
    const stop = liveMatchIds
      .split(",")
      .map((matchId) =>
        subscribeToMatch(matchId, {
          onScore: (event) =>
            setItems((current) =>
              current.map((item) =>
                item.id === matchId &&
                event.eventSequence > (item.eventSequence || 0)
                  ? {
                      ...item,
                      score: `${event.totalRuns}/${event.wickets}`,
                      overs: `${event.overNumber}.${event.ballInOver} overs`,
                      eventSequence: event.eventSequence,
                    }
                  : item,
              ),
            ),
          onMatchCompleted: () =>
            setItems((current) =>
              current.map((item) =>
                item.id === matchId
                  ? { ...item, status: "COMPLETED", score: "Completed" }
                  : item,
              ),
            ),
        }),
      );
    return () => stop.forEach((close) => close());
  }, [liveMatchIds, setItems]);
}
function Cards({ matches, select, savedMatchIds, toggleSavedMatch }) {
  return (
    <section className="match-section">
      <p>ON THE PITCH</p>
      <h2>Matches that matter</h2>
      <div className="cards">
        {matches.map((m) => (
          <article className="match-card" key={m.id}>
            <button className="match-card-main" onClick={() => select(m)}>
              <small>{m.status}</small>
              <h3>{m.teams}</h3>
              <b>{m.score}</b>
              <p>{m.overs}</p>
              <span>Open match centre →</span>
            </button>
            <button
              className={`save-match ${savedMatchIds?.has(m.id) ? "saved" : ""}`}
              onClick={() => toggleSavedMatch?.(m.id)}
              aria-label={`${savedMatchIds?.has(m.id) ? "Stop following" : "Follow"} ${m.teams}`}
            >
              {savedMatchIds?.has(m.id) ? "★ Following" : "☆ Follow"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
function News({ select }) {
  const [articles, setArticles] = useState([]),
    [status, setStatus] = useState("loading");
  useEffect(() => {
    getNews()
      .then((data) => {
        setArticles(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);
  return (
    <main className="listing">
      <p>CRICKET STORIES</p>
      <h1>News</h1>
      {status === "loading" && (
        <div className="state-card">Loading stories…</div>
      )}
      {status === "error" && (
        <div className="state-card">
          News is unavailable while the local API is offline.
        </div>
      )}
      {status === "ready" && articles.length === 0 && (
        <div className="state-card">No stories have been published yet.</div>
      )}
      {articles.length > 0 && (
        <div className="news-grid">
          {articles.map((article) => (
            <button
              className="news-card news-button"
              onClick={() => select(article.slug)}
              key={article.id}
            >
              {article.imageUrl && <img className="news-card-image" src={article.imageUrl} alt="" loading="lazy" />}
              <small>
                {new Date(article.publishedAt).toLocaleDateString()}
              </small>
              <h2>{article.title}</h2>
              <p>{article.summary}</p>
              <b>{article.isFeatured ? "FEATURED · " : ""}Read story →</b>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
function Listing({ title }) {
  return (
    <main className="listing">
      <p>CRICKET CENTRE</p>
      <h1>{title}</h1>
      <div>
        This public module is ready to connect to the Cricket Sports API.
      </div>
    </main>
  );
}
function Centre({ match, back }) {
  const [tab, setTab] = useState("Live");
  const [state, setState] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [events, setEvents] = useState([]);
  const [completed, setCompleted] = useState(match.status === "COMPLETED");
  const [connection, setConnection] = useState("connecting");
  const [shareMessage, setShareMessage] = useState("");
  const sequence = useRef(-1);
  const show = (text) => {
    setCelebration(text);
    window.setTimeout(() => setCelebration(null), 1450);
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMessage("Match link copied.");
    } catch {
      setShareMessage("Copy this link from your browser address bar.");
    }
    window.setTimeout(() => setShareMessage(""), 2500);
  };
  const addEvent = (event) => {
    const label = event.isWicket
      ? "WICKET"
      : event.runsOffBat === 6
        ? "SIX"
        : event.runsOffBat === 4
          ? "FOUR"
          : event.extraRuns
            ? `EXTRA +${event.extraRuns}`
            : `${event.runsOffBat} RUN${event.runsOffBat === 1 ? "" : "S"}`;
    const detail = `Over ${event.state.overNumber}.${event.state.ballInOver} · Score ${event.state.totalRuns}/${event.state.wickets}`;
    setEvents((items) =>
      [
        {
          id: event.state.eventSequence,
          label,
          detail,
          tone: event.isWicket
            ? "wicket"
            : event.runsOffBat === 4
              ? "four"
              : event.runsOffBat === 6
                ? "six"
                : "",
        },
        ...items.filter((item) => item.id !== event.state.eventSequence),
      ].slice(0, 8),
    );
  };
  useEffect(() => {
    sequence.current = -1;
    setEvents([]);
    setConnection("connecting");
    getCurrentInnings(match.id).then((current) => {
      if (current) {
        sequence.current = current.eventSequence;
        setState(current);
        setCompleted(current.isMatchComplete);
      }
    });
    return subscribeToMatch(match.id, {
      onScore: (event) => {
        if (event.eventSequence > sequence.current) {
          sequence.current = event.eventSequence;
          setState(event);
          setCompleted(event.isMatchComplete);
        }
      },
      onDelivery: (event) => {
        if (event.state.eventSequence > sequence.current) {
          sequence.current = event.eventSequence;
          setState(event.state);
          setCompleted(event.state.isMatchComplete);
          addEvent(event);
          if (event.isWicket) show("WICKET!");
          else if (event.runsOffBat === 6) show("SIX!");
          else if (event.runsOffBat === 4) show("FOUR!");
        }
      },
      onMatchCompleted: () => {
        setCompleted(true);
        show("MATCH COMPLETE");
      },
      onConnection: setConnection,
    });
  }, [match.id]);
  const runs = state?.totalRuns;
  const wickets = state?.wickets;
  const overs = state ? `${state.overNumber}.${state.ballInOver}` : "—";
  const version = state?.eventSequence || 0;
  const connectionLabel =
    connection === "live"
      ? "Live updates connected"
      : connection === "connecting"
        ? "Connecting live updates…"
        : "Live updates offline";
  return (
    <main className="centre">
      {celebration && (
        <div
          className={`event-overlay ${celebration === "WICKET!" ? "wicket-event" : ""}`}
        >
            <span>{celebration}</span>
            <small>OUCE LIVE CRICKET</small>
        </div>
      )}
      <button className="back no-print" onClick={back}>
        ← All matches
      </button>
      <section className="scoreboard">
        <small>
          {completed
            ? "MATCH COMPLETE"
            : state
              ? "LIVE · CURRENT INNINGS"
              : "MATCH CENTRE"}
        </small>
        <h1>{match.teams}</h1>
        <div className="score-line">
          <span>Score</span>
          <strong>{state ? `${runs}/${wickets}` : "—"}</strong>
          <span>{overs} overs</span>
        </div>
        <p>
          {state
            ? "Live score supplied by the scoring engine."
            : "No active innings is being scored yet."}
        </p>
        <small className={`live-sync ${connection}`}>
          {connectionLabel}
          {state && ` · event #${state.eventSequence}`}
        </small>
        <div className="match-tools no-print">
          <button className="share-match" onClick={copyLink}>
            Copy match link
          </button>
        </div>
        {shareMessage && (
          <small className="share-message no-print">{shareMessage}</small>
        )}
      </section>
      {completed && <ResultSummary matchId={match.id} />}
      <div className="tabs no-print">
        {["Live", "Scorecard", "Commentary", "Statistics", "Info"].map((x) => (
          <button
            className={tab === x ? "selected" : ""}
            onClick={() => setTab(x)}
            key={x}
          >
            {x}
          </button>
        ))}
      </div>
      {tab === "Live" ? (
        <Live matchId={match.id} state={state} events={events} />
      ) : tab === "Scorecard" ? (
        <Scorecard matchId={match.id} version={version} />
      ) : tab === "Commentary" ? (
        <Commentary matchId={match.id} version={version} />
      ) : tab === "Statistics" ? (
        <Stats matchId={match.id} version={version} />
      ) : (
        <Info match={match} />
      )}
    </main>
  );
}
function ResultSummary({ matchId }) {
  const [innings, setInnings] = useState(null);
  useEffect(() => {
    getScorecard(matchId)
      .then(setInnings)
      .catch(() => setInnings([]));
  }, [matchId]);
  if (innings === null) return null;
  if (innings.length < 2)
    return <div className="result-summary">Match completed.</div>;
  const [first, second] = innings;
  const batting = innings.flatMap((item) => item.batting || []);
  const bowling = innings.flatMap((item) => item.bowling || []);
  const topBatter = batting.reduce(
    (best, player) => (!best || player.runs > best.runs ? player : best),
    null,
  );
  const topBowler = bowling.reduce(
    (best, player) =>
      !best ||
      player.wickets > best.wickets ||
      (player.wickets === best.wickets &&
        player.runsConceded < best.runsConceded)
        ? player
        : best,
    null,
  );
  const result =
    second.totalRuns > first.totalRuns
      ? `${second.battingTeamName} won by ${10 - second.wickets} wicket${10 - second.wickets === 1 ? "" : "s"}`
      : first.totalRuns > second.totalRuns
        ? `${first.battingTeamName} won by ${first.totalRuns - second.totalRuns} run${first.totalRuns - second.totalRuns === 1 ? "" : "s"}`
        : "Match tied";
  return (
    <div className="result-summary">
      <b>{result}</b>
      {(topBatter || topBowler) && (
        <div className="result-performers">
          {topBatter && (
            <span>
              <small>TOP BATTER</small>
              {topBatter.playerName} · {topBatter.runs} runs
            </span>
          )}
          {topBowler && (
            <span>
              <small>TOP BOWLER</small>
              {topBowler.playerName} · {topBowler.wickets}/
              {topBowler.runsConceded}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
function Live({ matchId, state, events }) {
  const [players, setPlayers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  useEffect(() => {
    getCatalog("players")
      .then((data) => setPlayers(data.items || []))
      .catch(() => {});
    getCommentary(matchId)
      .then(setDeliveries)
      .catch(() => {});
  }, [matchId, state?.eventSequence]);
  if (!state)
    return (
      <section className="panel">
        <p>No active innings is being scored yet.</p>
      </section>
    );
  const name = (id) =>
    players.find((player) => player.id === id)?.fullName || "Loading player…";
  const recent = deliveries.slice(0, 6).reverse();
  const ball = (item) =>
    item.isWicket ? "W" : item.extraType !== 0 ? "E" : String(item.runsOffBat);
  return (
    <section className="panel">
      <LiveEventFeed events={events} />
      <div className="current">
        <article>
          <small>STRIKER</small>
          <h2>{name(state.strikerId)}</h2>
          <p>Currently at the crease</p>
        </article>
        <article>
          <small>NON-STRIKER</small>
          <h2>{name(state.nonStrikerId)}</h2>
          <p>Currently at the crease</p>
        </article>
        <article>
          <small>BOWLER</small>
          <h2>{name(state.bowlerId)}</h2>
          <p>Current bowler</p>
        </article>
      </div>
      <h3>Recent balls</h3>
      {recent.length ? (
        <div className="balls">
          {recent.map((item, index) => (
            <b
              className={
                item.isWicket
                  ? "wicket"
                  : item.runsOffBat === 4
                    ? "four"
                    : item.runsOffBat === 6
                      ? "six"
                      : ""
              }
              key={index}
            >
              {ball(item)}
            </b>
          ))}
        </div>
      ) : (
        <p>No deliveries recorded yet.</p>
      )}
    </section>
  );
}
function LiveEventFeed({ events }) {
  return (
    <section className="live-event-feed">
      <div>
        <small>LIVE EVENT FEED</small>
        <h2>Just happened</h2>
      </div>
      {events.length ? (
        <ol>
          {events.map((event) => (
            <li key={event.id}>
              <b className={event.tone}>{event.label}</b>
              <span>{event.detail}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p>New scoring events will appear here without refreshing the page.</p>
      )}
    </section>
  );
}
function Scorecard({ matchId, version }) {
  const [innings, setInnings] = useState([]);
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    getScorecard(matchId)
      .then((data) => {
        setInnings(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [matchId, version]);
  if (status === "loading")
    return (
      <section className="panel">
        <p>Loading scorecard…</p>
      </section>
    );
  if (status === "error")
    return (
      <section className="panel">
        <p>Scorecard is unavailable.</p>
      </section>
    );
  if (!innings.length)
    return (
      <section className="panel">
        <p>No innings has been scored yet.</p>
      </section>
    );
  return (
    <section className="panel">
      {innings.map((innings) => (
        <div className="innings-card" key={innings.number}>
          <h2>
            {innings.battingTeamName}{" "}
            <b>
              {innings.totalRuns}/{innings.wickets}
            </b>
          </h2>
          <p>
            {Math.floor(innings.legalBalls / 6)}.{innings.legalBalls % 6} overs
            · Extras {innings.extras} ·{" "}
            {innings.isComplete ? "Completed" : "Live"}
          </p>
          <table>
            <thead>
              <tr>
                <th>Batting</th>
                <th>Status</th>
                <th>R</th>
                <th>B</th>
                <th>4s</th>
                <th>6s</th>
              </tr>
            </thead>
            <tbody>
              {innings.batting.map((player) => (
                <tr key={player.playerName}>
                  <td>{player.playerName}</td>
                  <td>{player.isOut ? "Out" : "Not out"}</td>
                  <td>{player.runs}</td>
                  <td>{player.balls}</td>
                  <td>{player.fours}</td>
                  <td>{player.sixes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Bowling</h3>
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>O</th>
                <th>R</th>
                <th>W</th>
              </tr>
            </thead>
            <tbody>
              {innings.bowling.map((player) => (
                <tr key={player.playerName}>
                  <td>{player.playerName}</td>
                  <td>
                    {Math.floor(player.legalBalls / 6)}.{player.legalBalls % 6}
                  </td>
                  <td>{player.runsConceded}</td>
                  <td>{player.wickets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}
function Commentary({ matchId, version }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    getCommentary(matchId)
      .then((data) => {
        setItems(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [matchId, version]);
  if (status === "loading")
    return (
      <section className="panel">
        <p>Loading commentary…</p>
      </section>
    );
  if (status === "error")
    return (
      <section className="panel">
        <p>Commentary is unavailable.</p>
      </section>
    );
  if (!items.length)
    return (
      <section className="panel">
        <p>No deliveries have been recorded yet.</p>
      </section>
    );
  return (
    <section className="panel commentary">
      {items.map((item, index) => {
        const label = item.isWicket
          ? "WICKET"
          : item.runsOffBat === 6
            ? "SIX"
            : item.runsOffBat === 4
              ? "FOUR"
              : item.extraType !== 0
                ? "EXTRA"
                : `${item.runsOffBat} RUN${item.runsOffBat === 1 ? "" : "S"}`;
        return (
          <article key={`${item.inningsNumber}-${index}`}>
            <b>
              {item.overNumber}.{item.ballNumber}
            </b>
            <div>
              <strong>{label}</strong>
              <p>
                {item.commentary ||
                  `Innings ${item.inningsNumber}: ${label.toLowerCase()}.`}
              </p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
function Stats({ matchId, version }) {
  const [innings, setInnings] = useState([]);
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    getScorecard(matchId)
      .then((data) => {
        setInnings(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [matchId, version]);
  if (status === "loading")
    return (
      <section className="panel">
        <p>Loading statistics…</p>
      </section>
    );
  if (status === "error")
    return (
      <section className="panel">
        <p>Statistics are unavailable.</p>
      </section>
    );
  if (!innings.length)
    return (
      <section className="panel">
        <p>No innings has been scored yet.</p>
      </section>
    );
  return (
    <section className="panel stats">
      <h2>Match statistics</h2>
      <div className="stat-grid">
        {innings.map((item) => {
          const fours = item.batting.reduce(
            (total, player) => total + player.fours,
            0,
          );
          const sixes = item.batting.reduce(
            (total, player) => total + player.sixes,
            0,
          );
          const rate = item.legalBalls
            ? (item.totalRuns / (item.legalBalls / 6)).toFixed(2)
            : "0.00";
          return (
            <article key={item.number}>
              <h3>{item.battingTeamName}</h3>
              <p>
                <b>
                  {item.totalRuns}/{item.wickets}
                </b>{" "}
                in {Math.floor(item.legalBalls / 6)}.{item.legalBalls % 6} overs
              </p>
              <dl>
                <div>
                  <dt>Run rate</dt>
                  <dd>{rate}</dd>
                </div>
                <div>
                  <dt>Fours</dt>
                  <dd>{fours}</dd>
                </div>
                <div>
                  <dt>Sixes</dt>
                  <dd>{sixes}</dd>
                </div>
                <div>
                  <dt>Extras</dt>
                  <dd>{item.extras}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}
function Info({ match }) {
  const formats = ["Test", "ODI", "T20", "T10"];
  const status =
    typeof match.status === "number"
      ? ["Scheduled", "Live", "Completed", "Cancelled", "Abandoned"][
          match.status
        ]
      : match.status;
  return (
    <section className="panel info">
      <h2>Match information</h2>
      <p>
        <b>Format</b>
        <span>
          {typeof match.format === "number"
            ? formats[match.format]
            : match.format || "Not set"}
        </span>
      </p>
      <p>
        <b>Status</b>
        <span>{status || "Not set"}</span>
      </p>
      <p>
        <b>Tournament</b>
        <span>{match.tournamentName || "Not set"}</span>
      </p>
      <p>
        <b>Venue</b>
        <span>{match.venueName || "Not set"}</span>
      </p>
      <p>
        <b>Start time</b>
        <span>
          {match.startsAt
            ? new Date(match.startsAt).toLocaleString()
            : "Not set"}
        </span>
      </p>
      <p>
        <b>Overs limit</b>
        <span>{match.oversLimit || "Not set"}</span>
      </p>
      {match.notes && (
        <p>
          <b>Notes</b>
          <span>{match.notes}</span>
        </p>
      )}
      <HeadToHead match={match} />
    </section>
  );
}
function HeadToHead({ match }) {
  const [record, setRecord] = useState(null);
  useEffect(() => {
    if (!match.homeTeam?.id || !match.awayTeam?.id) {
      setRecord({ total: 0, homeWins: 0, awayWins: 0, ties: 0 });
      return;
    }
    getMatches()
      .then(async (data) => {
        const meetings = (data.items || []).filter(
          (item) =>
            item.id !== match.id &&
            item.status === 2 &&
            ((item.homeTeam.id === match.homeTeam.id &&
              item.awayTeam.id === match.awayTeam.id) ||
              (item.homeTeam.id === match.awayTeam.id &&
                item.awayTeam.id === match.homeTeam.id)),
        );
        const cards = await Promise.all(
          meetings.map(async (item) => ({
            innings: await getScorecard(item.id).catch(() => []),
          })),
        );
        const result = cards.reduce(
          (totals, { innings }) => {
            if (innings.length < 2) return totals;
            const [first, second] = innings;
            if (first.totalRuns === second.totalRuns) {
              totals.ties++;
              return totals;
            }
            const winnerName = (
              first.totalRuns > second.totalRuns ? first : second
            ).battingTeamName;
            if (winnerName === match.homeTeam.name) totals.homeWins++;
            else if (winnerName === match.awayTeam.name) totals.awayWins++;
            return totals;
          },
          { total: meetings.length, homeWins: 0, awayWins: 0, ties: 0 },
        );
        setRecord(result);
      })
      .catch(() => setRecord({ total: 0, homeWins: 0, awayWins: 0, ties: 0 }));
  }, [match.id, match.homeTeam?.id, match.awayTeam?.id]);
  if (record === null)
    return (
      <section className="head-to-head">
        <small>HEAD TO HEAD</small>
        <p>Loading previous meetings…</p>
      </section>
    );
  return (
    <section className="head-to-head">
      <small>HEAD TO HEAD</small>
      <h2>Previous meetings</h2>
      {record.total ? (
        <>
          <div>
            <article>
              <b>{record.homeWins}</b>
              <span>{match.homeTeam.name}</span>
            </article>
            <strong>{record.total}</strong>
            <article>
              <b>{record.awayWins}</b>
              <span>{match.awayTeam.name}</span>
            </article>
          </div>
          <p>
            {record.total} completed meeting{record.total === 1 ? "" : "s"}{" "}
            recorded in this app{record.ties ? ` · ${record.ties} tied` : ""}.
          </p>
        </>
      ) : (
        <p>No previous completed meetings are recorded yet.</p>
      )}
    </section>
  );
}
function AdminDashboard({ close }) {
  const [session, setSession] = useState(() => getValidSession());
  const [area, setArea] = useState("Overview");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!session) return;
    const delay = new Date(session.expiresAt).getTime() - Date.now();
    if (delay <= 0) {
      clearSession();
      setSession(null);
      setError("Your staff session has expired. Sign in again.");
      return;
    }
    const timer = window.setTimeout(() => {
      clearSession();
      setSession(null);
      setError("Your staff session has expired. Sign in again.");
    }, delay);
    return () => window.clearTimeout(timer);
  }, [session]);
  const signIn = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const result = await login(f.get("email"), f.get("password"));
      saveSession(result);
      setSession(result);
      setError("");
    } catch {
      setError("Unable to sign in. Check the API, database, and account.");
    }
  };
  if (!session)
    return (
      <main className="admin-login">
        <button className="back" onClick={close}>
          ← Back to site
        </button>
        <form onSubmit={signIn}>
          <p>ADMIN ACCESS</p>
          <h1>Control centre</h1>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" required />
          </label>
          {error && <small>{error}</small>}
          <button className="cta">Sign in →</button>
          <a className="text-button" href="?reset=request">
            Forgot password?
          </a>
          <span>Only Admin-role accounts can enter.</span>
        </form>
      </main>
    );
  if (!session.roles?.includes("Admin"))
    return (
      <main className="admin-login">
        <button className="back" onClick={close}>
          ← Back to site
        </button>
        <div className="denied">
          <p>ACCESS RESTRICTED</p>
          <h1>Admin role required</h1>
          <span>This account cannot manage cricket data.</span>
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
  const sections = [
    "Overview",
    "Teams",
    "Players",
    "Tournaments",
    "Venues",
    "Matches",
    "News",
    "Users",
    "Reports",
    "Audit log",
  ];
  return (
    <main className="admin">
      <aside>
        <b>● SPORTSMANIA ADMIN</b>
        {sections.map((x) => (
          <button
            className={area === x ? "active" : ""}
            onClick={() => setArea(x)}
            key={x}
          >
            {x}
          </button>
        ))}
        <button
          onClick={() => {
            clearSession();
            setSession(null);
          }}
        >
          Sign out
        </button>
      </aside>
      <section>
        <header>
          <div>
            <p>ADMIN DASHBOARD</p>
            <h1>{area}</h1>
          </div>
          <button className="login" onClick={close}>
            View site
          </button>
        </header>
        {area === "Overview" ? (
          <AdminOverview />
        ) : area === "Teams" ? (
          <AdminTeams session={session} />
        ) : area === "Players" ? (
          <AdminPlayers session={session} />
        ) : area === "Venues" ? (
          <AdminVenues session={session} />
        ) : area === "Tournaments" ? (
          <AdminTournaments session={session} />
        ) : area === "Matches" ? (
          <AdminMatches session={session} />
        ) : area === "News" ? (
          <AdminNews session={session} />
        ) : area === "Users" ? (
          <AdminUsers session={session} />
        ) : area === "Reports" ? (
          <AdminReports />
        ) : area === "Audit log" ? (
          <AdminAuditLog session={session} />
        ) : (
          <Management area={area} />
        )}
      </section>
    </main>
  );
}
function Overview() {
  return (
    <>
      <div className="admin-cards">
        {[
          ["Total matches", "24"],
          ["Live matches", "3"],
          ["Total players", "186"],
          ["Total teams", "16"],
          ["Tournaments", "4"],
        ].map((x) => (
          <article key={x[0]}>
            <small>{x[0]}</small>
            <b>{x[1]}</b>
            <span>Updated from API</span>
          </article>
        ))}
      </div>
      <div className="admin-block">
        <h2>Today’s activity</h2>
        <p>
          Manage catalogue data through the protected APIs. Destructive actions
          should be confirmed before submission.
        </p>
      </div>
    </>
  );
}
function Management({ area }) {
  return (
    <div className="admin-block">
      <div className="manage-head">
        <h2>Manage {area}</h2>
        <button className="cta">+ Add {area.slice(0, -1)}</button>
      </div>
      <input placeholder={`Search ${area.toLowerCase()}…`} />
      <div className="admin-empty">
        <b>{area} management</b>
        <p>
          This authorized view is ready to connect to the protected CRUD
          endpoint.
        </p>
      </div>
    </div>
  );
}
