import { useEffect, useState } from 'react';
import { BookOpen, Briefcase, FileText, GitBranch, Link2, Mail, MapPin, Pencil, ShieldCheck } from 'lucide-react';

// Define the shape of your database profile based on your schema
interface UserProfile {
  fullName: string;
  location: string | null;
  education: string | null;
  workExperience: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  gender: string | null;
  race: string | null;
  veteranStatus: string | null;
  disabilityStatus: string | null;
  workAuthorization: string | null;
  skills: string[] | null;
  targetRoles?: string[];
  resumeUrl: string | null;
}

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('rolematch_token');
        if (!token) throw new Error('No authentication token found.');

        const response = await fetch('http://localhost:5000/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to load profile data.');

        const data = await response.json();
        setProfile(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <div className="page">Loading your profile...</div>;
  if (error) return <div className="page" style={{ color: 'red' }}>{error}</div>;
  if (!profile) return <div className="page">No profile found. Please complete onboarding.</div>;

  return (
      <div className="page">
        <header className="profile-header">
          <div className="profile-avatar" aria-hidden="true">
            {profile.fullName?.split(' ').map((part) => part[0]).slice(0, 2).join('') || 'U'}
          </div>
          <div>
            <span className="eyebrow">Profile</span>
            <h1>{profile.fullName}</h1>
            <p>{profile.education || 'Add your education'} - {profile.location || 'Location not set'}</p>
            <div className="profile-actions">
              <button className="button primary" type="button">
                <Pencil size={16} aria-hidden="true"/>
                Edit profile
              </button>

              {/* NEW: Conditionally render a link to the resume or a disabled button */}
              {profile.resumeUrl ? (
                  <a
                      href={`http://localhost:5000${profile.resumeUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="button secondary"
                      style={{textDecoration: 'none'}}
                  >
                    <FileText size={16} aria-hidden="true"/>
                    View Resume
                  </a>
              ) : (
                  <button className="button secondary" type="button" disabled title="No resume uploaded">
                    <FileText size={16} aria-hidden="true"/>
                    No Resume
                  </button>
              )}
            </div>
          </div>
        </header>

        <div className="profile-grid">
          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Background</span>
                <h2>Experience & Demographics</h2>
              </div>
            </div>
            <dl className="detail-list">
              <div>
                <dt>Location</dt>
                <dd><MapPin size={15} aria-hidden="true"/> {profile.location || 'Not provided'}</dd>
              </div>
              <div>
                <dt>Education</dt>
                <dd><BookOpen size={15} aria-hidden="true"/> {profile.education || 'Not provided'}</dd>
              </div>
              <div>
                <dt>Experience</dt>
                <dd><Briefcase size={15} aria-hidden="true"/> {profile.workExperience || 'Not provided'}</dd>
              </div>
              <div>
                <dt>Authorization</dt>
                <dd><ShieldCheck size={15} aria-hidden="true"/> {profile.workAuthorization || 'Not provided'}</dd>
              </div>
            </dl>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Skills</span>
                <h2>Profile keywords</h2>
              </div>
            </div>
            <div className="tag-row large">
              {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill) => (
                      <span className="tag" key={skill}>{skill}</span>
                  ))
              ) : (
                  <span style={{color: '#667085', fontSize: '0.9rem'}}>No skills added yet.</span>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Documents</span>
                <h2>Application materials</h2>
              </div>
            </div>
            <div className="compact-list">
              {profile.resumeUrl ? (
                  <article className="compact-row">
                    <div>
                      <strong>Primary Resume</strong>
                      <span style={{color: '#667085', fontSize: '0.85rem'}}>Uploaded during onboarding</span>
                    </div>
                    <a
                        href={`http://localhost:5000${profile.resumeUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{color: '#2563eb', display: 'flex', alignItems: 'center'}}
                        title="Open Resume"
                    >
                      <FileText size={20} aria-hidden="true"/>
                    </a>
                  </article>
              ) : (
                  <p style={{color: '#667085', fontSize: '0.9rem'}}>No documents uploaded yet.</p>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Connections</span>
                <h2>Linked accounts</h2>
              </div>
            </div>
            <div className="connection-list">
              <div>
                <GitBranch size={18} aria-hidden="true"/>
                <span>GitHub</span>
                {profile.githubUrl ? (
                    <a href={profile.githubUrl} target="_blank" rel="noreferrer"
                       style={{color: '#2563eb', fontSize: '0.84rem', fontWeight: 600, textDecoration: 'none'}}>View
                      Profile</a>
                ) : (
                    <strong style={{color: '#6B7280'}}>Not connected</strong>
                )}
              </div>
              <div>
                <Mail size={18} aria-hidden="true"/>
                <span>Email Tracking</span>
                <strong style={{color: '#6B7280'}}>Pending OAuth setup</strong>
              </div>
              <div>
                <Link2 size={18} aria-hidden="true"/>
                <span>LinkedIn</span>
                {profile.linkedinUrl ? (
                    <a href={profile.linkedinUrl} target="_blank" rel="noreferrer"
                       style={{color: '#2563eb', fontSize: '0.84rem', fontWeight: 600, textDecoration: 'none'}}>View
                      Profile</a>
                ) : (
                    <strong style={{color: '#6B7280'}}>Not connected</strong>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
  );
}