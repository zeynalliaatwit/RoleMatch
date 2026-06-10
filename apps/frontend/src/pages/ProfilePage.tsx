import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { ReactNode } from 'react';
import {
  BadgeCheck,
  BookOpen,
  Briefcase,
  FileText,
  GitBranch,
  GraduationCap,
  Link2,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import { API_BASE_URL } from '../api/client';
import {
  getProfile,
  updateProfile,
  uploadProfileDocument,
  type AutofillAnswers,
  type CertificationEntry,
  type EducationEntry,
  type ProjectEntry,
  type UpdateProfileInput,
  type UserProfile,
  type WorkHistoryEntry,
} from '../api/profile';

function textToList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function listToText(value?: string[] | null) {
  return (value ?? []).join(', ');
}

function blankEducation(): EducationEntry {
  return { school: '', degree: '', field: '', location: '', startDate: '', endDate: '', gpa: '', notes: '', courses: [] };
}

function blankWork(): WorkHistoryEntry {
  return { company: '', title: '', location: '', startDate: '', endDate: '', current: false, highlights: [], skills: [] };
}

function blankProject(): ProjectEntry {
  return { name: '', role: '', url: '', description: '', technologies: [] };
}

function blankCertification(): CertificationEntry {
  return { name: '', issuer: '', issuedAt: '', expiresAt: '' };
}

function profileToForm(profile: UserProfile): UpdateProfileInput {
  return {
    fullName: profile.fullName ?? '',
    phone: profile.phone ?? '',
    location: profile.location ?? '',
    education: profile.education ?? '',
    workExperience: profile.workExperience ?? '',
    linkedinUrl: profile.linkedinUrl ?? '',
    githubUrl: profile.githubUrl ?? '',
    portfolioUrl: profile.portfolioUrl ?? '',
    indeedUrl: profile.indeedUrl ?? '',
    workAuthorization: profile.workAuthorization ?? '',
    veteranStatus: profile.veteranStatus ?? '',
    disabilityStatus: profile.disabilityStatus ?? '',
    gender: profile.gender ?? '',
    race: profile.race ?? '',
    salaryMinimum: profile.salaryMinimum ?? '',
    skills: profile.skills ?? [],
    targetRoles: profile.targetRoles ?? [],
    preferredLocations: profile.preferredLocations ?? [],
    relevantCourses: profile.relevantCourses ?? [],
    portfolioLinks: profile.portfolioLinks ?? [],
    educationHistory: profile.educationHistory?.length ? profile.educationHistory : [blankEducation()],
    workHistory: profile.workHistory?.length ? profile.workHistory : [blankWork()],
    projectHistory: profile.projectHistory?.length ? profile.projectHistory : [blankProject()],
    certifications: profile.certifications?.length ? profile.certifications : [blankCertification()],
    autofillAnswers: profile.autofillAnswers ?? {},
  };
}

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<UpdateProfileInput | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState('resume');
  const [documentLabel, setDocumentLabel] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const loadedProfile = await getProfile();
        setProfile(loadedProfile);
        setForm(profileToForm(loadedProfile));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, []);

  const documentCounts = useMemo(() => {
    const documents = profile?.documents ?? [];
    return {
      total: documents.length,
      resumes: documents.filter((document) => document.documentType === 'resume').length,
      templates: documents.filter((document) => document.documentType === 'cover-letter-template').length,
    };
  }, [profile?.documents]);

  const updateForm = <Key extends keyof UpdateProfileInput>(key: Key, value: UpdateProfileInput[Key]) => {
    setForm((current) => current ? { ...current, [key]: value } : current);
  };

  const updateAutofill = (key: keyof AutofillAnswers, value: string) => {
    setForm((current) => current ? {
      ...current,
      autofillAnswers: { ...current.autofillAnswers, [key]: value },
    } : current);
  };

  const handleEdit = () => {
    if (!profile) return;
    setForm(profileToForm(profile));
    setNotice('');
    setError('');
    setEditing(true);
  };

  const handleCancel = () => {
    if (profile) setForm(profileToForm(profile));
    setEditing(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const updatedProfile = await updateProfile(form);
      const mergedProfile = { ...profile, ...updatedProfile, documents: profile?.documents ?? [], stats: profile?.stats } as UserProfile;
      setProfile(mergedProfile);
      setForm(profileToForm(mergedProfile));
      setEditing(false);
      setNotice('Profile updated.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!documentFile) return;

    setUploading(true);
    setError('');
    setNotice('');

    try {
      const document = await uploadProfileDocument(documentFile, documentType, documentLabel || documentFile.name);
      setProfile((current) => current ? {
        ...current,
        resumeUrl: document.documentType === 'resume' ? document.fileUrl : current.resumeUrl,
        documents: [document, ...(current.documents ?? [])],
      } : current);
      setDocumentLabel('');
      setDocumentFile(null);
      setFileInputKey((current) => current + 1);
      setNotice('Document uploaded.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to upload document.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="page">Loading your profile...</div>;
  if (error && !profile) return <div className="page error-banner">{error}</div>;
  if (!profile || !form) return <div className="page">No profile found. Please complete onboarding.</div>;

  return (
    <div className="page profile-page">
      <header className="profile-header profile-hero">
        <div className="profile-avatar" aria-hidden="true">
          {profile.fullName?.split(' ').map((part) => part[0]).slice(0, 2).join('') || 'U'}
        </div>
        <div className="profile-title">
          <span className="eyebrow">Profile</span>
          <h1>{profile.fullName}</h1>
          <p>{profile.targetRoles?.[0] || profile.education || 'Add target roles'} - {profile.location || 'Location not set'}</p>
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
        <div className="profile-signal-card" aria-label="Profile completeness">
          <span>{documentCounts.total} docs</span>
          <strong>{profile.skills?.length ?? 0}</strong>
          <small>skills indexed</small>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="notice-banner">{notice}</div>}

      {editing && (
        <form className="panel profile-edit-form profile-editor" aria-label="Edit profile" onSubmit={handleSubmit}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">Edit</span>
              <h2>Candidate profile</h2>
            </div>
            <div className="form-actions compact-actions">
              <button className="button secondary" type="button" onClick={handleCancel}>
                <X size={16} aria-hidden="true" />
                Cancel
              </button>
              <button className="button primary" type="submit" disabled={saving}>
                <Save size={16} aria-hidden="true" />
                {saving ? 'Saving' : 'Save profile'}
              </button>
            </div>
          </div>

          <section className="editor-section">
            <span className="eyebrow">Identity</span>
            <div className="form-grid">
              <label>Full name<input value={form.fullName} onChange={(event) => updateForm('fullName', event.target.value)} required /></label>
              <label>Phone<input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} /></label>
              <label>Location<input value={form.location} onChange={(event) => updateForm('location', event.target.value)} placeholder="Boston, MA" /></label>
              <label>Work authorization<input value={form.workAuthorization} onChange={(event) => updateForm('workAuthorization', event.target.value)} /></label>
              <label>LinkedIn<input value={form.linkedinUrl} onChange={(event) => updateForm('linkedinUrl', event.target.value)} placeholder="https://linkedin.com/in/username" /></label>
              <label>GitHub<input value={form.githubUrl} onChange={(event) => updateForm('githubUrl', event.target.value)} placeholder="https://github.com/username" /></label>
              <label>Portfolio<input value={form.portfolioUrl} onChange={(event) => updateForm('portfolioUrl', event.target.value)} /></label>
              <label>Indeed<input value={form.indeedUrl} onChange={(event) => updateForm('indeedUrl', event.target.value)} /></label>
            </div>
          </section>

          <section className="editor-section">
            <span className="eyebrow">Targeting</span>
            <div className="form-grid">
              <CommaField label="Target roles" value={form.targetRoles} onChange={(value) => updateForm('targetRoles', value)} placeholder="Software Engineer, Full Stack Developer" />
              <CommaField label="Preferred locations" value={form.preferredLocations} onChange={(value) => updateForm('preferredLocations', value)} placeholder="Boston, Austin, Remote" />
              <CommaField label="Skills" value={form.skills} onChange={(value) => updateForm('skills', value)} placeholder="React, TypeScript, Node.js, PostgreSQL" />
              <CommaField label="Relevant courses" value={form.relevantCourses} onChange={(value) => updateForm('relevantCourses', value)} placeholder="Algorithms, Databases, Software Engineering" />
              <CommaField label="Portfolio links" value={form.portfolioLinks} onChange={(value) => updateForm('portfolioLinks', value)} placeholder="https://..." />
              <label>Minimum salary<input value={form.salaryMinimum} onChange={(event) => updateForm('salaryMinimum', event.target.value)} placeholder="$70,000" /></label>
            </div>
          </section>

          <EditorList title="Education" onAdd={() => updateForm('educationHistory', [...form.educationHistory, blankEducation()])}>
            {form.educationHistory.map((entry, index) => (
              <article className="nested-editor" key={`education-${index}`}>
                <div className="nested-editor-header">
                  <strong>Education {index + 1}</strong>
                  <button className="icon-button" type="button" title="Remove education" onClick={() => updateForm('educationHistory', form.educationHistory.filter((_, itemIndex) => itemIndex !== index))}>
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="form-grid">
                  <label>School<input value={entry.school} onChange={(event) => updateEducation(index, { school: event.target.value })} /></label>
                  <label>Degree<input value={entry.degree} onChange={(event) => updateEducation(index, { degree: event.target.value })} /></label>
                  <label>Field<input value={entry.field} onChange={(event) => updateEducation(index, { field: event.target.value })} /></label>
                  <label>Location<input value={entry.location ?? ''} onChange={(event) => updateEducation(index, { location: event.target.value })} /></label>
                  <label>Start<input value={entry.startDate ?? ''} onChange={(event) => updateEducation(index, { startDate: event.target.value })} placeholder="Sep 2022" /></label>
                  <label>End<input value={entry.endDate ?? ''} onChange={(event) => updateEducation(index, { endDate: event.target.value })} placeholder="May 2026" /></label>
                  <label>GPA<input value={entry.gpa ?? ''} onChange={(event) => updateEducation(index, { gpa: event.target.value })} /></label>
                  <CommaField label="Courses" value={entry.courses ?? []} onChange={(value) => updateEducation(index, { courses: value })} />
                  <label className="field-full">Notes<textarea value={entry.notes ?? ''} onChange={(event) => updateEducation(index, { notes: event.target.value })} /></label>
                </div>
              </article>
            ))}
          </EditorList>

          <EditorList title="Work history" onAdd={() => updateForm('workHistory', [...form.workHistory, blankWork()])}>
            {form.workHistory.map((entry, index) => (
              <article className="nested-editor" key={`work-${index}`}>
                <div className="nested-editor-header">
                  <strong>Experience {index + 1}</strong>
                  <button className="icon-button" type="button" title="Remove experience" onClick={() => updateForm('workHistory', form.workHistory.filter((_, itemIndex) => itemIndex !== index))}>
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="form-grid">
                  <label>Company<input value={entry.company} onChange={(event) => updateWork(index, { company: event.target.value })} /></label>
                  <label>Title<input value={entry.title} onChange={(event) => updateWork(index, { title: event.target.value })} /></label>
                  <label>Location<input value={entry.location ?? ''} onChange={(event) => updateWork(index, { location: event.target.value })} /></label>
                  <label>Start<input value={entry.startDate ?? ''} onChange={(event) => updateWork(index, { startDate: event.target.value })} /></label>
                  <label>End<input value={entry.endDate ?? ''} onChange={(event) => updateWork(index, { endDate: event.target.value })} /></label>
                  <label className="checkbox-control inline-check"><input type="checkbox" checked={Boolean(entry.current)} onChange={(event) => updateWork(index, { current: event.target.checked })} /> Current role</label>
                  <CommaField label="Highlights" value={entry.highlights ?? []} onChange={(value) => updateWork(index, { highlights: value })} />
                  <CommaField label="Skills used" value={entry.skills ?? []} onChange={(value) => updateWork(index, { skills: value })} />
                </div>
              </article>
            ))}
          </EditorList>

          <EditorList title="Projects" onAdd={() => updateForm('projectHistory', [...form.projectHistory, blankProject()])}>
            {form.projectHistory.map((entry, index) => (
              <article className="nested-editor" key={`project-${index}`}>
                <div className="nested-editor-header">
                  <strong>Project {index + 1}</strong>
                  <button className="icon-button" type="button" title="Remove project" onClick={() => updateForm('projectHistory', form.projectHistory.filter((_, itemIndex) => itemIndex !== index))}>
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="form-grid">
                  <label>Name<input value={entry.name} onChange={(event) => updateProject(index, { name: event.target.value })} /></label>
                  <label>Role<input value={entry.role ?? ''} onChange={(event) => updateProject(index, { role: event.target.value })} /></label>
                  <label className="field-full">URL<input value={entry.url ?? ''} onChange={(event) => updateProject(index, { url: event.target.value })} /></label>
                  <CommaField label="Technologies" value={entry.technologies ?? []} onChange={(value) => updateProject(index, { technologies: value })} />
                  <label className="field-full">Description<textarea value={entry.description ?? ''} onChange={(event) => updateProject(index, { description: event.target.value })} /></label>
                </div>
              </article>
            ))}
          </EditorList>

          <section className="editor-section">
            <span className="eyebrow">Autofill answers</span>
            <div className="form-grid">
              <label>Authorized to work?<input value={form.autofillAnswers.authorizedToWork ?? ''} onChange={(event) => updateAutofill('authorizedToWork', event.target.value)} /></label>
              <label>Sponsorship required?<input value={form.autofillAnswers.sponsorshipRequired ?? ''} onChange={(event) => updateAutofill('sponsorshipRequired', event.target.value)} /></label>
              <label>Veteran status<input value={form.veteranStatus} onChange={(event) => updateForm('veteranStatus', event.target.value)} /></label>
              <label>Disability status<input value={form.disabilityStatus} onChange={(event) => updateForm('disabilityStatus', event.target.value)} /></label>
              <label>Gender<input value={form.gender} onChange={(event) => updateForm('gender', event.target.value)} /></label>
              <label>Race<input value={form.race} onChange={(event) => updateForm('race', event.target.value)} /></label>
              <label>Years professional<input value={form.autofillAnswers.yearsProfessionalExperience ?? ''} onChange={(event) => updateAutofill('yearsProfessionalExperience', event.target.value)} /></label>
              <label>Years software<input value={form.autofillAnswers.yearsSoftwareExperience ?? ''} onChange={(event) => updateAutofill('yearsSoftwareExperience', event.target.value)} /></label>
              <label>Years React<input value={form.autofillAnswers.yearsReactExperience ?? ''} onChange={(event) => updateAutofill('yearsReactExperience', event.target.value)} /></label>
              <label>Years Node<input value={form.autofillAnswers.yearsNodeExperience ?? ''} onChange={(event) => updateAutofill('yearsNodeExperience', event.target.value)} /></label>
              <label>Years Python<input value={form.autofillAnswers.yearsPythonExperience ?? ''} onChange={(event) => updateAutofill('yearsPythonExperience', event.target.value)} /></label>
              <label>Earliest start<input value={form.autofillAnswers.earliestStartDate ?? ''} onChange={(event) => updateAutofill('earliestStartDate', event.target.value)} /></label>
            </div>
          </section>
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
            <div><dt>Location</dt><dd><MapPin size={15} aria-hidden="true" /> {profile.location || 'Not provided'}</dd></div>
            <div><dt>Education</dt><dd><BookOpen size={15} aria-hidden="true" /> {profile.educationHistory?.[0]?.school || profile.education || 'Not provided'}</dd></div>
            <div><dt>Experience</dt><dd><Briefcase size={15} aria-hidden="true" /> {profile.workHistory?.[0]?.title || profile.workExperience || 'Not provided'}</dd></div>
            <div><dt>Authorization</dt><dd><ShieldCheck size={15} aria-hidden="true" /> {profile.workAuthorization || profile.autofillAnswers?.authorizedToWork || 'Not provided'}</dd></div>
          </dl>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Documents</span>
              <h2>Application materials</h2>
            </div>
          </div>
          <form className="document-upload" onSubmit={handleDocumentUpload}>
            <select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
              <option value="resume">Resume</option>
              <option value="cover-letter-template">Cover letter template</option>
              <option value="transcript">Transcript</option>
              <option value="portfolio">Portfolio</option>
              <option value="other">Other</option>
            </select>
            <input value={documentLabel} onChange={(event) => setDocumentLabel(event.target.value)} placeholder="Document label" />
            <input key={fileInputKey} type="file" onChange={(event: ChangeEvent<HTMLInputElement>) => setDocumentFile(event.target.files?.[0] ?? null)} />
            <button className="button primary" type="submit" disabled={uploading || !documentFile}>
              <Upload size={16} aria-hidden="true" />
              {uploading ? 'Uploading' : 'Upload'}
            </button>
          </form>
          <div className="compact-list">
            {profile.documents?.length > 0 ? profile.documents.map((document) => (
              <article className="compact-row" key={document.id}>
                <div>
                  <strong>{document.label}</strong>
                  <span>{document.documentType} - {document.fileName}</span>
                </div>
                <a href={`${API_BASE_URL}${document.fileUrl}`} target="_blank" rel="noreferrer" className="text-link" title="Open document">
                  <FileText size={20} aria-hidden="true" />
                </a>
              </article>
            )) : <p className="muted-copy">No documents uploaded yet.</p>}
          </div>
        </section>

        <ProfileTagsPanel title="Target roles" icon={<UserCheck size={18} />} tags={profile.targetRoles ?? []} fallback="No target roles added yet." />
        <ProfileTagsPanel title="Skills" icon={<BadgeCheck size={18} />} tags={profile.skills ?? []} fallback="No skills added yet." />
        <ProfileTagsPanel title="Relevant courses" icon={<GraduationCap size={18} />} tags={profile.relevantCourses ?? []} fallback="No courses added yet." />

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Connections</span>
              <h2>Linked accounts</h2>
            </div>
          </div>
          <div className="connection-list">
            <ConnectionRow icon={<GitBranch size={18} />} label="GitHub" url={profile.githubUrl ?? ''} />
            <ConnectionRow icon={<Link2 size={18} />} label="LinkedIn" url={profile.linkedinUrl ?? ''} />
            <ConnectionRow icon={<Link2 size={18} />} label="Portfolio" url={profile.portfolioUrl ?? ''} />
            <ConnectionRow icon={<Link2 size={18} />} label="Indeed" url={profile.indeedUrl ?? ''} />
            <div><Mail size={18} aria-hidden="true" /><span>Email tracking</span><strong>Pending OAuth setup</strong></div>
          </div>
        </section>
      </div>
    </div>
  );

  function updateEducation(index: number, patch: Partial<EducationEntry>) {
    updateForm('educationHistory', form.educationHistory.map((entry, itemIndex) => itemIndex === index ? { ...entry, ...patch } : entry));
  }

  function updateWork(index: number, patch: Partial<WorkHistoryEntry>) {
    updateForm('workHistory', form.workHistory.map((entry, itemIndex) => itemIndex === index ? { ...entry, ...patch } : entry));
  }

  function updateProject(index: number, patch: Partial<ProjectEntry>) {
    updateForm('projectHistory', form.projectHistory.map((entry, itemIndex) => itemIndex === index ? { ...entry, ...patch } : entry));
  }
}

function CommaField({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (value: string[]) => void; placeholder?: string }) {
  return (
    <label>
      {label}
      <input value={listToText(value)} onChange={(event) => onChange(textToList(event.target.value))} placeholder={placeholder} />
    </label>
  );
}

function EditorList({ title, onAdd, children }: { title: string; onAdd: () => void; children: ReactNode }) {
  return (
    <section className="editor-section">
      <div className="nested-section-header">
        <span className="eyebrow">{title}</span>
        <button className="button secondary" type="button" onClick={onAdd}>
          <Plus size={16} aria-hidden="true" />
          Add
        </button>
      </div>
      <div className="nested-stack">{children}</div>
    </section>
  );
}

function ProfileTagsPanel({ title, icon, tags, fallback }: { title: string; icon: ReactNode; tags: string[]; fallback: string }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">{title}</span>
          <h2>{title}</h2>
        </div>
        {icon}
      </div>
      <div className="tag-row large">
        {tags.length > 0 ? tags.map((tag) => <span className="tag" key={`${title}-${tag}`}>{tag}</span>) : <span className="muted-copy">{fallback}</span>}
      </div>
    </section>
  );
}

function ConnectionRow({ icon, label, url }: { icon: ReactNode; label: string; url: string }) {
  return (
    <div>
      {icon}
      <span>{label}</span>
      {url ? <a href={url} target="_blank" rel="noreferrer">View</a> : <strong>Not connected</strong>}
    </div>
  );
}
