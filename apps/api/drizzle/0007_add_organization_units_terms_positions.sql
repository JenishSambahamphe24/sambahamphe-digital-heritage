CREATE TYPE "public"."appointment_end_reason" AS ENUM('term_ended', 'resigned', 'removed', 'deceased', 'replaced', 'other');--> statement-breakpoint
CREATE TYPE "public"."appointment_type" AS ENUM('elected', 'nominated', 'co_opted', 'acting', 'ex_officio', 'honorary');--> statement-breakpoint
CREATE TYPE "public"."assertion_status" AS ENUM('accepted', 'disputed', 'superseded', 'rejected', 'retracted');--> statement-breakpoint
CREATE TYPE "public"."org_unit_status" AS ENUM('active', 'dissolved', 'merged');--> statement-breakpoint
CREATE TYPE "public"."date_precision" AS ENUM('day', 'month', 'year');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"person_id" uuid NOT NULL,
	"org_unit_id" uuid NOT NULL,
	"position_id" uuid NOT NULL,
	"term_id" uuid,
	"appointment_type" "appointment_type" DEFAULT 'elected' NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"date_precision" date_precision DEFAULT 'day' NOT NULL,
	"end_reason" "appointment_end_reason",
	"is_exclusive" boolean DEFAULT false NOT NULL,
	"record_status" "assertion_status" DEFAULT 'accepted' NOT NULL,
	"notes" text,
	"period" daterange GENERATED ALWAYS AS (daterange(starts_on, ends_on, '[)')) STORED,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "appointments_end_after_start" CHECK ("appointments"."ends_on" is null or "appointments"."ends_on" > "appointments"."starts_on"),
	CONSTRAINT "appointments_end_reason_needs_end" CHECK ("appointments"."end_reason" is null or "appointments"."ends_on" is not null)
);
--> statement-breakpoint
CREATE TABLE "org_unit_type_parents" (
	"type_id" uuid NOT NULL,
	"parent_type_id" uuid NOT NULL,
	CONSTRAINT "org_unit_type_parents_type_id_parent_type_id_pk" PRIMARY KEY("type_id","parent_type_id")
);
--> statement-breakpoint
CREATE TABLE "org_unit_types" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"level_order" integer NOT NULL,
	CONSTRAINT "org_unit_types_key_unique" UNIQUE("organization_id","key")
);
--> statement-breakpoint
CREATE TABLE "org_units" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"type_id" uuid NOT NULL,
	"parent_id" uuid,
	"slug" text NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"place_id" uuid,
	"established_date" jsonb,
	"established_sort" date,
	"dissolved_date" jsonb,
	"dissolved_sort" date,
	"status" "org_unit_status" DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "org_units_slug_unique" UNIQUE("slug"),
	CONSTRAINT "org_units_not_own_parent" CHECK ("org_units"."parent_id" is null or "org_units"."parent_id" <> "org_units"."id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"short_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "position_definitions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"key" text NOT NULL,
	"title_i18n" jsonb NOT NULL,
	"rank" integer NOT NULL,
	"is_office_bearer" boolean DEFAULT false NOT NULL,
	"max_holders" integer,
	"active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "position_definitions_key_unique" UNIQUE("organization_id","key"),
	CONSTRAINT "position_definitions_max_holders" CHECK ("position_definitions"."max_holders" is null or "position_definitions"."max_holders" >= 1)
);
--> statement-breakpoint
CREATE TABLE "terms" (
	"id" uuid PRIMARY KEY NOT NULL,
	"org_unit_id" uuid NOT NULL,
	"ordinal" integer,
	"label_i18n" jsonb,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"date_precision" date_precision DEFAULT 'day' NOT NULL,
	"notes" text,
	"period" daterange GENERATED ALWAYS AS (daterange(starts_on, ends_on, '[)')) STORED,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "terms_id_unit_unique" UNIQUE("id","org_unit_id"),
	CONSTRAINT "terms_end_after_start" CHECK ("terms"."ends_on" is null or "terms"."ends_on" > "terms"."starts_on")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_org_unit_id_org_units_id_fk" FOREIGN KEY ("org_unit_id") REFERENCES "public"."org_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_position_id_position_definitions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."position_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_term_same_unit_fk" FOREIGN KEY ("term_id","org_unit_id") REFERENCES "public"."terms"("id","org_unit_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_unit_type_parents" ADD CONSTRAINT "org_unit_type_parents_type_id_org_unit_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."org_unit_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_unit_type_parents" ADD CONSTRAINT "org_unit_type_parents_parent_type_id_org_unit_types_id_fk" FOREIGN KEY ("parent_type_id") REFERENCES "public"."org_unit_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_unit_types" ADD CONSTRAINT "org_unit_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_units" ADD CONSTRAINT "org_units_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_units" ADD CONSTRAINT "org_units_type_id_org_unit_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."org_unit_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_units" ADD CONSTRAINT "org_units_parent_id_org_units_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."org_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_units" ADD CONSTRAINT "org_units_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_units" ADD CONSTRAINT "org_units_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_units" ADD CONSTRAINT "org_units_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_definitions" ADD CONSTRAINT "position_definitions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms" ADD CONSTRAINT "terms_org_unit_id_org_units_id_fk" FOREIGN KEY ("org_unit_id") REFERENCES "public"."org_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms" ADD CONSTRAINT "terms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms" ADD CONSTRAINT "terms_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_unit_starts_idx" ON "appointments" USING btree ("org_unit_id","starts_on" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "appointments_person_idx" ON "appointments" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "org_units_parent_id_idx" ON "org_units" USING btree ("parent_id");--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_org_unit_id_org_units_id_fk" FOREIGN KEY ("org_unit_id") REFERENCES "public"."org_units"("id") ON DELETE no action ON UPDATE no action;