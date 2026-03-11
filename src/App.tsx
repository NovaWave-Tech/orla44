import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import DashboardPage from './pages/Dashboard'
import AlunosPage from './pages/Alunos'
import ModalidadesPage from './pages/Modalidades'
import { PrivateRoute } from './components/PrivateRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/alunos"
        element={
          <PrivateRoute>
            <AlunosPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/modalidades"
        element={
          <PrivateRoute>
            <ModalidadesPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
