import { useState } from 'react';
import type { ContentLang } from './contentLang';
import { UI, type UiLang } from './i18n';
import { SlideLayoutEditor } from './SlideLayoutEditor';
import { SlideMdPanel } from './SlideMdPanel';
import type { AuthSession } from './types';

export function SlideEditFloat({
  slideRel,
  session,
  uiLang,
  contentLang,
  onSaved,
  onClose,
}: {
  slideRel: string;
  session: AuthSession;
  uiLang: UiLang;
  contentLang: ContentLang;
  onSaved: () => void;
  onClose: () => void;
}) {
  const t = UI[uiLang];
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div
      className={`presenter-edit-float ${collapsed ? 'is-collapsed' : ''}`}
      role="dialog"
      aria-label={t.editPanel}
    >
      <div className="presenter-edit-float-head">
        <span className="presenter-edit-float-title">{t.editPanel}</span>
        <div className="presenter-edit-float-actions">
          <button
            type="button"
            className="presenter-edit-float-btn"
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
            title={collapsed ? t.expandMd : t.collapseMd}
          >
            {collapsed ? '▲' : '▼'}
          </button>
          <button
            type="button"
            className="presenter-edit-float-btn"
            onClick={onClose}
            aria-label={t.closeEdit}
          >
            ×
          </button>
        </div>
      </div>
      {collapsed ? (
        <p className="presenter-edit-float-collapsed">{t.mdCollapsedHint}</p>
      ) : (
        <div className="presenter-edit-float-body">
          <SlideLayoutEditor uiLang={uiLang} contentLang={contentLang} />
          <SlideMdPanel
            slideRel={slideRel}
            session={session}
            uiLang={uiLang}
            contentLang={contentLang}
            onSaved={onSaved}
          />
        </div>
      )}
    </div>
  );
}
