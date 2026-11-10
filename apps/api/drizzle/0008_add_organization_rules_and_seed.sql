-- Organization rules Drizzle can't express (schema-design §7, §13), each
-- covered by test/organization-schema.int.test.ts.

-- Terms of one board never overlap.
ALTER TABLE terms ADD CONSTRAINT terms_no_overlap
  EXCLUDE USING gist (org_unit_id WITH =, period WITH &&);--> statement-breakpoint

-- One holder at a time for a position with max_holders = 1 (e.g. Chairperson).
ALTER TABLE appointments ADD CONSTRAINT appointments_exclusive_one_holder
  EXCLUDE USING gist (org_unit_id WITH =, position_id WITH =, period WITH &&)
  WHERE (is_exclusive AND record_status = 'accepted');--> statement-breakpoint

-- The same person is not appointed twice to the same seat at the same time.
ALTER TABLE appointments ADD CONSTRAINT appointments_no_double_seat
  EXCLUDE USING gist (person_id WITH =, org_unit_id WITH =, position_id WITH =, period WITH &&)
  WHERE (record_status = 'accepted');--> statement-breakpoint

CREATE INDEX appointments_period_idx ON appointments USING gist (period);--> statement-breakpoint

-- is_exclusive mirrors the position, so the partial exclusion above can use it.
CREATE FUNCTION appointments_copy_exclusive() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.is_exclusive := coalesce(
    (SELECT max_holders = 1 FROM position_definitions WHERE id = NEW.position_id), false);
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER appointments_set_exclusive
  BEFORE INSERT OR UPDATE OF position_id ON appointments
  FOR EACH ROW EXECUTE FUNCTION appointments_copy_exclusive();--> statement-breakpoint

-- Changing a position to one-holder re-checks existing appointments; an
-- overlap then fails the exclusion constraint instead of slipping through.
CREATE FUNCTION position_definitions_sync_exclusive() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE appointments SET is_exclusive = coalesce(NEW.max_holders = 1, false)
  WHERE position_id = NEW.id;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER position_definitions_max_holders_changed
  AFTER UPDATE OF max_holders ON position_definitions
  FOR EACH ROW EXECUTE FUNCTION position_definitions_sync_exclusive();--> statement-breakpoint

-- Reference data: the organization, its board levels and the Central Board.
-- Positions wait for the statute (requirements Q-8 follow-up) and are entered
-- in the admin. Nepali names await the organization's review.
INSERT INTO organizations (id, slug, name_i18n, short_name)
VALUES (gen_random_uuid(), 'sambahamphe-utthan-sangh',
        '{"en": "Sambahamphe Utthan Sangh", "ne": "सम्बाहाङ्फे उत्थान संघ"}', 'SUS');--> statement-breakpoint
INSERT INTO org_unit_types (id, organization_id, key, name_i18n, level_order)
SELECT gen_random_uuid(), o.id, t.key, t.name_i18n::jsonb, t.level_order
FROM organizations o,
  (VALUES ('central_board', '{"en": "Central Board", "ne": "केन्द्रीय समिति"}', 1),
          ('regional_board', '{"en": "Regional Board", "ne": "क्षेत्रीय समिति"}', 2),
          ('gaau_committee', '{"en": "Gaau Committee", "ne": "गाउँ समिति"}', 3)) AS t(key, name_i18n, level_order)
WHERE o.slug = 'sambahamphe-utthan-sangh';--> statement-breakpoint
INSERT INTO org_unit_type_parents (type_id, parent_type_id)
SELECT child.id, parent.id
FROM org_unit_types child JOIN org_unit_types parent ON parent.organization_id = child.organization_id
WHERE (child.key, parent.key) IN (('regional_board', 'central_board'), ('gaau_committee', 'regional_board'));--> statement-breakpoint
INSERT INTO org_units (id, organization_id, type_id, slug, name_i18n)
SELECT gen_random_uuid(), t.organization_id, t.id, 'central-board', t.name_i18n
FROM org_unit_types t WHERE t.key = 'central_board';
