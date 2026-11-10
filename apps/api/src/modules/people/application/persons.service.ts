import type { TDbExecutor, TTransaction } from "../../../core/database/database.types.js";
import type { IAuthContext } from "../../auth/auth.types.js";
import type { TViewer } from "../domain/privacy.types.js";
import type {
  TConsentRow,
  TNewPersonNameRow,
  TNewPersonRow,
  TPersonNameRow,
  TPersonRow,
} from "../internal/persons.repository.js";
import type {
  TAdminPersonListResponse,
  TAdminPersonResponse,
  TConsentResponse,
  TCreatePersonRequest,
  TFieldGroup,
  TListPersonsQuery,
  TPersonFields,
  TPersonListResponse,
  TPersonResponse,
  TRecordConsentRequest,
  TRetractPersonRequest,
  TUpdatePersonRequest,
} from "@repo/contracts";
import type { Request } from "express";

import { HttpStatus, Injectable } from "@nestjs/common";

import { adminPersonListResponseSchema, personListResponseSchema } from "@repo/contracts";
import { FuzzyDateHelper } from "@repo/dates";

import { DatabaseService } from "../../../core/database/database.service.js";
import { AppException } from "../../../core/errors/app.exception.js";
import { VersionConflictException } from "../../../core/errors/version-conflict.exception.js";
import { PERMISSION } from "../../access/access.catalog.js";
import { AccessService } from "../../access/application/access.service.js";
import { ChangeRequestsService } from "../../change-requests/application/change-requests.service.js";
import { ENTITY_TYPE, OP_TYPE } from "../../change-requests/change-request.constants.js";
import { PlacesRepository } from "../../places/internal/places.repository.js";
import { PersonRulesHelper } from "../domain/person-rules.helper.js";
import { PrivacyPolicyHelper } from "../domain/privacy-policy.helper.js";
import { RomanizationHelper } from "../domain/romanization.helper.js";
import { PersonsRepository } from "../internal/persons.repository.js";
import { PersonResponseHelper } from "../person-response.helper.js";

const CONSENT_ENTITY = "person_consent";
const CONSENT_RECORDED_VERSION = 1;
const CONSENT_REVOKED_VERSION = 2;

