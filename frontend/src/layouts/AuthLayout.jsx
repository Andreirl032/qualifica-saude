import { Outlet, Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="btn btn-ghost text-2xl">Qualifica Saúde</Link>
        </div>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
