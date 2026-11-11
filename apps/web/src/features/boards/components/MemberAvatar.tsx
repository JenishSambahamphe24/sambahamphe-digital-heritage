import { cn } from "@repo/ui";

import { I18nTextHelper } from "#/lib/i18n-text.helper";

export type TMemberAvatarSize = "md" | "lg";

const SIZE_CLASSES: Record<TMemberAvatarSize, string> = {
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
};

export interface MemberAvatarProps {
  name: string;
  size?: TMemberAvatarSize;
  className?: string;
}

// Initials only: board pages never show photos of living people.
export function MemberAvatar({ name, size = "md", className }: MemberAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-info-subtle text-primary font-display flex shrink-0 items-center justify-center rounded-full font-semibold",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {I18nTextHelper.initials(name)}
    </span>
  );
}
