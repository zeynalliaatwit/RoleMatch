import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { BookOpen, Briefcase, FileText, GitBranch, Link2, Mail, MapPin, Pencil, Save, ShieldCheck, X } from 'lucide-react';
import { API_BASE_URL } from '../api/client';
import { getProfile, updateProfile, type UpdateProfileInput, type UserProfile } from '../api/profile';

function profileToForm(profile: UserProfile): UpdateProfileInput {
  return {
    fullName: profile.fullName ?? '',
    location: profile.location ?? '',
    education: profile.education ?? '',
    workExperience: profile.workExperience ?? '',
    linkedinUrl: profile.linkedinUrl ?? '',
    githubUrl: profile.githubUrl ?? '',
    workAuthorization: profile.workAuthorization ?? '',
    skills: profile.skills ?? [],
  };
}

function skillsToText(skills: string[]) {
  return skills.join(', ');
}

function textToSkills(value: string) {
  return value.split(',').map((skill) => skill.trim()).filter(Boolean);
}

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<UpdateProfileInput | null>(null);
  const [skillsText, setSkillsText] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const loadedProfile = await getProfile();
        setProfile(loadedProfile);
        setForm(profileToForm(loadedProfile));
        setSkillsText(skillsToText(loadedProfile.skills ?? []));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, []);

  const handleEdit = () => {
    if (!profile) return;
    setForm(profileToForm(profile));
    setSkillsText(skillsToText(profile.skills ?? []));
    setNotice('');
    setError('');
    setEditing(true);
  };

  const handleCancel = () => {
    if (profile) {
      setForm(profileToForm(profile));
      setSkillsText(skillsToText(profile.skills ?? []));
    }
    setEditing(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const updatedProfile = await updateProfile({
        ...form,
        skills: textToSkills(skillsText),
      });
      const mergedProfile = { ...profile, ...updatedProfile, stats: profile?.stats } as UserProfile;
      setProfile(mergedProfile);
      setForm(profileToForm(mergedProfile));
      setSkillsText(skillsToText(mergedProfile.skills ?? []));
      setEditing(false);
      setNotice('Profile updated.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page">Loading your profile...</div>;
  if (error && !profile) return <div className="page error-banner">{error}</div>;
  if (!profile || !form) return <div className="page">No profile found. Please complete onboarding.</div>;

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
            <button className="button primary" type="button" onClick={handleEdit}>
              <Pencil size={16} aria-hidden="true" />
              Edit profile
            </button>

            {profile.resumeUrl ? (
              <a href={`${API_BASE_URL}${profile.resumeUrl}`} target="_blank" rel="noreferrer" className="button secondary">
                <FileText size={16} aria-hidden="true" />
                View Resume
              </a>
            ) : (
              <button className="button secondary" type="button" disabled title="No resume uploaded">
                <FileText size={16} aria-hidden="true" />
                No Resume
              </button>
            )}
          </div>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="notice-banner">{notice}</div>}

      {editing && (
        <form className="panel profile-edit-form" aria-label="Edit profile" onSubmit={handleSubmit}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">Edit</span>
              <h2>Profile details</h2>
            </div>
          </div>
          <div className="form-grid">
            <label>
              Full name
              <input
                value={form.fullName}
                onChange={(event) => setForm((current) => current ? { ...current, fullName: event.target.value } : current)}
                required
              />
            </label>
            <label>
              Location
              <input
                value={form.location}
                onChange={(event) => setForm((current) => current ? { ...current, location: event.target.value } : current)}
                placeholder="Boston, MA"
              />
            </label>
            <label>
              Education
              <input
                value={form.education}
                onChange={(event) => setForm((current) => current ? { ...current, education: event.target.value } : current)}
              />
            </label>
            <label>
              Work authorization
              <input
                value={form.workAuthorization}
                onChange={(event) => setForm((current) => current ? { ...current, workAuthorization: event.target.value } : current)}
              />
            </label>
            <label>
              LinkedIn
              <input
                value={form.linkedinUrl}
                onChange={(event) => setForm((current) => current ? { ...current, linkedinUrl: event.target.value } : current)}
                placeholder="https://linkedin.com/in/username"
              />
            </label>
            <label>
              GitHub
              <input
                value={form.githubUrl}
                onChange={(event) => setForm((current) => current ? { ...current, githubUrl: event.target.value } : current)}
                placeholder="https://github.com/username"
              />
            </label>
            <label className="field-full">
              Skills
              <input
                value={skillsText}
                onChange={(event) => setSkillsText(event.target.value)}
                placeholder="React, TypeScript, Node.js, PostgreSQL"
              />
            </label>
            <label className="field-full">
              Work experience
              <textarea
                value={form.workExperience}
                onChange={(event) => setForm((current) => current ? { ...current, workExperience: event.target.value } : current)}
                placeholder="Roles, projects, internships, coursework, or tools that should inform job matching"
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="button secondary" type="button" onClick={handleCancel}>
              <X size={16} aria-hidden="true" />
              Cancel
            </button>
            <button className="button primary" type="submit" disabled={saving}>
              <Save size={16} aria-hidden="true" />
              {saving ? 'Saving' : 'Save profile'}
            </button>
          </div>
        </form>
      )}

      <div className="profile-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Background</span>
              <h2>Experience & eligibility</h2>
            </div>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Location</dt>
              <dd><MapPin size={15} aria-hidden="true" /> {profile.location || 'Not provided'}</dd>
            </div>
            <div>
              <dt>Education</dt>
              <dd><BookOpen size={15} aria-hidden="true" /> {profile.education || 'Not provided'}</dd>
            </div>
            <div>
              <dt>Experience</dt>
              <dd><Briefcase size={15} aria-hidden="true" /> {profile.workExperience || 'Not provided'}</dd>
            </div>
            <div>
              <dt>Authorization</dt>
              <dd><ShieldCheck size={15} aria-hidden="true" /> {profile.workAuthorization || 'Not provided'}</dd>
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
              <span className="muted-copy">No skills added yet.</span>
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
                  <span>Uploaded during onboarding</span>
                </div>
                <a href={`${API_BASE_URL}${profile.resumeUrl}`} target="_blank" rel="noreferrer" className="text-link" title="Open Resume">
                  <FileText size={20} aria-hidden="true" />
                </a>
              </article>
            ) : (
              <p className="muted-copy">No documents uploaded yet.</p>
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
              <GitBranch size={18} aria-hidden="true" />
              <span>GitHub</span>
              {profile.githubUrl ? (
                <a href={profile.githubUrl} target="_blank" rel="noreferrer">View profile</a>
              ) : (
                <strong>Not connected</strong>
              )}
            </div>
            <div>
              <Mail size={18} aria-hidden="true" />
              <span>Email tracking</span>
              <strong>Pending OAuth setup</strong>
            </div>
            <div>
              <Link2 size={18} aria-hidden="true" />
              <span>LinkedIn</span>
              {profile.linkedinUrl ? (
                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">View profile</a>
              ) : (
                <strong>Not connected</strong>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
