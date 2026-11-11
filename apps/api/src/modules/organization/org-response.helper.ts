import type { TAppointmentRow } from "./internal/appointments.repository.js";
import type { TOrgUnitRow } from "./internal/org-units.repository.js";
import type { TPositionRow } from "./internal/positions.repository.js";
import type { TTermRow } from "./internal/terms.repository.js";
import type {
  TAppointmentResponse,
  TOrgUnitNodeResponse,
  TPositionResponse,
  TTermResponse,
} from "@repo/contracts";

import {
  appointmentResponseSchema,
  orgUnitNodeResponseSchema,
  positionResponseSchema,
  termResponseSchema,
} from "@repo/contracts";

import { OrgDateHelper } from "./domain/org-date.helper.js";

export class OrgResponseHelper {
  static node(row: TOrgUnitRow & { typeKey: string }): TOrgUnitNodeResponse {
    return orgUnitNodeResponseSchema.parse({
      id: row.id,
      parentId: row.parentId,
      slug: row.slug,
      nameI18n: row.nameI18n,
      typeKey: row.typeKey,
      status: row.status,
      sortOrder: row.sortOrder,
    });
  }

  static position(row: TPositionRow): TPositionResponse {
    return positionResponseSchema.parse({
      id: row.id,
      key: row.key,
      titleI18n: row.titleI18n,
      rank: row.rank,
      isOfficeBearer: row.isOfficeBearer,
      maxHolders: row.maxHolders,
      active: row.active,
      version: row.version,
    });
  }

  static term(row: TTermRow, today: string): TTermResponse {
    return termResponseSchema.parse({
      id: row.id,
      orgUnitId: row.orgUnitId,
      ordinal: row.ordinal,
      labelI18n: row.labelI18n,
      startsOn: row.startsOn,
      endsOn: row.endsOn,
      datePrecision: row.datePrecision,
      notes: row.notes,
      isCurrent: OrgDateHelper.covers(row, today),
      version: row.version,
    });
  }

  static appointment(row: TAppointmentRow, displayName: string): TAppointmentResponse {
    return appointmentResponseSchema.parse({
      id: row.id,
      person: { id: row.personId, displayName },
      orgUnitId: row.orgUnitId,
      positionId: row.positionId,
      termId: row.termId,
      appointmentType: row.appointmentType,
      startsOn: row.startsOn,
      endsOn: row.endsOn,
      datePrecision: row.datePrecision,
      endReason: row.endReason,
      recordStatus: row.recordStatus,
      notes: row.notes,
      version: row.version,
    });
  }
}