@Injectable()
export class PersonsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly persons: PersonsRepository,
    private readonly places: PlacesRepository,
    private readonly changeRequests: ChangeRequestsService,
    private readonly access: AccessService,
  ) {}

  // ---------- reads for any viewer (privacy-filtered)

  async getForViewer(
    auth: IAuthContext | null,
    request: Request,
    id: string,
  ): Promise<TPersonResponse> {
    const row = await this.persons.findById(id);
    if (!row || row.recordStatus !== "active") {
      throw PersonsService.notFound();
    }
    const viewer = await this.viewerFor(auth, request, row.id);
    const view = PrivacyPolicyHelper.view(
      PersonResponseHelper.subject(row),
      await this.consentScopes(row.id),
      viewer,
      new Date(),
    );
    // Hidden and missing look the same: never reveal that a record exists.
    if (!view.visible) {
      throw PersonsService.notFound();
    }
    const [names, places] = await Promise.all([
      this.persons.namesOf([row.id]),
      this.placesFor([row]),
    ]);
    return PersonResponseHelper.forViewer(row, names.get(row.id) ?? [], places, view);
  }

  async listForViewer(
    auth: IAuthContext | null,
    request: Request,
    query: TListPersonsQuery,
  ): Promise<TPersonListResponse> {
    const isEditor = await this.isEditor(auth, request);
    const search = {
      raw: query.q,
      romanized: query.q ? RomanizationHelper.romanize(query.q) : undefined,
      offset: (query.page - 1) * query.pageSize,
      limit: query.pageSize,
    };
    const { rows: matches, total } = isEditor
      ? await this.persons.searchAll(search)
      : await this.persons.searchVisible({ ...search, level: auth ? "members" : "public" });
    const rows = await this.inOrder(matches.map((match) => match.id));
    const [names, places] = await Promise.all([
      this.persons.namesOf(rows.map((row) => row.id)),
      this.placesFor(rows),
    ]);
    const today = new Date();
    const data: TPersonResponse[] = [];
    for (const row of rows) {
      const viewer: TViewer = isEditor
        ? { kind: "editor" }
        : auth
          ? { kind: "member", grantedGroups: new Set() }
          : { kind: "anonymous" };
      const view = PrivacyPolicyHelper.view(
        PersonResponseHelper.subject(row),
        await this.consentScopes(row.id),
        viewer,
        today,
      );
      if (view.visible) {
        data.push(PersonResponseHelper.forViewer(row, names.get(row.id) ?? [], places, view));
      }
    }
    return personListResponseSchema.parse({
      data,
      page: { page: query.page, pageSize: query.pageSize, total },
    });
  }

  // ---------- editor reads

  async getForEditor(id: string): Promise<TAdminPersonResponse> {
    const row = await this.persons.findById(id);
    if (!row) {
      throw PersonsService.notFound();
    }
    return this.adminResponse(row);
  }

  async listForEditor(query: TListPersonsQuery): Promise<TAdminPersonListResponse> {
    const { rows: matches, total } = await this.persons.searchAll({
      raw: query.q,
      romanized: query.q ? RomanizationHelper.romanize(query.q) : undefined,
      offset: (query.page - 1) * query.pageSize,
      limit: query.pageSize,
    });
    const rows = await this.inOrder(matches.map((match) => match.id));
    const names = await this.persons.namesOf(rows.map((row) => row.id));
    const matchedName = new Map(matches.map((match) => [match.id, match.matchedName]));
    const today = new Date();
    return adminPersonListResponseSchema.parse({
      data: rows.map((row) =>
        PersonResponseHelper.adminListItem(
          row,
          names.get(row.id) ?? [],
          matchedName.get(row.id) ?? null,
          today,
        ),
      ),
      page: { page: query.page, pageSize: query.pageSize, total },
    });
  }

  // ---------- editor writes (auto-approved change requests, ADR-012)

  async create(actorId: string, request: TCreatePersonRequest): Promise<TAdminPersonResponse> {
    const today = new Date();
    const columns = PersonsService.columns(request);
    await this.validate(request, columns, [], today, request.reason);
    const row = await this.database.db.transaction(async (tx) => {
      const result = await this.changeRequests.applyAsEditor(
        tx,
        {
          actorId,
          title: "Add person",
          reason: request.reason,
          operation: {
            opType: OP_TYPE.createPerson,
            payload: { ...request },
            targetType: ENTITY_TYPE.person,
          },
        },
        async () => {
          const person = await this.persons.insert(
            { ...columns, createdBy: actorId, updatedBy: actorId },
            tx,
          );
          const names = await this.persons.replaceNames(
            person.id,
            PersonsService.nameRows(request),
            tx,
          );
          return {
            entityId: person.id,
            version: person.version,
            snapshot: PersonsService.snapshot(person, names),
          };
        },
      );
      return this.persons.findById(result.entityId, tx);
    });
    return this.adminResponse(PersonsService.present(row));
  }

  async update(
    actorId: string,
    id: string,
    request: TUpdatePersonRequest,
  ): Promise<TAdminPersonResponse> {
    const today = new Date();
    const row = await this.database.db.transaction(async (tx) => {
      const current = await this.lockActive(id, request.version, tx);
      const columns = PersonsService.columns(request);
      // A change between living, minor and deceased resets privacy to that
      // status's defaults unless the editor set it explicitly.
      const before = PrivacyPolicyHelper.defaults(PersonResponseHelper.subject(current), today);
      const after = PrivacyPolicyHelper.defaults(
        {
          livingStatus: columns.livingStatus ?? "unknown",
          deathDate: columns.deathDate ?? null,
          birthSortTo: columns.birthSortTo ?? null,
        },
        today,
      );
      if (!request.visibility && !request.fieldVisibility && before !== after) {
        columns.visibility = after.visibility;
        columns.fieldVisibility = after.fieldVisibility;
      } else {
        columns.visibility = request.visibility ?? current.visibility;
        columns.fieldVisibility = request.fieldVisibility ?? current.fieldVisibility;
      }
      const consents = await this.consentScopes(id, tx);
      await this.validate(request, columns, consents, today, request.reason, true);
      const result = await this.changeRequests.applyAsEditor(
        tx,
        {
          actorId,
          title: "Edit person",
          reason: request.reason,
          operation: {
            opType: OP_TYPE.updatePerson,
            payload: { ...request },
            targetType: ENTITY_TYPE.person,
            targetId: id,
            baseVersion: request.version,
          },
        },
        async () => {
          const person = await this.persons.updateIfVersion(
            id,
            request.version,
            { ...columns, updatedBy: actorId },
            tx,
          );
          if (!person) {
            throw new VersionConflictException(current.version);
          }
          const names = await this.persons.replaceNames(id, PersonsService.nameRows(request), tx);
          return {
            entityId: id,
            version: person.version,
            snapshot: PersonsService.snapshot(person, names),
          };
        },
      );
      return this.persons.findById(result.entityId, tx);
    });
    return this.adminResponse(PersonsService.present(row));
  }

  // Never deleted (ADR-017): the record leaves every view but keeps its history.
  async retract(
    actorId: string,
    id: string,
    request: TRetractPersonRequest,
  ): Promise<TAdminPersonResponse> {
    const row = await this.database.db.transaction(async (tx) => {
      const current = await this.lockActive(id, request.version, tx);
      await this.changeRequests.applyAsEditor(
        tx,
        {
          actorId,
          title: "Retract person",
          reason: request.reason,
          operation: {
            opType: OP_TYPE.retractPerson,
            payload: { reason: request.reason },
            targetType: ENTITY_TYPE.person,
            targetId: id,
            baseVersion: request.version,
          },
        },
        async () => {
          const person = await this.persons.updateIfVersion(
            id,
            request.version,
            { recordStatus: "retracted", updatedBy: actorId },
            tx,
          );
          if (!person) {
            throw new VersionConflictException(current.version);
          }
          const names = await this.persons.namesOf([id], tx);
          return {
            entityId: id,
            version: person.version,
            snapshot: PersonsService.snapshot(person, names.get(id) ?? []),
          };
        },
      );
      return this.persons.findById(id, tx);
    });
    return this.adminResponse(PersonsService.present(row));
  }

  async recordConsent(
    actorId: string,
    personId: string,
    request: TRecordConsentRequest,
  ): Promise<TConsentResponse> {
    const consent = await this.database.db.transaction(async (tx) => {
      if (!(await this.persons.lockById(personId, tx))) {
        throw PersonsService.notFound();
      }
      const saved: { row?: TConsentRow } = {};
      await this.changeRequests.applyAsEditor(
        tx,
        {
          actorId,
          title: "Record consent",
          operation: {
            opType: OP_TYPE.recordConsent,
            payload: {
              personId,
              scope: request.scope,
              relationToSubject: request.relationToSubject,
            },
            targetType: CONSENT_ENTITY,
          },
        },
        async () => {
          saved.row = await this.persons.insertConsent(
            {
              personId,
              grantedByName: request.grantedByName,
              relationToSubject: request.relationToSubject,
              scope: request.scope,
              grantedAt: new Date(request.grantedAt),
              recordedBy: actorId,
              notes: request.notes ?? null,
            },
            tx,
          );
          return {
            entityId: saved.row.id,
            version: CONSENT_RECORDED_VERSION,
            snapshot: { ...saved.row },
          };
        },
      );
      return PersonsService.present(saved.row ?? null);
    });
    return PersonResponseHelper.consent(consent);
  }

  // Revoking only ever narrows visibility, so no privacy re-check is needed.
  async revokeConsent(actorId: string, personId: string, consentId: string): Promise<void> {
    await this.database.db.transaction(async (tx) => {
      await this.changeRequests.applyAsEditor(
        tx,
        {
          actorId,
          title: "Revoke consent",
          operation: {
            opType: OP_TYPE.revokeConsent,
            payload: { personId, consentId },
            targetType: CONSENT_ENTITY,
            targetId: consentId,
          },
        },
        async () => {
          const revoked = await this.persons.revokeConsent(personId, consentId, tx);
          if (!revoked) {
            throw new AppException(
              HttpStatus.NOT_FOUND,
              "not_found",
              "Not found",
              "Active consent not found.",
            );
          }
          return {
            entityId: revoked.id,
            version: CONSENT_REVOKED_VERSION,
            snapshot: { ...revoked },
          };
        },
      );
    });
  }

  // ---------- internals

  private async validate(
    fields: TPersonFields,
    columns: TNewPersonRow,
    consents: Awaited<ReturnType<PersonsService["consentScopes"]>>,
    today: Date,
    reason: string | null | undefined,
    columnsHaveVisibility = false,
  ): Promise<void> {
    const errors = PersonRulesHelper.check(fields);
    const placeIds = [fields.birthPlaceId, fields.deathPlaceId].filter((id): id is string =>
      Boolean(id),
    );
    const found = await this.places.findSummaries(placeIds);
    for (const [path, placeId] of [
      ["birthPlaceId", fields.birthPlaceId],
      ["deathPlaceId", fields.deathPlaceId],
    ] as const) {
      if (placeId && !found.has(placeId)) {
        errors.push({ path: [path], code: "unknown_place", message: "This place doesn't exist." });
      }
    }
    if (errors.length > 0) {
      throw PersonsService.invalid(errors);
    }
    const subject = {
      livingStatus: columns.livingStatus ?? "unknown",
      deathDate: columns.deathDate ?? null,
      birthSortTo: columns.birthSortTo ?? null,
    };
    if (!columnsHaveVisibility) {
      const defaults = PrivacyPolicyHelper.defaults(subject, today);
      columns.visibility = fields.visibility ?? defaults.visibility;
      columns.fieldVisibility = { ...defaults.fieldVisibility, ...fields.fieldVisibility };
    }
    // ADR-023: an editor adding or editing a minor records the authority for it.
    if (PrivacyPolicyHelper.isMinor(subject, today) && !reason) {
      throw PersonsService.invalid([
        {
          path: ["reason"],
          code: "minor_authority_required",
          message: "Note who authorized adding this minor (their parent or guardian).",
        },
      ]);
    }
    const violations = PrivacyPolicyHelper.violations(
      {
        ...subject,
        visibility: columns.visibility ?? "private",
        fieldVisibility: columns.fieldVisibility ?? {},
      },
      consents,
      today,
    );
    if (violations.length > 0) {
      throw PersonsService.invalid(
        violations.map((violation) => ({
          path:
            violation.field === "visibility"
              ? ["visibility"]
              : ["fieldVisibility", violation.field],
          code: violation.code,
          message:
            violation.code === "minor_not_public"
              ? "A minor's record can't be more open than the family branch."
              : "A living person's details can only be opened up with their recorded consent.",
        })),
      );
    }
  }

  private async lockActive(id: string, version: number, tx: TTransaction): Promise<TPersonRow> {
    const current = await this.persons.lockById(id, tx);
    if (!current) {
      throw PersonsService.notFound();
    }
    if (current.recordStatus !== "active") {
      throw new AppException(
        HttpStatus.CONFLICT,
        "person_not_active",
        "Not editable",
        "This record was retracted or merged and can't be edited.",
      );
    }
    if (current.version !== version) {
      throw new VersionConflictException(current.version);
    }
    return current;
  }

  private async viewerFor(
    auth: IAuthContext | null,
    request: Request,
    personId: string,
  ): Promise<TViewer> {
    if (!auth) {
      return { kind: "anonymous" };
    }
    if (await this.isEditor(auth, request)) {
      return { kind: "editor" };
    }
    const granted = await this.persons.grantedGroups(personId, auth.user.id, new Date());
    return { kind: "member", grantedGroups: new Set(granted as TFieldGroup[]) };
  }

  private async isEditor(auth: IAuthContext | null, request: Request): Promise<boolean> {
    return auth !== null && (await this.access.can(request, PERMISSION.genealogyEdit));
  }

  private async consentScopes(personId: string, executor?: TDbExecutor) {
    const rows = await this.persons.activeConsentsOf(personId, executor);
    return rows.map((row) => row.scope);
  }

  private async placesFor(rows: TPersonRow[]) {
    return this.places.findSummaries(
      rows
        .flatMap((row) => [row.birthPlaceId, row.deathPlaceId])
        .filter((id): id is string => Boolean(id)),
    );
  }

  private async inOrder(ids: string[]): Promise<TPersonRow[]> {
    const rows = new Map((await this.persons.findManyById(ids)).map((row) => [row.id, row]));
    return ids.map((id) => rows.get(id)).filter((row): row is TPersonRow => row !== undefined);
  }

  private async adminResponse(row: TPersonRow): Promise<TAdminPersonResponse> {
    const [names, places, consents] = await Promise.all([
      this.persons.namesOf([row.id]),
      this.placesFor([row]),
      this.persons.consentsOf(row.id),
    ]);
    return PersonResponseHelper.admin(row, names.get(row.id) ?? [], places, consents, new Date());
  }

  private static columns(fields: TPersonFields): TNewPersonRow {
    const birth = fields.birthDate ? FuzzyDateHelper.normalize(fields.birthDate) : null;
    const death = fields.deathDate ? FuzzyDateHelper.normalize(fields.deathDate) : null;
    return {
      lineageRole: fields.lineageRole,
      isFoundingAncestor: fields.isFoundingAncestor,
      gender: fields.gender ?? null,
      genderNote: fields.genderNote ?? null,
      livingStatus: fields.livingStatus,
      birthDate: fields.birthDate ?? null,
      birthSortFrom: birth?.from ?? null,
      birthSortTo: birth?.to ?? null,
      deathDate: fields.deathDate ?? null,
      deathSortFrom: death?.from ?? null,
      deathSortTo: death?.to ?? null,
      birthPlaceId: fields.birthPlaceId ?? null,
      deathPlaceId: fields.deathPlaceId ?? null,
      occupation: fields.occupation ?? null,
      internalNotes: fields.internalNotes ?? null,
    };
  }

  private static nameRows(fields: TPersonFields): TNewPersonNameRow[] {
    return fields.names.map((name, index) => ({
      nameType: name.nameType,
      givenName: name.givenName ?? null,
      surname: name.surname ?? null,
      fullName: name.fullName,
      language: name.language ?? null,
      script: name.script ?? null,
      romanized: RomanizationHelper.romanize(name.fullName),
      isPrimary: name.isPrimary,
      sortOrder: index,
    }));
  }

  private static snapshot(person: TPersonRow, names: TPersonNameRow[]): Record<string, unknown> {
    return JSON.parse(JSON.stringify({ person, names })) as Record<string, unknown>;
  }

  private static present<T>(value: T | null): T {
    if (value === null) {
      throw new Error("Row written in this transaction was not found");
    }
    return value;
  }

  private static notFound(): AppException {
    return new AppException(HttpStatus.NOT_FOUND, "not_found", "Not found", "Person not found.");
  }

  private static invalid(
    errors: Array<{ path: Array<string | number>; code: string; message: string }>,
  ): AppException {
    return new AppException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      "validation_error",
      "Validation failed",
      "Some fields need attention.",
      errors,
    );
  }
}
