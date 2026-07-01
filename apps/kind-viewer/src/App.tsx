import { useEffect, useState } from 'react';
import { AdminPortal } from './AdminPortal';
import { authHeaders, clearSession, loadSession, saveSession, verifySession } from './auth';
import { type ContentLang, loadContentLang, saveContentLang } from './contentLang';
import { UI } from './i18n';
import { LoginGate } from './LoginGate';
import { Presenter } from './Presenter';
import type { AuthSession, ManifestResponse } from './types';

type Route = { mode: 'present' } | { mode: 'admin' };

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, '');
  if (raw === 'admin' || raw === '/admin') return { mode: 'admin' };
  return { mode: 'present' };
}

export function App() {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession());
  const [authReady, setAuthReady] = useState(false);
  const [contentLang, setContentLang] = useState<ContentLang>(() => loadContentLang());
  const [route, setRoute] = useState(parseHash);
  const [manifest, setManifest] = useState<ManifestResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  const t = UI[contentLang];
  const authKey = session ? `${session.email}\0${session.token}` : null;

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!authKey) {
        setAuthReady(true);
        return;
      }
      const current = loadSession();
      if (!current) {
        setAuthReady(true);
        return;
      }
      const verified = await verifySession(current);
      if (cancelled) return;
      if (!verified) {
        clearSession();
        setSession(null);
      } else {
        setSession((prev) =>
          prev?.token === verified.token && prev?.email === verified.email ? prev : verified,
        );
      }
      setAuthReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authKey]);

  useEffect(() => {
    void authKey;
    const current = loadSession();
    if (!current || route.mode === 'admin') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/manifest?t=${Date.now()}`, {
          cache: 'no-store',
          headers: authHeaders(current),
        });
        if (res.status === 401) {
          clearSession();
          setSession(null);
          return;
        }
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const data = (await res.json()) as ManifestResponse;
        if (!cancelled) {
          setManifest(data);
          setLoadError(null);
          setSlideIndex((i) => Math.min(i, Math.max(0, data.slides.length - 1)));
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(String((e as Error)?.message ?? e));
          setManifest(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authKey, route.mode]);

  const onLogin = (s: AuthSession) => {
    saveSession(s);
    setSession(s);
    window.location.hash = '#/';
  };

  const onLogout = () => {
    clearSession();
    setSession(null);
    setManifest(null);
    window.location.hash = '#/';
  };

  const onContentLangChange = (lang: ContentLang) => {
    setContentLang(lang);
    saveContentLang(lang);
  };

  if (!authReady) {
    return (
      <div className="presenter-loading">
        <p>{t.loading}</p>
      </div>
    );
  }

  if (!session) {
    return <LoginGate uiLang={contentLang} onSuccess={onLogin} />;
  }

  if (route.mode === 'admin') {
    if (session.role !== 'admin') {
      window.location.hash = '#/';
      return null;
    }
    return (
      <AdminPortal
        session={session}
        uiLang={contentLang}
        onBack={() => {
          window.location.hash = '#/';
        }}
      />
    );
  }

  if (loadError) {
    return (
      <div className="presenter-loading">
        <p>{t.loadError}</p>
        <p>{loadError}</p>
      </div>
    );
  }

  if (!manifest?.slides.length) {
    return (
      <div className="presenter-loading">
        <p>{t.loading}</p>
      </div>
    );
  }

  return (
    <Presenter
      slides={manifest.slides}
      index={slideIndex}
      contentLang={contentLang}
      session={session}
      onIndexChange={setSlideIndex}
      onContentLangChange={onContentLangChange}
      onLogout={onLogout}
      onAdmin={() => {
        window.location.hash = '#/admin';
      }}
    />
  );
}
