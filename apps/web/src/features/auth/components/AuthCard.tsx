import type { ReactNode } from "react";

import { Card } from "@repo/ui";

export interface AuthCardProps {
  title: string;
  children: ReactNode;
}

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <Card className="flex flex-col gap-6">
        <h1 className="font-display text-foreground text-2xl font-semibold">{title}</h1>
        {children}
      </Card>
    </div>
  );
}
