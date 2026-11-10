
import { useEffect, useState } from "react";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export default function Admin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");

  const [alumni, setAlumni] = useState([]);
  const [messages, setMessages] = useState([]);

  const [activeTab, setActiveTab] = useState("alumni");

  const [loginLoading, setLoginLoading] = useState(false);
  const [alumniLoading, setAlumniLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [error, setError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [notice, setNotice] = useState("");

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
    card: {
      background: "#fffdf7",
      border: "1px solid #e5dfcf",
      borderRadius: 12,
      padding: 22,
    },
    muted: {
      color: "#687366",
      lineHeight: 1.6,
    },
  };

  async function login(e) {
    e.preventDefault();
    setLoginLoading(true);
    setError("");

    if (!API) {
      setError("Backend API URL is not configured.");
      setLoginLoading(false);
      return;
    }

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
      setNotice("Successfully signed in.");
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function loadPending(authToken = token) {
    if (!authToken) return;

    setAlumniLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/api/admin/alumni/pending`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

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
      setAlumniLoading(false);
    }
  }

  async function loadMessages(authToken = token) {
    if (!authToken) return;

    setMessagesLoading(true);
    setMessageError("");

    try {
      const response = await fetch(
        `${API}/api/admin/messages`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load messages.");
      }

      const records = Array.isArray(data)
        ? data
        : data.messages || data.data || [];

      setMessages(records);
    } catch (err) {
      setMessageError(err.message || "Could not load contact messages.");
    } finally {
      setMessagesLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadPending(token);
      loadMessages(token);
    }
  }, [token]);

  async function updateAlumniStatus(id, status) {
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

      setAlumni((current) =>
        current.filter((person) => person._id !== id)
      );

      setNotice(`Registration ${status} successfully.`);
    } catch (err) {
      setError(err.message || "Could not update registration.");
    }
  }

  async function updateMessageStatus(id, status) {
    setMessageError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/api/admin/messages/${id}`,
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
        throw new Error(data.message || "Could not update message.");
      }

      setMessages((current) =>
        current.map((message) =>
          message._id === id
            ? { ...message, status }
            : message
        )
      );

      setNotice(
        status === "read"
          ? "Message marked as read."
          : "Message marked as unread."
      );
    } catch (err) {
      setMessageError(err.message || "Could not update message.");
    }
  }

  function logout() {
    setToken("");
    setAlumni([]);
    setMessages([]);
    setEmail("");
    setPassword("");
    setActiveTab("alumni");
    setNotice("");
    setError("");
    setMessageError("");
  }

  const unreadCount = messages.filter(
    (message) => message.status !== "read"
  ).length;

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
            <p
              style={{
                color: "#8b7955",
                letterSpacing: 2,
                fontSize: 12,
              }}
            >
              ADMIN PORTAL
            </p>

            <h2 style={{ fontSize: 29, marginTop: 8 }}>
              Welcome back
            </h2>

            <p style={styles.muted}>
              Sign in to manage alumni registrations and contact
              messages submitted to the association.
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
              <p role="alert" style={{ color: "#a3332a" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                ...styles.button,
                width: "100%",
                background: "#294b35",
                color: "white",
                padding: 14,
                opacity: loginLoading ? 0.7 : 1,
              }}
            >
              {loginLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        ) : (
          <>
            <div>
              <p
                style={{
                  color: "#8b7955",
                  letterSpacing: 1.5,
                  fontSize: 12,
                }}
              >
                ADMIN DASHBOARD
              </p>

              <h2 style={{ fontSize: 30, margin: "5px 0" }}>
                Welcome, Admin
              </h2>

              <p style={styles.muted}>
                Manage alumni registrations and messages from visitors.
              </p>
            </div>

            {/* Dashboard tabs */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                margin: "25px 0",
              }}
            >
              <button
                onClick={() => {
                  setActiveTab("alumni");
                  setNotice("");
                  setError("");
                }}
                style={{
                  ...styles.button,
                  background:
                    activeTab === "alumni" ? "#294b35" : "#e8e3d5",
                  color:
                    activeTab === "alumni" ? "#fff8e9" : "#294b35",
                }}
              >
                Alumni Registrations ({alumni.length})
              </button>

              <button
                onClick={() => {
                  setActiveTab("messages");
                  setNotice("");
                  setMessageError("");
                }}
                style={{
                  ...styles.button,
                  background:
                    activeTab === "messages" ? "#294b35" : "#e8e3d5",
                  color:
                    activeTab === "messages" ? "#fff8e9" : "#294b35",
                }}
              >
                Contact Messages ({unreadCount} unread)
              </button>
            </div>

            {notice && (
              <p role="status" style={{ color: "#294b35" }}>
                {notice}
              </p>
            )}

            {/* Alumni registrations */}
            {activeTab === "alumni" && (
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
                    <p
                      style={{
                        color: "#8b7955",
                        letterSpacing: 1.5,
                        fontSize: 12,
                      }}
                    >
                      REGISTRATION REVIEW
                    </p>

                    <h2 style={{ fontSize: 27, margin: "5px 0" }}>
                      Pending alumni
                    </h2>

                    <p style={styles.muted}>
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
                    disabled={alumniLoading}
                  >
                    {alumniLoading ? "Refreshing..." : "Refresh list"}
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
                  <span style={{ fontSize: 13 }}>
                    AWAITING REVIEW
                  </span>

                  <div
                    style={{
                      fontSize: 34,
                      fontWeight: "bold",
                      marginTop: 5,
                    }}
                  >
                    {alumni.length}
                  </div>
                </div>

                {error && (
                  <p role="alert" style={{ color: "#a3332a" }}>
                    {error}
                  </p>
                )}

                {alumniLoading && <p>Loading registrations...</p>}

                {!alumniLoading && alumni.length === 0 && !error && (
                  <div
                    style={{
                      ...styles.card,
                      padding: 30,
                      textAlign: "center",
                    }}
                  >
                    <h3>No pending registrations</h3>
                    <p style={styles.muted}>
                      New submissions will appear here for review.
                    </p>
                  </div>
                )}

                <div style={{ display: "grid", gap: 18 }}>
                  {alumni.map((person) => (
                    <article key={person._id} style={styles.card}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 10,
                        }}
                      >
                        <h3 style={{ fontSize: 22, margin: "0 0 12px" }}>
                          {person.fullName ||
                            person.name ||
                            "Unnamed alumnus"}
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
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(190px, 1fr))",
                          gap: "12px 20px",
                          lineHeight: 1.6,
                          overflowWrap: "anywhere",
                        }}
                      >
                        <div>
                          <strong>Email:</strong> {person.email || "—"}
                        </div>

                        <div>
                          <strong>Phone:</strong> {person.phone || "—"}
                        </div>

                        <div>
                          <strong>Passing year:</strong>{" "}
                          {person.passingYear || "—"}
                        </div>

                        <div>
                          <strong>Profession:</strong>{" "}
                          {person.profession || "—"}
                        </div>

                        <div>
                          <strong>City:</strong>{" "}
                          {person.currentCity || "—"}
                        </div>
                      </div>

                      {person.message && (
                        <p style={{ lineHeight: 1.7, ...styles.muted }}>
                          <strong>Message:</strong> {person.message}
                        </p>
                      )}

                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          marginTop: 20,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          style={{
                            ...styles.button,
                            background: "#294b35",
                            color: "white",
                          }}
                          onClick={() =>
                            updateAlumniStatus(person._id, "approved")
                          }
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
                              updateAlumniStatus(person._id, "rejected");
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

            {/* Contact messages */}
            {activeTab === "messages" && (
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
                    <p
                      style={{
                        color: "#8b7955",
                        letterSpacing: 1.5,
                        fontSize: 12,
                      }}
                    >
                      CONTACT INBOX
                    </p>

                    <h2 style={{ fontSize: 27, margin: "5px 0" }}>
                      Messages from visitors
                    </h2>

                    <p style={styles.muted}>
                      Messages submitted through the website's Contact Us
                      form will appear here.
                    </p>
                  </div>

                  <button
                    style={{
                      ...styles.button,
                      background: "#e8e3d5",
                      color: "#294b35",
                    }}
                    onClick={() => loadMessages()}
                    disabled={messagesLoading}
                  >
                    {messagesLoading ? "Refreshing..." : "Refresh messages"}
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    margin: "22px 0",
                  }}
                >
                  <div
                    style={{
                      flex: "1 1 160px",
                      background: "#e8eddf",
                      borderRadius: 10,
                      padding: 18,
                    }}
                  >
                    <span style={{ fontSize: 13 }}>TOTAL MESSAGES</span>
                    <div style={{ fontSize: 30, fontWeight: "bold" }}>
                      {messages.length}
                    </div>
                  </div>

                  <div
                    style={{
                      flex: "1 1 160px",
                      background: "#f3e6c9",
                      borderRadius: 10,
                      padding: 18,
                    }}
                  >
                    <span style={{ fontSize: 13 }}>UNREAD MESSAGES</span>
                    <div style={{ fontSize: 30, fontWeight: "bold" }}>
                      {unreadCount}
                    </div>
                  </div>
                </div>

                {messageError && (
                  <p role="alert" style={{ color: "#a3332a" }}>
                    {messageError}
                  </p>
                )}

                {messagesLoading && <p>Loading messages...</p>}

                {!messagesLoading &&
                  messages.length === 0 &&
                  !messageError && (
                    <div
                      style={{
                        ...styles.card,
                        padding: 30,
                        textAlign: "center",
                      }}
                    >
                      <h3>Your inbox is empty</h3>
                      <p style={styles.muted}>
                        Contact messages from visitors will appear here.
                      </p>
                    </div>
                  )}

                <div style={{ display: "grid", gap: 18 }}>
                  {messages.map((message) => (
                    <article
                      key={message._id}
                      style={{
                        ...styles.card,
                        borderLeft:
                          message.status === "read"
                            ? "4px solid #d5d4c7"
                            : "4px solid #b68b45",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 10,
                        }}
                      >
                        <h3 style={{ fontSize: 21, margin: 0 }}>
                          {message.name || "Website visitor"}
                        </h3>

                        <span
                          style={{
                            background:
                              message.status === "read"
                                ? "#e8eddf"
                                : "#f3e6c9",
                            color: "#294b35",
                            borderRadius: 20,
                            padding: "5px 11px",
                            fontSize: 12,
                          }}
                        >
                          {message.status === "read" ? "Read" : "Unread"}
                        </span>
                      </div>

                      <p style={{ margin: "13px 0 5px" }}>
                        <strong>Email:</strong>{" "}
                        <a
                          href={`mailto:${message.email}`}
                          style={{
                            color: "#55734e",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {message.email || "—"}
                        </a>
                      </p>

                      <p style={{ ...styles.muted, whiteSpace: "pre-wrap" }}>
                        <strong>Message:</strong>
                        {"\n"}
                        {message.message || "No message provided."}
                      </p>

                      {message.createdAt && (
                        <p style={{ fontSize: 12, color: "#8b7955" }}>
                          Received:{" "}
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      )}

                      <button
                        style={{
                          ...styles.button,
                          marginTop: 12,
                          background:
                            message.status === "read"
                              ? "#f3e4df"
                              : "#294b35",
                          color:
                            message.status === "read"
                              ? "#963d32"
                              : "white",
                        }}
                        onClick={() =>
                          updateMessageStatus(
                            message._id,
                            message.status === "read" ? "unread" : "read"
                          )
                        }
                      >
                        {message.status === "read"
                          ? "Mark as unread"
                          : "Mark as read"}
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}
