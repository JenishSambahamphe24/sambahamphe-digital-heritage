import { useDeferredValue, useState } from "react";
import { useTranslations } from "use-intl";

import { Button, Input } from "@repo/ui";

import { usePersonOptions } from "../hooks/usePersonOptions";

export interface IPickedPerson {
  id: string;
  displayName: string;
}

export interface PersonOptionPickerProps {
  id: string;
  unitId: string;
  value: IPickedPerson | null;
  onChange: (person: IPickedPerson | null) => void;
  invalid?: boolean;
}

export function PersonOptionPicker({
  id,
  unitId,
  value,
  onChange,
  invalid,
}: PersonOptionPickerProps) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim());
  const options = usePersonOptions(unitId, deferred);

  if (value) {
    return (
      <div className="border-border-strong bg-surface flex h-10 items-center justify-between gap-2 rounded-md border px-3 text-sm">
        <span className="truncate">{value.displayName}</span>
        <Button variant="ghost" className="h-8 px-2" onClick={() => onChange(null)}>
          {t("place_picker_clear")}
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <Input
        id={id}
        invalid={invalid}
        aria-describedby={`${id}-message`}
        placeholder={t("org_person_picker_placeholder")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {options.data && options.data.length > 0 ? (
        <ul className="border-border bg-surface divide-border divide-y rounded-md border text-sm">
          {options.data.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                className="hover:bg-surface-muted w-full px-3 py-2 text-left"
                onClick={() => {
                  onChange(person);
                  setQuery("");
                }}
              >
                {person.displayName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
