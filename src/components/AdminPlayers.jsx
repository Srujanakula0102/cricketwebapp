import { useEffect, useState } from "react";
import { getAdminTeams } from "../api/adminTeams";
import {
  createPlayer,
  deletePlayer,
  getAdminPlayers,
  updatePlayer,
} from "../api/adminPlayers";
import { uploadImage } from "../api/uploads";

const roles = ["Batter", "Bowler", "All-rounder", "Wicketkeeper"];
const emptyPlayer = {
  fullName: "",
  teamId: "",
  role: 0,
  countryOrRegion: "",
  profileImageUrl: "",
  battingStyle: "",
  bowlingStyle: "",
  dateOfBirth: "",
};

export default function AdminPlayers({ session }) {
  const [items, setItems] = useState([]);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const load = () => {
    setStatus("loading");
    Promise.all([getAdminPlayers(search), getAdminTeams()])
      .then(([players, teamData]) => {
        setItems(players.items || []);
        setTeams(teamData.items || []);
        setStatus("ready");
      })
      .catch((error) => {
        setMessage(error.message);
        setStatus("error");
      });
  };
  useEffect(() => {
    const delay = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(delay);
  }, [search]);
  const save = async (event) => {
    event.preventDefault();
    setStatus("saving");
    setMessage("");
    const payload = {
      ...form,
      role: Number(form.role),
      teamId: form.teamId || null,
      countryOrRegion: form.countryOrRegion.trim() || null,
      profileImageUrl: form.profileImageUrl.trim() || null,
      battingStyle: form.battingStyle.trim() || null,
      bowlingStyle: form.bowlingStyle.trim() || null,
      dateOfBirth: form.dateOfBirth || null,
    };
    try {
      form.id
        ? await updatePlayer(form.id, payload, session.accessToken)
        : await createPlayer(payload, session.accessToken);
      setForm(null);
      setMessage(form.id ? "Player updated." : "Player added.");
      load();
    } catch (error) {
      setMessage(error.message);
      setStatus("ready");
    }
  };
  const upload = async (file) => {
    if (!file) return;
    try {
      setMessage("Uploading image…");
      const profileImageUrl = await uploadImage(file, session.accessToken);
      setForm((current) => ({ ...current, profileImageUrl }));
      setMessage("Image uploaded. Save the player to keep it.");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const remove = async (player) => {
    if (!window.confirm(`Delete ${player.fullName}? This cannot be undone.`))
      return;
    try {
      await deletePlayer(player.id, session.accessToken);
      setMessage("Player deleted.");
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };
  return (
    <div className="admin-block">
      <div className="manage-head">
        <h2>Manage Players</h2>
        <button
          className="cta"
          onClick={() => {
            setMessage("");
            setForm({ ...emptyPlayer });
          }}
        >
          + Add Player
        </button>
      </div>
      {message && <p className="admin-message">{message}</p>}
      {form && (
        <form className="admin-form" onSubmit={save}>
          <h3>{form.id ? "Edit player" : "Add player"}</h3>
          <label>
            Full name
            <input
              value={form.fullName}
              onChange={(event) =>
                setForm({ ...form, fullName: event.target.value })
              }
              required
            />
          </label>
          <label>
            Role
            <select
              value={form.role}
              onChange={(event) =>
                setForm({ ...form, role: event.target.value })
              }
            >
              {roles.map((role, index) => (
                <option value={index} key={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label>
            Team
            <select
              value={form.teamId || ""}
              onChange={(event) =>
                setForm({ ...form, teamId: event.target.value })
              }
            >
              <option value="">No team assigned</option>
              {teams.map((team) => (
                <option value={team.id} key={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Country or region
            <input
              value={form.countryOrRegion || ""}
              onChange={(event) =>
                setForm({ ...form, countryOrRegion: event.target.value })
              }
            />
          </label>
          <label>
            Batting style
            <input
              value={form.battingStyle || ""}
              placeholder="e.g. Right-hand bat"
              onChange={(event) =>
                setForm({ ...form, battingStyle: event.target.value })
              }
            />
          </label>
          <label>
            Bowling style
            <input
              value={form.bowlingStyle || ""}
              placeholder="e.g. Right-arm fast"
              onChange={(event) =>
                setForm({ ...form, bowlingStyle: event.target.value })
              }
            />
          </label>
          <label>
            Date of birth
            <input
              type="date"
              value={form.dateOfBirth || ""}
              onChange={(event) =>
                setForm({ ...form, dateOfBirth: event.target.value })
              }
            />
          </label>
          <label>
            Upload profile image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => upload(event.target.files?.[0])}
            />
          </label>
          <label>
            Profile image address (optional)
            <input
              type="url"
              value={form.profileImageUrl || ""}
              onChange={(event) =>
                setForm({ ...form, profileImageUrl: event.target.value })
              }
            />
          </label>
          {form.profileImageUrl && (
            <img
              className="image-preview"
              src={form.profileImageUrl}
              alt="Player profile preview"
            />
          )}
          <div>
            <button className="cta" disabled={status === "saving"}>
              {status === "saving" ? "Saving…" : "Save player"}
            </button>
            <button type="button" onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search players…"
      />
      {status === "loading" && (
        <div className="admin-empty">Loading players…</div>
      )}
      {status === "error" && (
        <div className="admin-empty">Players could not be loaded.</div>
      )}
      {status === "ready" && !items.length && (
        <div className="admin-empty">
          No players yet. Add the first one above.
        </div>
      )}
      {items.length > 0 && (
        <div className="admin-list">
          {items.map((player) => (
            <article key={player.id}>
              <div>
                <b>{player.fullName}</b>
                <span>
                  {roles[player.role] || player.role} ·{" "}
                  {player.teamName || "No team assigned"} ·{" "}
                  {player.countryOrRegion || "Region not listed"}
                </span>
              </div>
              <div>
                <button
                  onClick={() => {
                    setMessage("");
                    setForm({
                      ...player,
                      teamId: player.teamId || "",
                      profileImageUrl: player.profileImageUrl || "",
                      countryOrRegion: player.countryOrRegion || "",
                      battingStyle: player.battingStyle || "",
                      bowlingStyle: player.bowlingStyle || "",
                      dateOfBirth: player.dateOfBirth || "",
                    });
                  }}
                >
                  Edit
                </button>
                <button
                  className="delete-button"
                  onClick={() => remove(player)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
