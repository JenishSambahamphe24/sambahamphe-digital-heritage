import type {
  IPlaceListRow,
  IPlaceSummaryRow,
  TPlaceAltNameRow,
  TPlaceRow,
} from "./internal/places.repository.js";
import type {
  TPlaceListItemResponse,
  TPlaceResponse,
  TPlaceSummaryResponse,
} from "@repo/contracts";

import {
  placeListItemResponseSchema,
  placeResponseSchema,
  placeSummaryResponseSchema,
} from "@repo/contracts";

export class PlaceResponseHelper {
  static summary(row: IPlaceSummaryRow): TPlaceSummaryResponse {
    return placeSummaryResponseSchema.parse({ id: row.id, kind: row.kind, nameI18n: row.nameI18n });
  }

  static detail(
    row: TPlaceRow,
    altNames: TPlaceAltNameRow[],
    ancestors: IPlaceSummaryRow[],
  ): TPlaceResponse {
    return placeResponseSchema.parse({
      id: row.id,
      parentId: row.parentId,
      kind: row.kind,
      nameI18n: row.nameI18n,
      // numeric comes back from Postgres as a string to keep its precision.
      latitude: row.latitude === null ? null : Number(row.latitude),
      longitude: row.longitude === null ? null : Number(row.longitude),
      notes: row.notes,
      altNames: altNames.map((alt) => ({
        name: alt.name,
        language: alt.language,
        script: alt.script,
        kind: alt.kind,
        validFromYear: alt.validFromYear,
        validToYear: alt.validToYear,
      })),
      ancestors: ancestors.map((ancestor) => PlaceResponseHelper.summary(ancestor)),
      version: row.version,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  static listItem(row: IPlaceListRow, ancestors: IPlaceSummaryRow[]): TPlaceListItemResponse {
    return placeListItemResponseSchema.parse({
      ...PlaceResponseHelper.summary(row),
      parentId: row.parentId,
      childCount: row.childCount,
      matchedAltName: row.matchedAltName,
      ancestors: ancestors.map((ancestor) => PlaceResponseHelper.summary(ancestor)),
    });
  }
}
