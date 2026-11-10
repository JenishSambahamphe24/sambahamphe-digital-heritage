import type { INameDraft } from "../name-draft.types";
import type { TNameType } from "@repo/contracts";

import { useTranslations } from "use-intl";

import { NAME_TYPES } from "@repo/contracts";
import { Button, Input, Select } from "@repo/ui";

const SCRIPTS = ["Latn", "Deva", "Limb"] as const;

export interface NamesEditorProps {
  value: INameDraft[];
  onChange: (value: INameDraft[]) => void;
  invalid?: boolean;
}

export function NamesEditor({ value, onChange, invalid }: NamesEditorProps) {
  const t = useTranslations();
  const update = (key: number, patch: Partial<INameDraft>) =>
    onChange(value.map((name) => (name.key === key ? { ...name, ...patch } : name)));
  return (
    <fieldset className="flex flex-col gap-2" aria-invalid={invalid || undefined}>
      <legend className="text-sm font-medium">{t("person_names")}</legend>
      {value.map((name) => (
        <div key={name.key} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-12">
          <Input
            aria-label={t("person_full_name")}
            placeholder={t("person_full_name")}
            className="sm:col-span-5"
            invalid={invalid && !name.fullName.trim()}
            value={name.fullName}
            onChange={(event) => update(name.key, { fullName: event.target.value })}
          />
          <Select
            aria-label={t("person_name_type")}
            className="sm:col-span-2"
            value={name.nameType}
            onValueChange={(value) => update(name.key, { nameType: value as TNameType })}
            options={NAME_TYPES.map((type) => ({
              value: type,
              label: t("person_name_type_value", { type }),
            }))}
          />
          <Select
            aria-label={t("person_script")}
            className="sm:col-span-2"
            value={name.script}
            onValueChange={(value) => update(name.key, { script: value })}
            options={[
              { value: "", label: t("person_script_unset") },
              ...SCRIPTS.map((script) => ({
                value: script,
                label: t("person_script_value", { script }),
              })),
            ]}
          />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="radio"
              name="primary-name"
              checked={name.isPrimary}
              onChange={() =>
                onChange(value.map((other) => ({ ...other, isPrimary: other.key === name.key })))
              }
            />
            {t("person_primary_name")}
          </label>
          <Button
            variant="ghost"
            className="sm:col-span-1"
            disabled={value.length === 1}
            onClick={() => onChange(value.filter((other) => other.key !== name.key))}
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
            { key: Date.now(), fullName: "", nameType: "alias", script: "", isPrimary: false },
          ])
        }
      >
        {t("person_add_name")}
      </Button>
    </fieldset>
  );
}
