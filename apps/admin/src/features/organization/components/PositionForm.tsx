import type { TPositionResponse } from "@repo/contracts";

import { useState } from "react";
import { useTranslations } from "use-intl";

import { Button, FormField, Input, ToastHelper } from "@repo/ui";

import { FieldErrorsHelper } from "#/lib/field-errors.helper";
import { ProblemMessageHelper } from "#/lib/problem-message.helper";

import { useOrgMutations } from "../hooks/useOrgMutations";

export interface PositionFormProps {
  position?: TPositionResponse;
  nextRank: number;
  onDone: () => void;
}

export function PositionForm({ position, nextRank, onDone }: PositionFormProps) {
  const t = useTranslations();
  const { savePosition } = useOrgMutations();
  const [key, setKey] = useState(position?.key ?? "");
  const [titleEn, setTitleEn] = useState(position?.titleI18n.en ?? "");
  const [titleNe, setTitleNe] = useState(position?.titleI18n.ne ?? "");
  const [rank, setRank] = useState(String(position?.rank ?? nextRank));
  const [maxHolders, setMaxHolders] = useState(position?.maxHolders?.toString() ?? "");
  const [isOfficeBearer, setIsOfficeBearer] = useState(position?.isOfficeBearer ?? false);
  const [active, setActive] = useState(position?.active ?? true);
  const errors = FieldErrorsHelper.byPath(savePosition.error);
  const error = (path: string) =>
    errors.has(path) ? t(errors.get(path) ?? "field_error_invalid") : null;
  return (
    <form
      noValidate
      className="border-border flex flex-col gap-1 rounded-lg border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        savePosition.mutate(
          {
            id: position?.id,
            version: position?.version,
            body: {
              key: key.trim(),
              titleI18n: { en: titleEn.trim() || undefined, ne: titleNe.trim() || undefined },
              rank: Number(rank),
              maxHolders: maxHolders.trim() ? Number(maxHolders) : null,
              isOfficeBearer,
              active,
            },
          },
          {
            onSuccess: () => {
              ToastHelper.show({ tone: "success", description: t("org_position_saved") });
              onDone();
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
      <div className="grid gap-x-4 sm:grid-cols-3">
        <FormField
          id="position-title-en"
          label={t("org_position_title_en")}
          error={error("titleI18n")}
        >
          <Input
            id="position-title-en"
            value={titleEn}
            invalid={errors.has("titleI18n")}
            aria-describedby="position-title-en-message"
            onChange={(event) => setTitleEn(event.target.value)}
          />
        </FormField>
        <FormField id="position-title-ne" label={t("org_position_title_ne")}>
          <Input
            id="position-title-ne"
            lang="ne"
            value={titleNe}
            aria-describedby="position-title-ne-message"
            onChange={(event) => setTitleNe(event.target.value)}
          />
        </FormField>
        <FormField
          id="position-key"
          label={t("org_position_key")}
          hint={t("org_position_key_hint")}
          error={error("key")}
        >
          <Input
            id="position-key"
            value={key}
            disabled={Boolean(position)}
            invalid={errors.has("key")}
            aria-describedby="position-key-message"
            onChange={(event) => setKey(event.target.value.toLowerCase())}
          />
        </FormField>
      </div>
      <div className="grid gap-x-4 sm:grid-cols-3">
        <FormField
          id="position-rank"
          label={t("org_position_rank")}
          hint={t("org_position_rank_hint")}
          error={error("rank")}
        >
          <Input
            id="position-rank"
            inputMode="numeric"
            value={rank}
            invalid={errors.has("rank")}
            aria-describedby="position-rank-message"
            onChange={(event) => setRank(event.target.value)}
          />
        </FormField>
        <FormField
          id="position-max"
          label={t("org_position_max")}
          hint={t("org_position_max_hint")}
          error={error("maxHolders")}
        >
          <Input
            id="position-max"
            inputMode="numeric"
            value={maxHolders}
            invalid={errors.has("maxHolders")}
            aria-describedby="position-max-message"
            onChange={(event) => setMaxHolders(event.target.value)}
          />
        </FormField>
        <div className="flex flex-col justify-center gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isOfficeBearer}
              onChange={(event) => setIsOfficeBearer(event.target.checked)}
            />
            {t("org_position_office_bearer")}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            {t("org_position_active")}
          </label>
        </div>
      </div>
      <div className="mt-2 flex gap-3">
        <Button type="submit" loading={savePosition.isPending}>
          {t("common_save")}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {t("common_cancel")}
        </Button>
      </div>
    </form>
  );
}
