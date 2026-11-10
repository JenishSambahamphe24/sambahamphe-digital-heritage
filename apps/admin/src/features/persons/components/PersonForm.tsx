import type { IPickedPlace } from "../../places/components/PlacePicker";
import type { IFuzzyDateDraft } from "../fuzzy-date-draft.helper";
import type { INameDraft } from "../name-draft.types";
import type {
  TAdminPersonResponse,
  TFieldGroup,
  TFieldVisibility,
  TGender,
  TLineageRole,
  TLivingStatus,
  TVisibilityLevel,
} from "@repo/contracts";

import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useLocale, useTranslations } from "use-intl";

import {
  FIELD_GROUPS,
  GENDERS,
  LINEAGE_ROLES,
  LIVING_STATUSES,
  VISIBILITY_LEVELS,
} from "@repo/contracts";
import { Button, FormField, Input, ToastHelper } from "@repo/ui";

import { Select } from "#/components/Select";
import { Textarea } from "#/components/Textarea";
import { FieldErrorsHelper } from "#/lib/field-errors.helper";
import { I18nTextHelper } from "#/lib/i18n-text.helper";
import { ProblemMessageHelper } from "#/lib/problem-message.helper";

import { PlacePicker } from "../../places/components/PlacePicker";
import { FuzzyDateDraftHelper } from "../fuzzy-date-draft.helper";
import { useSavePerson } from "../hooks/useSavePerson";
import { FuzzyDateInput } from "./FuzzyDateInput";
import { NamesEditor } from "./NamesEditor";

// "" means "the default for this person's status", applied by the API.
type TLevelChoice = TVisibilityLevel | "";

export interface PersonFormProps {
  person?: TAdminPersonResponse;
}

