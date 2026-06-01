import { Bookmark, BriefcaseBusiness, ClipboardList, Home, LogOut, Search, User } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { userProfile } from '../data/mockData';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/jobs', label: 'Job search', icon: Search },
  { to: '/applications', label: 'Application tracker', icon: ClipboardList },
  { to: '/saved', label: 'Saved jobs', icon: Bookmark },
  { to: '/profile', label: 'Profile', icon: User },
];

export function AppShell() {
  const navigate = useNavigate();

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
              {userProfile.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
            </div>
            <div>
              <strong>{userProfile.name}</strong>
              <span>{userProfile.title}</span>
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
