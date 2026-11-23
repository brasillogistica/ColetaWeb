-- ColetaWeb: persistencia do idioma por usuario autenticado.
-- Executar UMA VEZ no SQL Editor do Supabase antes de publicar os arquivos.
-- Nao remove nem altera registros existentes; adiciona apenas a coluna idioma.

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS idioma text DEFAULT 'pt-BR';

-- Obtem apenas o idioma do proprio usuario. A funcao nao revela outros perfis.
CREATE OR REPLACE FUNCTION public.cw_obter_idioma()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_email text;
DECLARE v_idioma text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;
  v_email := NULLIF(auth.jwt() ->> 'email', '');
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Email nao disponivel na sessao';
  END IF;

  SELECT idioma INTO v_idioma
  FROM public.usuarios
  WHERE lower(email) = lower(v_email)
  LIMIT 1;

  RETURN CASE WHEN v_idioma IN ('pt-BR','en','es') THEN v_idioma ELSE 'pt-BR' END;
END;
$$;

-- Salva somente a preferencia do usuario logado; valida a lista de idiomas.
CREATE OR REPLACE FUNCTION public.cw_definir_idioma(p_idioma text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;
  IF p_idioma IS NULL OR p_idioma NOT IN ('pt-BR','en','es') THEN
    RAISE EXCEPTION 'Idioma invalido';
  END IF;
  v_email := NULLIF(auth.jwt() ->> 'email', '');
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Email nao disponivel na sessao';
  END IF;

  UPDATE public.usuarios
  SET idioma = p_idioma
  WHERE lower(email) = lower(v_email);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil de usuario nao encontrado';
  END IF;
END;
$$;

-- Nenhuma destas funcoes pode ser chamada por usuarios anonimos.
REVOKE ALL ON FUNCTION public.cw_obter_idioma() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cw_definir_idioma(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cw_obter_idioma() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cw_definir_idioma(text) TO authenticated;

-- Conferencia (somente leitura):
SELECT idioma, count(*) AS usuarios
FROM public.usuarios
GROUP BY idioma
ORDER BY idioma;
