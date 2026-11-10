import type { ReactNode } from "react";

import { setRequestLocale } from "next-intl/server";

import { AuthShell } from "#/features/auth/components/AuthShell";

interface AuthLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

// Layouts render alongside pages, so each one sets the locale for static rendering.
export default async function AuthLayout({ children, params }: AuthLayoutProps) {
  setRequestLocale((await params).locale);
  return <AuthShell>{children}</AuthShell>;
}
