import { getRouteApi, Link } from "@tanstack/react-router";
import { useTranslations } from "use-intl";

import { Alert, Spinner } from "@repo/ui";

import { QueryError } from "../../layout/components/QueryError";
import { usePerson } from "../hooks/usePerson";
import { ConsentsSection } from "./ConsentsSection";
import { PersonForm } from "./PersonForm";
import { RetractPersonPanel } from "./RetractPersonPanel";

const route = getRouteApi("/_authenticated/persons/$personId");

export function PersonEditPage() {
  const t = useTranslations();
  const { personId } = route.useParams();
  const person = usePerson(personId);
  if (person.isPending) {
    return <Spinner />;
  }
  if (person.isError) {
    return <QueryError error={person.error} />;
  }
  const active = person.data.recordStatus === "active";
  return (
    <div className="flex flex-col gap-6">
      <Link to="/persons" className="text-primary text-sm hover:underline">
        ← {t("persons_back")}
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold">{person.data.displayName}</h1>
        <p className="text-foreground-muted text-sm">
          {[
            person.data.presumedLiving
              ? t("person_presumed_living")
              : t("person_living_status_value", { status: person.data.livingStatus }),
            person.data.isMinor ? t("person_minor") : null,
            t("person_version", { version: person.data.version }),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      {active ? (
        <>
          {/* Keyed by version so the form restarts from the saved data after each save or reload. */}
          <PersonForm key={person.data.version} person={person.data} />
          <ConsentsSection person={person.data} />
          <RetractPersonPanel person={person.data} />
        </>
      ) : (
        <Alert tone="warning">
          {t("person_not_active_notice", { status: person.data.recordStatus })}
        </Alert>
      )}
    </div>
  );
}
