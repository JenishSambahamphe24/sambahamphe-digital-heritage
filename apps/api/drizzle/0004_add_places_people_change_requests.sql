CREATE TYPE "public"."cr_apply_status" AS ENUM('pending', 'applied', 'conflict', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."cr_domain" AS ENUM('genealogy');--> statement-breakpoint
CREATE TYPE "public"."cr_status" AS ENUM('pending', 'under_review', 'needs_correction', 'approved', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."consent_relation" AS ENUM('self', 'parent_guardian', 'next_of_kin', 'estate');--> statement-breakpoint
CREATE TYPE "public"."name_type" AS ENUM('birth', 'given', 'married', 'alias', 'ritual', 'nickname', 'honorific', 'other');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('female', 'male', 'other', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."lineage_role" AS ENUM('lineage', 'spouse');--> statement-breakpoint
CREATE TYPE "public"."living_status" AS ENUM('living', 'deceased', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."person_record_status" AS ENUM('active', 'merged', 'retracted');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('unverified', 'verified', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."visibility_level" AS ENUM('public', 'members', 'branch', 'restricted', 'private');--> statement-breakpoint
CREATE TYPE "public"."place_alt_name_kind" AS ENUM('historical', 'variant', 'official');--> statement-breakpoint
CREATE TYPE "public"."place_kind" AS ENUM('country', 'province', 'district', 'municipality', 'ward', 'village', 'locality', 'venue', 'other');--> statement-breakpoint
CREATE TABLE "change_request_operations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"change_request_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"op_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"payload_version" integer DEFAULT 1 NOT NULL,
	"temp_ref" text,
	"target_type" text,
	"target_id" uuid,
	"base_version" integer,
	"apply_status" "cr_apply_status" DEFAULT 'pending' NOT NULL,
	"result_entity_id" uuid,
	CONSTRAINT "change_request_operations_seq_unique" UNIQUE("change_request_id","seq")
);
--> statement-breakpoint
CREATE TABLE "change_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"domain" "cr_domain" NOT NULL,
	"title" text NOT NULL,
	"rationale" text,
	"status" "cr_status" DEFAULT 'pending' NOT NULL,
	"auto_approved" boolean DEFAULT false NOT NULL,
	"submitted_by" uuid NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewer_id" uuid,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"decision_note" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "change_requests_decided_iff_final" CHECK (("change_requests"."status" in ('approved', 'rejected')) = ("change_requests"."decided_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "clans" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"community" text DEFAULT 'Limbu' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "entity_revisions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"change_request_id" uuid,
	"actor_id" uuid,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entity_revisions_version_unique" UNIQUE("entity_type","entity_id","version")
);
--> statement-breakpoint
CREATE TABLE "person_access_grants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"person_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"field_groups" text[] NOT NULL,
	"granted_by" uuid NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "person_consents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"person_id" uuid NOT NULL,
	"granted_by_user_id" uuid,
	"granted_by_name" text NOT NULL,
	"relation_to_subject" "consent_relation" NOT NULL,
	"scope" jsonb NOT NULL,
	"granted_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"recorded_by" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "person_names" (
	"id" uuid PRIMARY KEY NOT NULL,
	"person_id" uuid NOT NULL,
	"name_type" "name_type" NOT NULL,
	"given_name" text,
	"surname" text,
	"full_name" text NOT NULL,
	"language" text,
	"script" text,
	"romanized" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" uuid PRIMARY KEY NOT NULL,
	"record_status" "person_record_status" DEFAULT 'active' NOT NULL,
	"merged_into_id" uuid,
	"lineage_role" "lineage_role" NOT NULL,
	"is_founding_ancestor" boolean DEFAULT false NOT NULL,
	"gender" "gender",
	"gender_note" text,
	"living_status" "living_status" DEFAULT 'unknown' NOT NULL,
	"birth_date" jsonb,
	"birth_sort_from" date,
	"birth_sort_to" date,
	"death_date" jsonb,
	"death_sort_from" date,
	"death_sort_to" date,
	"birth_place_id" uuid,
	"death_place_id" uuid,
	"birth_clan_id" uuid,
	"occupation" text,
	"internal_notes" text,
	"visibility" "visibility_level" DEFAULT 'restricted' NOT NULL,
	"field_visibility" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"verification_status" "verification_status" DEFAULT 'unverified' NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "persons_merged_has_target" CHECK ("persons"."record_status" <> 'merged' or "persons"."merged_into_id" is not null),
	CONSTRAINT "persons_not_merged_into_self" CHECK ("persons"."merged_into_id" is null or "persons"."merged_into_id" <> "persons"."id"),
	CONSTRAINT "persons_birth_sort_order" CHECK ("persons"."birth_sort_from" is null or "persons"."birth_sort_from" <= "persons"."birth_sort_to"),
	CONSTRAINT "persons_death_sort_order" CHECK ("persons"."death_sort_from" is null or "persons"."death_sort_from" <= "persons"."death_sort_to"),
	CONSTRAINT "persons_living_has_no_death" CHECK ("persons"."living_status" <> 'living' or "persons"."death_date" is null),
	CONSTRAINT "persons_lineage_gender" CHECK ("persons"."lineage_role" <> 'lineage' or "persons"."gender" in ('male', 'female')),
	CONSTRAINT "persons_founder_is_lineage_male" CHECK (not "persons"."is_founding_ancestor" or ("persons"."lineage_role" = 'lineage' and "persons"."gender" = 'male'))
);
--> statement-breakpoint
CREATE TABLE "place_alt_names" (
	"id" uuid PRIMARY KEY NOT NULL,
	"place_id" uuid NOT NULL,
	"name" text NOT NULL,
	"language" text,
	"script" text,
	"kind" "place_alt_name_kind" DEFAULT 'variant' NOT NULL,
	"valid_from_year" integer,
	"valid_to_year" integer,
	CONSTRAINT "place_alt_names_valid_years" CHECK ("place_alt_names"."valid_from_year" is null or "place_alt_names"."valid_to_year" is null or "place_alt_names"."valid_from_year" <= "place_alt_names"."valid_to_year")
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY NOT NULL,
	"parent_id" uuid,
	"kind" "place_kind" NOT NULL,
	"name_i18n" jsonb NOT NULL,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"notes" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "change_request_operations" ADD CONSTRAINT "change_request_operations_change_request_id_change_requests_id_fk" FOREIGN KEY ("change_request_id") REFERENCES "public"."change_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_revisions" ADD CONSTRAINT "entity_revisions_change_request_id_change_requests_id_fk" FOREIGN KEY ("change_request_id") REFERENCES "public"."change_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_revisions" ADD CONSTRAINT "entity_revisions_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_access_grants" ADD CONSTRAINT "person_access_grants_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_access_grants" ADD CONSTRAINT "person_access_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_access_grants" ADD CONSTRAINT "person_access_grants_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_consents" ADD CONSTRAINT "person_consents_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_consents" ADD CONSTRAINT "person_consents_granted_by_user_id_users_id_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_consents" ADD CONSTRAINT "person_consents_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_names" ADD CONSTRAINT "person_names_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_merged_into_id_persons_id_fk" FOREIGN KEY ("merged_into_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_birth_place_id_places_id_fk" FOREIGN KEY ("birth_place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_death_place_id_places_id_fk" FOREIGN KEY ("death_place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_birth_clan_id_clans_id_fk" FOREIGN KEY ("birth_clan_id") REFERENCES "public"."clans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_alt_names" ADD CONSTRAINT "place_alt_names_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_parent_id_places_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "change_request_operations_target_idx" ON "change_request_operations" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "change_requests_status_submitted_idx" ON "change_requests" USING btree ("status","submitted_at");--> statement-breakpoint
CREATE INDEX "change_requests_submitted_by_idx" ON "change_requests" USING btree ("submitted_by");--> statement-breakpoint
CREATE INDEX "person_access_grants_person_user_idx" ON "person_access_grants" USING btree ("person_id","user_id");--> statement-breakpoint
CREATE INDEX "person_consents_person_id_idx" ON "person_consents" USING btree ("person_id");--> statement-breakpoint
CREATE UNIQUE INDEX "person_names_one_primary" ON "person_names" USING btree ("person_id") WHERE "person_names"."is_primary";--> statement-breakpoint
CREATE INDEX "person_names_person_id_idx" ON "person_names" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "person_names_romanized_trgm_idx" ON "person_names" USING gin ("romanized" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "person_names_full_name_trgm_idx" ON "person_names" USING gin ("full_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "persons_lineage_role_idx" ON "persons" USING btree ("lineage_role");--> statement-breakpoint
CREATE INDEX "persons_birth_sort_from_idx" ON "persons" USING btree ("birth_sort_from");--> statement-breakpoint
CREATE INDEX "persons_birth_clan_id_idx" ON "persons" USING btree ("birth_clan_id");--> statement-breakpoint
CREATE INDEX "persons_merged_into_id_idx" ON "persons" USING btree ("merged_into_id") WHERE "persons"."merged_into_id" is not null;--> statement-breakpoint
CREATE INDEX "place_alt_names_place_id_idx" ON "place_alt_names" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "place_alt_names_name_trgm_idx" ON "place_alt_names" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "places_parent_id_idx" ON "places" USING btree ("parent_id");