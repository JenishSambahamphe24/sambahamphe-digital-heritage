import { useDeferredValue, useState } from "react";
import { useLocale, useTranslations } from "use-intl";

import { Button, Input } from "@repo/ui";

import { I18nTextHelper } from "#/lib/i18n-text.helper";

import { usePlaces } from "../hooks/usePlaces";
import { PlacePath } from "./PlacePath";

const PICKER_PAGE = 1;
const PICKER_RESULTS = 8;

export interface IPickedPlace {
  id: string;
  label: string;
}

export interface PlacePickerProps {
  id: string;
  value: IPickedPlace | null;
  onChange: (place: IPickedPlace | null) => void;
  excludeId?: string;
  invalid?: boolean;
}

export function PlacePicker({ id, value, onChange, excludeId, invalid }: PlacePickerProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim());
  const results = usePlaces(deferred, "", PICKER_PAGE, PICKER_RESULTS);
  const options = deferred
    ? (results.data?.data ?? []).filter((place) => place.id !== excludeId)
    : [];

  if (value) {
    return (
      <div className="border-border-strong bg-surface flex h-10 items-center justify-between gap-2 rounded-md border px-3 text-sm">
        <span className="truncate">{value.label}</span>
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
        placeholder={t("place_picker_placeholder")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {options.length > 0 ? (
        <ul className="border-border bg-surface divide-border divide-y rounded-md border text-sm">
          {options.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                className="hover:bg-surface-muted flex w-full flex-col items-start px-3 py-2 text-left"
                onClick={() => {
                  onChange({ id: place.id, label: I18nTextHelper.pick(place.nameI18n, locale) });
                  setQuery("");
                }}
              >
                <span>{I18nTextHelper.pick(place.nameI18n, locale)}</span>
                <PlacePath ancestors={place.ancestors} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
