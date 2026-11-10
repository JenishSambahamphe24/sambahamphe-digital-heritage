import type { ReactNode } from "react";

import { setRequestLocale } from "next-intl/server";

import { SiteFooter } from "#/features/site/components/SiteFooter";
import { SiteHeader } from "#/features/site/components/SiteHeader";

interface SiteLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

// Layouts render alongside pages, so each one sets the locale for static rendering.
export default async function SiteLayout({ children, params }: SiteLayoutProps) {
  setRequestLocale((await params).locale);
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
