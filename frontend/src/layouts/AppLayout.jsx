import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-700 shadow flex relative">
          <Link to="/" className="btn btn-ghost text-xl absolute left-1/2 transform -translate-x-1/2">Qualifica Saúde</Link>
        <div className="flex items-center gap-3 ml-auto mr-5">
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
