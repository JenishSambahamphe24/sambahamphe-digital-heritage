import type {
  TBoardQuery,
  TBoardResponse,
  TIdParams,
  TOrgUnitResponse,
  TOrgUnitTreeResponse,
  TOrgUnitTypeListResponse,
  TPositionListResponse,
  TTermListResponse,
} from "@repo/contracts";

import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import {
  boardQuerySchema,
  boardResponseSchema,
  idParamsSchema,
  orgUnitResponseSchema,
  orgUnitTreeResponseSchema,
  orgUnitTypeListResponseSchema,
  positionListResponseSchema,
  termListResponseSchema,
} from "@repo/contracts";

import { ApiProblemResponse } from "../../../core/openapi/api-problem-response.decorator.js";
import { Public } from "../../auth/guards/public.decorator.js";
import { BoardService } from "../application/board.service.js";
import { OrgUnitsService } from "../application/org-units.service.js";
import { PositionsService } from "../application/positions.service.js";
import { TermsService } from "../application/terms.service.js";

// The organization's structure and its boards are public (requirements: "public boards").
@ApiTags("organization")
@ApiProblemResponse()
@Public()
@Controller("org")
export class OrganizationController {
  constructor(
    private readonly units: OrgUnitsService,
    private readonly positions: PositionsService,
    private readonly terms: TermsService,
    private readonly boards: BoardService,
  ) {}

  @Get("unit-types")
  @ApiOkResponse({ standardSchema: orgUnitTypeListResponseSchema })
  types(): Promise<TOrgUnitTypeListResponse> {
    return this.units.types();
  }

  @Get("units")
  @ApiOkResponse({ standardSchema: orgUnitTreeResponseSchema })
  tree(): Promise<TOrgUnitTreeResponse> {
    return this.units.tree();
  }

  @Get("units/:id")
  @ApiOkResponse({ standardSchema: orgUnitResponseSchema })
  unit(@Param({ schema: idParamsSchema }) params: TIdParams): Promise<TOrgUnitResponse> {
    return this.units.get(params.id);
  }

  @Get("units/:id/terms")
  @ApiOkResponse({ standardSchema: termListResponseSchema })
  unitTerms(@Param({ schema: idParamsSchema }) params: TIdParams): Promise<TTermListResponse> {
    return this.terms.list(params.id);
  }

  @Get("units/:id/board")
  @ApiOkResponse({ standardSchema: boardResponseSchema })
  board(
    @Param({ schema: idParamsSchema }) params: TIdParams,
    @Query({ schema: boardQuerySchema }) query: TBoardQuery,
  ): Promise<TBoardResponse> {
    return this.boards.board(params.id, query);
  }

  @Get("positions")
  @ApiOkResponse({ standardSchema: positionListResponseSchema })
  positionList(): Promise<TPositionListResponse> {
    return this.positions.list();
  }
}
