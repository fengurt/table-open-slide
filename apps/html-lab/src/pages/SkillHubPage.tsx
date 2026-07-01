import { HUB_DECK_JOURNEYS, HUB_SECTIONS } from '../data/hub-catalog';
import { HubAccordionSection, HubCard } from '../ui/HubCard';
import { DocumentsLibrary } from '../ui/DocumentsLibrary';
import { LabStatusDashboard } from '../ui/LabStatusDashboard';
import './hub.css';
import '../ui/document-library.css';

const SECTION_DEFAULT_OPEN: Record<string, boolean> = {
  studio: true,
  runtimes: true,
  'content-os': false,
  agents: false,
};

export function SkillHubPage() {
  return (
    <div className="hub-content">
      <header className="hub-header">
        <p className="hub-eyebrow">open-slide · table-slides01</p>
        <h1 className="hub-title">Content studio</h1>
        <p className="hub-lead">
          Award-grade content studio — one shell for HTML, Word, decks, and agent pipelines.
          Sidebar collapses with <kbd>[</kbd>; shortcuts via <kbd>?</kbd>.
        </p>
      </header>

      <LabStatusDashboard />

      <DocumentsLibrary />

      {HUB_SECTIONS.map((section) => (
        <HubAccordionSection
          key={section.id}
          id={section.id}
          title={section.title}
          hint={section.hint}
          defaultOpen={SECTION_DEFAULT_OPEN[section.id] ?? true}
        >
          {section.entries.map((entry) => (
            <HubCard key={entry.id} entry={entry} />
          ))}
        </HubAccordionSection>
      ))}

      <HubAccordionSection
        id="decks"
        title="Deck journeys"
        hint="本 hub 内互动预览，或打开独立 viewer"
        defaultOpen
      >
        {HUB_DECK_JOURNEYS.map((entry) => (
          <HubCard key={entry.id} entry={entry} />
        ))}
      </HubAccordionSection>

      <footer className="hub-foot">
        <p>
          <strong>Quick start:</strong>{' '}
          <code>pnpm dev:html-lab</code> · <code>pnpm dev:up</code> ·{' '}
          <code>pnpm docx:mcp:build</code>
        </p>
        <p>
          Skills: <code>skills/tableai-guizang-ppt-skill/</code> ·{' '}
          <code>skills/tableai-docx-master/</code> ·{' '}
          <code>modules/tableai-ppt-master/</code> ·{' '}
          <code>apps/kind-viewer/skills/kind-deck-authoring/</code>
        </p>
      </footer>
    </div>
  );
}
