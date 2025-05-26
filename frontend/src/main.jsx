import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import AdminPage from './pages/AdminPage.jsx'
import FeaturesPage from './pages/FeaturesPage.jsx'
import HowToUsePage from './pages/HowToUsePage.jsx'
import SupportedPlatformsPage from './pages/SupportedPlatformsPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import EmailVerificationPage from './pages/EmailVerificationPage.jsx'
import EmailVerificationCodePage from './pages/EmailVerificationCodePage.jsx'
import UnauthorizedPage from './pages/UnauthorizedPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import PublicRoute from './components/PublicRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { RoleProvider } from './contexts/RoleContext.jsx'
import './index.css'
import './debug.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RoleProvider>
          <Routes>
            {/* Trang chính không yêu cầu đăng nhập */}
            <Route path="/" element={<App />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/how-to-use" element={<HowToUsePage />} />
            <Route path="/supported-platforms" element={<SupportedPlatformsPage />} />

            {/* Trang lỗi */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Trang yêu cầu đăng nhập */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            } />

            {/* Trang xác thực - chỉ hiển thị khi chưa đăng nhập */}
            <Route path="/login" element={
              <PublicRoute restricted={true}>
                <LoginPage />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute restricted={true}>
                <RegisterPage />
              </PublicRoute>
            } />
            <Route path="/forgot-password" element={
              <PublicRoute restricted={true}>
                <ForgotPasswordPage />
              </PublicRoute>
            } />
            <Route path="/email-verification" element={
              <PublicRoute restricted={false}>
                <EmailVerificationPage />
              </PublicRoute>
            } />
            <Route path="/verify-email-code" element={
              <PublicRoute restricted={false}>
                <EmailVerificationCodePage />
              </PublicRoute>
            } />
          </Routes>
        </RoleProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
