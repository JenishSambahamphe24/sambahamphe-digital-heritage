import type { IPlaceSummaryRow } from "../places/internal/places.repository.js";
import type { IPrivacySubject, IPrivacyView } from "./domain/privacy.types.js";
import type { TConsentRow, TPersonNameRow, TPersonRow } from "./internal/persons.repository.js";
import type {
  TAdminPersonListItemResponse,
  TAdminPersonResponse,
  TConsentResponse,
  TPersonNameResponse,
  TPersonResponse,
} from "@repo/contracts";

import {
  adminPersonListItemResponseSchema,
  adminPersonResponseSchema,
  consentResponseSchema,
  personResponseSchema,
} from "@repo/contracts";

import { PlaceResponseHelper } from "../places/place-response.helper.js";
import { PrivacyPolicyHelper } from "./domain/privacy-policy.helper.js";

type TPlaces = Map<string, IPlaceSummaryRow>;

export class PersonResponseHelper {
  static subject(row: TPersonRow): IPrivacySubject {
    return {
      livingStatus: row.livingStatus,
      deathDate: row.deathDate,
      birthSortTo: row.birthSortTo,
      visibility: row.visibility,
      fieldVisibility: row.fieldVisibility,
    };
  }

  static displayName(names: TPersonNameRow[]): string {
    return (names.find((name) => name.isPrimary) ?? names[0])?.fullName ?? "";
  }

  // Only the field groups the privacy policy allowed; nothing else is copied.
  static forViewer(
    row: TPersonRow,
    names: TPersonNameRow[],
    places: TPlaces,
    view: IPrivacyView,
  ): TPersonResponse {
    const shown: Record<string, unknown> = { id: row.id, lineageRole: row.lineageRole };
    if (view.groups.has("names")) {
      shown.displayName = PersonResponseHelper.displayName(names);
      shown.names = names.map((name) => PersonResponseHelper.name(name));
      shown.gender = row.gender;
    }
    if (view.groups.has("vital_dates")) {
      shown.livingStatus = row.livingStatus;
      shown.birthDate = row.birthDate;
      shown.deathDate = row.deathDate;
    }
    if (view.groups.has("places")) {
      shown.birthPlace = PersonResponseHelper.place(row.birthPlaceId, places);
      shown.deathPlace = PersonResponseHelper.place(row.deathPlaceId, places);
    }
    if (view.groups.has("biography")) {
      shown.occupation = row.occupation;
    }
    return personResponseSchema.parse(shown);
  }

  static admin(
    row: TPersonRow,
    names: TPersonNameRow[],
    places: TPlaces,
    consents: TConsentRow[],
    today: Date,
  ): TAdminPersonResponse {
    const subject = PersonResponseHelper.subject(row);
    return adminPersonResponseSchema.parse({
      id: row.id,
      recordStatus: row.recordStatus,
      lineageRole: row.lineageRole,
      isFoundingAncestor: row.isFoundingAncestor,
      displayName: PersonResponseHelper.displayName(names),
      names: names.map((name) => PersonResponseHelper.name(name)),
      gender: row.gender,
      genderNote: row.genderNote,
      livingStatus: row.livingStatus,
      presumedLiving: PrivacyPolicyHelper.presumedLiving(subject, today),
      isMinor: PrivacyPolicyHelper.isMinor(subject, today),
      birthDate: row.birthDate,
      deathDate: row.deathDate,
      birthPlace: PersonResponseHelper.place(row.birthPlaceId, places),
      deathPlace: PersonResponseHelper.place(row.deathPlaceId, places),
      occupation: row.occupation,
      internalNotes: row.internalNotes,
      visibility: row.visibility,
      fieldVisibility: row.fieldVisibility,
      verificationStatus: row.verificationStatus,
      consents: consents.map((consent) => PersonResponseHelper.consent(consent)),
      version: row.version,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  static adminListItem(
    row: TPersonRow,
    names: TPersonNameRow[],
    matchedName: string | null,
    today: Date,
  ): TAdminPersonListItemResponse {
    return adminPersonListItemResponseSchema.parse({
      id: row.id,
      displayName: PersonResponseHelper.displayName(names),
      matchedName,
      lineageRole: row.lineageRole,
      livingStatus: row.livingStatus,
      presumedLiving: PrivacyPolicyHelper.presumedLiving(PersonResponseHelper.subject(row), today),
      recordStatus: row.recordStatus,
      birthDate: row.birthDate,
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  static consent(row: TConsentRow): TConsentResponse {
    return consentResponseSchema.parse({
      id: row.id,
      grantedByName: row.grantedByName,
      relationToSubject: row.relationToSubject,
      scope: row.scope,
      grantedAt: row.grantedAt.toISOString(),
      revokedAt: row.revokedAt?.toISOString() ?? null,
      notes: row.notes,
    });
  }

  private static name(row: TPersonNameRow): TPersonNameResponse {
    return {
      nameType: row.nameType,
      givenName: row.givenName,
      surname: row.surname,
      fullName: row.fullName,
      language: row.language,
      script: row.script,
      isPrimary: row.isPrimary,
    };
  }

  private static place(id: string | null, places: TPlaces) {
    const place = id ? places.get(id) : undefined;
    return place ? PlaceResponseHelper.summary(place) : null;
  }
}
