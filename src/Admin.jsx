
import { useEffect, useState } from "react";

const API = "http://localhost:5000";

export default function Admin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok || !data.token) {
        throw new Error(data.message || "Login failed.");
      }

      setToken(data.token);
      setPassword("");
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPending(authToken = token) {
    if (!authToken) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/admin/alumni/pending`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Could not load registrations.");
      }

      const records = Array.isArray(data)
        ? data
        : data.alumni || data.registrations || data.data || [];

      setAlumni(records);
    } catch (err) {
      setError(err.message || "Could not load pending alumni.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadPending(token);
  }, [token]);

  async function updateStatus(id, status) {
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/api/admin/alumni/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Could not update status.");
      }

      setAlumni((current) => current.filter((person) => person._id !== id));
      setNotice(`Registration ${status} successfully.`);
    } catch (err) {
      setError(err.message || "Could not update registration.");
    }
  }

  function logout() {
    setToken("");
    setAlumni([]);
    setEmail("");
    setPassword("");
    setNotice("");
    setError("");
  }

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f7f3e9",
      color: "#293b2b",
      fontFamily: "Georgia, serif",
    },
    header: {
      background: "#294b35",
      color: "#fff8e9",
      padding: "24px clamp(18px, 5vw, 64px)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 16,
    },
    button: {
      border: "none",
      borderRadius: 8,
      padding: "11px 17px",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: 13,
      border: "1px solid #d5d4c7",
      borderRadius: 8,
      background: "#fffdf7",
      fontSize: 15,
      marginTop: 7,
      marginBottom: 18,
    },
  };

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 2 }}>
            K K JNANADA INSTITUTION
          </div>
          <h1 style={{ margin: "8px 0 0", fontSize: 25 }}>
            Alumni Administration
          </h1>
        </div>

        {token && (
          <button
            style={{
              ...styles.button,
              background: "#f5ead5",
              color: "#294b35",
            }}
            onClick={logout}
          >
            Log out
          </button>
        )}
      </header>

      <section
        style={{
          maxWidth: 1050,
          margin: "0 auto",
          padding: "36px 20px 60px",
        }}
      >
        {!token ? (
          <form
            onSubmit={login}
            style={{
              maxWidth: 430,
              margin: "35px auto",
              padding: 28,
              background: "#fffdf7",
              border: "1px solid #e5dfcf",
              borderRadius: 14,
            }}
          >
            <p style={{ color: "#8b7955", letterSpacing: 2, fontSize: 12 }}>
              ADMIN PORTAL
            </p>
            <h2 style={{ fontSize: 29, marginTop: 8 }}>
              Welcome back
            </h2>
            <p style={{ color: "#687366", lineHeight: 1.6 }}>
              Sign in to review alumni registrations submitted to the
              association.
            </p>

            <label htmlFor="admin-email">Admin email</label>
            <input
              id="admin-email"
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />

            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            {error && (
              <p role="alert" style={{ color: "#a3332a" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                width: "100%",
                background: "#294b35",
                color: "white",
                padding: 14,
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <p style={{ color: "#8b7955", letterSpacing: 1.5, fontSize: 12 }}>
                  REGISTRATION REVIEW
                </p>
                <h2 style={{ fontSize: 30, margin: "5px 0" }}>
                  Pending alumni
                </h2>
                <p style={{ color: "#687366" }}>
                  Review each submission before approving it.
                </p>
              </div>

              <button
                style={{
                  ...styles.button,
                  background: "#e8e3d5",
                  color: "#294b35",
                }}
                onClick={() => loadPending()}
                disabled={loading}
              >
                Refresh list
              </button>
            </div>

            <div
              style={{
                background: "#e8eddf",
                borderRadius: 10,
                padding: 18,
                margin: "22px 0",
              }}
            >
              <span style={{ fontSize: 13 }}>AWAITING REVIEW</span>
              <div style={{ fontSize: 34, fontWeight: "bold", marginTop: 5 }}>
                {alumni.length}
              </div>
            </div>

            {error && (
              <p role="alert" style={{ color: "#a3332a" }}>{error}</p>
            )}
            {notice && (
              <p role="status" style={{ color: "#294b35" }}>{notice}</p>
            )}

            {loading && <p>Loading registrations...</p>}

            {!loading && alumni.length === 0 && !error && (
              <div
                style={{
                  padding: 30,
                  textAlign: "center",
                  background: "#fffdf7",
                  borderRadius: 12,
                  border: "1px solid #e5dfcf",
                }}
              >
                <h3>No pending registrations</h3>
                <p style={{ color: "#687366" }}>
                  New submissions will appear here for review.
                </p>
              </div>
            )}

            <div style={{ display: "grid", gap: 18 }}>
              {alumni.map((person) => (
                <article
                  key={person._id}
                  style={{
                    background: "#fffdf7",
                    border: "1px solid #e5dfcf",
                    borderRadius: 12,
                    padding: 22,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <h3 style={{ fontSize: 22, margin: "0 0 12px" }}>
                      {person.fullName || person.name || "Unnamed alumnus"}
                    </h3>
                    <span
                      style={{
                        background: "#f3e6c9",
                        borderRadius: 20,
                        padding: "5px 11px",
                        fontSize: 12,
                        height: "fit-content",
                      }}
                    >
                      Pending
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                      gap: "12px 20px",
                      lineHeight: 1.6,
                      overflowWrap: "anywhere",
                    }}
                  >
                    <div><strong>Email:</strong> {person.email || "—"}</div>
                    <div><strong>Phone:</strong> {person.phone || "—"}</div>
                    <div>
                      <strong>Passing year:</strong>{" "}
                      {person.passingYear || "—"}
                    </div>
                    <div>
                      <strong>Profession:</strong>{" "}
                      {person.profession || "—"}
                    </div>
                    <div>
                      <strong>City:</strong> {person.currentCity || "—"}
                    </div>
                  </div>

                  {person.message && (
                    <p style={{ lineHeight: 1.7, color: "#687366" }}>
                      <strong>Message:</strong> {person.message}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <button
                      style={{
                        ...styles.button,
                        background: "#294b35",
                        color: "white",
                      }}
                      onClick={() => updateStatus(person._id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      style={{
                        ...styles.button,
                        background: "#f3e4df",
                        color: "#963d32",
                      }}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to reject this registration?"
                          )
                        ) {
                          updateStatus(person._id, "rejected");
                        }
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
