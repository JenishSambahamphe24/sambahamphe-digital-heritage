import type { TConsentRelation, TFieldGroup, TVisibilityLevel } from "@repo/contracts";

import { useState } from "react";
import { useTranslations } from "use-intl";

import { CONSENT_RELATIONS, FIELD_GROUPS, VISIBILITY_LEVELS } from "@repo/contracts";
import { Button, FormField, Input, Select, ToastHelper } from "@repo/ui";

import { ProblemMessageHelper } from "#/lib/problem-message.helper";

import { usePersonActions } from "../hooks/usePersonActions";

const DATE_INPUT_LENGTH = 10;

export interface RecordConsentFormProps {
  personId: string;
}

export function RecordConsentForm({ personId }: RecordConsentFormProps) {
  const t = useTranslations();
  const { recordConsent } = usePersonActions(personId);
  const today = new Date().toISOString().slice(0, DATE_INPUT_LENGTH);
  const [grantedByName, setGrantedByName] = useState("");
  const [relation, setRelation] = useState<TConsentRelation>("self");
  const [level, setLevel] = useState<TVisibilityLevel>("public");
  const [groups, setGroups] = useState<TFieldGroup[]>(["names"]);
  const [grantedOn, setGrantedOn] = useState(today);
  return (
    <form
      noValidate
      className="border-border flex flex-col gap-1 border-t pt-4"
      onSubmit={(event) => {
        event.preventDefault();
        recordConsent.mutate(
          {
            grantedByName: grantedByName.trim(),
            relationToSubject: relation,
            scope: { visibility: level, fieldGroups: groups },
            grantedAt: `${grantedOn}T00:00:00Z`,
          },
          {
            onSuccess: () => {
              setGrantedByName("");
              ToastHelper.show({ tone: "success", description: t("consent_recorded") });
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
      <h3 className="text-sm font-medium">{t("consent_record_title")}</h3>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <FormField id="consent-name" label={t("consent_granted_by")}>
          <Input
            id="consent-name"
            value={grantedByName}
            aria-describedby="consent-name-message"
            onChange={(event) => setGrantedByName(event.target.value)}
          />
        </FormField>
        <FormField id="consent-relation" label={t("consent_relation_label")}>
          <Select
            id="consent-relation"
            value={relation}
            onValueChange={(value) => setRelation(value as TConsentRelation)}
            options={CONSENT_RELATIONS.map((option) => ({
              value: option,
              label: t("consent_relation", { relation: option }),
            }))}
          />
        </FormField>
        <FormField id="consent-level" label={t("consent_level")}>
          <Select
            id="consent-level"
            value={level}
            onValueChange={(value) => setLevel(value as TVisibilityLevel)}
            options={VISIBILITY_LEVELS.map((option) => ({
              value: option,
              label: t("visibility_level", { level: option }),
            }))}
          />
        </FormField>
        <FormField id="consent-date" label={t("consent_date")}>
          <Input
            id="consent-date"
            type="date"
            value={grantedOn}
            max={today}
            aria-describedby="consent-date-message"
            onChange={(event) => setGrantedOn(event.target.value)}
          />
        </FormField>
      </div>
      <fieldset className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <legend className="mb-1 text-sm font-medium">{t("consent_groups")}</legend>
        {FIELD_GROUPS.map((group) => (
          <label key={group} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={groups.includes(group)}
              onChange={(event) =>
                setGroups(
                  event.target.checked
                    ? [...groups, group]
                    : groups.filter((other) => other !== group),
                )
              }
            />
            {t("field_group", { group })}
          </label>
        ))}
      </fieldset>
      <Button
        type="submit"
        variant="secondary"
        className="mt-3 self-start"
        disabled={!grantedByName.trim() || groups.length === 0}
        loading={recordConsent.isPending}
      >
        {t("consent_record")}
      </Button>
    </form>
  );
}
