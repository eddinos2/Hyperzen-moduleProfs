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
    p.created_at,
    p.updated_at
  FROM profiles p
  LEFT JOIN campus c ON p.campus_id = c.id
  ORDER BY p.created_at DESC;
END;
$$;
