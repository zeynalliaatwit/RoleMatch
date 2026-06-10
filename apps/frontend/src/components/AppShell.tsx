import { Bookmark, BriefcaseBusiness, ClipboardList, Home, LogOut, Search, User } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../api/jobs';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/jobs', label: 'Job search', icon: Search },
  { to: '/applications', label: 'Application tracker', icon: ClipboardList },
  { to: '/saved', label: 'Saved jobs', icon: Bookmark },
  { to: '/profile', label: 'Profile', icon: User },
];

interface ShellProfile {
  fullName: string;
  education: string | null;
  location: string | null;
}

function initialsFor(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'RM';
}

export function AppShell() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ShellProfile | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('rolematch_token');
    if (!token) return;

    const loadProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setProfile(await response.json() as ShellProfile);
        }
      } catch {
        setProfile(null);
      }
    };

    void loadProfile();
  }, []);

  const displayName = profile?.fullName?.trim() || 'RoleMatch user';
  const subtitle = useMemo(() => {
    if (profile?.education) return profile.education;
    if (profile?.location) return profile.location;

    return 'Profile setup';
  }, [profile]);

  const handleLogout = () => {
    localStorage.removeItem('rolematch_token');
    navigate('/auth', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <BriefcaseBusiness size={19} />
          </div>
          <div>
            <strong>RoleMatch</strong>
            <span>Job workspace</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                end={item.to === '/'}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="mini-profile">
            <div className="avatar" aria-hidden="true">
              {initialsFor(displayName)}
            </div>
            <div>
              <strong>{displayName}</strong>
              <span>{subtitle}</span>
            </div>
          </div>
          <button className="nav-link danger" type="button" onClick={handleLogout}>
            <LogOut size={18} aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
