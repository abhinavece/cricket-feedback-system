/**
 * Broadcast layout — strips the parent auction header/nav for a clean OBS-ready view.
 * This layout renders children directly without any chrome.
 */
export default function BroadcastLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="broadcast-layout">
      <style>{`
        .broadcast-layout { position: fixed; inset: 0; z-index: 9999; background: #020617; }
        .broadcast-layout ~ *, header, nav, footer { display: none !important; }
      `}</style>
      {children}
    </div>
  );
}
