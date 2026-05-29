import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dob, setDob] = useState('');

    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        // Send different data depending on if they are logging in or signing up
        const payload = isLogin
            ? { email, password }
            : { email, password, firstName, lastName, dob };

        try {
            const response = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Unable to complete request.');

            if (isLogin) {
                localStorage.setItem('rolematch_token', data.token);
                navigate('/');
            } else {
                setIsLogin(true);
                // Clear registration fields
                setFirstName(''); setLastName(''); setDob(''); setPassword('');
                alert("Registration successful! Please log in.");
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unable to complete request.');
        }
    };

    // Shared input styling
    const inputStyle = { padding: '9px 8px', backgroundColor: '#fafafa', border: '1px solid #dbdbdb', borderRadius: '3px', fontSize: '14px', width: '100%', boxSizing: 'border-box' as const };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                {/* Main Card */}
                <div style={{ backgroundColor: '#fff', border: '1px solid #dbdbdb', padding: '3rem 2.5rem', width: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h1 style={{ fontFamily: 'sans-serif', fontSize: '2rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>RoleMatch</h1>

                    {!isLogin && (
                        <p style={{ color: '#737373', fontSize: '16px', fontWeight: '600', textAlign: 'center', marginBottom: '1.5rem', lineHeight: '1.3' }}>
                            Sign up to track your job applications.
                        </p>
                    )}

                    <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>

                        {/* Fields only visible during Registration */}
                        {!isLogin && (
                            <>
                                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                        style={inputStyle}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                        style={inputStyle}
                                    />
                                </div>

                                <input
                                    type="date"
                                    title="Date of Birth"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    required
                                    style={{ ...inputStyle, color: dob ? '#000' : '#737373' }}
                                />
                            </>
                        )}

                        {/* Always visible fields */}
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={inputStyle}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={inputStyle}
                        />

                        <button type="submit" style={{ marginTop: '10px', padding: '8px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                            {isLogin ? 'Log in' : 'Sign up'}
                        </button>
                    </form>

                    {error && <p style={{ color: '#ed4956', fontSize: '14px', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
                </div>

                {/* Toggle Card */}
                <div style={{ backgroundColor: '#fff', border: '1px solid #dbdbdb', padding: '1.5rem', width: '350px', marginTop: '10px', textAlign: 'center', fontSize: '14px' }}>
                    {isLogin ? "Don't have an account? " : "Have an account? "}
                    <span
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        style={{ color: '#2563eb', fontWeight: '600', cursor: 'pointer' }}
                    >
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
                </div>

            </div>
        </div>
    );
}
