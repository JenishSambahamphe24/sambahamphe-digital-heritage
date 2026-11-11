import type { TBoardQuery, TBoardResponse } from "@repo/contracts";

import { HttpStatus, Injectable } from "@nestjs/common";

import { boardResponseSchema } from "@repo/contracts";

import { AppException } from "../../../core/errors/app.exception.js";
import { PrivacyPolicyHelper } from "../../people/domain/privacy-policy.helper.js";
import { PersonsRepository } from "../../people/internal/persons.repository.js";
import { PersonResponseHelper } from "../../people/person-response.helper.js";
import { OrgDateHelper } from "../domain/org-date.helper.js";
import { AppointmentsRepository } from "../internal/appointments.repository.js";
import { OrgUnitsRepository } from "../internal/org-units.repository.js";
import { TermsRepository } from "../internal/terms.repository.js";
import { OrgResponseHelper } from "../org-response.helper.js";
import { OrgUnitsService } from "./org-units.service.js";

const ONE_DAY_MS = 86_400_000;
const ISO_DATE_LENGTH = 10;

// Public: who sat on a board in a term or on a day. Holders pass through the
// privacy policy's board rule (Q-14 default): name and position only, and
// minors are left out entirely.
@Injectable()
export class BoardService {
  constructor(
    private readonly units: OrgUnitsRepository,
    private readonly terms: TermsRepository,
    private readonly appointments: AppointmentsRepository,
    private readonly persons: PersonsRepository,
  ) {}

  async board(unitId: string, query: TBoardQuery): Promise<TBoardResponse> {
    const unit = await this.units.findById(unitId);
    if (!unit) {
      throw OrgUnitsService.notFound();
    }
    const today = OrgDateHelper.today();
    const day = query.on ?? today;
    const term = query.termId
      ? await this.terms.findInUnit(unitId, query.termId)
      : await this.terms.coveringDay(unitId, day);
    if (query.termId && !term) {
      throw new AppException(HttpStatus.NOT_FOUND, "not_found", "Not found", "Term not found.");
    }
    const range =
      term && query.termId
        ? { from: term.startsOn, to: term.endsOn }
        : { from: day, to: BoardService.nextDay(day) };
    const rows = await this.appointments.board(unitId, range);
    const people = new Map(
      (
        await this.persons.findManyById([...new Set(rows.map((row) => row.appointment.personId))])
      ).map((person) => [person.id, person]),
    );
    const names = await this.persons.namesOf([...people.keys()]);
    const now = new Date();

    const members = rows.flatMap(({ appointment, position }) => {
      const person = people.get(appointment.personId);
      if (
        !person ||
        person.recordStatus !== "active" ||
        !PrivacyPolicyHelper.boardNameVisible(PersonResponseHelper.subject(person), now)
      ) {
        return [];
      }
      return [
        {
          position: {
            id: position.id,
            key: position.key,
            titleI18n: position.titleI18n,
            rank: position.rank,
            isOfficeBearer: position.isOfficeBearer,
          },
          personId: person.id,
          displayName: PersonResponseHelper.displayName(names.get(person.id) ?? []),
          appointmentType: appointment.appointmentType,
          startsOn: appointment.startsOn,
          endsOn: appointment.endsOn,
          datePrecision: appointment.datePrecision,
        },
      ];
    });
    return boardResponseSchema.parse({
      unit: OrgResponseHelper.node(unit),
      term: term ? OrgResponseHelper.term(term, today) : null,
      on: day,
      members,
    });
  }

  private static nextDay(day: string): string {
    return new Date(Date.parse(`${day}T00:00:00Z`) + ONE_DAY_MS)
      .toISOString()
      .slice(0, ISO_DATE_LENGTH);
  }
}
