import './route-loader.css';

export function RouteLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="lab-route-loader" role="status" aria-live="polite">
      <span className="lab-route-loader-bar" aria-hidden="true" />
      <span className="lab-route-loader-label">{label}</span>
    </div>
  );
}
