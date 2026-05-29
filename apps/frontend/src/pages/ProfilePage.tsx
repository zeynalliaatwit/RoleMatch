import { FileText, GitBranch, Link2, Mail, MapPin, Pencil, ShieldCheck } from 'lucide-react';
import { profileDocuments, userProfile } from '../data/mockData';

export function ProfilePage() {
  return (
    <div className="page">
      <header className="profile-header">
        <div className="profile-avatar" aria-hidden="true">
          {userProfile.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
        </div>
        <div>
          <span className="eyebrow">Profile</span>
          <h1>{userProfile.name}</h1>
          <p>{userProfile.title} - {userProfile.location}</p>
          <div className="profile-actions">
            <button className="button primary" type="button">
              <Pencil size={16} aria-hidden="true" />
              Edit profile
            </button>
            <button className="button secondary" type="button">
              <FileText size={16} aria-hidden="true" />
              Resume
            </button>
          </div>
        </div>
      </header>

      <div className="profile-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Targets</span>
              <h2>Search preferences</h2>
            </div>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Roles</dt>
              <dd>{userProfile.targetRoles.join(', ')}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd><MapPin size={15} aria-hidden="true" /> {userProfile.targetLocation}</dd>
            </div>
            <div>
              <dt>Salary</dt>
              <dd>{userProfile.salaryFloor}</dd>
            </div>
            <div>
              <dt>Authorization</dt>
              <dd><ShieldCheck size={15} aria-hidden="true" /> {userProfile.workAuthorization}</dd>
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
            {userProfile.skills.map((skill) => (
              <span className="tag" key={skill}>{skill}</span>
            ))}
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
            {profileDocuments.map((document) => (
              <article className="compact-row" key={document.id}>
                <div>
                  <strong>{document.name}</strong>
                  <span>{document.status} - {document.updated}</span>
                </div>
                <FileText size={18} aria-hidden="true" />
              </article>
            ))}
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
              <strong>Connected</strong>
            </div>
            <div>
              <Mail size={18} aria-hidden="true" />
              <span>Email</span>
              <strong>Ready</strong>
            </div>
            <div>
              <Link2 size={18} aria-hidden="true" />
              <span>LinkedIn</span>
              <strong>Saved</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
