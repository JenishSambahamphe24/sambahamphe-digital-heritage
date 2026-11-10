-- Presumed-living rule (schema-design §4), mirrored in
-- modules/people/domain/privacy-policy.helper.ts for single records. List
-- queries filter with it so a page of results never needs every row in memory.
-- Unknown status with no dates counts as living: deny by default (ADR-021).
CREATE FUNCTION person_presumed_living(p persons) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT CASE p.living_status
    WHEN 'living' THEN true
    WHEN 'deceased' THEN false
    ELSE p.death_date IS NULL
      AND (p.birth_sort_to IS NULL OR p.birth_sort_to > current_date - interval '110 years')
  END
$$;--> statement-breakpoint

-- Genealogy records are never hard-deleted (ADR-017): retract or merge instead.
-- Revisions are history and never change once written.
CREATE FUNCTION genealogy_reject_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% is append-only or status-managed (% rejected)', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;--> statement-breakpoint
CREATE TRIGGER persons_no_delete
  BEFORE DELETE ON persons
  FOR EACH ROW EXECUTE FUNCTION genealogy_reject_change();--> statement-breakpoint
CREATE TRIGGER persons_no_truncate
  BEFORE TRUNCATE ON persons
  FOR EACH STATEMENT EXECUTE FUNCTION genealogy_reject_change();--> statement-breakpoint
CREATE TRIGGER entity_revisions_no_update_delete
  BEFORE UPDATE OR DELETE ON entity_revisions
  FOR EACH ROW EXECUTE FUNCTION genealogy_reject_change();--> statement-breakpoint
CREATE TRIGGER entity_revisions_no_truncate
  BEFORE TRUNCATE ON entity_revisions
  FOR EACH STATEMENT EXECUTE FUNCTION genealogy_reject_change();
