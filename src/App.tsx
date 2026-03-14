import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import DashboardPage from './pages/Dashboard'
import AlunosPage from './pages/Alunos'
import ModalidadesPage from './pages/Modalidades'
import TurmasPage from './pages/Turmas'
import MensalidadesPage from './pages/Mensalidades'
import PresencasPage from './pages/Presencas'
import MensagensPage from './pages/Mensagens'
import GastosPage from './pages/Gastos'
import ConfiguracoesPage from './pages/Configuracoes'
import NotificacoesPage from './pages/Notificacoes'
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
      <Route
        path="/turmas"
        element={
          <PrivateRoute>
            <TurmasPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/mensalidades"
        element={
          <PrivateRoute>
            <MensalidadesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/presencas"
        element={
          <PrivateRoute>
            <PresencasPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/mensagens"
        element={
          <PrivateRoute>
            <MensagensPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/gastos"
        element={
          <PrivateRoute>
            <GastosPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/notificacoes"
        element={
          <PrivateRoute>
            <NotificacoesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <PrivateRoute>
            <ConfiguracoesPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
