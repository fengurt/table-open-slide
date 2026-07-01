import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { labRouteTitle } from '../data/lab-nav';
import { LabHealthProvider } from '../lab/LabHealthProvider';
import { LabGlobalSidebar } from './LabGlobalSidebar';
import { LabShellProvider } from './LabShellContext';
import { LabShortcutsDialog } from './LabShortcutsDialog';
import { StudioLock } from './StudioLock';
import { useLabShellUi } from './useLabShellUi';
import './lab-shell.css';

const STUDIO_QUICK = [
  { to: '/', label: 'Hub', end: true as const },
  { to: '/lab', label: 'HTML', prefetch: () => void import('../LabAppRoute') },
  { to: '/docx', label: 'Word', prefetch: () => void import('../pages/DocxLabPage') },
  { to: '/admin', label: 'Admin', prefetch: () => void import('../pages/AdminPage') },
] as const;

export function LabShell() {
  const shell = useLabShellUi();
  const { pathname } = useLocation();
  const title = labRouteTitle(pathname);

  return (
    <LabShellProvider value={shell}>
      <LabHealthProvider>
        <div className={`lab-root${shell.sidebarCollapsed ? ' is-sidebar-collapsed' : ''}`}>
          <header className="lab-topbar">
            <div className="lab-topbar-start">
              <button
                type="button"
                className="lab-sidebar-toggle"
                onClick={shell.toggleSidebar}
                aria-expanded={!shell.sidebarCollapsed}
                aria-controls="lab-global-sidebar"
                title="Toggle sidebar ([)"
              >
                {shell.sidebarCollapsed ? '›' : '‹'}
              </button>
              <Link to="/" className="lab-topbar-brand">
                <span className="lab-topbar-eyebrow">open-slide</span>
                <span className="lab-topbar-title">{title}</span>
              </Link>
            </div>

            <nav className="lab-topbar-quick" aria-label="Studio shortcuts">
              {STUDIO_QUICK.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={'end' in item ? item.end : false}
                  className={({ isActive }) => `lab-quick-link${isActive ? ' is-active' : ''}`}
                  onMouseEnter={'prefetch' in item ? item.prefetch : undefined}
                  onFocus={'prefetch' in item ? item.prefetch : undefined}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <StudioLock />
            <p className="lab-topbar-hint">:3333</p>
            <button
              type="button"
              className="lab-topbar-help"
              onClick={() => shell.setShortcutsOpen(true)}
              title="Keyboard shortcuts (?)"
              aria-label="Keyboard shortcuts"
            >
              ?
            </button>
          </header>

          <div className="lab-frame">
            <LabGlobalSidebar />
            {!shell.sidebarCollapsed ? (
              <button
                type="button"
                className="lab-scrim"
                aria-label="Close sidebar"
                onClick={shell.toggleSidebar}
              />
            ) : null}
            <main className="lab-main" id="lab-main">
              <Outlet />
            </main>
          </div>

          {shell.toast ? (
            <div className="lab-toast" role="status">
              {shell.toast}
            </div>
          ) : null}

          <LabShortcutsDialog
            open={shell.shortcutsOpen}
            onClose={() => shell.setShortcutsOpen(false)}
          />
        </div>
      </LabHealthProvider>
    </LabShellProvider>
  );
}
