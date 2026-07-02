import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { HubLink } from '../data/hub-catalog';
import { deckSidebarItems, isSidebarItemActive, LAB_SIDEBAR_SECTIONS } from '../data/lab-nav';
import { fetchAtelierProjects } from '../data/projects';
import { useLabHealth } from '../lab/LabHealthProvider';
import { useLabShell } from './useLabShell';

function SidebarLink({
  id,
  label,
  icon,
  meta,
  link,
  collapsed,
  online,
}: {
  id: string;
  label: string;
  icon: string;
  meta?: string;
  link: HubLink;
  collapsed: boolean;
  online?: boolean;
}) {
  const { pathname } = useLocation();
  const { showToast } = useLabShell();
  const tip = collapsed ? label : meta;

  if (link.kind === 'route') {
    const active = isSidebarItemActive(link, pathname);
    return (
      <NavLink
        to={link.to}
        end={link.to === '/'}
        className={`lab-sidebar-link${active ? ' is-active' : ''}`}
        title={tip}
        data-nav-id={id}
      >
        <span className="lab-sidebar-link-icon" aria-hidden="true">
          {icon}
        </span>
        {!collapsed ? (
          <span className="lab-sidebar-link-text">
            <span className="lab-sidebar-link-label">{label}</span>
            {meta ? <span className="lab-sidebar-link-meta">{meta}</span> : null}
          </span>
        ) : null}
      </NavLink>
    );
  }

  if (link.kind === 'external') {
    const statusTip =
      online === undefined ? (tip ?? label) : `${label} · ${online ? 'online' : 'offline'}`;
    return (
      <a
        href={link.href}
        className="lab-sidebar-link lab-sidebar-link-external"
        target="_blank"
        rel="noopener noreferrer"
        title={statusTip}
        data-nav-id={id}
      >
        <span className="lab-sidebar-link-icon" aria-hidden="true">
          {icon}
        </span>
        {online !== undefined ? (
          <span
            className={`lab-sidebar-online${online ? ' is-on' : ''}`}
            title={online ? 'Online' : 'Offline'}
            aria-hidden="true"
          />
        ) : null}
        {!collapsed ? (
          <span className="lab-sidebar-link-text">
            <span className="lab-sidebar-link-label">{label}</span>
            {meta ? <span className="lab-sidebar-link-meta">{meta}</span> : null}
          </span>
        ) : null}
      </a>
    );
  }

  return (
    <button
      type="button"
      className="lab-sidebar-link lab-sidebar-link-command"
      title={link.doc ? `${link.command} · ${link.doc}` : link.command}
      data-nav-id={id}
      onClick={() => {
        void navigator.clipboard.writeText(link.command).then(() => {
          showToast(`Copied: ${link.command}`);
        });
      }}
    >
      <span className="lab-sidebar-link-icon" aria-hidden="true">
        {icon}
      </span>
      {!collapsed ? (
        <span className="lab-sidebar-link-text">
          <span className="lab-sidebar-link-label">{label}</span>
          {meta ? <span className="lab-sidebar-link-meta">{meta}</span> : null}
        </span>
      ) : null}
    </button>
  );
}

export function LabGlobalSidebar() {
  const { sidebarCollapsed, sectionsOpen, toggleSection } = useLabShell();
  const { online } = useLabHealth();
  const [deckItems, setDeckItems] = useState(
    LAB_SIDEBAR_SECTIONS.find((s) => s.id === 'decks')?.items,
  );

  useEffect(() => {
    let alive = true;
    fetchAtelierProjects()
      .then((projects) => {
        if (alive) setDeckItems(deckSidebarItems(projects));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const sections = useMemo(
    () =>
      LAB_SIDEBAR_SECTIONS.map((section) =>
        section.id === 'decks' && deckItems ? { ...section, items: deckItems } : section,
      ),
    [deckItems],
  );

  return (
    <aside
      id="lab-global-sidebar"
      className={`lab-global-sidebar${sidebarCollapsed ? ' is-collapsed' : ''}`}
      aria-label="Lab navigation"
    >
      <div className="lab-global-sidebar-inner">
        {sections.map((section) => {
          const open = sidebarCollapsed ? true : (sectionsOpen[section.id] ?? true);
          return (
            <div key={section.id} className={`lab-sidebar-section${open ? ' is-open' : ''}`}>
              {!sidebarCollapsed ? (
                <button
                  type="button"
                  className="lab-sidebar-section-toggle"
                  aria-expanded={open}
                  onClick={() => toggleSection(section.id)}
                >
                  <span className="lab-sidebar-section-title">{section.title}</span>
                  <span className="lab-sidebar-section-chevron" aria-hidden="true">
                    {open ? '−' : '+'}
                  </span>
                </button>
              ) : (
                <div className="lab-sidebar-section-rail" aria-hidden="true" />
              )}
              {open ? (
                <nav className="lab-sidebar-nav">
                  {section.items.map((item) => (
                    <SidebarLink
                      key={item.id}
                      id={item.id}
                      label={item.label}
                      icon={item.icon}
                      meta={item.meta}
                      link={item.link}
                      collapsed={sidebarCollapsed}
                      online={item.link.kind === 'external' ? online.get(item.id) : undefined}
                    />
                  ))}
                </nav>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
