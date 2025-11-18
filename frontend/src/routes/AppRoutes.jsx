import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import CreatePasswordPage from '../pages/CreatePasswordPage.jsx'
import SecretaryDashboard from '../pages/SecretaryDashboard.jsx'
import PatientHomePage from '../pages/PatientHomePage.jsx'
import ProfessionalHomePage from '../pages/ProfessionalHomePage.jsx'
import PatientDocumentQualificationPage from '../pages/PatientDocumentQualificationPage.jsx'
import RequireAuth from './guards/RequireAuth.jsx'
import RequireRole from './guards/RequireRole.jsx'
import { useAuth } from '../hooks/useAuth.js'

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const map = { secretario: '/secretario', paciente: '/paciente', profissional: '/profissional' }
  return <Navigate to={map[user.role] || '/login'} replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/definir-senha" element={<CreatePasswordPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeRedirect />} />

          <Route element={<RequireRole allowed={["secretario"]} />}>
            <Route path="/secretario" element={<SecretaryDashboard />} />
          </Route>

          <Route element={<RequireRole allowed={["paciente"]} />}>
            <Route path="/paciente" element={<PatientHomePage />} />
          </Route>

          <Route element={<RequireRole allowed={["profissional"]} />}>
            <Route path="/profissional" element={<ProfessionalHomePage />} />
            <Route path="/paciente/qualificacao-documento/:documentoId?" element={<PatientDocumentQualificationPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
