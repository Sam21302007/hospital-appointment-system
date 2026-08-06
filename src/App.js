import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './styles/global.css';

// Protected route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading MedCare...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect to correct dashboard
    if (profile.role === 'admin') return <Navigate to="/admin" replace />;
    if (profile.role === 'doctor') return <Navigate to="/doctor" replace />;
    return <Navigate to="/patient" replace />;
  }

  return children;
};

// Public route (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (user && profile) {
    if (profile.role === 'admin') return <Navigate to="/admin" replace />;
    if (profile.role === 'doctor') return <Navigate to="/doctor" replace />;
    return <Navigate to="/patient" replace />;
  }

  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
    <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
    <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const DatabaseStatusBanner = () => {
  const { isConfigured } = useAuth();
  const [showModal, setShowModal] = React.useState(false);

  if (isConfigured) return null;

  return (
    <>
      <div style={{
        background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
        color: '#fff',
        padding: '10px 24px',
        textAlign: 'center',
        fontSize: '13px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        position: 'sticky',
        top: 0,
        zIndex: 2000,
        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)',
      }}>
        <span>⚠️ DATABASE CONNECTION REQUIRED: Supabase is not connected yet.</span>
        <button 
          onClick={() => setShowModal(true)}
          style={{
            background: '#fff',
            color: '#ef4444',
            border: 'none',
            padding: '4px 12px',
            borderRadius: '20px',
            fontWeight: '800',
            cursor: 'pointer',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          View Setup Steps
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🛠️ Connect Your Supabase Database</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              <p>To use authentication, booking, and analytics, connect your free Supabase database:</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>1. Create Supabase Project</strong>
                <span style={{ fontSize: '13px' }}>Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)' }}>supabase.com</a>, sign up/login, and create a new project.</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>2. Create Database Tables</strong>
                <span style={{ fontSize: '13px' }}>Go to the <b>SQL Editor</b> in your Supabase dashboard, click "New query", paste the contents of the <code>supabase_schema.sql</code> file (located in the root of this project), and click <b>Run</b>.</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>3. Set Environment Variables</strong>
                <span style={{ fontSize: '13px' }}>In the root of this project, create or open the <code>.env</code> file and fill in your Supabase Project URL and Public Anon Key:</span>
                <pre style={{
                  background: 'var(--bg-input)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  border: '1px solid var(--border)',
                  color: 'var(--primary-light)',
                  overflowX: 'auto',
                }}>
{`REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-public-key`}
                </pre>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>4. Restart the App</strong>
                <span style={{ fontSize: '13px' }}>Restart this terminal process (or redeploy to Vercel) for React to load the new credentials. The warning banner will disappear immediately!</span>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>Got it!</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <DatabaseStatusBanner />
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1a1a3e',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
