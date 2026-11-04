import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  OrinClient,
  type Actor,
  type CampusEvent,
  type Registration,
  type Certificate,
  type Notice,
  type Review,
} from "../../../packages/contracts/src/index.ts";
import "./style.css";
import QRCode from "qrcode";
function PassQR({ value }: { value: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    void QRCode.toDataURL(value, { width: 220, margin: 2 }).then(setSrc);
  }, [value]);
  return src ? (
    <img src={src} width={220} height={220} alt="Event attendance QR pass" />
  ) : null;
}
const api = new OrinClient("");
type College = { id: string; name: string; city: string };
function App() {
  const [actor, setActor] = useState<Actor | null>(null),
    [page, setPage] = useState("Explore"),
    [events, setEvents] = useState<CampusEvent[]>([]),
    [regs, setRegs] = useState<Registration[]>([]),
    [certs, setCerts] = useState<Certificate[]>([]),
    [notes, setNotes] = useState<Notice[]>([]),
    [reviews, setReviews] = useState<Review[]>([]),
    [colleges, setColleges] = useState<College[]>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [scope, setScope] = useState("all"),
    [selected, setSelected] = useState<CampusEvent | null>(null),
    [participants, setParticipants] = useState<any[]>([]),
    [updates, setUpdates] = useState<any[]>([]),
    [signup, setSignup] = useState(false);
  const host = !!actor?.roles.length;
  async function refresh() {
    const data = await api.request<{ items: CampusEvent[] }>(
      `/v1/events?scope=${scope}&search=${encodeURIComponent(search)}`,
    );
    setEvents(data.items);
    setColleges(await api.request<College[]>("/v1/colleges"));
    if (api.token) {
      const a = await api.request<Actor>("/v1/me");
      setActor(a);
      setRegs(await api.request<Registration[]>("/v1/registrations"));
      setCerts(await api.request<Certificate[]>("/v1/certificates"));
      setNotes(await api.request<Notice[]>("/v1/notifications"));
      if (a.roles.some((r) => r.role !== "organizer"))
        setReviews(await api.request<Review[]>("/v1/reviews"));
    }
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void run(refresh);
    const onFocus = () => {
      void run(refresh);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [scope]);
  async function open(e: CampusEvent) {
    setSelected(await api.request<CampusEvent>(`/v1/events/${e.id}`));
    setUpdates(await api.request<any[]>(`/v1/events/${e.id}/updates`));
    if (
      actor &&
      (actor.id === e.organizer_id ||
        actor.roles.some(
          (r) =>
            r.role !== "organizer" &&
            (r.college_id === e.college_id || r.role === "platform_admin"),
        ))
    )
      setParticipants(
        await api.request<any[]>(`/v1/events/${e.id}/participants`),
      );
    else setParticipants([]);
  }
  const form = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    return new FormData(e.currentTarget);
  };
  async function login(data: FormData) {
    if (signup) {
      await api.request("/v1/auth/signup", "POST", {
        full_name: data.get("name"),
        email: data.get("email"),
        password: data.get("password"),
      });
      setMessage("Check your email for the verification token, then sign in.");
      setSignup(false);
      return;
    }
    const result = await api.request<{ token: string; actor: Actor }>(
      "/v1/auth/login",
      "POST",
      { email: data.get("email"), password: data.get("password") },
    );
    api.token = result.token;
    setActor(result.actor);
    setPage("Explore");
    await refresh();
  }
  return (
    <div className="shell">
      <aside>
        <a className="brand" href="#">
          orin<span>campus connections</span>
        </a>
        <nav>
          {[
            "Explore",
            "My events",
            "Recognition",
            "Updates",
            ...(host ? ["Organizer"] : []),
            ...(actor?.roles.some((r) => r.role !== "organizer")
              ? ["Approvals"]
              : []),
            "Account",
          ].map((p) => (
            <button
              className={page === p ? "active" : ""}
              key={p}
              onClick={() => {
                setPage(p);
                setSelected(null);
              }}
            >
              {p}
            </button>
          ))}
        </nav>
        <small>
          Discover locally.
          <br />
          Participate with confidence.
        </small>
      </aside>
      <main>
        <header>
          <span>YOUR CAMPUS. YOUR NEXT OPPORTUNITY.</span>
          <div>
            {actor?.full_name || "Welcome to Orin"}{" "}
            <button onClick={() => void run(refresh)} disabled={busy}>
              Refresh
            </button>
            {actor && (
              <button
                onClick={() =>
                  void run(async () => {
                    try {
                      await api.request("/v1/auth/logout", "POST");
                    } finally {
                      api.token = null;
                      setActor(null);
                      setRegs([]);
                      setNotes([]);
                      setCerts([]);
                      setReviews([]);
                      setSelected(null);
                      setPage("Explore");
                    }
                    await refresh();
                  })
                }
              >
                Sign out
              </button>
            )}
          </div>
        </header>
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        {busy && <p role="status">Working…</p>}
        {page === "Explore" && (
          <>
            <section className="hero">
              <p className="eyebrow">START SOMETHING WORTH SHOWING UP FOR</p>
              <h1>
                Find your people.
                <br />
                Make your next move.
              </h1>
              <p>
                Explore campus events, discover new interests and build a record
                of what you achieve.
              </p>
            </section>
            <form
              className="filters"
              onSubmit={(e) => {
                e.preventDefault();
                void run(refresh);
              }}
            >
              <input
                aria-label="Search events"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events and interests"
              />
              <select
                aria-label="Event scope"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
              >
                <option value="all">All accessible events</option>
                <option value="college">My college</option>
                <option value="partner">Partner colleges</option>
              </select>
              <button>Search</button>
            </form>
            <div className="grid">
              {events.map((e) => (
                <article key={e.id}>
                  <span className="tag">
                    {e.genre} · {e.visibility.replace("_", " ")}
                  </span>
                  <h2>{e.title}</h2>
                  <p>{e.description.slice(0, 160)}</p>
                  <p>
                    {new Date(e.starts_at).toLocaleString()}
                    <br />
                    {e.venue}
                  </p>
                  <button onClick={() => void run(() => open(e))}>
                    View event
                  </button>
                </article>
              ))}
            </div>
            {!events.length && <p>No events match this view yet.</p>}
          </>
        )}
        {page === "My events" && (
          <>
            <h1>Your registrations</h1>
            {!actor ? (
              <p>Sign in to see your registrations.</p>
            ) : (
              regs.map((r) => (
                <article key={r.id}>
                  <h2>{r.title}</h2>
                  <p>{r.status}</p>
                  {r.status === "registered" && (
                    <details>
                      <summary>Attendance pass</summary>
                      <PassQR value={r.qr_token!} />
                      <code>{r.qr_token}</code>
                      <p>Show this pass to the organizer. Keep it private.</p>
                    </details>
                  )}
                  <button
                    disabled={
                      busy || ["cancelled", "checked_in"].includes(r.status)
                    }
                    onClick={() =>
                      void run(async () => {
                        await api.request(
                          `/v1/events/${r.event_id}/cancel-registration`,
                          "POST",
                        );
                        await refresh();
                      })
                    }
                  >
                    Cancel registration
                  </button>
                </article>
              ))
            )}
          </>
        )}
        {page === "Recognition" && (
          <>
            <h1>Your recognition</h1>
            {certs.map((c) => (
              <article key={c.code}>
                <h2>{c.title}</h2>
                <p>
                  {c.full_name} · {c.award}
                </p>
                <p>
                  {c.revoked_at
                    ? "Revoked"
                    : "Issued " + new Date(c.issued_at).toLocaleDateString()}
                </p>
                <code>{c.code}</code>
              </article>
            ))}
            <form
              onSubmit={(e) => {
                const d = form(e);
                void run(async () => {
                  const c = await api.request<Certificate>(
                    "/v1/certificates/" + d.get("code"),
                  );
                  setMessage(
                    `${c.full_name} — ${c.title} — ${c.award}${c.revoked_at ? " (REVOKED)" : ""}`,
                  );
                });
              }}
            >
              <h2>Verify a certificate</h2>
              <input name="code" required placeholder="Verification code" />
              <button>Verify</button>
            </form>
          </>
        )}
        {page === "Updates" && (
          <>
            <h1>Your updates</h1>
            {notes.map((n) => (
              <article key={n.id}>
                <h2>{n.kind.replaceAll(".", " ")}</h2>
                <p>
                  {Object.entries(n.payload)
                    .map(([k, v]) => `${k}: ${String(v)}`)
                    .join(" · ")}
                </p>
                <button
                  disabled={!!n.read_at}
                  onClick={() =>
                    void run(async () => {
                      await api.request(
                        `/v1/notifications/${n.id}/read`,
                        "POST",
                      );
                      await refresh();
                    })
                  }
                >
                  {n.read_at ? "Read" : "Mark read"}
                </button>
              </article>
            ))}
          </>
        )}
        {page === "Account" && (
          <>
            <h1>{actor ? "Your account" : "Join your campus community"}</h1>
            {!actor ? (
              <>
                <form
                  onSubmit={(e) => {
                    const d = form(e);
                    void run(() => login(d));
                  }}
                >
                  {signup && (
                    <input name="name" required placeholder="Full name" />
                  )}
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Email address"
                  />
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={12}
                    placeholder="Password (12+ characters)"
                  />
                  <button disabled={busy}>
                    {signup ? "Create account" : "Sign in"}
                  </button>
                  <button type="button" onClick={() => setSignup(!signup)}>
                    {signup ? "Already have an account?" : "Create an account"}
                  </button>
                </form>
                <form
                  onSubmit={(e) => {
                    const d = form(e);
                    void run(async () => {
                      await api.request("/v1/auth/request-reset", "POST", {
                        email: d.get("email"),
                      });
                      setMessage(
                        "If the account exists, reset instructions will arrive.",
                      );
                    });
                  }}
                >
                  <h2>Forgot password?</h2>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Account email"
                  />
                  <button>Send reset instructions</button>
                </form>
              </>
            ) : (
              <>
                <article>
                  <h2>{actor.full_name}</h2>
                  <p>
                    Account reference: <code>{actor.id}</code>
                  </p>
                  <p>
                    {actor.email} ·{" "}
                    {actor.email_verified
                      ? "Email verified"
                      : "Email verification pending"}
                  </p>
                  <p>College affiliation: {actor.verification_status}</p>
                  <button
                    onClick={() =>
                      void run(async () => {
                        await api.request(
                          "/v1/auth/resend-verification",
                          "POST",
                        );
                        setMessage("Verification email requested.");
                      })
                    }
                  >
                    Resend verification
                  </button>
                </article>
                <form
                  onSubmit={(e) => {
                    const d = form(e);
                    void run(async () => {
                      await api.request("/v1/reviews", "POST", {
                        kind: d.get("kind"),
                        college_id: d.get("college"),
                        evidence: d.get("evidence"),
                      });
                      setMessage("Request submitted to your college reviewer.");
                    });
                  }}
                >
                  <h2>College and organizer access</h2>
                  <select name="kind">
                    <option value="college">Verify college affiliation</option>
                    <option value="organizer">Request organizer access</option>
                  </select>
                  <select name="college" required>
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <textarea
                    name="evidence"
                    required
                    minLength={10}
                    placeholder="Provide your department, student/staff reference and contact details for an administrator to verify independently. Do not enter passwords or sensitive ID numbers."
                  />
                  <button>Submit request</button>
                </form>
              </>
            )}
            <form
              onSubmit={(e) => {
                const d = form(e);
                void run(async () => {
                  await api.request("/v1/auth/verify-email", "POST", {
                    token: d.get("token"),
                  });
                  if (actor) await refresh();
                  setMessage("Email verified.");
                });
              }}
            >
              <h2>Confirm email</h2>
              <input
                name="token"
                required
                placeholder="Token from verification email"
              />
              <button>Confirm</button>
            </form>
            <form
              onSubmit={(e) => {
                const d = form(e);
                void run(async () => {
                  await api.request("/v1/auth/reset-password", "POST", {
                    token: d.get("token"),
                    password: d.get("password"),
                  });
                  api.token = null;
                  setActor(null);
                  setMessage("Password reset. Sign in again.");
                });
              }}
            >
              <h2>Reset password</h2>
              <input
                name="token"
                required
                placeholder="Reset token from email"
              />
              <input
                name="password"
                type="password"
                minLength={12}
                required
                placeholder="New password"
              />
              <button>Reset password</button>
            </form>
            {actor?.roles.some((r) => r.role === "platform_admin") && (
              <form
                onSubmit={(e) => {
                  const d = form(e);
                  void run(async () => {
                    await api.request("/v1/admin/grants", "POST", {
                      user_id: d.get("user_id"),
                      college_id: d.get("college_id"),
                      role: d.get("role"),
                    });
                    setMessage("Role granted");
                  });
                }}
              >
                <h2>Assign college authority</h2>
                <input
                  name="user_id"
                  required
                  placeholder="Verified account UUID"
                />
                <select name="college_id">
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select name="role">
                  <option value="college_admin">College admin</option>
                  <option value="organizer">Organizer</option>
                </select>
                <button>Grant access</button>
              </form>
            )}
            {actor?.roles.some((r) => r.role === "platform_admin") && (
              <form
                onSubmit={(e) => {
                  const d = form(e);
                  void run(async () => {
                    await api.request("/v1/colleges", "POST", {
                      name: d.get("name"),
                      city: d.get("city"),
                    });
                    await refresh();
                  });
                }}
              >
                <h2>Onboard college</h2>
                <input name="name" required placeholder="College name" />
                <input name="city" required placeholder="City" />
                <button>Add college</button>
              </form>
            )}
          </>
        )}
        {page === "Approvals" && (
          <>
            <h1>College review queue</h1>
            {reviews.map((r) => (
              <article key={r.id}>
                <h2>
                  {r.full_name} · {r.kind}
                </h2>
                <p>{r.email}</p>
                <p>{r.evidence}</p>
                {[true, false].map((approve) => (
                  <button
                    key={String(approve)}
                    onClick={() =>
                      void run(async () => {
                        await api.request(
                          `/v1/reviews/${r.id}/decision`,
                          "POST",
                          {
                            approve,
                            reason: approve
                              ? "Reviewed by college administrator"
                              : "Please contact your college administrator for clarification",
                          },
                        );
                        await refresh();
                      })
                    }
                  >
                    {approve ? "Approve" : "Reject"}
                  </button>
                ))}
              </article>
            ))}
          </>
        )}
        {page === "Organizer" && (
          <>
            <h1>Organizer workspace</h1>
            <p>
              Create a draft, publish it, then manage attendance and
              recognition.
            </p>
            <form
              onSubmit={(e) => {
                const d = form(e);
                void run(async () => {
                  const value = (key: string) => String(d.get(key));
                  await api.request("/v1/events", "POST", {
                    title: value("title"),
                    description: value("description"),
                    genre: value("genre"),
                    venue: value("venue"),
                    visibility: value("visibility"),
                    capacity: Number(d.get("capacity")),
                    registration_deadline: new Date(
                      value("deadline"),
                    ).toISOString(),
                    starts_at: new Date(value("starts")).toISOString(),
                    ends_at: new Date(value("ends")).toISOString(),
                    allowed_colleges: d.getAll("allowed_colleges"),
                  });
                  await refresh();
                  setMessage("Draft created. Open it below to publish.");
                });
              }}
            >
              <h2>Create an event</h2>
              {["title", "genre", "venue"].map((n) => (
                <input key={n} name={n} required placeholder={n} />
              ))}
              <textarea
                name="description"
                placeholder="Description, theme and participation details"
              />
              <input
                name="capacity"
                type="number"
                min={1}
                defaultValue={100}
                required
              />
              <select name="visibility">
                <option value="college_only">Own college</option>
                <option value="partner">Invited colleges</option>
                <option value="public">Public</option>
              </select>
              <label>
                Invited colleges
                <select name="allowed_colleges" multiple>
                  {colleges
                    .filter((c) => c.id !== actor?.college_id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
              {[
                ["deadline", "Registration deadline"],
                ["starts", "Starts"],
                ["ends", "Ends"],
              ].map(([name, label]) => (
                <label key={name}>
                  {label}
                  <input name={name} type="datetime-local" required />
                </label>
              ))}
              <button disabled={busy}>Save draft</button>
            </form>
            <div className="grid">
              {events
                .filter(
                  (e) =>
                    e.organizer_id === actor?.id ||
                    actor?.roles.some(
                      (r) =>
                        r.role !== "organizer" &&
                        (r.college_id === e.college_id ||
                          r.role === "platform_admin"),
                    ),
                )
                .map((e) => (
                  <article key={e.id}>
                    <h2>{e.title}</h2>
                    <p>{e.status}</p>
                    <button onClick={() => void run(() => open(e))}>
                      Manage event
                    </button>
                  </article>
                ))}
            </div>
          </>
        )}
        {selected && (
          <div className="overlay">
            <section
              className="dialog"
              role="dialog"
              aria-modal="true"
              aria-label={selected.title}
            >
              <button onClick={() => setSelected(null)}>Close</button>
              <span className="tag">
                {selected.status} · {selected.genre}
              </span>
              <h1>{selected.title}</h1>
              <p>{selected.description}</p>
              <p>
                {selected.venue} ·{" "}
                {new Date(selected.starts_at).toLocaleString()}
              </p>
              <p>
                Registration closes{" "}
                {new Date(selected.registration_deadline).toLocaleString()}
              </p>
              <button
                disabled={busy || !actor || selected.status !== "published"}
                onClick={() =>
                  void run(async () => {
                    const r = await api.request<Registration>(
                      `/v1/events/${selected.id}/register`,
                      "POST",
                    );
                    await refresh();
                    setMessage(`Registration ${r.status}`);
                  })
                }
              >
                {actor ? "Register" : "Sign in to register"}
              </button>
              <h2>Event updates</h2>
              {updates.map((u) => (
                <p key={u.id}>{u.body}</p>
              ))}
              {host &&
                (selected.organizer_id === actor?.id ||
                  actor?.roles.some(
                    (r) =>
                      r.role !== "organizer" &&
                      (r.college_id === selected.college_id ||
                        r.role === "platform_admin"),
                  )) && (
                  <>
                    <h2>Manage event</h2>
                    <div className="actions">
                      {(
                        {
                          draft: ["published", "cancelled"],
                          published: ["ongoing", "cancelled"],
                          ongoing: ["completed", "cancelled"],
                          completed: [],
                          cancelled: [],
                        } as Record<string, string[]>
                      )[selected.status].map((status) => (
                        <button
                          disabled={busy}
                          key={status}
                          onClick={() =>
                            void run(async () => {
                              await api.request(
                                `/v1/events/${selected.id}/status`,
                                "POST",
                                { status, version: selected.version },
                              );
                              await refresh();
                              await open(selected);
                            })
                          }
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    <form
                      onSubmit={(e) => {
                        const d = form(e);
                        void run(async () => {
                          await api.request(
                            `/v1/events/${selected.id}/updates`,
                            "POST",
                            { body: d.get("body") },
                          );
                          await open(selected);
                        });
                      }}
                    >
                      <textarea
                        name="body"
                        required
                        placeholder="Post an announcement"
                      />
                      <button>Post update</button>
                    </form>
                    <form
                      onSubmit={(e) => {
                        const d = form(e);
                        void run(async () => {
                          await api.request(
                            `/v1/events/${selected.id}/check-in`,
                            "POST",
                            { qr_token: d.get("pass") },
                          );
                          await open(selected);
                        });
                      }}
                    >
                      <input
                        name="pass"
                        required
                        placeholder="Participant pass token"
                      />
                      <button>Check in</button>
                    </form>
                    <h2>Participants ({participants.length})</h2>
                    {participants.map((r) => (
                      <p key={r.id}>
                        {r.full_name} · {r.status}
                      </p>
                    ))}
                    {selected.status === "completed" && (
                      <form
                        onSubmit={(e) => {
                          const d = form(e);
                          void run(async () => {
                            await api.request(
                              `/v1/events/${selected.id}/results`,
                              "POST",
                              {
                                awards: JSON.parse(
                                  String(d.get("awards") || "[]"),
                                ),
                              },
                            );
                            await refresh();
                            setMessage("Recognition issued for attendance.");
                          });
                        }}
                      >
                        <label>
                          Awards JSON (optional)
                          <textarea name="awards" defaultValue="[]" />
                        </label>
                        <p>
                          Example: [
                          {'{"registration_id":"…","award":"First place"}'}].
                          All other attendees receive participation recognition.
                        </p>
                        <button>Publish recognition</button>
                      </form>
                    )}
                  </>
                )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
