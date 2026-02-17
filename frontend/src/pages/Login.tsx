import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { useAuth } from "../context/AuthContext"
import { toast } from "../hooks/use-toast"
import { Film } from "lucide-react"

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
    <div className="min-h-screen flex items-center justify-center bg-background hero-gradient px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 text-center">
          <Link to="/" className="mb-4 inline-flex items-center gap-2">
            <Film size={28} className="text-[hsl(var(--primary))]" />
            <span className="font-display text-2xl font-bold gold-text">MovieShelf</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Sign in to your account</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Signing in..." : "Sign In"}</Button>
        </form>
        <p className="mt-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Don&apos;t have an account? <Link to="/register" className="text-[hsl(var(--primary))] hover:underline font-medium">Register</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