export function PersonForm({ person }: PersonFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const navigate = useNavigate();
  const save = useSavePerson();
  const place = (summary: TAdminPersonResponse["birthPlace"]): IPickedPlace | null =>
    summary ? { id: summary.id, label: I18nTextHelper.pick(summary.nameI18n, locale) } : null;

  const [names, setNames] = useState<INameDraft[]>(
    person?.names.map((name, index) => ({
      key: index,
      fullName: name.fullName,
      nameType: name.nameType,
      script: name.script ?? "",
      isPrimary: name.isPrimary,
    })) ?? [{ key: 0, fullName: "", nameType: "birth", script: "", isPrimary: true }],
  );
  const [lineageRole, setLineageRole] = useState<TLineageRole>(person?.lineageRole ?? "lineage");
  const [gender, setGender] = useState<TGender | "">(person?.gender ?? "");
  const [isFounder, setIsFounder] = useState(person?.isFoundingAncestor ?? false);
  const [livingStatus, setLivingStatus] = useState<TLivingStatus>(
    person?.livingStatus ?? "unknown",
  );
  const [birthDate, setBirthDate] = useState<IFuzzyDateDraft>(
    FuzzyDateDraftHelper.fromDate(person?.birthDate),
  );
  const [deathDate, setDeathDate] = useState<IFuzzyDateDraft>(
    FuzzyDateDraftHelper.fromDate(person?.deathDate),
  );
  const [birthPlace, setBirthPlace] = useState(place(person?.birthPlace ?? null));
  const [deathPlace, setDeathPlace] = useState(place(person?.deathPlace ?? null));
  const [occupation, setOccupation] = useState(person?.occupation ?? "");
  const [internalNotes, setInternalNotes] = useState(person?.internalNotes ?? "");
  const [visibility, setVisibility] = useState<TLevelChoice>(person?.visibility ?? "");
  const [fieldVisibility, setFieldVisibility] = useState<
    Partial<Record<TFieldGroup, TLevelChoice>>
  >(person?.fieldVisibility ?? {});
  const [reason, setReason] = useState("");

  const errors = FieldErrorsHelper.byPath(save.error);
  const error = (path: string) =>
    errors.has(path) ? t(errors.get(path) ?? "field_error_invalid") : null;
  const chosenGroups = Object.fromEntries(
    Object.entries(fieldVisibility).filter(([, level]) => level !== ""),
  ) as TFieldVisibility;

  return (
    <form
      noValidate
      className="flex max-w-3xl flex-col gap-1"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(
          {
            id: person?.id,
            version: person?.version,
            body: {
              names: names
                .filter((name) => name.fullName.trim())
                .map((name) => ({
                  nameType: name.nameType,
                  fullName: name.fullName.trim(),
                  script: name.script || null,
                  isPrimary: name.isPrimary,
                })),
              lineageRole,
              gender: gender || null,
              isFoundingAncestor: isFounder,
              livingStatus,
              birthDate: FuzzyDateDraftHelper.toDate(birthDate),
              deathDate: livingStatus === "living" ? null : FuzzyDateDraftHelper.toDate(deathDate),
              birthPlaceId: birthPlace?.id ?? null,
              deathPlaceId: deathPlace?.id ?? null,
              occupation: occupation.trim() || null,
              internalNotes: internalNotes.trim() || null,
              visibility: visibility || undefined,
              fieldVisibility: Object.keys(chosenGroups).length > 0 ? chosenGroups : undefined,
              reason: reason.trim() || null,
            },
          },
          {
            onSuccess: (saved) => {
              ToastHelper.show({ tone: "success", description: t("person_saved") });
              if (!person) {
                void navigate({ to: "/persons/$personId", params: { personId: saved.id } });
              }
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
      <NamesEditor value={names} onChange={setNames} invalid={errors.has("names")} />
      <p className="text-danger min-h-5 text-sm" aria-live="polite">
        {error("names")}
      </p>

      <div className="grid gap-x-4 sm:grid-cols-3">
        <FormField
          id="person-lineage"
          label={t("person_lineage_role")}
          hint={t("person_lineage_role_hint")}
        >
          <Select
            id="person-lineage"
            value={lineageRole}
            onChange={(event) => setLineageRole(event.target.value as TLineageRole)}
          >
            {LINEAGE_ROLES.map((role) => (
              <option key={role} value={role}>
                {t("person_lineage_role_value", { role })}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField id="person-gender" label={t("person_gender")} error={error("gender")}>
          <Select
            id="person-gender"
            value={gender}
            invalid={errors.has("gender")}
            aria-describedby="person-gender-message"
            onChange={(event) => setGender(event.target.value as TGender | "")}
          >
            <option value="">{t("person_gender_unset")}</option>
            {GENDERS.map((option) => (
              <option key={option} value={option}>
                {t("person_gender_value", { gender: option })}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField id="person-living" label={t("person_living_status")}>
          <Select
            id="person-living"
            value={livingStatus}
            onChange={(event) => setLivingStatus(event.target.value as TLivingStatus)}
          >
            {LIVING_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t("person_living_status_value", { status })}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isFounder}
          onChange={(event) => setIsFounder(event.target.checked)}
        />
        {t("person_founding_ancestor")}
      </label>
      <p className="text-danger min-h-5 text-sm" aria-live="polite">
        {error("isFoundingAncestor")}
      </p>

      <FormField id="person-birth-date" label={t("person_birth_date")} error={error("birthDate")}>
        <FuzzyDateInput
          id="person-birth-date"
          value={birthDate}
          onChange={setBirthDate}
          invalid={errors.has("birthDate")}
        />
      </FormField>
      {livingStatus !== "living" ? (
        <FormField id="person-death-date" label={t("person_death_date")} error={error("deathDate")}>
          <FuzzyDateInput
            id="person-death-date"
            value={deathDate}
            onChange={setDeathDate}
            invalid={errors.has("deathDate")}
          />
        </FormField>
      ) : null}
      <div className="grid gap-x-4 sm:grid-cols-2">
        <FormField
          id="person-birth-place"
          label={t("person_birth_place")}
          error={error("birthPlaceId")}
        >
          <PlacePicker
            id="person-birth-place"
            value={birthPlace}
            onChange={setBirthPlace}
            invalid={errors.has("birthPlaceId")}
          />
        </FormField>
        {livingStatus !== "living" ? (
          <FormField
            id="person-death-place"
            label={t("person_death_place")}
            error={error("deathPlaceId")}
          >
            <PlacePicker
              id="person-death-place"
              value={deathPlace}
              onChange={setDeathPlace}
              invalid={errors.has("deathPlaceId")}
            />
          </FormField>
        ) : null}
      </div>
      <FormField id="person-occupation" label={t("person_occupation")}>
        <Input
          id="person-occupation"
          value={occupation}
          aria-describedby="person-occupation-message"
          onChange={(event) => setOccupation(event.target.value)}
        />
      </FormField>
      <FormField
        id="person-notes"
        label={t("person_internal_notes")}
        hint={t("person_internal_notes_hint")}
      >
        <Textarea
          id="person-notes"
          value={internalNotes}
          aria-describedby="person-notes-message"
          onChange={(event) => setInternalNotes(event.target.value)}
        />
      </FormField>

      <fieldset className="border-border mt-2 flex flex-col gap-1 rounded-lg border p-4">
        <legend className="px-1 text-sm font-medium">{t("person_privacy")}</legend>
        <p className="text-foreground-muted mb-2 text-sm">{t("person_privacy_hint")}</p>
        <FormField
          id="person-visibility"
          label={t("person_visibility")}
          error={error("visibility")}
        >
          <Select
            id="person-visibility"
            value={visibility}
            invalid={errors.has("visibility")}
            aria-describedby="person-visibility-message"
            onChange={(event) => setVisibility(event.target.value as TLevelChoice)}
          >
            <option value="">{t("person_visibility_default")}</option>
            {VISIBILITY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {t("visibility_level", { level })}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="grid gap-x-4 sm:grid-cols-2">
          {FIELD_GROUPS.map((group) => (
            <FormField
              key={group}
              id={`person-group-${group}`}
              label={t("field_group", { group })}
              error={error(`fieldVisibility.${group}`)}
            >
              <Select
                id={`person-group-${group}`}
                value={fieldVisibility[group] ?? ""}
                invalid={errors.has(`fieldVisibility.${group}`)}
                aria-describedby={`person-group-${group}-message`}
                onChange={(event) =>
                  setFieldVisibility({
                    ...fieldVisibility,
                    [group]: event.target.value as TLevelChoice,
                  })
                }
              >
                <option value="">{t("person_visibility_default")}</option>
                {VISIBILITY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {t("visibility_level", { level })}
                  </option>
                ))}
              </Select>
            </FormField>
          ))}
        </div>
      </fieldset>

      <FormField
        id="person-reason"
        label={t("person_reason")}
        hint={t("person_reason_hint")}
        error={error("reason")}
      >
        <Textarea
          id="person-reason"
          value={reason}
          invalid={errors.has("reason")}
          aria-describedby="person-reason-message"
          onChange={(event) => setReason(event.target.value)}
        />
      </FormField>
      <div className="mt-3 flex gap-3">
        <Button type="submit" loading={save.isPending}>
          {t("common_save")}
        </Button>
        <Button variant="secondary" onClick={() => void navigate({ to: "/persons" })}>
          {t("common_cancel")}
        </Button>
      </div>
    </form>
  );
}
