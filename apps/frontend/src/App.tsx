import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Home, User, Bookmark, Settings, LogOut } from 'lucide-react';
import Profile from './Profile';
import Auth from './Auth';
import ProtectedRoute from './ProtectedRoute';

// Shared styling for the sidebar links
const navLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    textDecoration: 'none',
    color: '#000',
    padding: '12px',
    borderRadius: '8px',
    transition: 'background-color 0.2s'
};

function App() {

    // Clears the token and kicks the user back to the login screen
    const handleLogout = () => {
        localStorage.removeItem('rolematch_token');
        window.location.href = '/auth'; // Force a full reload to clear any residual state
    };

    return (
        <BrowserRouter>
            <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#fafafa', fontFamily: 'sans-serif' }}>

                {/* Left-Hand Navigation Sidebar */}
                <nav style={{
                    width: '244px',
                    borderRight: '1px solid #dbdbdb',
                    backgroundColor: '#fff',
                    padding: '2rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                    <h2 style={{ paddingLeft: '12px', marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '1.5rem' }}>
                        RoleMatch
                    </h2>

                    <Link to="/" style={navLinkStyle}>
                        <Home size={24} /> <span style={{ fontSize: '16px' }}>Dashboard</span>
                    </Link>
                    <Link to="/profile" style={navLinkStyle}>
                        <User size={24} /> <span style={{ fontSize: '16px' }}>Profile</span>
                    </Link>
                    <Link to="/saved" style={navLinkStyle}>
                        <Bookmark size={24} /> <span style={{ fontSize: '16px' }}>Saved Jobs</span>
                    </Link>

                    <div style={{ flexGrow: 1 }} /> {/* Pushes settings & logout to the bottom */}

                    <Link to="/settings" style={navLinkStyle}>
                        <Settings size={24} /> <span style={{ fontSize: '16px' }}>Settings</span>
                    </Link>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        style={{ ...navLinkStyle, background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', color: '#ed4956' }}
                    >
                        <LogOut size={24} /> <span style={{ fontSize: '16px' }}>Log Out</span>
                    </button>
                </nav>

                {/* Main Content Area */}
                <main style={{ flex: 1, overflowY: 'auto' }}>
                    <Routes>

                        {/* Public Auth Route */}
                        <Route path="/auth" element={<Auth />} />

                        {/* Protected Routes Wrapper */}
                        <Route element={<ProtectedRoute />}>

                            <Route path="/" element={
                                <div style={{ padding: '4rem', textAlign: 'center' }}>
                                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>RoleMatch Dashboard</h1>
                                    <p style={{ color: '#737373' }}>Welcome to your job application assistant.</p>
                                </div>
                            } />

                            <Route path="/profile" element={<Profile />} />

                        </Route>

                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;