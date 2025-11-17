import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'

const roleHome = {
  secretario: '/secretario',
  paciente: '/paciente',
  profissional: '/profissional',
}

export default function RequireRole({ allowed = [] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!allowed.includes(user.role)) {
    return <Navigate to={roleHome[user.role] || '/'} replace />
  }
  return <Outlet />
}
