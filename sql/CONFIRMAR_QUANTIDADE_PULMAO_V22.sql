-- ColetaWeb V22: confirmação da quantidade real de PULMÃO pela transportadora.
-- Execute no SQL Editor do Supabase, após as versões Booking V21 e Coleta V20.
-- Faça backup e teste em homologação. Não remove solicitações nem coletas.

ALTER TABLE public.cw_solicitacoes
  ADD COLUMN IF NOT EXISTS quantidade_solicitada_pulmao integer,
  ADD COLUMN IF NOT EXISTS quantidade_confirmada_pulmao integer,
  ADD COLUMN IF NOT EXISTS justificativa_quantidade_pulmao text,
  ADD COLUMN IF NOT EXISTS quantidade_pulmao_confirmada_em timestamptz,
  ADD COLUMN IF NOT EXISTS quantidade_pulmao_confirmada_por uuid;

COMMENT ON COLUMN public.cw_solicitacoes.quantidade IS
  'Quantidade operacional: para PULMÃO, passa a representar a quantidade real após confirmação.';

CREATE OR REPLACE FUNCTION public.cw_confirmar_quantidade_pulmao_v22(
  p_solicitacao_id uuid,
  p_quantidade_real integer,
  p_justificativa text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE
  solicitacao public.cw_solicitacoes%ROWTYPE;
  usuario_email text;
  transportadora_vinculada text;
  usados bigint;
  motivo text := btrim(coalesce(p_justificativa,''));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;
  IF p_quantidade_real IS NULL OR p_quantidade_real < 0 OR p_quantidade_real > 10000 THEN
    RAISE EXCEPTION 'Quantidade real inválida (0 a 10000)';
  END IF;

  -- O email é fornecido pelo JWT validado do usuário autenticado.
  usuario_email := auth.jwt()->>'email';
  SELECT u.transportadora INTO transportadora_vinculada
  FROM public.usuarios u
  WHERE lower(btrim(u.email))=lower(btrim(usuario_email))
    AND lower(btrim(coalesce(u.status,''))) IN ('aprovado','ativo','ativa','')
  LIMIT 1;
  IF nullif(btrim(coalesce(transportadora_vinculada,'')),'') IS NULL THEN
    RAISE EXCEPTION 'Seu usuário não possui transportadora ativa vinculada';
  END IF;

  -- Mesmo bloqueio utilizado pelo trigger V20, impedindo corrida com nova coleta.
  PERFORM pg_advisory_xact_lock(hashtextextended('CW_SOLICITACAO_'||p_solicitacao_id::text,0));
  SELECT * INTO solicitacao FROM public.cw_solicitacoes
    WHERE id=p_solicitacao_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação não encontrada'; END IF;
  IF upper(btrim(coalesce(solicitacao.tipo,''))) <> 'PULMÃO'
     OR solicitacao.status <> 'LIBERADO PARA COLETA' THEN
    RAISE EXCEPTION 'Confirmação permitida apenas para PULMÃO liberado pelo Booking';
  END IF;
  IF upper(btrim(solicitacao.transportadora)) <> upper(btrim(transportadora_vinculada)) THEN
    RAISE EXCEPTION 'Esta solicitação pertence a outra transportadora';
  END IF;
  IF solicitacao.quantidade_confirmada_pulmao IS NOT NULL THEN
    RAISE EXCEPTION 'Quantidade já confirmada; atualize a lista';
  END IF;
  IF p_quantidade_real <> solicitacao.quantidade AND length(motivo)<10 THEN
    RAISE EXCEPTION 'Para quantidade divergente, a justificativa deve ter ao menos 10 caracteres';
  END IF;
  IF length(motivo)>1000 THEN RAISE EXCEPTION 'Justificativa excede 1000 caracteres'; END IF;

  SELECT count(*) INTO usados FROM public.coletas c
  WHERE c.cw_solicitacao_id=p_solicitacao_id;
  IF p_quantidade_real < usados THEN
    RAISE EXCEPTION 'Quantidade real (%) menor que os % contêineres já registrados',p_quantidade_real,usados;
  END IF;

  UPDATE public.cw_solicitacoes SET
    quantidade_solicitada_pulmao=solicitacao.quantidade,
    quantidade_confirmada_pulmao=p_quantidade_real,
    justificativa_quantidade_pulmao=CASE WHEN p_quantidade_real=solicitacao.quantidade THEN NULL ELSE motivo END,
    quantidade_pulmao_confirmada_em=now(),
    quantidade_pulmao_confirmada_por=auth.uid(),
    quantidade=p_quantidade_real
  WHERE id=p_solicitacao_id;
END;
$$;

REVOKE ALL ON FUNCTION public.cw_confirmar_quantidade_pulmao_v22(uuid,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cw_confirmar_quantidade_pulmao_v22(uuid,integer,text) TO authenticated;

-- PULMÃO só poderá começar a ser utilizado depois de confirmar sua quantidade real.
-- Reaproveita a função do gatilho V20, mantendo a trava e os demais controles.
CREATE OR REPLACE FUNCTION public.cw_validar_inicio_coleta_v20()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE ativo integer; limite integer; estado text; tipo text; usados integer; pulmao_confirmado integer;
BEGIN
  IF NEW.finalizado IS DISTINCT FROM false THEN RETURN NEW; END IF;
  IF nullif(upper(trim(coalesce(NEW.container,''))), '') IS NULL OR upper(trim(NEW.container))='N/A' THEN
    RAISE EXCEPTION 'Informe o número do contêiner antes de iniciar o processo';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('CW_CONTAINER_'||upper(trim(NEW.container)),0));
  SELECT count(*) INTO ativo FROM public.coletas c
  WHERE upper(trim(c.container))=upper(trim(NEW.container))
    AND c.finalizado IS DISTINCT FROM true AND c.id IS DISTINCT FROM NEW.id;
  IF ativo>0 THEN
    RAISE EXCEPTION 'Contêiner % já está vinculado a um processo em operação. Só poderá ser reutilizado após a conclusão total.',upper(trim(NEW.container));
  END IF;
  IF NEW.cw_solicitacao_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('CW_SOLICITACAO_'||NEW.cw_solicitacao_id::text,0));
    SELECT s.quantidade,s.status,s.tipo,s.quantidade_confirmada_pulmao
      INTO limite,estado,tipo,pulmao_confirmado FROM public.cw_solicitacoes s
      WHERE s.id=NEW.cw_solicitacao_id;
    IF NOT FOUND OR estado<>'LIBERADO PARA COLETA' THEN
      RAISE EXCEPTION 'Esta solicitação não está liberada pelo Booking';
    END IF;
    IF upper(trim(coalesce(tipo,'')))='PULMÃO' AND pulmao_confirmado IS NULL THEN
      RAISE EXCEPTION 'Confirme a quantidade real de PULMÃO antes de iniciar a coleta';
    END IF;
    SELECT count(*) INTO usados FROM public.coletas c
    WHERE c.cw_solicitacao_id=NEW.cw_solicitacao_id AND c.id IS DISTINCT FROM NEW.id;
    IF usados>=limite THEN RAISE EXCEPTION 'Quantidade de contêineres desta solicitação já foi utilizada'; END IF;
  END IF;
  RETURN NEW;
END;$$;

-- O trigger cw_validar_inicio_coleta_v20 já instalado usa automaticamente
-- a versão atualizada da função acima.
