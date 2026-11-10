export interface AuthTitleProps {
  children: string;
}

export function AuthTitle({ children }: AuthTitleProps) {
  return <h1 className="font-display text-foreground text-2xl font-semibold">{children}</h1>;
}
