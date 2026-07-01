import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LabShell } from './ui/LabShell';
import { RouteLoader } from './ui/RouteLoader';

const SkillHubPage = lazy(() =>
  import('./pages/SkillHubPage').then((m) => ({ default: m.SkillHubPage })),
);
const LabApp = lazy(() => import('./LabAppRoute').then((m) => ({ default: m.LabApp })));
const DocxLabPage = lazy(() =>
  import('./pages/DocxLabPage').then((m) => ({ default: m.DocxLabPage })),
);
const ProjectJourneyPage = lazy(() =>
  import('./pages/ProjectJourneyPage').then((m) => ({ default: m.ProjectJourneyPage })),
);
const ProjectsPage = lazy(() =>
  import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })),
);
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));

function LazyRoute({ children, label }: { children: React.ReactNode; label: string }) {
  return <Suspense fallback={<RouteLoader label={label} />}>{children}</Suspense>;
}

/** open-slide Lab — shared shell, HTML editor, docx export, deck journeys */
export function AppRouter() {
  return (
    <Routes>
      <Route element={<LabShell />}>
        <Route
          path="/"
          element={
            <LazyRoute label="Loading hub…">
              <SkillHubPage />
            </LazyRoute>
          }
        />
        <Route
          path="/lab"
          element={
            <LazyRoute label="Loading HTML Lab…">
              <LabApp />
            </LazyRoute>
          }
        />
        <Route
          path="/docx"
          element={
            <LazyRoute label="Loading docx-master…">
              <DocxLabPage />
            </LazyRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <LazyRoute label="Loading projects…">
              <ProjectsPage />
            </LazyRoute>
          }
        />
        <Route
          path="/project/:projectId"
          element={
            <LazyRoute label="Loading deck…">
              <ProjectJourneyPage />
            </LazyRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <LazyRoute label="Loading admin…">
              <AdminPage />
            </LazyRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
