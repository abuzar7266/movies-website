import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { useAuth } from "../context/AuthContext"
import { toast } from "../hooks/use-toast"
import { Film } from "lucide-react"
import styles from "./AuthPage.module.css"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const res = await login(email, password)
    setSubmitting(false)
    if (res.ok) {
      toast.success("Welcome back")
      navigate("/")
    } else {
      if (res.reason === "not_found") toast.error("User not found")
      else if (res.reason === "wrong_password") toast.error("Incorrect password")
      else toast.error("Invalid credentials")
    }
    return res.ok
  }
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link to="/" className={styles.brandLink}>
            <Film size={28} className={styles.brandIcon} />
            <span className={styles.brandText}>MovieShelf</span>
          </Link>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to your account</p>
        </div>
        <form onSubmit={onSubmit} className={styles.form}>
          <div>
            <label className={styles.label}>Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div>
            <label className={styles.label}>Password</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <Button type="submit" className={styles.fullWidth} disabled={submitting}>{submitting ? "Signing in..." : "Sign In"}</Button>
        </form>
        <p className={styles.footer}>
          Don&apos;t have an account? <Link to="/register" className={styles.footerLink}>Register</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
