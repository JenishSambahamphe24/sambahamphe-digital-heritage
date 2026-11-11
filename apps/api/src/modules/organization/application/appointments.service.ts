import type { TTransaction } from "../../../core/database/database.types.js";
import type { TAppointmentRow } from "../internal/appointments.repository.js";
import type {
  TAppointmentListResponse,
  TAppointmentResponse,
  TCreateAppointmentRequest,
  TRetractAppointmentRequest,
  TUpdateAppointmentRequest,
} from "@repo/contracts";
import type { Request } from "express";

import { HttpStatus, Injectable } from "@nestjs/common";

import { appointmentListResponseSchema } from "@repo/contracts";

import { AuditService } from "../../../core/audit/audit.service.js";
import { DatabaseErrorHelper } from "../../../core/database/database-error.helper.js";
import { DatabaseService } from "../../../core/database/database.service.js";
import { AppException } from "../../../core/errors/app.exception.js";
import { VersionConflictException } from "../../../core/errors/version-conflict.exception.js";
import { PersonsRepository } from "../../people/internal/persons.repository.js";
import { PersonResponseHelper } from "../../people/person-response.helper.js";
import { AppointmentsRepository } from "../internal/appointments.repository.js";
import { OrgUnitsRepository } from "../internal/org-units.repository.js";
import { PositionsRepository } from "../internal/positions.repository.js";
import { TermsRepository } from "../internal/terms.repository.js";
import { OrgResponseHelper } from "../org-response.helper.js";
import { ORG_CONSTRAINT } from "../organization.constants.js";
import { OrgScopeService } from "./org-scope.service.js";
import { OrgUnitsService } from "./org-units.service.js";

