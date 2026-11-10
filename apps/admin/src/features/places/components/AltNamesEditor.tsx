import type { TPlaceAltNameKind } from "@repo/contracts";

import { useTranslations } from "use-intl";

import { PLACE_ALT_NAME_KINDS } from "@repo/contracts";
import { Button, Input, Select } from "@repo/ui";

export interface IAltNameDraft {
  key: number;
  name: string;
  kind: TPlaceAltNameKind;
  validFromYear: string;
  validToYear: string;
}

export interface AltNamesEditorProps {
  value: IAltNameDraft[];
  onChange: (value: IAltNameDraft[]) => void;
}

export function AltNamesEditor({ value, onChange }: AltNamesEditorProps) {
  const t = useTranslations();
  const update = (key: number, patch: Partial<IAltNameDraft>) =>
    onChange(value.map((alt) => (alt.key === key ? { ...alt, ...patch } : alt)));
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{t("place_alt_names")}</legend>
      <p className="text-foreground-muted text-sm">{t("place_alt_names_hint")}</p>
      {value.map((alt) => (
        <div key={alt.key} className="grid grid-cols-1 gap-2 sm:grid-cols-12">
          <Input
            aria-label={t("place_alt_name")}
            className="sm:col-span-5"
            value={alt.name}
            onChange={(event) => update(alt.key, { name: event.target.value })}
          />
          <Select
            aria-label={t("place_alt_kind")}
            className="sm:col-span-3"
            value={alt.kind}
            onValueChange={(value) => update(alt.key, { kind: value as TPlaceAltNameKind })}
            options={PLACE_ALT_NAME_KINDS.map((kind) => ({
              value: kind,
              label: t("place_alt_kind_value", { kind }),
            }))}
          />
          <Input
            aria-label={t("place_alt_from")}
            placeholder={t("place_alt_from")}
            inputMode="numeric"
            className="sm:col-span-1"
            value={alt.validFromYear}
            onChange={(event) => update(alt.key, { validFromYear: event.target.value })}
          />
          <Input
            aria-label={t("place_alt_to")}
            placeholder={t("place_alt_to")}
            inputMode="numeric"
            className="sm:col-span-1"
            value={alt.validToYear}
            onChange={(event) => update(alt.key, { validToYear: event.target.value })}
          />
          <Button
            variant="ghost"
            className="sm:col-span-2"
            onClick={() => onChange(value.filter((other) => other.key !== alt.key))}
          >
            {t("common_remove")}
          </Button>
        </div>
      ))}
      <Button
        variant="secondary"
        className="self-start"
        onClick={() =>
          onChange([
            ...value,
            { key: Date.now(), name: "", kind: "variant", validFromYear: "", validToYear: "" },
          ])
        }
      >
        {t("place_alt_add")}
      </Button>
    </fieldset>
  );
}
