import { Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { MobileSidebar } from "./MobileSidebar";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

// The bars never move: the window is locked to the viewport and only the
// content column scrolls (same shape as the Pathibhara admin).
export function AdminLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // A focused element or anchor jump can still scroll the window itself;
  // put it back so the sidebar and navbar stay in place.
  useEffect(() => {
    function resetWindowScroll() {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    }
    window.addEventListener("scroll", resetWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", resetWindowScroll);
  }, []);

  return (
    <div className="bg-background flex">
      <div className="hidden shrink-0 lg:block">
        <Sidebar />
      </div>
      <MobileSidebar open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen} />
      <div className="flex h-screen w-full min-w-0 flex-col overflow-hidden">
        <div className="shrink-0">
          <Navbar onOpenSidebar={() => setIsMobileSidebarOpen(true)} />
        </div>
        <main className="scrollbar-slim grow overflow-y-auto px-3 md:px-6">
          <div className="mx-auto max-w-7xl pt-4 pb-6 md:pt-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
