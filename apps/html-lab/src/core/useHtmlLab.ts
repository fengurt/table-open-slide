import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { htmlToMarkdown } from '../htmlToMarkdown';
import {
  analyzeModules,
  buildTuneCss,
  filterModuleStatsForComponent,
  filterParamsForComponent,
  injectLabPreview,
  type LabSelectMessage,
  updatePreviewTuneCss,
} from '../htmlTune';
import { applyModuleMarkdownToHtml, countModuleNodes, hasModuleMarkers } from '../moduleMarkdown';
import {
  type LabUiState,
  loadTuneParams,
  loadUiState,
  saveTuneParams,
  saveUiState,
} from '../persist';
import { defaultParams, matchTemplate } from '../templateRegistry';
import { fetchHtmlList, fetchRawHtml } from './api';
import { autoOptimizeLayout } from './autoLayout';
import { saveRawHtml } from './saveHtml';
import { pushRecentPath } from './search';
import type { HtmlItem, HtmlLabOptions, SelectedComponent } from './types';
import {
  apiPreviewUrl,
  isProjectSlideFragmentPath,
  previewPageUrl,
  readDeepLinkPath,
  syncUrlPath,
} from './urls';
import { useDebouncedValue } from './useDebouncedValue';

export const SIDEBAR_MIN = 220;
export const SIDEBAR_MAX = 520;

export function useDragWidth(
  onDelta: (delta: number) => void,
  onEnd?: () => void,
): (e: React.PointerEvent) => void {
  const startX = useRef(0);
  return useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      startX.current = e.clientX;
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      target.classList.add('is-dragging');

      const onMove = (ev: PointerEvent) => {
        onDelta(ev.clientX - startX.current);
        startX.current = ev.clientX;
      };
      const onUp = () => {
        target.releasePointerCapture(e.pointerId);
        target.classList.remove('is-dragging');
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        onEnd?.();
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [onDelta, onEnd],
  );
}

