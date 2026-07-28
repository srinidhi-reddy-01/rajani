-- Replaces the old "personally verified" checkmark (is_verified, kept but no longer
-- driving the public badge - see rule #13) with a real, checkable claim: the vendor's
-- actual FSSAI license number. The "FSSAI certified" badge (SRP card + vendor detail
-- page) is driven by this column being non-null, not by admin opinion.
alter table vendors add column fssai_license_number text;
