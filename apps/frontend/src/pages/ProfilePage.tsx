import { BookOpen, BriefcaseBusiness, FileText, GitBranch, GraduationCap, Link2, Mail, MapPin, Pencil, ShieldCheck } from 'lucide-react';
import {
  profileConnections,
  profileCoursework,
  profileDocuments,
  profileExperience,
  profileProjects,
  profileSkillGroups,
  userProfile,
} from '../data/mockData';

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
          <p className="profile-summary">{userProfile.summary}</p>
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
              <span className="eyebrow">Education</span>
              <h2>Academic profile</h2>
            </div>
            <GraduationCap size={20} aria-hidden="true" />
          </div>
          <dl className="detail-list">
            <div>
              <dt>School</dt>
              <dd>{userProfile.school}</dd>
            </div>
            <div>
              <dt>Degree</dt>
              <dd>{userProfile.degree}</dd>
            </div>
            <div>
              <dt>Minor</dt>
              <dd>{userProfile.minor}</dd>
            </div>
            <div>
              <dt>Graduation</dt>
              <dd>{userProfile.graduation}</dd>
            </div>
          </dl>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Skills</span>
              <h2>Skill profile</h2>
            </div>
          </div>
          <div className="skill-group-list">
            {profileSkillGroups.map((group) => (
              <div key={group.label}>
                <strong>{group.label}</strong>
                <div className="tag-row large">
                  {group.skills.map((skill) => (
                    <span className="tag" key={skill}>{skill}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel profile-wide">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Experience</span>
              <h2>Work and project experience</h2>
            </div>
            <BriefcaseBusiness size={20} aria-hidden="true" />
          </div>
          <div className="experience-list">
            {profileExperience.map((experience) => (
              <article className="experience-item" key={experience.id}>
                <div>
                  <strong>{experience.role}</strong>
                  <span>{experience.organization} - {experience.dates}</span>
                </div>
                <ul>
                  {experience.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Coursework</span>
              <h2>Related classes</h2>
            </div>
            <BookOpen size={20} aria-hidden="true" />
          </div>
          <div className="tag-row large">
            {profileCoursework.map((course) => (
              <span className="tag" key={course}>{course}</span>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Projects</span>
              <h2>Portfolio context</h2>
            </div>
          </div>
          <div className="project-list">
            {profileProjects.map((project) => (
              <article key={project.id}>
                <strong>{project.name}</strong>
                <span>{project.detail}</span>
              </article>
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
              <h2>Accounts and sources</h2>
            </div>
          </div>
          <div className="connection-list">
            {profileConnections.map((connection) => {
              const Icon = connection.label.includes('email') ? Mail : connection.label === 'GitHub' ? GitBranch : Link2;

              return (
                <div key={connection.id}>
                  <Icon size={18} aria-hidden="true" />
                  <span>
                    <strong>{connection.label}</strong>
                    <small>{connection.value}</small>
                  </span>
                  <em>{connection.status}</em>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
