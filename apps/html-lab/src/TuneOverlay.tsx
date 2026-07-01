import type { ModuleStat } from './htmlTune';
import { LayoutWorkbench } from './LayoutWorkbench';
import type { HtmlTemplate, TuneParamDef } from './templateRegistry';

export function TuneOverlay({
  template,
  width,
  params,
  paramDefs,
  moduleStats,
  savedNote,
  focusLabel,
  autoLayoutBusy,
  onAutoLayout,
  onParamChange,
  onReset,
  onSave,
  onClose,
}: {
  template: HtmlTemplate;
  width: number;
  params: Record<string, number>;
  paramDefs?: TuneParamDef[];
  moduleStats: ModuleStat[];
  savedNote: string | null;
  focusLabel?: string | null;
  autoLayoutBusy?: boolean;
  onAutoLayout?: () => void;
  onParamChange: (key: string, value: number) => void;
  onReset: () => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="hl-tune-overlay" role="presentation" onClick={onClose}>
      <aside
        className="hl-tune-float"
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-label="布局调参"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <LayoutWorkbench
          template={template}
          params={params}
          paramDefs={paramDefs}
          moduleStats={moduleStats}
          savedNote={savedNote}
          focusLabel={focusLabel}
          autoLayoutBusy={autoLayoutBusy}
          onAutoLayout={onAutoLayout}
          onParamChange={onParamChange}
          onReset={onReset}
          onSave={onSave}
          onClose={onClose}
        />
      </aside>
    </div>
  );
}
