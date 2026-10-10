"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const fallbackTimer = useRef(0);

  useEffect(() => {
    window.clearTimeout(fallbackTimer.current);
    const timer = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const beginNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      const sameDocument = destination.pathname === current.pathname && destination.search === current.search;
      if (destination.origin !== current.origin || (sameDocument && destination.hash)) return;
      if (destination.pathname === current.pathname && destination.search === current.search) return;

      setLoading(true);
      window.clearTimeout(fallbackTimer.current);
      fallbackTimer.current = window.setTimeout(() => setLoading(false), 2400);
    };

    document.addEventListener("click", beginNavigation, true);
    return () => {
      document.removeEventListener("click", beginNavigation, true);
      window.clearTimeout(fallbackTimer.current);
    };
  }, []);

  return <>
    <AnimatePresence>
      {loading ? <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="pointer-events-none fixed inset-x-0 top-0 z-[70]"
        role="status"
        aria-live="polite"
        aria-label="Loading page"
      >
        <div className="h-[3px] overflow-hidden bg-[#dcebe5]"><span className="route-progress-line block h-full w-[42%] bg-[#26b98b]" /></div>
        <div className="absolute right-3 top-3 flex items-center gap-2 bg-[#073c31] px-3 py-2 text-[10px] font-bold uppercase text-white shadow-lg md:right-6">
          <span className="h-1.5 w-1.5 animate-pulse bg-[#72e0b7]" /> Loading
        </div>
      </motion.div> : null}
    </AnimatePresence>
  </>;
}
