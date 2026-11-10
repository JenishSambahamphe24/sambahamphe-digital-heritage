import type { IAltNameDraft } from "./AltNamesEditor";
import type { IPickedPlace } from "./PlacePicker";
import type { TPlaceKind, TPlaceResponse } from "@repo/contracts";

import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useLocale, useTranslations } from "use-intl";

import { PLACE_KINDS } from "@repo/contracts";
import { Button, FormField, Input, Select, ToastHelper } from "@repo/ui";

import { Textarea } from "#/components/Textarea";
import { FieldErrorsHelper } from "#/lib/field-errors.helper";
import { I18nTextHelper } from "#/lib/i18n-text.helper";
import { ProblemMessageHelper } from "#/lib/problem-message.helper";

import { useSavePlace } from "../hooks/useSavePlace";
import { AltNamesEditor } from "./AltNamesEditor";
import { PlacePicker } from "./PlacePicker";

export interface PlaceFormProps {
  place?: TPlaceResponse;
  initialParent?: IPickedPlace | null;
}

function optionalNumber(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

export function PlaceForm({ place, initialParent = null }: PlaceFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const navigate = useNavigate();
  const save = useSavePlace();
  const parentFromPlace = place?.ancestors.at(-1);
  const [kind, setKind] = useState<TPlaceKind>(place?.kind ?? "village");
  const [nameEn, setNameEn] = useState(place?.nameI18n.en ?? "");
  const [nameNe, setNameNe] = useState(place?.nameI18n.ne ?? "");
  const [parent, setParent] = useState<IPickedPlace | null>(
    parentFromPlace
      ? { id: parentFromPlace.id, label: I18nTextHelper.pick(parentFromPlace.nameI18n, locale) }
      : initialParent,
  );
  const [latitude, setLatitude] = useState(place?.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(place?.longitude?.toString() ?? "");
  const [notes, setNotes] = useState(place?.notes ?? "");
  const [altNames, setAltNames] = useState<IAltNameDraft[]>(
    (place?.altNames ?? []).map((alt, index) => ({
      key: index,
      name: alt.name,
      kind: alt.kind,
      validFromYear: alt.validFromYear?.toString() ?? "",
      validToYear: alt.validToYear?.toString() ?? "",
    })),
  );
  const errors = FieldErrorsHelper.byPath(save.error);
  const error = (path: string) =>
    errors.has(path) ? t(errors.get(path) ?? "field_error_invalid") : null;

  return (
    <form
      noValidate
      className="flex max-w-2xl flex-col gap-1"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(
          {
            id: place?.id,
            version: place?.version,
            body: {
              kind,
              parentId: parent?.id ?? null,
              nameI18n: { en: nameEn.trim() || undefined, ne: nameNe.trim() || undefined },
              latitude: optionalNumber(latitude),
              longitude: optionalNumber(longitude),
              notes: notes.trim() || null,
              altNames: altNames
                .filter((alt) => alt.name.trim())
                .map((alt) => ({
                  name: alt.name.trim(),
                  kind: alt.kind,
                  validFromYear: optionalNumber(alt.validFromYear),
                  validToYear: optionalNumber(alt.validToYear),
                })),
            },
          },
          {
            onSuccess: (saved) => {
              ToastHelper.show({ tone: "success", description: t("place_saved") });
              void navigate({ to: "/places", search: { parentId: saved.parentId ?? undefined } });
            },
            onError: (problem) => {
              ToastHelper.show({
                tone: "danger",
                description: t(ProblemMessageHelper.keyFor(problem.code)),
              });
            },
          },
        );
      }}
    >
      <div className="grid gap-x-4 sm:grid-cols-2">
        <FormField id="place-name-en" label={t("place_name_en")} error={error("nameI18n")}>
          <Input
            id="place-name-en"
            value={nameEn}
            invalid={errors.has("nameI18n")}
            aria-describedby="place-name-en-message"
            onChange={(event) => setNameEn(event.target.value)}
          />
        </FormField>
        <FormField id="place-name-ne" label={t("place_name_ne")}>
          <Input
            id="place-name-ne"
            lang="ne"
            value={nameNe}
            aria-describedby="place-name-ne-message"
            onChange={(event) => setNameNe(event.target.value)}
          />
        </FormField>
      </div>
      <FormField id="place-kind" label={t("place_kind_label")}>
        <Select
          id="place-kind"
          value={kind}
          onValueChange={(value) => setKind(value as TPlaceKind)}
          options={PLACE_KINDS.map((option) => ({
            value: option,
            label: t("place_kind", { kind: option }),
          }))}
        />
      </FormField>
      <FormField id="place-parent" label={t("place_parent")} hint={t("place_parent_hint")}>
        <PlacePicker id="place-parent" value={parent} onChange={setParent} excludeId={place?.id} />
      </FormField>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <FormField id="place-latitude" label={t("place_latitude")} error={error("latitude")}>
          <Input
            id="place-latitude"
            inputMode="decimal"
            value={latitude}
            invalid={errors.has("latitude")}
            aria-describedby="place-latitude-message"
            onChange={(event) => setLatitude(event.target.value)}
          />
        </FormField>
        <FormField id="place-longitude" label={t("place_longitude")} error={error("longitude")}>
          <Input
            id="place-longitude"
            inputMode="decimal"
            value={longitude}
            invalid={errors.has("longitude")}
            aria-describedby="place-longitude-message"
            onChange={(event) => setLongitude(event.target.value)}
          />
        </FormField>
      </div>
      <FormField id="place-notes" label={t("place_notes")}>
        <Textarea
          id="place-notes"
          value={notes}
          aria-describedby="place-notes-message"
          onChange={(event) => setNotes(event.target.value)}
        />
      </FormField>
      <AltNamesEditor value={altNames} onChange={setAltNames} />
      <div className="mt-4 flex gap-3">
        <Button type="submit" loading={save.isPending}>
          {t("common_save")}
        </Button>
        <Button
          variant="secondary"
          onClick={() => void navigate({ to: "/places", search: { parentId: parent?.id } })}
        >
          {t("common_cancel")}
        </Button>
      </div>
    </form>
  );
}
