import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { useAuth } from "../context/AuthContext"
import { toast } from "../hooks/use-toast"
import { Film } from "lucide-react"

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
    <div className="min-h-screen flex items-center justify-center bg-background hero-gradient px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 text-center">
          <Link to="/" className="mb-4 inline-flex items-center gap-2">
            <Film size={28} className="text-[hsl(var(--primary))]" />
            <span className="font-display text-2xl font-bold gold-text">MovieShelf</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-foreground">Create an account</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Join to review movies</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Creating..." : "Create Account"}</Button>
        </form>
        <p className="mt-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Already have an account? <Link to="/login" className="text-[hsl(var(--primary))] hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
