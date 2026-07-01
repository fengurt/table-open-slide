import type { ModuleStat } from './htmlTune.js';
import type { HtmlTemplate, TuneParamDef } from './templateRegistry.js';

export function LayoutWorkbench({
  template,
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
  onClose?: () => void;
}) {
  const totalOver = moduleStats.filter((m) => m.over).length;
  const rows = paramDefs ?? template.params;

  return (
    <div className="hl-workbench">
      <div className="hl-workbench-head">
        <div>
          <h2 className="hl-workbench-title">{focusLabel ? `调参 · ${focusLabel}` : '布局调参'}</h2>
          <p className="hl-workbench-sub">{template.label}</p>
        </div>
        <div className="hl-workbench-actions">
          {onAutoLayout ? (
            <button
              type="button"
              className="hl-btn hl-btn--gold"
              disabled={autoLayoutBusy}
              onClick={onAutoLayout}
            >
              {autoLayoutBusy ? 'Optimizing…' : 'Auto-fit'}
            </button>
          ) : null}
          <button type="button" className="hl-btn" onClick={onReset}>
            重置
          </button>
          <button type="button" className="hl-btn hl-btn--primary" onClick={onSave}>
            保存模板
          </button>
          {onClose ? (
            <button
              type="button"
              className="hl-btn hl-btn--ghost"
              onClick={onClose}
              title="Esc 关闭"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>
      {onClose ? (
        <p className="hl-hint hl-workbench-dismiss">
          Esc 或点击外部区域关闭 · 预览区 hover 组件可点选
        </p>
      ) : null}
      {savedNote ? <p className="hl-saved-note">{savedNote}</p> : null}

      {rows.length > 0 ? (
        <section className="hl-section">
          <h3 className="hl-section-title">间距与字号</h3>
          <div className="hl-params">
            {rows.map((p) => (
              <ParamRow
                key={p.key}
                def={p}
                value={params[p.key] ?? p.default}
                onChange={onParamChange}
              />
            ))}
          </div>
        </section>
      ) : null}

      {moduleStats.length > 0 ? (
        <section className="hl-section">
          <h3 className="hl-section-title">
            模块字数 {totalOver > 0 ? <span className="hl-warn">({totalOver} 处超限)</span> : null}
          </h3>
          <p className="hl-hint">按去空白字符计；超限标红，便于压缩文案。</p>
          <div className="hl-modules">
            {moduleStats.map((mod) => (
              <div key={mod.id} className={`hl-module ${mod.over ? 'hl-module--over' : ''}`}>
                <div className="hl-module-head">
                  <span>{mod.label}</span>
                  <span className="hl-module-limit">上限 {mod.maxChars} 字</span>
                </div>
                {mod.counts.length === 0 ? (
                  <p className="hl-hint">未匹配到内容</p>
                ) : (
                  <ul className="hl-module-list">
                    {mod.counts.map((c) => (
                      <li key={c.index} className={c.chars > mod.maxChars ? 'is-over' : ''}>
                        <span className="hl-module-idx">#{c.index}</span>
                        <span className="hl-module-count">
                          {c.chars}/{mod.maxChars}
                        </span>
                        <span className="hl-module-preview" title={c.preview}>
                          {c.preview}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ParamRow({
  def,
  value,
  onChange,
}: {
  def: TuneParamDef;
  value: number;
  onChange: (key: string, value: number) => void;
}) {
  return (
    <label className="hl-param">
      <span className="hl-param-label">{def.label}</span>
      <div className="hl-param-controls">
        <input
          type="range"
          min={def.min}
          max={def.max}
          step={def.step}
          value={value}
          onChange={(e) => onChange(def.key, Number(e.target.value))}
        />
        <input
          type="number"
          min={def.min}
          max={def.max}
          step={def.step}
          value={value}
          className="hl-param-num"
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange(def.key, n);
          }}
        />
        <span className="hl-param-unit">{def.unit}</span>
      </div>
    </label>
  );
}
