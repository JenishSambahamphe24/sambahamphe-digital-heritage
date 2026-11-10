import type { Request } from "express";

import { HttpStatus, Injectable } from "@nestjs/common";

import { AppException } from "../../../core/errors/app.exception.js";
import { PERMISSION } from "../../access/access.catalog.js";
import { AccessService } from "../../access/application/access.service.js";
import { OrgUnitsRepository } from "../internal/org-units.repository.js";

// org:manage can be limited to one board and everything under it, so writes
// check the unit's path instead of a global grant.
@Injectable()
export class OrgScopeService {
  constructor(
    private readonly access: AccessService,
    private readonly units: OrgUnitsRepository,
  ) {}

  // Without a unit (a new top-level board) only a global grant passes.
  async assertCanManage(request: Request, unitId: string | null): Promise<void> {
    const orgUnitPath = unitId ? await this.units.pathOf(unitId) : [];
    if (!(await this.access.can(request, PERMISSION.orgManage, { orgUnitPath }))) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        "forbidden",
        "Forbidden",
        "You can't manage this board.",
      );
    }
  }
}
