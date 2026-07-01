import { useCallback, useEffect, useRef, useState } from 'react';
import type { ManifestDiff, SlideDigest, SlideFieldChange } from './manifestDiff';
import {
  clearBaselineFromStorage,
  compareManifestSlides,
  loadBaselineFromStorage,
  saveBaselineToStorage,
} from './manifestDiff';
import type { ManifestResponse, SlideManifestEntry } from './types';

async function fetchManifestJson(): Promise<ManifestResponse> {
  const res = await fetch(`/api/manifest?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as ManifestResponse;
}

function formatTs(ts: number): string {
  try {
    return new Date(ts).toLocaleString('zh-CN');
  } catch {
    return '';
  }
}

function fieldLabel(f: SlideFieldChange): string {
  switch (f) {
    case 'title':
      return '标题';
    case 'briefing':
      return '简报';
    case 'order':
      return '序号';
    case 'track':
      return '轨道';
    case 'tags':
      return '标签';
    default:
      return f;
  }
}

function cellDigestField(d: SlideDigest, f: SlideFieldChange): string {
  if (f === 'tags') return d.tags.join('、');
  if (f === 'order') return String(d.order);
  if (f === 'track') return d.track;
  return d[f];
}

export function AdminPortal() {
  const [manifest, setManifest] = useState<ManifestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const [intervalSec, setIntervalSec] = useState(20);
  const [compareMode, setCompareMode] = useState<'last' | 'baseline'>('last');
  const [baseline, setBaseline] = useState<SlideManifestEntry[] | null>(() =>
    loadBaselineFromStorage(),
  );
  const [lastDiff, setLastDiff] = useState<ManifestDiff | null>(null);

  const compareModeRef = useRef(compareMode);
  const baselineRef = useRef(baseline);
  const prevSnapshotRef = useRef<SlideManifestEntry[] | null>(null);
  const firstLastCompareRef = useRef(true);

  useEffect(() => {
    baselineRef.current = baseline;
  }, [baseline]);

  const runScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      const data = await fetchManifestJson();
      const next = data.slides;
      const mode = compareModeRef.current;
      const bl = baselineRef.current;

      let diff: ManifestDiff | null = null;
      if (mode === 'baseline' && bl && bl.length > 0) {
        diff = compareManifestSlides(bl, next);
      } else if (mode === 'last') {
        if (firstLastCompareRef.current) {
          firstLastCompareRef.current = false;
          prevSnapshotRef.current = next;
          diff = null;
        } else {
          diff = compareManifestSlides(prevSnapshotRef.current, next);
          prevSnapshotRef.current = next;
        }
      }

      setManifest(data);
      setLastDiff(diff);
    } catch (e) {
      setError(String((e as Error)?.message ?? e));
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    compareModeRef.current = compareMode;
    firstLastCompareRef.current = true;
    prevSnapshotRef.current = null;
    setLastDiff(null);
    void runScan();
  }, [compareMode, runScan]);

  useEffect(() => {
    if (!autoScan) return;
    const ms = Math.min(120, Math.max(5, intervalSec)) * 1000;
    const id = window.setInterval(() => {
      void runScan();
    }, ms);
    return () => window.clearInterval(id);
  }, [autoScan, intervalSec, runScan]);

  const setBaselineFromCurrent = () => {
    if (!manifest?.slides.length) return;
    const snap = manifest.slides.map((s) => ({ ...s, tags: [...s.tags] }));
    saveBaselineToStorage(snap);
    baselineRef.current = snap;
    setBaseline(snap);
    void runScan();
  };

  const clearBaseline = () => {
    clearBaselineFromStorage();
    baselineRef.current = null;
    setBaseline(null);
    void runScan();
  };

  const resetLastCompare = () => {
    firstLastCompareRef.current = true;
    prevSnapshotRef.current = null;
    setLastDiff(null);
    void runScan();
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <h1 className="admin-title">管理台</h1>
          <p className="admin-sub">自动扫描 · 与基线或上次快照比对差异</p>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="btn" onClick={() => void runScan()} disabled={scanning}>
            {scanning ? '扫描中…' : '立即扫描'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => (window.location.hash = '#/')}
          >
            返回演示
          </button>
        </div>
      </header>

      {error ? (
        <div className="admin-error">
          <p>{error}</p>
          <button type="button" className="btn" onClick={() => void runScan()}>
            重试
          </button>
        </div>
      ) : null}

      <div className="admin-grid">
        <section className="admin-card">
          <h2>自动扫描</h2>
          <label className="admin-label-row">
            <input
              type="checkbox"
              checked={autoScan}
              onChange={(e) => setAutoScan(e.target.checked)}
            />
            开启定时重新扫描文件夹
          </label>
          <label className="admin-label-row">
            间隔（秒）
            <input
              type="number"
              min={5}
              max={120}
              value={intervalSec}
              onChange={(e) => setIntervalSec(Number.parseInt(e.target.value, 10) || 20)}
              className="admin-input"
            />
          </label>
          <p className="admin-hint">每次请求都会完整读取磁盘 HTML 并重建清单（与演示页一致）。</p>
        </section>

        <section className="admin-card">
          <h2>比对模式</h2>
          <fieldset className="admin-fieldset">
            <label className="admin-label-row">
              <input
                type="radio"
                name="cmp"
                checked={compareMode === 'last'}
                onChange={() => setCompareMode('last')}
              />
              相对<strong>上次扫描</strong>（首次扫描不产生差异）
            </label>
            <label className="admin-label-row">
              <input
                type="radio"
                name="cmp"
                checked={compareMode === 'baseline'}
                onChange={() => setCompareMode('baseline')}
              />
              相对<strong>固定基线</strong>（见下方存储）
            </label>
          </fieldset>
          <div className="admin-btn-row">
            <button
              type="button"
              className="btn"
              onClick={setBaselineFromCurrent}
              disabled={!manifest?.slides.length}
            >
              将当前快照存为基线
            </button>
            <button type="button" className="btn" onClick={clearBaseline} disabled={!baseline}>
              清除基线
            </button>
            <button type="button" className="btn" onClick={resetLastCompare}>
              重置「相对上次」计数
            </button>
          </div>
          <p className="admin-hint">
            基线保存在 <code>sessionStorage</code>，关闭标签页后失效。
          </p>
        </section>

        <section className="admin-card admin-card--wide">
          <h2>当前状态</h2>
          {manifest ? (
            <ul className="admin-stats">
              <li>
                根目录：<code>{manifest.root}</code>
              </li>
              <li>幻灯数量：{manifest.slides.length}</li>
              <li>上次扫描时间：{formatTs(manifest.scannedAt)}</li>
              <li>已存基线：{baseline ? `${baseline.length} 页` : '无'}</li>
            </ul>
          ) : (
            <p className="admin-muted">等待首次扫描…</p>
          )}
        </section>
      </div>

      <section className="admin-diff">
        <h2>差异报告</h2>
        {compareMode === 'baseline' && !baseline?.length ? (
          <p className="admin-muted">
            未设置基线：请先「将当前快照存为基线」，或切换到「相对上次扫描」。
          </p>
        ) : !lastDiff ? (
          <p className="admin-muted">尚无对比结果（首次「相对上次」扫描或等待下一次扫描）。</p>
        ) : (
          <div className="admin-diff-summary">
            <span className="admin-pill admin-pill--add">+{lastDiff.added.length} 新增</span>
            <span className="admin-pill admin-pill--remove">−{lastDiff.removed.length} 删除</span>
            <span className="admin-pill admin-pill--change">~{lastDiff.changed.length} 变更</span>
            <span className="admin-pill admin-pill--ok">={lastDiff.unchangedCount} 未变</span>
          </div>
        )}

        {lastDiff && lastDiff.added.length > 0 ? (
          <div className="admin-diff-block">
            <h3 className="admin-diff-h3 add">新增文件</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>路径</th>
                  <th>标题</th>
                </tr>
              </thead>
              <tbody>
                {lastDiff.added.map((s) => (
                  <tr key={s.rel}>
                    <td>
                      <code>{s.rel}</code>
                    </td>
                    <td>{s.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {lastDiff && lastDiff.removed.length > 0 ? (
          <div className="admin-diff-block">
            <h3 className="admin-diff-h3 remove">已删除</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>路径</th>
                  <th>标题</th>
                </tr>
              </thead>
              <tbody>
                {lastDiff.removed.map((s) => (
                  <tr key={s.rel}>
                    <td>
                      <code>{s.rel}</code>
                    </td>
                    <td>{s.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {lastDiff && lastDiff.changed.length > 0 ? (
          <div className="admin-diff-block">
            <h3 className="admin-diff-h3 change">内容变更</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>路径</th>
                  <th>字段</th>
                  <th>之前</th>
                  <th>之后</th>
                </tr>
              </thead>
              <tbody>
                {lastDiff.changed.flatMap((c) =>
                  c.fields.map((f) => (
                    <tr key={`${c.rel}-${f}`}>
                      <td>
                        <code>{c.rel}</code>
                      </td>
                      <td>{fieldLabel(f)}</td>
                      <td className="admin-cell-muted">{cellDigestField(c.before, f)}</td>
                      <td>{cellDigestField(c.after, f)}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
