import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Input } from "../../components/ui/input"
import { Button } from "../../components/ui/button"
import { useAuth } from "../../context/AuthContext"
import { toast } from "../../hooks/use-toast"
import { Film } from "lucide-react"
import styles from "./AuthPage.module.css"

function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const ok = await register(name, email, password)
    setSubmitting(false)
    if (ok) {
      toast.success("Account created")
      navigate("/")
    } else {
      toast.error("Email already registered")
    }
    return ok
  }
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link to="/" className={styles.brandLink}>
            <Film size={28} className={styles.brandIcon} />
            <span className={styles.brandText}>MovieShelf</span>
          </Link>
          <h1 className={styles.title}>Create an account</h1>
          <p className={styles.subtitle}>Join to review movies</p>
        </div>
        <form onSubmit={onSubmit} className={styles.form}>
          <div>
            <label className={styles.label}>Full Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
          </div>
          <div>
            <label className={styles.label}>Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div>
            <label className={styles.label}>Password</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <Button type="submit" className={styles.fullWidth} disabled={submitting}>{submitting ? "Creating..." : "Create Account"}</Button>
        </form>
        <p className={styles.footer}>
          Already have an account? <Link to="/login" className={styles.footerLink}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
