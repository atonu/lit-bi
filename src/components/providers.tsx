"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const isChatPage = pathname === "/" || pathname.startsWith("/chat");
    if (!isChatPage) {
      const resetScroll = () => {
        // Scroll window and document elements
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        // Scroll all overflow-y-auto containers
        const scrollContainers = document.querySelectorAll(".overflow-y-auto, [style*='overflow-y: auto']");
        scrollContainers.forEach((container) => {
          container.scrollTop = 0;
        });
      };
      
      resetScroll();
      // Ensure we catch it after any delayed render/paints
      requestAnimationFrame(resetScroll);
      const timer1 = setTimeout(resetScroll, 50);
      const timer2 = setTimeout(resetScroll, 150);
      const timer3 = setTimeout(resetScroll, 300);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [pathname]);

  return <>{children}</>;
}
