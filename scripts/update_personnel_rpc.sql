-- ===========================================
-- MISE À JOUR DE LA FONCTION get_personnel_enriched
-- ===========================================

CREATE OR REPLACE FUNCTION get_personnel_enriched()
RETURNS TABLE (
  id uuid,
  email text,
  first_name text,
  last_name text,
  role app_role,
  campus_id uuid,
  campus_name campus_name,
  campus_address text,
  iban text,
  bic text,
  bank_name text,
  account_holder text,
  drive_invoice_link text,
  rib_confirmed_at timestamptz,
  rib_confirmed_by_id uuid,
  rib_confirmed_by_name text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.campus_id,
    c.name as campus_name,
    c.address as campus_address,
    p.iban,
    p.bic,
    p.bank_name,
    p.account_holder,
    p.drive_invoice_link,
    p.rib_confirmed_at,
    p.rib_confirmed_by,
    CONCAT(rb.first_name, ' ', rb.last_name) as rib_confirmed_by_name,
    p.created_at,
    p.updated_at
  FROM profiles p
  LEFT JOIN campus c ON p.campus_id = c.id
  LEFT JOIN profiles rb ON p.rib_confirmed_by = rb.id
  ORDER BY p.created_at DESC;
END;
$$;
