import { getRouteApi, Link } from "@tanstack/react-router";
import { useTranslations } from "use-intl";

import { Spinner } from "@repo/ui";

import { QueryError } from "../../layout/components/QueryError";
import { usePlace } from "../hooks/usePlace";
import { PlaceForm } from "./PlaceForm";

const editRoute = getRouteApi("/_authenticated/places/$placeId");

export function PlaceEditPage() {
  const t = useTranslations();
  const { placeId } = editRoute.useParams();
  const place = usePlace(placeId);
  if (place.isPending) {
    return <Spinner />;
  }
  if (place.isError) {
    return <QueryError error={place.error} />;
  }
  return (
    <div className="flex flex-col gap-6">
      <Link to="/places" className="text-primary text-sm hover:underline">
        ← {t("places_back")}
      </Link>
      <h1 className="font-display text-2xl font-semibold">{t("place_edit_title")}</h1>
      {/* Keyed by version so a reload after a conflict starts from the saved data. */}
      <PlaceForm key={place.data.version} place={place.data} />
    </div>
  );
}
