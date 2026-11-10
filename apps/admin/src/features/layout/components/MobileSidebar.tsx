import * as Dialog from "@radix-ui/react-dialog";
import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslations } from "use-intl";

import { Sidebar } from "./Sidebar";

export interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// The same sidebar as a drawer below the lg breakpoint; it closes on navigation.
export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const t = useTranslations();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-overlay/40 fixed inset-0 z-40 lg:hidden" />
        <Dialog.Content
          className="fixed inset-y-0 left-0 z-50 lg:hidden"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">{t("nav_label")}</Dialog.Title>
          <Sidebar />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
