import { useState } from "react"

function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  return (
    <div className="max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Register</h1>
      <div className="space-y-2">
        <label className="block text-sm">Name</label>
        <input className="w-full rounded border px-3 py-2" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="block text-sm">Email</label>
        <input className="w-full rounded border px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="block text-sm">Password</label>
        <input type="password" className="w-full rounded border px-3 py-2" value={password} onChange={e => setPassword(e.target.value)} />
      </div>
      <button className="rounded bg-indigo-600 px-4 py-2 text-white">Create account</button>
    </div>
  )
}

export default Register
