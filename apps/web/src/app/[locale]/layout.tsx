import type { Metadata } from "next";
import type { ReactNode } from "react";

import "../globals.css";

import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Noto_Sans, Noto_Sans_Devanagari, Noto_Sans_Limbu, Noto_Serif } from "next/font/google";
import { notFound } from "next/navigation";

import { cn, Toaster } from "@repo/ui";

import { Providers } from "#/features/site/components/Providers";
import { routing } from "#/i18n/routing";

const sans = Noto_Sans({ subsets: ["latin"], variable: "--font-app-sans", display: "swap" });
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-app-devanagari",
  display: "swap",
});
// Noto Sans Limbu ships a single weight; bold Limbu text is synthesized.
const limbu = Noto_Sans_Limbu({
  weight: "400",
  subsets: ["limbu"],
  variable: "--font-app-limbu",
  display: "swap",
});
const display = Noto_Serif({ subsets: ["latin"], variable: "--font-app-display", display: "swap" });

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: { default: t("site_name"), template: `%s · ${t("site_name")}` },
    description: t("meta_description"),
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  return (
    <html
      lang={locale}
      className={cn(sans.variable, devanagari.variable, limbu.variable, display.variable)}
    >
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider>
          <Providers>
            {children}
            <Toaster closeLabel={t("toast_close")} />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
