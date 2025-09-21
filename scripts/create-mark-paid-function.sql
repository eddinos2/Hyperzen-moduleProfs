-- Création de la fonction RPC mark_invoice_paid
-- Cette fonction permet de marquer une facture comme payée

CREATE OR REPLACE FUNCTION mark_invoice_paid(
  p_invoice_id UUID,
  p_payment_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_invoice_status TEXT;
  v_profile_role TEXT;
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Non authentifié');
  END IF;

  -- Récupérer le rôle de l'utilisateur
  SELECT role INTO v_profile_role
  FROM profiles
  WHERE id = auth.uid();

  -- Vérifier les permissions (SUPER_ADMIN ou COMPTABLE)
  IF v_profile_role NOT IN ('SUPER_ADMIN', 'COMPTABLE') THEN
    RETURN json_build_object('success', false, 'error', 'Permissions insuffisantes');
  END IF;

  -- Vérifier que la facture existe et récupérer son statut
  SELECT status INTO v_invoice_status
  FROM invoices
  WHERE id = p_invoice_id;

  IF v_invoice_status IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Facture non trouvée');
  END IF;

  -- Vérifier que la facture peut être marquée comme payée (doit être validée)
  IF v_invoice_status != 'validated' THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Seules les factures validées peuvent être marquées comme payées'
    );
  END IF;

  -- Marquer la facture comme payée
  UPDATE invoices
  SET 
    status = 'paid',
    paid_at = p_payment_date,
    paid_by = auth.uid(),
    updated_at = NOW()
  WHERE id = p_invoice_id;

  -- Enregistrer dans l'audit
  INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values, user_id)
  VALUES (
    'UPDATE',
    'invoices',
    p_invoice_id,
    json_build_object('status', v_invoice_status),
    json_build_object('status', 'paid', 'paid_at', p_payment_date, 'paid_by', auth.uid()),
    auth.uid()
  );

  -- Retourner le succès
  RETURN json_build_object(
    'success', true,
    'message', 'Facture marquée comme payée avec succès',
    'invoice_id', p_invoice_id,
    'payment_date', p_payment_date
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erreur lors du marquage de paiement: ' || SQLERRM
    );
END;
$$;

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION mark_invoice_paid(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_invoice_paid(UUID, TIMESTAMPTZ) TO anon;

-- Commentaire sur la fonction
COMMENT ON FUNCTION mark_invoice_paid(UUID, TIMESTAMPTZ) IS 'Marque une facture validée comme payée. Nécessite le rôle SUPER_ADMIN ou COMPTABLE.';
