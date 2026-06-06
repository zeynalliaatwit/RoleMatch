import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [step, setStep] = useState(1);
    const navigate = useNavigate();

    // Step 1 State: Credentials
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    // Step 2 State: Comprehensive Onboarding
    const [resumeFile, setResumeFile] = useState<File | null>(null); // NEW: Resume file state
    const [dob, setDob] = useState('');
    const [education, setEducation] = useState('');
    const [location, setLocation] = useState('');
    const [workExperience, setWorkExperience] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [gender, setGender] = useState('');
    const [race, setRace] = useState('');
    const [workAuthorization, setWorkAuthorization] = useState('');
    const [veteranStatus, setVeteranStatus] = useState('');
    const [disabilityStatus, setDisabilityStatus] = useState('');

    const [error, setError] = useState('');

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isLogin && password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const payload = isLogin ? { email, password } : { email, password, firstName, lastName };

        try {
            const response = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Unable to complete request.');

            localStorage.setItem('rolematch_token', data.token);

            if (isLogin) {
                navigate('/');
            } else {
                setStep(2);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unable to complete request.');
        }
    };

    const handleOnboardingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const token = localStorage.getItem('rolematch_token');

        try {
            // 1. Build a FormData object to handle both text fields and the file
            const formData = new FormData();

            if (resumeFile) formData.append('resume', resumeFile);
            formData.append('dob', dob);
            formData.append('education', education);
            formData.append('location', location);
            formData.append('workExperience', workExperience);
            formData.append('linkedinUrl', linkedinUrl);
            formData.append('githubUrl', githubUrl);
            formData.append('gender', gender);
            formData.append('race', race);
            formData.append('workAuthorization', workAuthorization);
            formData.append('veteranStatus', veteranStatus);
            formData.append('disabilityStatus', disabilityStatus);

            const response = await fetch('http://localhost:5000/api/profile/onboarding', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // CRITICAL: Do NOT manually set 'Content-Type' here.
                    // The browser will automatically set it to 'multipart/form-data'
                    // and append the correct boundary for the file.
                },
                body: formData
            });

            if (!response.ok) throw new Error('Failed to save profile setup.');
            navigate('/');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unable to complete request.');
        }
    };

    // Modernized input and select styling
    const inputStyle = {
        padding: '11px 14px',
        backgroundColor: '#ffffff',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '15px',
        width: '100%',
        boxSizing: 'border-box' as const,
        color: '#111827',
        transition: 'border-color 0.2s, box-shadow 0.2s'
    };
    const selectStyle = { ...inputStyle, cursor: 'pointer' };

    return (
        // OUTER WRAPPER: Changed to minHeight and added padding so the page naturally scrolls
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            width: '100%',
            justifyContent: 'center',
            backgroundColor: '#f9fafb', // Modern light gray background
            padding: '3rem 1rem', // Gives breathing room at the top and bottom during scroll
            boxSizing: 'border-box'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

                {/* MAIN CARD: Removed maxHeight and overflow, added modern shadow and rounding */}
                <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #eaedf2',
                    borderRadius: '16px',
                    padding: '3rem 2.5rem',
                    width: '100%',
                    maxWidth: step === 2 ? '540px' : '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
                    boxSizing: 'border-box'
                }}>
                    <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: '2.2rem', marginBottom: '1.5rem', fontWeight: '800', textAlign: 'center', color: '#111827' }}>RoleMatch</h1>

                    {step === 1 ? (
                        <>
                            {!isLogin && <p style={{ color: '#6B7280', fontSize: '16px', fontWeight: '500', textAlign: 'center', marginBottom: '1.5rem' }}>Sign up to centralize your job search.</p>}
                            <form onSubmit={handleAuthSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {!isLogin && (
                                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                        <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required style={inputStyle} />
                                        <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required style={inputStyle} />
                                    </div>
                                )}
                                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
                                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />

                                {!isLogin && (
                                    <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={inputStyle} />
                                )}

                                <button type="submit" style={{ marginTop: '10px', padding: '12px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s ease' }}>
                                    {isLogin ? 'Log in' : 'Create account'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <p style={{
                                color: '#6B7280',
                                fontSize: '16px',
                                fontWeight: '500',
                                textAlign: 'center',
                                marginBottom: '2.5rem'
                            }}>Welcome! Let's build your unified application profile.</p>
                            <form onSubmit={handleOnboardingSubmit}
                                  style={{width: '100%', display: 'flex', flexDirection: 'column', gap: '20px'}}>

                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    padding: '16px',
                                    backgroundColor: '#F3F4F6',
                                    borderRadius: '8px',
                                    border: '1px dashed #D1D5DB'
                                }}>
                                    <label style={{fontSize: '14px', fontWeight: '700', color: '#111827'}}>
                                        Upload Resume (PDF, DOCX)
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                                        required
                                        style={{fontSize: '14px', color: '#4B5563', cursor: 'pointer'}}
                                    />
                                    {resumeFile && (
                                        <span style={{fontSize: '13px', color: '#047857', fontWeight: '600'}}>
                Attached: {resumeFile.name}
            </span>
                                    )}
                                </div>

                                {/* 1. Date of Birth */}
                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                    <label style={{fontSize: '14px', fontWeight: '600', color: '#374151'}}>Date of
                                        Birth</label>
                                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                                           style={inputStyle} required/>
                                </div>

                                {/* 2. Location */}
                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                    <label style={{fontSize: '14px', fontWeight: '600', color: '#374151'}}>Location
                                        (City, State)</label>
                                    <input type="text" placeholder="e.g., Boston, MA" value={location}
                                           onChange={(e) => setLocation(e.target.value)} style={inputStyle} required/>
                                </div>

                                {/* 3. Education */}
                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                    <label style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#374151'
                                    }}>Education</label>
                                    <input type="text" placeholder="e.g., B.S. Computer Science" value={education}
                                           onChange={(e) => setEducation(e.target.value)} style={inputStyle} required/>
                                </div>

                                {/* 4. Work Experience */}
                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                    <label style={{fontSize: '14px', fontWeight: '600', color: '#374151'}}>Work
                                        Experience</label>
                                    <input type="text" placeholder="Current or past roles, companies, or projects"
                                           value={workExperience} onChange={(e) => setWorkExperience(e.target.value)}
                                           style={inputStyle} required/>
                                </div>

                                {/* 5. LinkedIn Field */}
                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                    <label style={{fontSize: '14px', fontWeight: '600', color: '#374151'}}>LinkedIn
                                        Profile URL</label>
                                    <input type="text" placeholder="https://linkedin.com/in/username"
                                           value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)}
                                           style={inputStyle} required/>
                                </div>

                                {/* 6. GitHub Field */}
                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                    <label style={{fontSize: '14px', fontWeight: '600', color: '#374151'}}>GitHub
                                        Profile URL</label>
                                    <input type="text" placeholder="https://github.com/username" value={githubUrl}
                                           onChange={(e) => setGithubUrl(e.target.value)} style={inputStyle} required/>
                                </div>

                                {/* 7. Gender */}
                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                    <label
                                        style={{fontSize: '14px', fontWeight: '600', color: '#374151'}}>Gender</label>
                                    <select value={gender} onChange={(e) => setGender(e.target.value)}
                                            style={selectStyle} required>
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Non-binary">Non-binary</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>

                                {/* 8. Race */}
                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                    <label style={{fontSize: '14px', fontWeight: '600', color: '#374151'}}>Race /
                                        Ethnicity</label>
                                    <select value={race} onChange={(e) => setRace(e.target.value)} style={selectStyle}
                                            required>
                                        <option value="">Select Race/Ethnicity</option>
                                        <option value="Asian">Asian</option>
                                        <option value="Black or African American">Black or African American</option>
                                        <option value="Hispanic or Latino">Hispanic or Latino</option>
                                        <option value="White">White</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>

                                {/* 9. Work Auth */}
                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                    <label style={{fontSize: '14px', fontWeight: '600', color: '#374151'}}>Work
                                        Authorization Status</label>
                                    <select value={workAuthorization}
                                            onChange={(e) => setWorkAuthorization(e.target.value)} style={selectStyle}
                                            required>
                                        <option value="">Select status</option>
                                        <option value="Citizen/Permanent Resident">Citizen / Permanent Resident</option>
                                        <option value="Require Sponsorship">Will require sponsorship now or in the
                                            future
                                        </option>
                                        <option value="Authorized (No sponsorship needed)">Authorized to work (No
                                            sponsorship needed)
                                        </option>
                                    </select>
                                </div>

                                {/* 10. Veteran Status */}
                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                    <label style={{fontSize: '14px', fontWeight: '600', color: '#374151'}}>Veteran
                                        Status</label>
                                    <select value={veteranStatus} onChange={(e) => setVeteranStatus(e.target.value)}
                                            style={selectStyle} required>
                                        <option value="">Select status</option>
                                        <option value="Not a veteran">I am not a protected veteran</option>
                                        <option value="Veteran">I identify as one or more of the classifications of
                                            protected veteran
                                        </option>
                                        <option value="Prefer not to say">I don't wish to answer</option>
                                    </select>
                                </div>

                                {/* 11. Disability Check */}
                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                    <label style={{fontSize: '14px', fontWeight: '600', color: '#374151'}}>Disability
                                        Status</label>
                                    <select value={disabilityStatus}
                                            onChange={(e) => setDisabilityStatus(e.target.value)} style={selectStyle}
                                            required>
                                        <option value="">Select status</option>
                                        <option value="No">No, I don't have a disability</option>
                                        <option value="Yes">Yes, I have a disability</option>
                                        <option value="Prefer not to say">I don't wish to answer</option>
                                    </select>
                                </div>

                                <button type="submit" style={{
                                    marginTop: '14px',
                                    padding: '14px',
                                    backgroundColor: '#047857',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    boxShadow: '0 4px 6px -1px rgba(4, 120, 87, 0.2)'
                                }}>
                                    Save & Go to Dashboard
                                </button>
                            </form>
                        </>
                    )}

                    {error && <p style={{
                        color: '#DC2626',
                        fontSize: '14px',
                        marginTop: '1.5rem',
                        textAlign: 'center',
                        backgroundColor: '#FEF2F2',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #F87171'
                    }}>{error}</p>}
                </div>

                {/* Toggle Login/Signup Card (Only show on Step 1) */}
                {step === 1 && (
                    <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #eaedf2',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        width: '100%',
                        maxWidth: '400px',
                        marginTop: '16px',
                        textAlign: 'center',
                        fontSize: '15px',
                        color: '#4B5563',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
                    }}>
                        {isLogin ? "Don't have an account? " : "Have an account? "}
                        <span onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }} style={{color: '#2563eb', fontWeight: '600', cursor: 'pointer'}}>
                            {isLogin ? 'Sign up' : 'Log in'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}