
import { useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const features = [
  {
    id: "implementation",
    title: "Fast Implementation",
    icon: "🚀",
    description: "Plan your software implementation with a guided process.",
    detail: "The product tour highlights the 14-day go-live information and implementation training described in the reference PDF."
  },
  {
    id: "training",
    title: "Training & Support",
    icon: "🎓",
    description: "Understand the training and assistance available.",
    detail: "The reference PDF highlights free implementation training and free chat support."
  },
  {
    id: "security",
    title: "Data Security",
    icon: "🔒",
    description: "Learn about protecting business information.",
    detail: "The reference PDF describes TranZact's data security as military-grade. This is presented as source material, not independently verified."
  },
  {
    id: "roi",
    title: "ROI Calculator",
    icon: "📊",
    description: "Estimate potential financial benefits.",
    detail: "Enter your own assumptions to estimate annual savings and return on investment."
  }
];

export default function App() {
  const [page, setPage] = useState("home");
  const [step, setStep] = useState(0);
  const [user, setUser] = useState("");
  const [token, setToken] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [hours, setHours] = useState(100);
  const [hourlyRate, setHourlyRate] = useState(300);
  const [investment, setInvestment] = useState(50000);
  const [improvement, setImprovement] = useState(20);
  const [saved, setSaved] = useState([]);

  const annualSavings = hours * 12 * hourlyRate * improvement / 100;
  const netBenefit = annualSavings - investment;
  const roi = investment > 0 ? netBenefit / investment * 100 : 0;
  const payback = annualSavings > 0
    ? investment / annualSavings * 12
    : null;

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function authenticate(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const data = await request(
        authMode === "login" ? "/api/login" : "/api/register",
        {
          method: "POST",
          body: JSON.stringify({ email, password })
        }
      );

      if (authMode === "register") {
        setAuthMode("login");
        setMessage("Account created. Please log in.");
      } else {
        setToken(data.access_token);
        setUser(data.email);
        setPage("home");
        setMessage("Login successful!");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setToken("");
    setUser("");
    setSaved([]);
    setPage("home");
    setMessage("You have logged out.");
  }

  async function saveCalculation() {
    if (!token) {
      setMessage("Please log in before saving a calculation.");
      setPage("auth");
      setAuthMode("login");
      return;
    }

    try {
      await request("/api/roi", {
        method: "POST",
        body: JSON.stringify({
          hours,
          hourly_rate: hourlyRate,
          investment,
          improvement,
          annual_savings: annualSavings,
          roi
        })
      });
      setMessage("ROI calculation saved successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function loadSaved() {
    if (!token) {
      setMessage("Please log in to view saved calculations.");
      setPage("auth");
      return;
    }

    try {
      const data = await request("/api/roi");
      setSaved(data.calculations);
      setPage("saved");
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  const tourSteps = [
    { title: "Welcome to Product Tour", description: "Explore the product and discover its benefits." },
    { title: "Implementation", description: "Learn about the implementation timeline and training." },
    { title: "Support & Security", description: "Explore customer support and data security information." },
    { title: "Return on Investment", description: "Estimate your potential savings and ROI." }
  ];

  function startTour() {
    setStep(0);
    setPage("tour");
  }

  function nextStep() {
    if (step < tourSteps.length - 1) {
      const next = step + 1;
      setStep(next);
      if (next === 3) setPage("roi");
    } else {
      setPage("home");
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <button className="brand" onClick={() => setPage("home")}>
          <span className="brand-icon">T</span>
          Product Tour
        </button>

        <nav>
          <button onClick={() => setPage("home")}>Home</button>
          <button onClick={() => setPage("features")}>Features</button>
          <button onClick={() => setPage("support")}>Support</button>
          <button onClick={() => setPage("security")}>Security</button>
          <button onClick={() => setPage("roi")}>ROI Calculator</button>
          {token && <button onClick={loadSaved}>My Calculations</button>}
        </nav>

        <div className="nav-account">
          {token ? (
            <>
              <span className="user-label">{user}</span>
              <button className="outline-btn" onClick={logout}>Logout</button>
            </>
          ) : (
            <button className="primary-btn" onClick={() => {
              setAuthMode("login");
              setPage("auth");
            }}>
              Login
            </button>
          )}
        </div>
      </header>

      {message && (
        <div className="notice" role="status">
          {message}
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}

      <main key={page} className="page-content">
        {page === "home" && (
          <>
            <section className="hero">
              <span className="eyebrow">YOUR BUSINESS, SIMPLIFIED</span>
              <h1>Discover a smarter way to manage your business.</h1>
              <p>
                Take a guided tour to explore implementation,
                training, support, security, and potential business value.
              </p>
              <div className="hero-actions">
                <button className="primary-btn" onClick={startTour}>
                  Start Product Tour →
                </button>
                <button className="outline-btn" onClick={() => setPage("features")}>
                  Explore Features
                </button>
              </div>
              <div className="hero-note">
                A guided introduction to the TranZact product
              </div>
            </section>

            <section className="section">
              <div className="section-heading">
                <span className="eyebrow">EXPLORE THE PRODUCT</span>
                <h2>Everything you need to know</h2>
                <p>Explore the main topics covered in the product tour.</p>
              </div>
              <div className="feature-grid">
                {features.map(feature => (
                  <article className="feature-card" key={feature.id}>
                    <span className="feature-icon">{feature.icon}</span>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                    <button className="text-btn" onClick={() => setPage(feature.id === "training" ? "support" : feature.id === "security" ? "security" : feature.id === "roi" ? "roi" : "features")}>
                      Learn more →
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {page === "features" && (
          <section className="section">
            <span className="eyebrow">PRODUCT OVERVIEW</span>
            <h1>Explore Product Features</h1>
            <p>Review the main benefits introduced in the reference PDF.</p>
            <div className="feature-grid">
              {features.map(feature => (
                <article className="feature-card" key={feature.id}>
                  <span className="feature-icon">{feature.icon}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <p>{feature.detail}</p>
                  <button className="text-btn" onClick={() => setPage(feature.id === "security" ? "security" : feature.id === "training" ? "support" : feature.id === "roi" ? "roi" : "tour")}>
                    Explore →
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {(page === "support" || page === "security") && (
          <section className="detail-panel">
            <span className="feature-icon">{page === "support" ? "🎓" : "🔒"}</span>
            <span className="eyebrow">PRODUCT INFORMATION</span>
            <h1>{page === "support" ? "Implementation & Support" : "Data Security"}</h1>
            <p>
              {page === "support"
                ? "The PDF highlights go-live in 14 days, free implementation training, and free chat support."
                : "The PDF describes TranZact's data security as military-grade. Consult the provider's official documentation for technical details."}
            </p>
            <button className="primary-btn" onClick={() => setPage("features")}>
              Back to Features
            </button>
          </section>
        )}

        {page === "tour" && (
          <section className="detail-panel">
            <span className="eyebrow">GUIDED EXPERIENCE</span>
            <div className="progress-track">
              <div className="progress-fill"
                style={{ width: `${((step + 1) / tourSteps.length) * 100}%` }} />
            </div>
            <p>Step {step + 1} of {tourSteps.length}</p>
            <h1>{tourSteps[step].title}</h1>
            <p>{tourSteps[step].description}</p>
            <div className="hero-actions">
              <button className="outline-btn" disabled={step === 0}
                onClick={() => setStep(s => s - 1)}>
                ← Previous
              </button>
              <button className="primary-btn" onClick={nextStep}>
                {step === tourSteps.length - 1 ? "Finish Tour" : "Next →"}
              </button>
            </div>
          </section>
        )}

        {page === "roi" && (
          <section className="section roi-layout">
            <div>
              <span className="eyebrow">BUSINESS VALUE ESTIMATOR</span>
              <h1>ROI Calculator</h1>
              <p>Enter your own assumptions to estimate possible savings.</p>

              <label>Hours saved per month
                <input type="number" min="0" value={hours}
                  onChange={e => setHours(Math.max(0, Number(e.target.value)))} />
              </label>
              <label>Cost per hour (₹)
                <input type="number" min="0" value={hourlyRate}
                  onChange={e => setHourlyRate(Math.max(0, Number(e.target.value)))} />
              </label>
              <label>Estimated improvement (%)
                <input type="number" min="0" max="100" value={improvement}
                  onChange={e => setImprovement(Math.min(100, Math.max(0, Number(e.target.value))))} />
              </label>
              <label>Implementation investment (₹)
                <input type="number" min="0" value={investment}
                  onChange={e => setInvestment(Math.max(0, Number(e.target.value)))} />
              </label>

              <button className="primary-btn" onClick={saveCalculation}>
                Save Calculation
              </button>
            </div>

            <aside className="roi-result">
              <span className="eyebrow">ESTIMATED RESULTS</span>
              <h2>₹{Math.round(annualSavings).toLocaleString("en-IN")}</h2>
              <p>Estimated annual savings</p>
              <hr />
              <div className="result-row">
                <span>Net annual benefit</span>
                <strong>₹{Math.round(netBenefit).toLocaleString("en-IN")}</strong>
              </div>
              <div className="result-row">
                <span>Estimated ROI</span>
                <strong>{investment > 0 ? `${roi.toFixed(1)}%` : "N/A"}</strong>
              </div>
              <div className="result-row">
                <span>Payback period</span>
                <strong>{payback === null ? "N/A" : `${payback.toFixed(1)} months`}</strong>
              </div>
              <p className="fine-print">
                Estimates only. Savings are calculated from the inputs you provide,
                not verified TranZact performance data.
              </p>
            </aside>
          </section>
        )}

        {page === "auth" && (
          <section className="auth-card">
            <span className="eyebrow">PRODUCT TOUR ACCOUNT</span>
            <h1>{authMode === "login" ? "Welcome back" : "Create an account"}</h1>
            <p>{authMode === "login" ? "Log in to save your ROI calculations." : "Register to save your calculations."}</p>
            <form onSubmit={authenticate}>
              <label>Email
                <input type="email" required value={email}
                  onChange={e => setEmail(e.target.value)} />
              </label>
              <label>Password
                <input type="password" required minLength="8"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </label>
              <button className="primary-btn" disabled={busy}>
                {busy ? "Please wait..." : authMode === "login" ? "Login" : "Register"}
              </button>
            </form>
            <button className="text-btn" onClick={() => {
              setAuthMode(authMode === "login" ? "register" : "login");
              setMessage("");
            }}>
              {authMode === "login" ? "Need an account? Register" : "Already registered? Login"}
            </button>
          </section>
        )}

        {page === "saved" && (
          <section className="section">
            <h1>My Saved Calculations</h1>
            {saved.length === 0 && <p>No saved calculations yet.</p>}
            <div className="saved-grid">
              {saved.map(item => (
                <article className="feature-card" key={item.id}>
                  <h3>ROI: {Number(item.roi).toFixed(1)}%</h3>
                  <p>Annual savings: ₹{Number(item.annual_savings).toLocaleString("en-IN")}</p>
                  <p>Investment: ₹{Number(item.investment).toLocaleString("en-IN")}</p>
                  <p>{item.created_at}</p>
                </article>
              ))}
            </div>
            <button className="outline-btn" onClick={() => setPage("roi")}>Back to Calculator</button>
          </section>
        )}
      </main>

      <footer>
        <strong>Product Tour</strong>
        <p>A guided introduction to product features and business value.</p>
        <span></span>
      </footer>
    </div>
  );
}
