import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-700 shadow">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost text-xl">Qualifica Saúde</Link>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <span className="badge badge-outline capitalize">{user.role}</span>
          )}
          <button className="btn btn-sm" onClick={logout}>Sair</button>
        </div>
      </div>
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
