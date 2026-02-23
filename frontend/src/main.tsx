import { StrictMode, Suspense, lazy, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import "./index.css"
import App from "@src/App"
import { AuthProvider } from "@context/AuthContext"
import { MovieProvider } from "@context/MovieContext"
import styles from "./main.module.css"
import { API_BASE, apiUrl } from "@api"

const Index = lazy(() => import("@pages/index/Index"))
const Login = lazy(() => import("@pages/auth/Login"))
const Register = lazy(() => import("@pages/auth/Register"))
const MovieDetail = lazy(() => import("@pages/movie-detail/MovieDetail"))
const NotFound = lazy(() => import("@pages/not-found"))

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Index /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "movie/:id", element: <MovieDetail /> },
      { path: "*", element: <NotFound /> },
    ],
  },
])

function ServerGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "ok" | "missing" | "down">("checking")
  const [retryKey, setRetryKey] = useState(0)
  useEffect(() => {
    if (!API_BASE) {
      setStatus("missing")
      return
    }
    let cancelled = false
    const ctrl = new AbortController()
    const timer = window.setTimeout(() => ctrl.abort(), 5000)
    ;(async () => {
      try {
        const r = await fetch(apiUrl("/healthz"), { cache: "no-store", signal: ctrl.signal, headers: { Accept: "application/json" } })
        if (cancelled) return
        setStatus(r.ok ? "ok" : "down")
      } catch {
        if (!cancelled) setStatus("down")
      } finally {
        window.clearTimeout(timer)
      }
    })()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      ctrl.abort()
    }
  }, [retryKey])
  if (status === "checking") return <div className={styles.loading}>Loading…</div>
  if (status === "missing") {
    return (
      <div className={styles.loading}>
        <div>
          <h1>Server unavailable</h1>
          <p>Please configure the backend URL and try again.</p>
          <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
            <button onClick={() => setRetryKey(k => k + 1)} style={{ padding: "0.5rem 0.75rem", border: "1px solid hsl(var(--border))", borderRadius: 6 }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }
  if (status === "down") {
    return (
      <div className={styles.loading}>
        <div>
          <h1>Failed to connect to server</h1>
          <p>Check that the backend is running and reachable.</p>
          <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
            <button onClick={() => setRetryKey(k => k + 1)} style={{ padding: "0.5rem 0.75rem", border: "1px solid hsl(var(--border))", borderRadius: 6 }}>
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }
  return <>{children}</>
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <MovieProvider>
        <ServerGate>
          <Suspense fallback={<div className={styles.loading}>Loading…</div>}>
            <RouterProvider router={router} />
          </Suspense>
        </ServerGate>
      </MovieProvider>
    </AuthProvider>
  </StrictMode>
)
