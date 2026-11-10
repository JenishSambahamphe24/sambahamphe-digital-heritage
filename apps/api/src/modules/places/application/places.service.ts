import type { TPlaceRow } from "../internal/places.repository.js";
import type {
  TCreatePlaceRequest,
  TListPlacesQuery,
  TPlaceListResponse,
  TPlaceResponse,
  TUpdatePlaceRequest,
} from "@repo/contracts";

import { HttpStatus, Injectable } from "@nestjs/common";

import { placeListResponseSchema } from "@repo/contracts";

import { AuditService } from "../../../core/audit/audit.service.js";
import { DatabaseService } from "../../../core/database/database.service.js";
import { AppException } from "../../../core/errors/app.exception.js";
import { VersionConflictException } from "../../../core/errors/version-conflict.exception.js";
import { PlacesRepository } from "../internal/places.repository.js";
import { PlaceResponseHelper } from "../place-response.helper.js";

@Injectable()
export class PlacesService {
  constructor(
    private readonly database: DatabaseService,
    private readonly places: PlacesRepository,
    private readonly audit: AuditService,
  ) {}

  async get(id: string): Promise<TPlaceResponse> {
    const row = await this.places.findById(id);
    if (!row) {
      throw PlacesService.notFound();
    }
    return this.detail(row);
  }

  async list(query: TListPlacesQuery): Promise<TPlaceListResponse> {
    const { rows, total } = await this.places.list({
      q: query.q,
      parentId: query.parentId,
      offset: (query.page - 1) * query.pageSize,
      limit: query.pageSize,
    });
    const ancestors = await this.places.ancestorsOf(rows.map((row) => row.id));
    return placeListResponseSchema.parse({
      data: rows.map((row) => PlaceResponseHelper.listItem(row, ancestors.get(row.id) ?? [])),
      page: { page: query.page, pageSize: query.pageSize, total },
    });
  }

  async create(actorId: string, request: TCreatePlaceRequest): Promise<TPlaceResponse> {
    const row = await this.database.db.transaction(async (tx) => {
      if (request.parentId && !(await this.places.findById(request.parentId, tx))) {
        throw PlacesService.unknownParent();
      }
      const place = await this.places.insert(
        { ...PlacesService.columns(request), createdBy: actorId, updatedBy: actorId },
        tx,
      );
      await this.places.replaceAltNames(place.id, request.altNames, tx);
      await this.audit.record(
        {
          action: "place.created",
          entityType: "place",
          entityId: place.id,
          actorId,
          changes: { kind: place.kind, parentId: place.parentId },
        },
        tx,
      );
      return place;
    });
    return this.detail(row);
  }

  async update(actorId: string, id: string, request: TUpdatePlaceRequest): Promise<TPlaceResponse> {
    const row = await this.database.db.transaction(async (tx) => {
      const current = await this.places.findById(id, tx);
      if (!current) {
        throw PlacesService.notFound();
      }
      if (request.parentId) {
        if (!(await this.places.findById(request.parentId, tx))) {
          throw PlacesService.unknownParent();
        }
        if (await this.places.isSelfOrDescendant(request.parentId, id, tx)) {
          throw new AppException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            "place_cycle",
            "Invalid parent",
            "A place can't sit inside itself or one of its own sub-places.",
          );
        }
      }
      const updated = await this.places.updateIfVersion(
        id,
        request.version,
        { ...PlacesService.columns(request), updatedBy: actorId },
        tx,
      );
      if (!updated) {
        throw new VersionConflictException(current.version);
      }
      await this.places.replaceAltNames(id, request.altNames, tx);
      await this.audit.record(
        {
          action: "place.updated",
          entityType: "place",
          entityId: id,
          actorId,
          changes: { version: updated.version, parentId: updated.parentId },
        },
        tx,
      );
      return updated;
    });
    return this.detail(row);
  }

  private async detail(row: TPlaceRow): Promise<TPlaceResponse> {
    const [altNames, ancestors] = await Promise.all([
      this.places.altNames(row.id),
      this.places.ancestorsOf([row.id]),
    ]);
    return PlaceResponseHelper.detail(row, altNames, ancestors.get(row.id) ?? []);
  }

  private static columns(request: TCreatePlaceRequest) {
    return {
      parentId: request.parentId ?? null,
      kind: request.kind,
      nameI18n: request.nameI18n,
      latitude:
        request.latitude === null || request.latitude === undefined
          ? null
          : String(request.latitude),
      longitude:
        request.longitude === null || request.longitude === undefined
          ? null
          : String(request.longitude),
      notes: request.notes ?? null,
    };
  }

  private static notFound(): AppException {
    return new AppException(HttpStatus.NOT_FOUND, "not_found", "Not found", "Place not found.");
  }

  private static unknownParent(): AppException {
    return new AppException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      "unknown_parent",
      "Unknown parent place",
      "The parent place doesn't exist.",
    );
  }
}
