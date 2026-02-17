import { useState } from "react"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  return (
    <div className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Login</h1>
      <div className="space-y-2">
        <label className="block text-sm">Email</label>
        <Input value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="block text-sm">Password</label>
        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      </div>
      <Button>Sign in</Button>
    </div>
  )
}

export default Login