export function useHtmlLab(options: HtmlLabOptions = {}) {
  const watchRoots = options.watchRoots ?? (['landing01', 'slides'] as const);

  const [ui, setUi] = useState(loadUiState);
  const [items, setItems] = useState<HtmlItem[]>([]);
  const [listMeta, setListMeta] = useState<{ truncated: boolean; total: number } | null>(null);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string | null>(
    () => options.initialPath ?? readDeepLinkPath(),
  );
  const [rawHtml, setRawHtml] = useState('');
  const [md, setMd] = useState('');
  const [mdError, setMdError] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mtimeNote, setMtimeNote] = useState<string | null>(null);
  const [mdOpen, setMdOpen] = useState(false);
  const [mdDirty, setMdDirty] = useState(false);
  const [htmlDirty, setHtmlDirty] = useState(false);
  const [mdSyncError, setMdSyncError] = useState<string | null>(null);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [htmlRevision, setHtmlRevision] = useState(0);
  const [autoLayoutBusy, setAutoLayoutBusy] = useState(false);
  const [autoLayoutNote, setAutoLayoutNote] = useState<string | null>(null);
  const [tuneParams, setTuneParams] = useState<Record<string, number>>({});
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<SelectedComponent | null>(null);
  const [copyNote, setCopyNote] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ path: string; x: number; y: number } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const mtimeSnapshot = useRef<Map<string, number>>(new Map());
  const htmlCache = useRef<Map<string, { mtimeMs: number; raw: string }>>(new Map());
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const openGeneration = useRef(0);
  const tuneParamsRef = useRef(tuneParams);
  tuneParamsRef.current = tuneParams;
  const didInitDeepLink = useRef(false);
  const debouncedMd = useDebouncedValue(md, 150);

  const template = useMemo(() => (selected ? matchTemplate(selected) : null), [selected]);

  const persistUi = useCallback((patch: Partial<LabUiState>) => {
    setUi((prev) => {
      const next = { ...prev, ...patch };
      saveUiState(next);
      return next;
    });
  }, []);

  const refreshList = useCallback(async () => {
    setLoadErr(null);
    try {
      const data = await fetchHtmlList([...watchRoots]);
      setItems(data.items);
      setListMeta({ truncated: data.truncated, total: data.total });
    } catch (e) {
      setLoadErr(String(e instanceof Error ? e.message : e));
    }
  }, [watchRoots]);

  const openSelected = useCallback(
    async (path: string) => {
      const gen = ++openGeneration.current;
      setSelected(path);
      syncUrlPath(path);
      pushRecentPath(path);
      options.onSelect?.(path);
      setBusy(true);
      setMdError(null);
      setMtimeNote(null);
      setSavedNote(null);
      setSelectedComponent(null);
      setMdOpen(false);
      setMdDirty(false);
      setHtmlDirty(false);
      setMdSyncError(null);
      setRawHtml('');
      setSearchOpen(false);
      try {
        const item = items.find((i) => i.path === path);
        const cached = htmlCache.current.get(path);
        let raw: string;
        if (cached && item && cached.mtimeMs === item.mtimeMs) {
          raw = cached.raw;
        } else {
          raw = await fetchRawHtml(path);
          if (item) htmlCache.current.set(path, { mtimeMs: item.mtimeMs, raw });
        }
        if (gen !== openGeneration.current) return;
        setRawHtml(raw);
        if (!mdDirty) setMd(htmlToMarkdown(raw));
        const tpl = matchTemplate(path);
        if (tpl) {
          const saved = loadTuneParams(path);
          setTuneParams(saved ? { ...defaultParams(tpl), ...saved } : defaultParams(tpl));
        } else {
          setTuneParams({});
        }
      } catch (e) {
        if (gen !== openGeneration.current) return;
        setRawHtml('');
        setMd('');
        setMdError(String(e instanceof Error ? e.message : e));
      } finally {
        if (gen === openGeneration.current) setBusy(false);
      }
    },
    [options, items, mdDirty],
  );

  const regenerateMd = useCallback(() => {
    if (!rawHtml) return;
    setMd(htmlToMarkdown(rawHtml));
    setMdDirty(false);
    setMdSyncError(null);
    setMdError(null);
  }, [rawHtml]);

  const openMarkdown = useCallback(() => {
    if (!rawHtml) return;
    if (!md || !hasModuleMarkers(md)) {
      setMd(htmlToMarkdown(rawHtml));
      setMdDirty(false);
    }
    setMdSyncError(null);
    setMdOpen(true);
  }, [md, rawHtml]);

  const mdLinked = useMemo(() => (rawHtml ? countModuleNodes(rawHtml) > 0 : false), [rawHtml]);

  const saveHtml = useCallback(async () => {
    if (!selected || !rawHtml) return;
    setSaveNote(null);
    try {
      await saveRawHtml(selected, rawHtml);
      setHtmlDirty(false);
      htmlCache.current.set(selected, {
        mtimeMs: Date.now(),
        raw: rawHtml,
      });
      setSaveNote('Saved to disk');
      void refreshList();
      window.setTimeout(() => setSaveNote(null), 2200);
    } catch (e) {
      setSaveNote(String(e instanceof Error ? e.message : e));
    }
  }, [selected, rawHtml, refreshList]);

  const copyPreviewLink = useCallback(async (path: string) => {
    const url = previewPageUrl(path);
    try {
      await navigator.clipboard.writeText(url);
      setCopyNote('Link copied');
      window.setTimeout(() => setCopyNote(null), 1800);
    } catch {
      setCopyNote('Copy failed');
      window.setTimeout(() => setCopyNote(null), 1800);
    }
    setCtxMenu(null);
  }, []);

  const closeTune = useCallback(() => {
    setSelectedComponent(null);
    persistUi({ tuneOpen: false });
    previewIframeRef.current?.contentWindow?.postMessage({ type: 'hl-lab-deselect' }, '*');
  }, [persistUi]);

  const openTuneAll = useCallback(() => {
    setSelectedComponent(null);
    previewIframeRef.current?.contentWindow?.postMessage({ type: 'hl-lab-deselect' }, '*');
    persistUi({ tuneOpen: true });
  }, [persistUi]);

  const previewSrcDoc = useMemo(() => {
    if (!rawHtml) return '';
    if (isProjectSlideFragmentPath(selected)) return '';
    if (!template) return rawHtml;
    const css = buildTuneCss(template, tuneParamsRef.current);
    return injectLabPreview(rawHtml, css, template.components);
  }, [rawHtml, selected, template]);

  const previewFrameSrc = useMemo(
    () => (isProjectSlideFragmentPath(selected) ? apiPreviewUrl(selected ?? '') : undefined),
    [selected],
  );

  const syncPreviewTune = useCallback(() => {
    const doc = previewIframeRef.current?.contentDocument;
    if (doc && template) updatePreviewTuneCss(doc, template, tuneParams);
  }, [template, tuneParams]);

  const runAutoLayout = useCallback(async () => {
    if (!template || !previewIframeRef.current) return;
    setAutoLayoutBusy(true);
    setAutoLayoutNote(null);
    try {
      const result = await autoOptimizeLayout(
        previewIframeRef.current,
        template,
        tuneParamsRef.current,
      );
      setTuneParams(result.params);
      tuneParamsRef.current = result.params;
      const doc = previewIframeRef.current.contentDocument;
      if (doc) updatePreviewTuneCss(doc, template, result.params);
      setAutoLayoutNote(
        result.resolved
          ? `Auto-fit in ${result.iterations} steps`
          : `Tightened ${result.iterations} steps (still tight)`,
      );
      window.setTimeout(() => setAutoLayoutNote(null), 2800);
    } catch (e) {
      setAutoLayoutNote(String(e instanceof Error ? e.message : e));
    } finally {
      setAutoLayoutBusy(false);
    }
  }, [template]);

  const setMdTracked = useCallback((value: string) => {
    setMd(value);
    setMdDirty(true);
  }, []);

  useEffect(() => {
    if (!mdOpen || !mdDirty || !rawHtml || !mdLinked) return;
    if (!hasModuleMarkers(debouncedMd)) return;
    try {
      const next = applyModuleMarkdownToHtml(rawHtml, debouncedMd);
      if (next !== rawHtml) {
        setRawHtml(next);
        setHtmlRevision((n) => n + 1);
        setHtmlDirty(true);
        setMdSyncError(null);
        if (selected) {
          htmlCache.current.set(selected, { mtimeMs: Date.now(), raw: next });
        }
      }
    } catch (e) {
      setMdSyncError(String(e instanceof Error ? e.message : e));
    }
  }, [debouncedMd, mdOpen, mdDirty, rawHtml, mdLinked, selected]);

  const moduleStats = useMemo(() => {
    if (!template || !rawHtml) return [];
    return analyzeModules(rawHtml, template.modules);
  }, [rawHtml, template]);

  const focusedParamDefs = useMemo(() => {
    if (!template) return [];
    return filterParamsForComponent(template, selectedComponent?.id ?? null);
  }, [template, selectedComponent]);

  const focusedModuleStats = useMemo(() => {
    if (!template) return moduleStats;
    if (!selectedComponent) return moduleStats;
    return filterModuleStatsForComponent(
      moduleStats,
      selectedComponent.id,
      selectedComponent.elementIndex,
      template,
    );
  }, [moduleStats, selectedComponent, template]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return f ? items.filter((it) => it.path.toLowerCase().includes(f)) : items;
  }, [items, filter]);

  const onSidebarDrag = useDragWidth((delta) => {
    setUi((prev) => {
      if (prev.sidebarCollapsed) return prev;
      const next = {
        ...prev,
        sidebarWidth: Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, prev.sidebarWidth + delta)),
      };
      saveUiState(next);
      return next;
    });
  });

  const downloadMd = useCallback(() => {
    if (!selected) return;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${selected.replace(/[/\\]/g, '__')}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [md, selected]);

  const resetTune = useCallback(() => {
    if (!template) return;
    setTuneParams(defaultParams(template));
    setSavedNote(null);
  }, [template]);

  const saveTune = useCallback(() => {
    if (!selected) return;
    saveTuneParams(selected, tuneParams);
    setSavedNote('Saved locally (per file + template)');
    window.setTimeout(() => setSavedNote(null), 2200);
  }, [selected, tuneParams]);

  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [ctxMenu]);

  useEffect(() => {
    if (!ui.tuneOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTune();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ui.tuneOpen, closeTune]);

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      const data = ev.data as LabSelectMessage | undefined;
      if (!data || data.type !== 'hl-lab-select') return;
      setSelectedComponent({
        id: data.componentId,
        label: data.label,
        elementIndex: data.elementIndex,
      });
      persistUi({ tuneOpen: true });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [persistUi]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    if (didInitDeepLink.current) return;
    const path = options.initialPath ?? readDeepLinkPath();
    if (!path) return;
    didInitDeepLink.current = true;
    void openSelected(path);
  }, [openSelected, options.initialPath]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        if (document.visibilityState === 'visible') void refreshList();
        schedule();
      }, 12_000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [refreshList]);

  useEffect(() => {
    const map = new Map(items.map((i) => [i.path, i.mtimeMs]));
    if (selected) {
      const next = map.get(selected);
      const prev = mtimeSnapshot.current.get(selected);
      if (prev !== undefined && next !== undefined && next > prev) {
        setMtimeNote('File changed on disk. Regenerate Markdown if needed.');
      }
    }
    mtimeSnapshot.current = map;
  }, [items, selected]);

  useEffect(() => {
    syncPreviewTune();
  }, [syncPreviewTune]);

  return {
    ui,
    persistUi,
    items,
    listMeta,
    filter,
    setFilter,
    filtered,
    selected,
    rawHtml,
    md,
    mdError,
    loadErr,
    busy,
    mtimeNote,
    mdOpen,
    setMdOpen,
    mdDirty,
    htmlDirty,
    mdLinked,
    mdSyncError,
    saveNote,
    autoLayoutBusy,
    autoLayoutNote,
    tuneParams,
    setTuneParams,
    setMd: setMdTracked,
    savedNote,
    selectedComponent,
    copyNote,
    ctxMenu,
    setCtxMenu,
    searchOpen,
    setSearchOpen,
    template,
    previewIframeRef,
    previewSrcDoc,
    previewFrameSrc,
    htmlRevision,
    moduleStats,
    focusedParamDefs,
    focusedModuleStats,
    refreshList,
    openSelected,
    copyPreviewLink,
    closeTune,
    openTuneAll,
    syncPreviewTune,
    onSidebarDrag,
    downloadMd,
    regenerateMd,
    openMarkdown,
    saveHtml,
    runAutoLayout,
    resetTune,
    saveTune,
    watchRoots,
  };
}

export type HtmlLabController = ReturnType<typeof useHtmlLab>;
