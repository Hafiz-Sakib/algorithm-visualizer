import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";

const links = [
  { to: "/sorting", label: "Sorting", icon: "⟨⟩", color: "oklch(0.72 0.19 255)" },
  { to: "/searching", label: "Searching", icon: "⌕", color: "oklch(0.75 0.18 162)" },
  { to: "/tree", label: "Tree", icon: "⋔", color: "oklch(0.82 0.18 85)" },
  { to: "/pathfinding", label: "Pathfinding", icon: "◈", color: "oklch(0.68 0.22 22)" },
  { to: "/graph", label: "Graph", icon: "⬡", color: "oklch(0.75 0.18 310)" },
  { to: "/dp", label: "DP", icon: "⊞", color: "oklch(0.72 0.22 180)" },
  { to: "/strings", label: "Strings", icon: "Σ", color: "oklch(0.82 0.22 60)" },
  { to: "/nqueens", label: "N-Queens", icon: "♛", color: "oklch(0.82 0.18 85)" },
  { to: "/knights", label: "Knight's Tour", icon: "♞", color: "oklch(0.72 0.22 180)" },
  { to: "/hanoi", label: "Hanoi", icon: "⌬", color: "oklch(0.75 0.18 310)" },
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);
  const router = useRouterState();
  const path = router.location.pathname;

  return (
    <header className="sticky top-0 z-50" style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", background: "oklch(0.08 0.02 265 / 88%)", borderBottom: "1px solid oklch(1 0 0 / 8%)" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, oklch(0.72 0.19 255), oklch(0.75 0.18 162))" }}>
            <span className="text-xs font-bold text-white select-none">AV</span>
          </div>
          <span className="font-semibold text-sm hidden sm:block" style={{ letterSpacing: "-0.02em" }}>
            <span className="text-white">Algo</span><span style={{ color: "oklch(0.72 0.19 255)" }}>Viz</span>
          </span>
        </Link>

        {/* Desktop nav — scrollable on medium screens */}
        <nav className="hidden md:flex items-center gap-0.5 overflow-x-auto max-w-[78%]">
          {links.map((l) => {
            const active = path === l.to;
            return (
              <Link key={l.to} to={l.to}
                className="relative px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap"
                style={{ color: active ? "oklch(0.95 0.01 255)" : "oklch(0.58 0.04 255)", background: active ? "oklch(1 0 0 / 8%)" : "transparent" }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "oklch(0.82 0.01 255)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "oklch(0.58 0.04 255)"; }}>
                {active && <span className="absolute inset-x-2.5 bottom-0.5 h-[2px] rounded-full" style={{ background: l.color }} />}
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Hamburger */}
        <button className="md:hidden flex flex-col gap-[5px] p-2 rounded-lg" onClick={() => setOpen(v => !v)} aria-label="Toggle menu"
          style={{ color: "oklch(0.65 0.04 255)" }}>
          <span className="block h-[1.5px] w-5 rounded-full transition-all duration-200" style={{ background: "currentColor", transform: open ? "rotate(45deg) translate(4.5px,4.5px)" : "none" }} />
          <span className="block h-[1.5px] w-5 rounded-full transition-all duration-200" style={{ background: "currentColor", opacity: open ? 0 : 1 }} />
          <span className="block h-[1.5px] w-5 rounded-full transition-all duration-200" style={{ background: "currentColor", transform: open ? "rotate(-45deg) translate(4.5px,-4.5px)" : "none" }} />
        </button>
      </div>

      {/* Mobile dropdown */}
      <div className="md:hidden transition-all duration-300 ease-in-out" style={{ maxHeight: open ? "700px" : "0", opacity: open ? 1 : 0, overflow: "hidden" }}>
        <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-1" style={{ borderTop: "1px solid oklch(1 0 0 / 6%)" }}>
          {links.map((l) => {
            const active = path === l.to;
            return (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                style={{ background: active ? "oklch(1 0 0 / 7%)" : "transparent", color: active ? "oklch(0.95 0.01 255)" : "oklch(0.62 0.04 255)", borderLeft: active ? `2px solid ${l.color}` : "2px solid transparent" }}>
                <span className="w-4 text-center" style={{ color: l.color }}>{l.icon}</span>
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
