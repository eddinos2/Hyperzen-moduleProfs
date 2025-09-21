-- ===========================================
-- FONCTION RPC POUR FACTURES AVEC INFORMATIONS BANCAIRES
-- ===========================================

CREATE OR REPLACE FUNCTION get_invoices_with_banking_info()
RETURNS TABLE (
  id uuid,
  enseignant_id uuid,
  enseignant_name text,
  enseignant_email text,
  campus_id uuid,
  campus_name campus_name,
  month_year text,
  status invoice_status,
  total_amount numeric,
  iban text,
  bic text,
  bank_name text,
  account_holder text,
  drive_invoice_link text,
  rib_confirmed_at timestamptz,
  rib_confirmed_by_id uuid,
  rib_confirmed_by_name text,
  prevalidated_by text,
  validated_by text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.enseignant_id,
    CONCAT(p.first_name, ' ', p.last_name) as enseignant_name,
    p.email as enseignant_email,
    i.campus_id,
    c.name as campus_name,
    i.month_year,
    i.status,
    i.total_amount,
    i.iban,
    i.bic,
    i.bank_name,
    i.account_holder,
    i.drive_invoice_link,
    i.rib_confirmed_at,
    i.rib_confirmed_by,
    CONCAT(rb.first_name, ' ', rb.last_name) as rib_confirmed_by_name,
    CONCAT(pb.first_name, ' ', pb.last_name) as prevalidated_by,
    CONCAT(vb.first_name, ' ', vb.last_name) as validated_by,
    i.created_at,
    i.updated_at
  FROM invoices i
  LEFT JOIN profiles p ON i.enseignant_id = p.id
  LEFT JOIN campus c ON i.campus_id = c.id
  LEFT JOIN profiles rb ON i.rib_confirmed_by = rb.id
  LEFT JOIN profiles pb ON i.prevalidated_by = pb.id
  LEFT JOIN profiles vb ON i.validated_by = vb.id
  ORDER BY i.created_at DESC;
END;
$$;
