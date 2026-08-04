-- Four additive, nullable/defaulted columns - no backfill, no existing vendor affected.
--
-- package_slots.is_locked: a slot that is always fully included and never presented as a
-- choice (e.g. "Common Items", "Pan Counter") - distinct from a pick-N-of-N slot, which
-- would still be technically togglable in the UI.
alter table package_slots add column is_locked boolean not null default false;

-- package_slot_items.sort_order: preserves source-menu item order within a slot. Existing
-- rows are left null (no backfill) - the read path must treat null as "sorts last".
alter table package_slot_items add column sort_order integer;

-- menu_items.group_label: a display-only sub-heading for grouping items within a single
-- pooled slot (e.g. "Refreshments" splitting into "Juices" / "Soups" while keeping one
-- pooled choose-N). Never read for selection-count math.
alter table menu_items add column group_label text;

-- vendors.internal_terms: admin-only vendor T&Cs (payment schedule, plates-counter
-- instructions, client-scope obligations) - never selected by any consumer-facing query.
alter table vendors add column internal_terms jsonb;
