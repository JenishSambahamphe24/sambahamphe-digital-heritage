import type { IPickedPlace } from "../../places/components/PlacePicker";
import type { TOrgUnitResponse, TOrgUnitStatus } from "@repo/contracts";

import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useLocale, useTranslations } from "use-intl";

import { ORG_UNIT_STATUSES } from "@repo/contracts";
import { Button, FormField, Input, Select, ToastHelper } from "@repo/ui";

import { FieldErrorsHelper } from "#/lib/field-errors.helper";
import { I18nTextHelper } from "#/lib/i18n-text.helper";
import { ProblemMessageHelper } from "#/lib/problem-message.helper";

import { PlacePicker } from "../../places/components/PlacePicker";
import { useOrgMutations } from "../hooks/useOrgMutations";
import { useOrgUnitTypes } from "../hooks/useOrgUnitTypes";

export interface UnitFormProps {
  unit?: TOrgUnitResponse;
  parent?: { id: string; typeId: string } | null;
}

export function UnitForm({ unit, parent = null }: UnitFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const navigate = useNavigate();
  const { saveUnit } = useOrgMutations();
  const types = useOrgUnitTypes();
  const parentId = unit ? unit.parentId : (parent?.id ?? null);
  const parentNode = unit?.ancestors.at(-1);
  const parentTypeId = unit
    ? types.data?.find((type) => type.key === parentNode?.typeKey)?.id
    : parent?.typeId;
  // Only the kinds of board allowed under this parent (or top-level kinds).
  const allowedTypes = (types.data ?? []).filter((type) =>
    parentId
      ? parentTypeId
        ? type.allowedParentTypeIds.includes(parentTypeId)
        : false
      : type.allowedParentTypeIds.length === 0,
  );
  const [typeId, setTypeId] = useState(unit?.typeId ?? "");
  const [nameEn, setNameEn] = useState(unit?.nameI18n.en ?? "");
  const [nameNe, setNameNe] = useState(unit?.nameI18n.ne ?? "");
  const [slug, setSlug] = useState(unit?.slug ?? "");
  const [status, setStatus] = useState<TOrgUnitStatus>(unit?.status ?? "active");
  const [place, setPlace] = useState<IPickedPlace | null>(
    unit?.place
      ? { id: unit.place.id, label: I18nTextHelper.pick(unit.place.nameI18n, locale) }
      : null,
  );
  const errors = FieldErrorsHelper.byPath(saveUnit.error);
  const error = (path: string) =>
    errors.has(path) ? t(errors.get(path) ?? "field_error_invalid") : null;
  const chosenType = typeId || allowedTypes[0]?.id || "";

  return (
    <form
      noValidate
      className="flex max-w-2xl flex-col gap-1"
      onSubmit={(event) => {
        event.preventDefault();
        saveUnit.mutate(
          {
            id: unit?.id,
            version: unit?.version,
            body: {
              typeId: chosenType,
              parentId,
              slug: slug.trim(),
              nameI18n: { en: nameEn.trim() || undefined, ne: nameNe.trim() || undefined },
              placeId: place?.id ?? null,
              status,
              sortOrder: unit?.sortOrder ?? 0,
            },
          },
          {
            onSuccess: (saved) => {
              ToastHelper.show({ tone: "success", description: t("org_unit_saved") });
              if (!unit) {
                void navigate({ to: "/organization/$unitId", params: { unitId: saved.id } });
              }
            },
            onError: (problem) =>
              ToastHelper.show({
                tone: "danger",
                description: t(ProblemMessageHelper.keyFor(problem.code)),
              }),
          },
        );
      }}
    >
      <div className="grid gap-x-4 sm:grid-cols-2">
        <FormField id="unit-name-en" label={t("org_unit_name_en")} error={error("nameI18n")}>
          <Input
            id="unit-name-en"
            value={nameEn}
            invalid={errors.has("nameI18n")}
            aria-describedby="unit-name-en-message"
            onChange={(event) => setNameEn(event.target.value)}
          />
        </FormField>
        <FormField id="unit-name-ne" label={t("org_unit_name_ne")}>
          <Input
            id="unit-name-ne"
            lang="ne"
            value={nameNe}
            aria-describedby="unit-name-ne-message"
            onChange={(event) => setNameNe(event.target.value)}
          />
        </FormField>
      </div>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <FormField
          id="unit-type"
          label={t("org_unit_type_label")}
          error={error("typeId") ?? error("parentId")}
        >
          <Select
            id="unit-type"
            value={chosenType}
            invalid={errors.has("typeId") || errors.has("parentId")}
            aria-describedby="unit-type-message"
            onValueChange={setTypeId}
            options={allowedTypes.map((type) => ({
              value: type.id,
              label: I18nTextHelper.pick(type.nameI18n, locale),
            }))}
          />
        </FormField>
        <FormField
          id="unit-slug"
          label={t("org_unit_slug")}
          hint={t("org_unit_slug_hint")}
          error={error("slug")}
        >
          <Input
            id="unit-slug"
            value={slug}
            invalid={errors.has("slug")}
            aria-describedby="unit-slug-message"
            onChange={(event) => setSlug(event.target.value.toLowerCase())}
          />
        </FormField>
      </div>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <FormField
          id="unit-place"
          label={t("org_unit_place")}
          hint={t("org_unit_place_hint")}
          error={error("placeId")}
        >
          <PlacePicker
            id="unit-place"
            value={place}
            onChange={setPlace}
            invalid={errors.has("placeId")}
          />
        </FormField>
        <FormField id="unit-status" label={t("org_unit_status_label")}>
          <Select
            id="unit-status"
            value={status}
            onValueChange={(value) => setStatus(value as TOrgUnitStatus)}
            options={ORG_UNIT_STATUSES.map((option) => ({
              value: option,
              label: t("org_unit_status", { status: option }),
            }))}
          />
        </FormField>
      </div>
      <div className="mt-3 flex gap-3">
        <Button type="submit" loading={saveUnit.isPending} disabled={!chosenType}>
          {t("common_save")}
        </Button>
        {!unit ? (
          <Button variant="secondary" onClick={() => void navigate({ to: "/organization" })}>
            {t("common_cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
