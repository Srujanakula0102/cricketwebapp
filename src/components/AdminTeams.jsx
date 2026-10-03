import { useEffect, useState } from "react";
import {
  createTeam,
  deleteTeam,
  getAdminTeams,
  updateTeam,
} from "../api/adminTeams";
import { uploadImage } from "../api/uploads";

const emptyTeam = {
  name: "",
  shortName: "",
  countryOrRegion: "",
  logoUrl: "",
  isActive: true,
};

export default function AdminTeams({ session }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const load = () => {
    setStatus("loading");
    getAdminTeams(search)
      .then((data) => {
        setItems(data.items || []);
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
    const payload = { ...form, logoUrl: form.logoUrl.trim() || null };
    try {
      form.id
        ? await updateTeam(form.id, payload, session.accessToken)
        : await createTeam(payload, session.accessToken);
      setForm(null);
      setMessage(form.id ? "Team updated." : "Team added.");
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
      const logoUrl = await uploadImage(file, session.accessToken, "teams");
      setForm((current) => ({ ...current, logoUrl }));
      setMessage("Image uploaded. Save the team to keep it.");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const remove = async (team) => {
    if (!window.confirm(`Delete ${team.name}? This cannot be undone.`)) return;
    setMessage("");
    try {
      await deleteTeam(team.id, session.accessToken);
      setMessage("Team deleted.");
      load();
    } catch (error) {
      setMessage(error.message);
    }
  };
  return (
    <div className="admin-block">
      <div className="manage-head">
        <h2>Manage Teams</h2>
        <button
          className="cta"
          onClick={() => {
            setMessage("");
            setForm({ ...emptyTeam });
          }}
        >
          + Add Team
        </button>
      </div>
      {message && <p className="admin-message">{message}</p>}
      {form && (
        <form className="admin-form" onSubmit={save}>
          <h3>{form.id ? "Edit team" : "Add team"}</h3>
          <label>
            Team name
            <input
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              required
            />
          </label>
          <label>
            Short name
            <input
              value={form.shortName}
              maxLength="12"
              onChange={(event) =>
                setForm({
                  ...form,
                  shortName: event.target.value.toUpperCase(),
                })
              }
              required
            />
          </label>
          <label>
            Country or region
            <input
              value={form.countryOrRegion}
              onChange={(event) =>
                setForm({ ...form, countryOrRegion: event.target.value })
              }
              required
            />
          </label>
          <label>
            Upload team logo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => upload(event.target.files?.[0])}
            />
          </label>
          <label>
            Logo image address (optional)
            <input
              type="url"
              value={form.logoUrl || ""}
              onChange={(event) =>
                setForm({ ...form, logoUrl: event.target.value })
              }
            />
          </label>
          {form.logoUrl && (
            <img
              className="image-preview"
              src={form.logoUrl}
              alt="Team logo preview"
            />
          )}
          <label className="check-label">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm({ ...form, isActive: event.target.checked })
              }
            />{" "}
            Active squad
          </label>
          <div>
            <button className="cta" disabled={status === "saving"}>
              {status === "saving" ? "Saving…" : "Save team"}
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
        placeholder="Search teams…"
      />
      {status === "loading" && (
        <div className="admin-empty">Loading teams…</div>
      )}
      {status === "error" && (
        <div className="admin-empty">Teams could not be loaded.</div>
      )}
      {status === "ready" && !items.length && (
        <div className="admin-empty">
          No teams yet. Add the first one above.
        </div>
      )}
      {items.length > 0 && (
        <div className="admin-list">
          {items.map((team) => (
            <article key={team.id}>
              <div>
                <b>{team.name}</b>
                <span>
                  {team.shortName} · {team.countryOrRegion} ·{" "}
                  {team.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div>
                <button
                  onClick={() => {
                    setMessage("");
                    setForm({ ...team, logoUrl: team.logoUrl || "" });
                  }}
                >
                  Edit
                </button>
                <button className="delete-button" onClick={() => remove(team)}>
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
