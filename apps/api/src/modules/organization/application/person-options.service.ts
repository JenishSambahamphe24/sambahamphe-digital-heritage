import type { TPersonOptionListResponse, TPersonOptionsQuery } from "@repo/contracts";
import type { Request } from "express";

import { Injectable } from "@nestjs/common";

import { personOptionListResponseSchema } from "@repo/contracts";

import { RomanizationHelper } from "../../people/domain/romanization.helper.js";
import { PersonsRepository } from "../../people/internal/persons.repository.js";
import { PersonResponseHelper } from "../../people/person-response.helper.js";
import { OrgScopeService } from "./org-scope.service.js";

const MAX_OPTIONS = 10;
const FIRST = 0;

// A narrow lookup for appointing people: a manager of the board may search
// names (living people included, since board members usually are), and gets
// back only id and name, at most ten at a time.
@Injectable()
export class PersonOptionsService {
  constructor(
    private readonly persons: PersonsRepository,
    private readonly scope: OrgScopeService,
  ) {}

  async search(request: Request, query: TPersonOptionsQuery): Promise<TPersonOptionListResponse> {
    await this.scope.assertCanManage(request, query.unitId);
    const { rows } = await this.persons.searchAll({
      raw: query.q,
      romanized: RomanizationHelper.romanize(query.q),
      offset: FIRST,
      limit: MAX_OPTIONS,
    });
    const people = new Map(
      (await this.persons.findManyById(rows.map((row) => row.id))).map((row) => [row.id, row]),
    );
    const names = await this.persons.namesOf([...people.keys()]);
    return personOptionListResponseSchema.parse({
      data: rows
        .filter((row) => people.get(row.id)?.recordStatus === "active")
        .map((row) => ({
          id: row.id,
          displayName: PersonResponseHelper.displayName(names.get(row.id) ?? []),
        })),
    });
  }
}
