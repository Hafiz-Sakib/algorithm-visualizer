import { Link } from "@tanstack/react-router";

const links = [
  { to: "/", label: "Home" },
  { to: "/sorting", label: "Sorting" },
  { to: "/searching", label: "Searching" },
  { to: "/tree", label: "Tree" },
  { to: "/pathfinding", label: "Pathfinding" },
] as const;

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block h-6 w-6 rounded-md bg-primary" />
          <span>AlgoViz</span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.slice(1).map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              activeProps={{ className: "px-3 py-1.5 rounded-md text-sm bg-primary text-primary-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}