interface ISeat {
  positionId: string;
  termId: string | null;
  startsOn: string;
  endsOn: string | null;
}

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly appointments: AppointmentsRepository,
    private readonly units: OrgUnitsRepository,
    private readonly positions: PositionsRepository,
    private readonly terms: TermsRepository,
    private readonly persons: PersonsRepository,
    private readonly scope: OrgScopeService,
    private readonly audit: AuditService,
  ) {}

  // The manager's list: retracted entries included, so mistakes stay visible.
  async listForUnit(request: Request, unitId: string): Promise<TAppointmentListResponse> {
    await this.assertUnit(unitId);
    await this.scope.assertCanManage(request, unitId);
    const rows = await this.appointments.forUnit(unitId);
    return appointmentListResponseSchema.parse({ data: await this.present(rows) });
  }

  async create(
    request: Request,
    actorId: string,
    unitId: string,
    body: TCreateAppointmentRequest,
  ): Promise<TAppointmentResponse> {
    await this.assertUnit(unitId);
    await this.scope.assertCanManage(request, unitId);
    const person = await this.persons.findById(body.personId);
    if (!person || person.recordStatus !== "active") {
      throw AppointmentsService.invalid(
        "personId",
        "unknown_person",
        "This person isn't in the archive.",
      );
    }
    const row = await this.write(async (tx) => {
      await this.checkSeat(
        unitId,
        {
          positionId: body.positionId,
          termId: body.termId ?? null,
          startsOn: body.startsOn,
          endsOn: body.endsOn ?? null,
        },
        undefined,
        tx,
      );
      const created = await this.appointments.insert(
        {
          personId: body.personId,
          orgUnitId: unitId,
          positionId: body.positionId,
          termId: body.termId ?? null,
          appointmentType: body.appointmentType,
          startsOn: body.startsOn,
          endsOn: body.endsOn ?? null,
          datePrecision: body.datePrecision,
          endReason: body.endReason ?? null,
          notes: body.notes ?? null,
          createdBy: actorId,
          updatedBy: actorId,
        },
        tx,
      );
      await this.audit.record(
        {
          action: "appointment.created",
          entityType: "appointment",
          entityId: created.id,
          actorId,
          changes: {
            orgUnitId: unitId,
            positionId: created.positionId,
            personId: created.personId,
          },
        },
        tx,
      );
      return created;
    });
    return (await this.present([row]))[0] as TAppointmentResponse;
  }

  async update(
    request: Request,
    actorId: string,
    unitId: string,
    id: string,
    body: TUpdateAppointmentRequest,
  ): Promise<TAppointmentResponse> {
    await this.scope.assertCanManage(request, unitId);
    const current = await this.findActive(unitId, id);
    const row = await this.write(async (tx) => {
      await this.checkSeat(
        unitId,
        {
          positionId: current.positionId,
          termId: body.termId ?? null,
          startsOn: body.startsOn,
          endsOn: body.endsOn ?? null,
        },
        id,
        tx,
      );
      const updated = await this.appointments.updateIfVersion(
        id,
        body.version,
        {
          termId: body.termId ?? null,
          appointmentType: body.appointmentType,
          startsOn: body.startsOn,
          endsOn: body.endsOn ?? null,
          datePrecision: body.datePrecision,
          endReason: body.endReason ?? null,
          notes: body.notes ?? null,
          updatedBy: actorId,
        },
        tx,
      );
      if (!updated) {
        throw new VersionConflictException(current.version);
      }
      await this.audit.record(
        {
          action: "appointment.updated",
          entityType: "appointment",
          entityId: id,
          actorId,
          changes: { orgUnitId: unitId, version: updated.version },
        },
        tx,
      );
      return updated;
    });
    return (await this.present([row]))[0] as TAppointmentResponse;
  }

  // Never deleted: a mistaken entry is retracted and drops off every board view.
  async retract(
    request: Request,
    actorId: string,
    unitId: string,
    id: string,
    body: TRetractAppointmentRequest,
  ): Promise<TAppointmentResponse> {
    await this.scope.assertCanManage(request, unitId);
    const current = await this.findActive(unitId, id);
    const row = await this.database.db.transaction(async (tx) => {
      const updated = await this.appointments.updateIfVersion(
        id,
        body.version,
        {
          recordStatus: "retracted",
          notes: [current.notes, `Retracted: ${body.reason}`].filter(Boolean).join("\n"),
          updatedBy: actorId,
        },
        tx,
      );
      if (!updated) {
        throw new VersionConflictException(current.version);
      }
      await this.audit.record(
        {
          action: "appointment.retracted",
          entityType: "appointment",
          entityId: id,
          actorId,
          changes: { orgUnitId: unitId },
        },
        tx,
      );
      return updated;
    });
    return (await this.present([row]))[0] as TAppointmentResponse;
  }

  private async checkSeat(
    unitId: string,
    seat: ISeat,
    excludeId: string | undefined,
    tx: TTransaction,
  ): Promise<void> {
    const position = await this.positions.findById(seat.positionId, tx);
    if (!position) {
      throw AppointmentsService.invalid(
        "positionId",
        "unknown_position",
        "This position doesn't exist.",
      );
    }
    if (!position.active && !excludeId) {
      throw AppointmentsService.invalid(
        "positionId",
        "position_inactive",
        "This position is no longer used.",
      );
    }
    if (seat.termId) {
      const term = await this.terms.findInUnit(unitId, seat.termId, tx);
      if (!term) {
        throw AppointmentsService.invalid(
          "termId",
          "unknown_term",
          "This term doesn't belong to this board.",
        );
      }
      if (seat.startsOn < term.startsOn || (term.endsOn !== null && seat.startsOn >= term.endsOn)) {
        throw AppointmentsService.invalid(
          "startsOn",
          "outside_term",
          "The start date isn't within the chosen term.",
        );
      }
    }
    // Several holders allowed but capped (e.g. 11 members): count under a row
    // lock on the board so two managers can't both take the last seat.
    if (position.maxHolders !== null && position.maxHolders > 1) {
      await this.units.lock(unitId, tx);
      const holders = await this.appointments.countOverlapping(
        {
          orgUnitId: unitId,
          positionId: position.id,
          startsOn: seat.startsOn,
          endsOn: seat.endsOn,
          excludeId,
        },
        tx,
      );
      if (holders >= position.maxHolders) {
        throw new AppException(
          HttpStatus.CONFLICT,
          "position_full",
          "Position full",
          "Every seat in this position is taken for those dates.",
        );
      }
    }
  }

  private async write(
    run: (tx: TTransaction) => Promise<TAppointmentRow>,
  ): Promise<TAppointmentRow> {
    try {
      return await this.database.db.transaction(run);
    } catch (error) {
      if (DatabaseErrorHelper.isExclusionViolation(error, ORG_CONSTRAINT.exclusiveOneHolder)) {
        throw new AppException(
          HttpStatus.CONFLICT,
          "position_taken",
          "Position taken",
          "Someone else holds this position in those dates.",
        );
      }
      if (DatabaseErrorHelper.isExclusionViolation(error, ORG_CONSTRAINT.noDoubleSeat)) {
        throw new AppException(
          HttpStatus.CONFLICT,
          "already_appointed",
          "Already appointed",
          "This person already holds this position in those dates.",
        );
      }
      throw error;
    }
  }

  private async findActive(unitId: string, id: string): Promise<TAppointmentRow> {
    const current = await this.appointments.findInUnit(unitId, id);
    if (!current) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        "not_found",
        "Not found",
        "Appointment not found.",
      );
    }
    if (current.recordStatus !== "accepted") {
      throw new AppException(
        HttpStatus.CONFLICT,
        "appointment_not_active",
        "Not editable",
        "This entry was retracted and can't be edited.",
      );
    }
    return current;
  }

  private async assertUnit(unitId: string): Promise<void> {
    if (!(await this.units.findById(unitId))) {
      throw OrgUnitsService.notFound();
    }
  }

  private async present(rows: TAppointmentRow[]): Promise<TAppointmentResponse[]> {
    const names = await this.persons.namesOf([...new Set(rows.map((row) => row.personId))]);
    return rows.map((row) =>
      OrgResponseHelper.appointment(
        row,
        PersonResponseHelper.displayName(names.get(row.personId) ?? []),
      ),
    );
  }

  private static invalid(path: string, code: string, message: string): AppException {
    return new AppException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      "validation_error",
      "Validation failed",
      "Some fields need attention.",
      [{ path: [path], code, message }],
    );
  }
}
