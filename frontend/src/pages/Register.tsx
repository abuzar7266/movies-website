import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { useAuth } from "../context/AuthContext"
import { toast } from "../hooks/use-toast"

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
    <form onSubmit={onSubmit} className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Register</h1>
      <div className="space-y-2">
        <label className="block text-sm">Name</label>
        <Input value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <label className="block text-sm">Email</label>
        <Input value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <label className="block text-sm">Password</label>
        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </div>
      <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create account"}</Button>
    </form>
  )
}

export default Register
