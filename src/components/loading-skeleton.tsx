export function LoadingSkeleton({
  variant = "guild",
}: {
  variant?: "landing" | "picker" | "guild";
}) {
  return (
    <main
      className={`page-skeleton skeleton-${variant}`}
      aria-label="Loading page"
      aria-busy="true"
    >
      <div className="skeleton-topbar">
        <span className="skeleton skeleton-brand" />
        <span className="skeleton skeleton-nav" />
      </div>
      <div className="skeleton-body">
        {variant === "guild" && (
          <aside className="skeleton-sidebar">
            <span className="skeleton skeleton-server" />
            {[1, 2, 3, 4, 5].map((item) => (
              <span className="skeleton skeleton-navitem" key={item} />
            ))}
          </aside>
        )}
        <section className="skeleton-main">
          <span className="skeleton skeleton-eyebrow" />
          <span className="skeleton skeleton-heading" />
          <span className="skeleton skeleton-subheading" />
          <div className="skeleton-cards">
            {[1, 2, 3, 4].map((item) => (
              <span className="skeleton skeleton-card" key={item} />
            ))}
          </div>
          <span className="skeleton skeleton-row" />
          <span className="skeleton skeleton-row" />
        </section>
      </div>
    </main>
  );
}
