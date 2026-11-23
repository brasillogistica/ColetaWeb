-- Diagnostico somente leitura. Execute no SQL Editor do projeto correto.
SELECT 'coluna usuarios.idioma' AS item,
       EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'idioma'
       ) AS instalado
UNION ALL
SELECT 'funcao cw_obter_idioma()',
       to_regprocedure('public.cw_obter_idioma()') IS NOT NULL
UNION ALL
SELECT 'funcao cw_definir_idioma(text)',
       to_regprocedure('public.cw_definir_idioma(text)') IS NOT NULL;

-- Todos devem retornar instalado = true.
-- Caso contrario, execute INSTALAR_IDIOMA_SUPABASE.sql no mesmo projeto.
-- Se todos forem true e o aviso permanecer, consulte o codigo do aviso
-- e confira a autenticacao do usuario e a linha dele em public.usuarios.
