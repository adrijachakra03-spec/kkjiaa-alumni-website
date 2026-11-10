
import { useEffect, useState } from "react";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const NEWS_CATEGORIES = [
  "School News",
  "Alumni Stories",
  "Events",
  "Achievements",
  "Announcements",
];

export default function Admin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");

  const [alumni, setAlumni] = useState([]);
  const [messages, setMessages] = useState([]);
  const [news, setNews] = useState([]);

  const [activeTab, setActiveTab] = useState("alumni");

  const [loginLoading, setLoginLoading] = useState(false);
  const [alumniLoading, setAlumniLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsSaving, setNewsSaving] = useState(false);

  const [error, setError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [newsError, setNewsError] = useState("");
  const [notice, setNotice] = useState("");

  const [editingNewsId, setEditingNewsId] = useState(null);
  const [newsPhoto, setNewsPhoto] = useState(null);

  const [newsForm, setNewsForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "School News",
    status: "draft",
  });

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
      fontFamily: "inherit",
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

  // -------------------------------
  // ADMIN LOGIN
  // -------------------------------

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
        headers: {
          "Content-Type": "application/json",
        },
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

  // -------------------------------
  // LOAD PENDING ALUMNI
  // -------------------------------

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

  // -------------------------------
  // LOAD CONTACT MESSAGES
  // -------------------------------

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
      setMessageError(
        err.message || "Could not load contact messages."
      );
    } finally {
      setMessagesLoading(false);
    }
  }

  // -------------------------------
  // LOAD NEWS ARTICLES
  // -------------------------------

  async function loadNews(authToken = token) {
    if (!authToken) return;

    setNewsLoading(true);
    setNewsError("");

    try {
      const response = await fetch(`${API}/api/admin/news`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load news.");
      }

      const records = Array.isArray(data)
        ? data
        : data.articles || data.news || data.data || [];

      setNews(records);
    } catch (err) {
      setNewsError(err.message || "Could not load news.");
    } finally {
      setNewsLoading(false);
    }
  }

  // Load dashboard information after login.

  useEffect(() => {
    if (token) {
      loadPending(token);
      loadMessages(token);
      loadNews(token);
    }
  }, [token]);

  // -------------------------------
  // UPDATE ALUMNI STATUS
  // -------------------------------

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

  // -------------------------------
  // UPDATE MESSAGE STATUS
  // -------------------------------

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

  // -------------------------------
  // NEWS FORM
  // -------------------------------

  function resetNewsForm() {
    setEditingNewsId(null);
    setNewsPhoto(null);

    setNewsForm({
      title: "",
      excerpt: "",
      content: "",
      category: "School News",
      status: "draft",
    });

    const fileInput = document.getElementById("news-cover-photo");

    if (fileInput) {
      fileInput.value = "";
    }
  }

  function editNewsArticle(article) {
    setEditingNewsId(article._id);
    setNewsPhoto(null);

    setNewsForm({
      title: article.title || "",
      excerpt: article.excerpt || "",
      content: article.content || "",
      category: article.category || "School News",
      status: article.status || "draft",
    });

    setNewsError("");
    setNotice("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // -------------------------------
  // CREATE / UPDATE NEWS
  // -------------------------------

  async function saveNewsArticle(e) {
    e.preventDefault();

    setNewsSaving(true);
    setNewsError("");
    setNotice("");

    try {
      const formData = new FormData();

      formData.append("title", newsForm.title.trim());
      formData.append("excerpt", newsForm.excerpt.trim());
      formData.append("content", newsForm.content.trim());
      formData.append("category", newsForm.category);
      formData.append("status", newsForm.status);

      if (newsPhoto) {
        formData.append("photo", newsPhoto);
      }

      const url = editingNewsId
        ? `${API}/api/admin/news/${editingNewsId}`
        : `${API}/api/admin/news`;

      const response = await fetch(url, {
        method: editingNewsId ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save the article.");
      }

      setNotice(
        newsForm.status === "published"
          ? "Article published successfully."
          : "Article saved as draft."
      );

      resetNewsForm();
      await loadNews();
    } catch (err) {
      setNewsError(err.message || "Could not save the article.");
    } finally {
      setNewsSaving(false);
    }
  }

  // -------------------------------
  // DELETE NEWS
  // -------------------------------

  async function deleteNewsArticle(id) {
    if (!window.confirm("Are you sure you want to delete this article?")) {
      return;
    }

    setNewsError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/api/admin/news/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not delete the article.");
      }

      setNews((current) =>
        current.filter((article) => article._id !== id)
      );

      if (editingNewsId === id) {
        resetNewsForm();
      }

      setNotice("Article deleted successfully.");
    } catch (err) {
      setNewsError(err.message || "Could not delete the article.");
    }
  }

  // -------------------------------
  // LOGOUT
  // -------------------------------

  function logout() {
    setToken("");
    setAlumni([]);
    setMessages([]);
    setNews([]);

    setEmail("");
    setPassword("");
    setActiveTab("alumni");

    resetNewsForm();

    setNotice("");
    setError("");
    setMessageError("");
    setNewsError("");
  }

  const unreadCount = messages.filter(
    (message) => message.status !== "read"
  ).length;

  const publishedCount = news.filter(
    (article) => article.status === "published"
  ).length;

  const draftCount = news.filter(
    (article) => article.status === "draft"
  ).length;

  // -------------------------------
  // MAIN UI
  // -------------------------------

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
          // -------------------------------
          // LOGIN FORM
          // -------------------------------

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
              Sign in to manage alumni registrations, contact messages
              and association news.
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
            {/* -------------------------------
                DASHBOARD HEADER
            -------------------------------- */}

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
                Manage alumni registrations, visitor messages and
                association news.
              </p>
            </div>

            {/* -------------------------------
                DASHBOARD TABS
            -------------------------------- */}

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

              <button
                onClick={() => {
                  setActiveTab("news");
                  setNotice("");
                  setNewsError("");
                  resetNewsForm();
                  loadNews();
                }}
                style={{
                  ...styles.button,
                  background:
                    activeTab === "news" ? "#294b35" : "#e8e3d5",
                  color:
                    activeTab === "news" ? "#fff8e9" : "#294b35",
                }}
              >
                News & Announcements ({news.length})
              </button>
            </div>

            {notice && (
              <p role="status" style={{ color: "#294b35" }}>
                {notice}
              </p>
            )}

            {/* =================================
                ALUMNI REGISTRATIONS
            ================================== */}

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

            {/* =================================
                CONTACT MESSAGES
            ================================== */}

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

            {/* =================================
                NEWS & ANNOUNCEMENTS
            ================================== */}

            {activeTab === "news" && (
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
                      ASSOCIATION UPDATES
                    </p>

                    <h2 style={{ fontSize: 27, margin: "5px 0" }}>
                      News & Announcements
                    </h2>

                    <p style={styles.muted}>
                      Publish school news, alumni stories, achievements
                      and events.
                    </p>
                  </div>

                  <button
                    style={{
                      ...styles.button,
                      background: "#e8e3d5",
                      color: "#294b35",
                    }}
                    onClick={() => loadNews()}
                    disabled={newsLoading}
                  >
                    {newsLoading ? "Refreshing..." : "Refresh articles"}
                  </button>
                </div>

                {/* News statistics */}

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
                      flex: "1 1 150px",
                      background: "#e8eddf",
                      borderRadius: 10,
                      padding: 18,
                    }}
                  >
                    <span style={{ fontSize: 13 }}>TOTAL ARTICLES</span>
                    <div style={{ fontSize: 30, fontWeight: "bold" }}>
                      {news.length}
                    </div>
                  </div>

                  <div
                    style={{
                      flex: "1 1 150px",
                      background: "#e8eddf",
                      borderRadius: 10,
                      padding: 18,
                    }}
                  >
                    <span style={{ fontSize: 13 }}>PUBLISHED</span>
                    <div style={{ fontSize: 30, fontWeight: "bold" }}>
                      {publishedCount}
                    </div>
                  </div>

                  <div
                    style={{
                      flex: "1 1 150px",
                      background: "#f3e6c9",
                      borderRadius: 10,
                      padding: 18,
                    }}
                  >
                    <span style={{ fontSize: 13 }}>DRAFTS</span>
                    <div style={{ fontSize: 30, fontWeight: "bold" }}>
                      {draftCount}
                    </div>
                  </div>
                </div>

                {newsError && (
                  <p role="alert" style={{ color: "#a3332a" }}>
                    {newsError}
                  </p>
                )}

                {/* Article editor */}

                <form
                  onSubmit={saveNewsArticle}
                  style={{
                    ...styles.card,
                    marginTop: 24,
                    marginBottom: 35,
                  }}
                >
                  <h3 style={{ fontSize: 23, marginTop: 0 }}>
                    {editingNewsId
                      ? "Edit article"
                      : "Create a news article"}
                  </h3>

                  <p style={styles.muted}>
                    Published articles will appear in the existing News
                    section on the website homepage.
                  </p>

                  <label htmlFor="news-title">Article title</label>

                  <input
                    id="news-title"
                    style={styles.input}
                    type="text"
                    maxLength={180}
                    placeholder="Enter an article title"
                    value={newsForm.title}
                    onChange={(e) =>
                      setNewsForm({
                        ...newsForm,
                        title: e.target.value,
                      })
                    }
                    required
                  />

                  <label htmlFor="news-category">Category</label>

                  <select
                    id="news-category"
                    style={styles.input}
                    value={newsForm.category}
                    onChange={(e) =>
                      setNewsForm({
                        ...newsForm,
                        category: e.target.value,
                      })
                    }
                    required
                  >
                    {NEWS_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <label htmlFor="news-excerpt">
                    Short description
                  </label>

                  <textarea
                    id="news-excerpt"
                    style={{
                      ...styles.input,
                      minHeight: 85,
                      resize: "vertical",
                    }}
                    maxLength={400}
                    placeholder="A short summary shown on the homepage..."
                    value={newsForm.excerpt}
                    onChange={(e) =>
                      setNewsForm({
                        ...newsForm,
                        excerpt: e.target.value,
                      })
                    }
                    required
                  />

                  <label htmlFor="news-content">Full article</label>

                  <textarea
                    id="news-content"
                    style={{
                      ...styles.input,
                      minHeight: 190,
                      resize: "vertical",
                      lineHeight: 1.7,
                    }}
                    maxLength={20000}
                    placeholder="Write the complete news article here..."
                    value={newsForm.content}
                    onChange={(e) =>
                      setNewsForm({
                        ...newsForm,
                        content: e.target.value,
                      })
                    }
                    required
                  />

                  <label htmlFor="news-cover-photo">
                    Cover photograph
                  </label>

                  <input
                    id="news-cover-photo"
                    type="file"
                    accept="image/*"
                    style={{
                      ...styles.input,
                      padding: 10,
                    }}
                    onChange={(e) =>
                      setNewsPhoto(e.target.files?.[0] || null)
                    }
                  />

                  <p
                    style={{
                      ...styles.muted,
                      fontSize: 13,
                      marginTop: -10,
                    }}
                  >
                    Upload one photograph for this article. Maximum size:
                    5 MB. Leave it empty when editing to keep the existing
                    photograph.
                  </p>

                  {editingNewsId &&
                    news.find(
                      (article) => article._id === editingNewsId
                    )?.coverImage && (
                      <div style={{ marginBottom: 20 }}>
                        <p
                          style={{
                            fontSize: 13,
                            color: "#687366",
                          }}
                        >
                          Current cover photograph:
                        </p>

                        <img
                          src={
                            news.find(
                              (article) => article._id === editingNewsId
                            )?.coverImage
                          }
                          alt="Current article cover"
                          style={{
                            width: "100%",
                            maxWidth: 260,
                            maxHeight: 170,
                            objectFit: "cover",
                            borderRadius: 9,
                          }}
                        />
                      </div>
                    )}

                  <label htmlFor="news-status">Article status</label>

                  <select
                    id="news-status"
                    style={styles.input}
                    value={newsForm.status}
                    onChange={(e) =>
                      setNewsForm({
                        ...newsForm,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="draft">Save as draft</option>
                    <option value="published">
                      Publish on homepage
                    </option>
                  </select>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <button
                      type="submit"
                      disabled={newsSaving}
                      style={{
                        ...styles.button,
                        background: "#294b35",
                        color: "white",
                        opacity: newsSaving ? 0.7 : 1,
                      }}
                    >
                      {newsSaving
                        ? "Saving..."
                        : editingNewsId
                          ? "Update article"
                          : newsForm.status === "published"
                            ? "Publish article"
                            : "Save draft"}
                    </button>

                    {editingNewsId && (
                      <button
                        type="button"
                        onClick={resetNewsForm}
                        style={{
                          ...styles.button,
                          background: "#e8e3d5",
                          color: "#294b35",
                        }}
                      >
                        Cancel editing
                      </button>
                    )}
                  </div>
                </form>

                {/* Article list */}

                <div>
                  <h3 style={{ fontSize: 23 }}>
                    All articles ({news.length})
                  </h3>

                  {newsLoading && <p>Loading articles...</p>}

                  {!newsLoading && news.length === 0 && (
                    <div
                      style={{
                        ...styles.card,
                        textAlign: "center",
                        padding: 30,
                      }}
                    >
                      <h3>No articles yet</h3>

                      <p style={styles.muted}>
                        Your news articles will appear here after you
                        create them.
                      </p>
                    </div>
                  )}

                  <div style={{ display: "grid", gap: 18 }}>
                    {news.map((article) => (
                      <article
                        key={article._id}
                        style={{
                          ...styles.card,
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        {article.coverImage && (
                          <img
                            src={article.coverImage}
                            alt={article.title}
                            style={{
                              width: "100%",
                              maxHeight: 230,
                              objectFit: "cover",
                              borderRadius: 9,
                            }}
                          />
                        )}

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 10,
                          }}
                        >
                          <span
                            style={{
                              background: "#e8eddf",
                              color: "#294b35",
                              borderRadius: 20,
                              padding: "5px 11px",
                              fontSize: 12,
                            }}
                          >
                            {article.category}
                          </span>

                          <span
                            style={{
                              background:
                                article.status === "published"
                                  ? "#e8eddf"
                                  : "#f3e6c9",
                              color: "#294b35",
                              borderRadius: 20,
                              padding: "5px 11px",
                              fontSize: 12,
                            }}
                          >
                            {article.status === "published"
                              ? "Published"
                              : "Draft"}
                          </span>
                        </div>

                        <h3 style={{ fontSize: 22, margin: 0 }}>
                          {article.title}
                        </h3>

                        <p
                          style={{
                            ...styles.muted,
                            margin: 0,
                          }}
                        >
                          {article.excerpt}
                        </p>

                        {article.publishedAt && (
                          <p
                            style={{
                              fontSize: 12,
                              color: "#8b7955",
                              margin: 0,
                            }}
                          >
                            Published:{" "}
                            {new Date(
                              article.publishedAt
                            ).toLocaleDateString()}
                          </p>
                        )}

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 10,
                            marginTop: 5,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => editNewsArticle(article)}
                            style={{
                              ...styles.button,
                              background: "#294b35",
                              color: "white",
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteNewsArticle(article._id)
                            }
                            style={{
                              ...styles.button,
                              background: "#f3e4df",
                              color: "#963d32",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}
