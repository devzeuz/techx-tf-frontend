import React, { useEffect, useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Authenticator } from '@aws-amplify/ui-react'; // Import directly
// import Login from './Login'; // <--- DELETE or COMMENT OUT THIS LINE

// Component Imports
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import CoursePlayer from './CoursePlayer';
import Admin from './Admin';

// Custom Login Header
const components = {
  Header() {
    return (
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '2em', fontWeight: 'bold', color: 'white', letterSpacing: '1px' }}>
            tx
        </span>
      </div>
    );
  }
};

const AuthenticatedApp = ({ user, signOut }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminStatus = async () => {
    try {
      const session = await fetchAuthSession();
      const groups = session.tokens.accessToken.payload['cognito:groups'] || [];
      setIsAdmin(groups.includes('Admin'));
    } catch (e) {
      console.log("Error checking admin status", e);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    if (user) checkAdminStatus();
  }, [user]);

  return (
    <Router>
        {/* HEADER */}
        <nav style={{ padding: '0 40px', height: '70px', background: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.4em', letterSpacing: '0.5px' }}>tx</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                <Link to="/" style={{ color: '#cbd5e1', textDecoration: 'none', fontWeight: '500' }}>Explore</Link>
                <Link to="/dashboard" style={{ color: '#cbd5e1', textDecoration: 'none', fontWeight: '500' }}>My Dashboard</Link>
                
                {isAdmin && (
                    <Link to="/admin" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #fbbf24', padding: '6px 12px', borderRadius: '6px', fontSize: '0.9em' }}>
                        Admin
                    </Link>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '10px', paddingLeft: '20px', borderLeft: '1px solid #334155' }}>
                    <div style={{ width: '32px', height: '32px', background: '#3b82f6', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '0.9em' }}>
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    <button onClick={signOut} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9em' }}>Log out</button>
                </div>
            </div>
        </nav>

        {/* ROUTES */}
        <Routes>
            <Route path="/" element={<LandingPage user={user} />} />
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/learn/:courseId" element={<CoursePlayer user={user} />} />
            <Route path="/admin" element={isAdmin ? <Admin user={user} /> : <LandingPage user={user} />} />
        </Routes>
    </Router>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  return (
    // 1. No <div className="login-container"> wrapper here!
    // 2. We pass the components directly to Authenticator
    <Authenticator components={components}>
      {({ signOut, user }) => (
        <AuthenticatedApp user={user} signOut={signOut} />
      )}
    </Authenticator>
  );
}

export default App;