import { useEffect, useState } from 'react'

interface User {
  id: number;
  email: string;
  name: string;
}

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // 1. Fetch Users
  const fetchUsers = () => {
    fetch('http://localhost:3000/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    })
    setName('')
    setEmail('')
    fetchUsers() 
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-blue-400 text-center">ShowUp Vault</h1>
        
        <form onSubmit={addUser} className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8 shadow-lg">
          <div className="mb-4">
            <input 
              className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-white focus:outline-none focus:border-blue-500"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <input 
              className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-white focus:outline-none focus:border-blue-500"
              placeholder="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold transition-all">
            Add to AWS Vault
          </button>
        </form>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-gray-700 pb-2">Database Records</h2>
          {users.map(user => (
            <div key={user.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between">
              <div>
                <p className="font-bold">{user.name}</p>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>
              <div className="text-blue-500">#{user.id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App