# ColetaWeb — Auditoria critica de carregamento e navegacao

Data: 18/11/2026. Base analisada: pacote COLETAWEB_FINAL, 10 paginas HTML,
CSS, JavaScript, ativos, arquivos SQL e instrucoes.

## Conclusao

O problema nao e um temporizador unico de 3 segundos. A navegacao troca de
documento HTML, carrega dependencias de CDN e executa leituras de autenticacao,
perfil e dados do Supabase. O tempo depende da rede, cache, banco e volume de
registros. Nenhuma alteracao puramente client-side garante todos os dados
atualizados em tempo zero.

Dois objetivos diferentes:
1. Mostrar a interface assim que o HTML estiver pronto: pode ser quase imediato
   com arquivos estaticos em cache ou restauracao do historico do navegador.
2. Mostrar registros atualizados: exige respostas do Supabase, salvo com cache
   local previamente preenchido e devidamente isolado por usuario.

## Problemas confirmados no codigo recebido

| Prioridade | Area | Evidencia | Consequencia |
|---|---|---|---|
| Alta | Registrar Coleta | `setTimeout(carregarBookingLiberados,1200)` | Espera artificial e corrida com a autenticacao: se ainda nao havia transportadora, a chamada encerrava sem dados. |
| Alta | Registrar Coleta | consulta a todas as linhas com `cw_solicitacao_id` | Volume desnecessario, risco de contagem incompleta pelo limite de linhas da API. |
| Alta | Analise Processos | `buscarUsuarioCompleto` chamava `buscarUsuarioLogado` e depois `checarPermissaoMaster` | Varias validacoes e consultas repetidas para o mesmo usuario. |
| Alta | Processos | `verificarAcesso` e `prepararConsulta` consultavam autenticacao e perfil separadamente | Duas sequencias iguais antes dos dados. |
| Media | Gestao | verificacao de acesso e carregamento inicial refaziam auth/perfil | Duas sequencias de rede na primeira abertura. |
| Media | Booking | polling chamava `auth.getUser()` antes de ler as solicitacoes | Chamada remota de Auth a cada atualizacao. |
| Media | Varios menus | inicializacao via evento `load` | Podia esperar recursos nao essenciais antes de iniciar as consultas. |
| Media | Registrar Coleta | lista de registros com `select('*')` | Campos completos, inclusive desnecessarios ao resumo, trafegavam a cada atualizacao. |
| Media | Gestao | recargas via intervalo e visibilidade sem trava de concorrencia | Consultas simultaneas podiam se sobrepor. |
| Alta | Gestao | `setChartData` fazia `chart.update()` e `renderGraficos` chamava novamente `.update()` para cada grafico | Dez atualizacoes de Chart.js para apenas cinco graficos, com animacoes de 560 ms. |
| Media | Gestao | cada `<tr>` era anexado diretamente ao `<tbody>` durante o loop | Muitos pontos de mutacao de DOM e trabalho extra do tradutor global. |
| Media | i18n | MutationObserver examinava elementos mesmo em portugues | Reprocessamento desnecessario de tabelas dinamicas. |
| Estrutural | Todas | navegacao entre paginas HTML completas | Novo parse, JS, CSS e inicializacao ao trocar de menu. Prefetch e bfcache ajudam, mas nao substituem uma aplicacao de pagina unica. |

## Exame por tela e componente

| Arquivo / area | Carregamento / dependencia | Parecer |
|---|---|---|
| `index.html` | sessao, perfil de `usuarios`, preferencia de idioma e calendario | Idioma remoto nao deve segurar menus; perfil precisa ser confirmado antes de expor botoes restritos. |
| `login.html` | biblioteca Supabase, login e retorno | Operacao depende obrigatoriamente do Auth; manter validacao. |
| `solicitacao-transporte.html` + JS | dados de solicitacoes, modelo Excel e monitoramento do Booking | Realtime + polling podem duplicar atualizacoes; Excel nao e necessario antes do usuario pedir importacao. |
| `booking.html` + `booking.js` | lista de solicitacoes, painel de Pulmao por RPC, historico, polling | Cache do login e trava de consultas ajudam; `limit(1000)` pode omitir registros. |
| `coleta.html` | perfil da transportadora, lista de abertos, saldo de liberados, fotografias e rascunho | Principal ponto de melhoria local: timer fixo, consulta global de coletas e dados demais em uma lista. |
| `processos.html` | perfil, paginacao no Supabase, regra de Free Time, filtros | Paginacao implementada, mas havia verificacao duplicada de perfil. |
| `gestao.html` | biblioteca de graficos, acesso, historico, agrupamentos, atualizacoes periodicas | `select('*')` e revalidacoes frequentes ainda podem gerar trafego alto. |
| `analise-processos.html` | varias bibliotecas, perfil, paginacao do historico, analise e importacao | Historico integral pode levar tempo proporcional ao numero de coletas; havia validacoes redundantes. |
| `admin.html` | perfil e lista de usuarios, depois transportadoras | A lista depende da confirmacao de permissao; inicio adiantado para `DOMContentLoaded`. |
| `cadastro-transportadora.html` | formulario e escrita no banco | Pouco custo inicial; revisar autorizacao de acesso direto e politicas RLS. |
| `js/i18n-global.js` e `js/idioma.js` | aplicacao de traducao, observacao do DOM, RPC remota | Traducao local pode ser imediata; RPC deve ser assincrona e nao bloqueante. |
| `js/navigation-fast.js` | prefetch de documentos e restauracao por historico | Reduz tempo percebido ao navegar, especialmente em ida e volta; suporte depende do navegador. |
| `css/` e `assets/` | tema visual e fundo de 360 KB | Fundo e cacheavel; nao ha ganho em recarregar a imagem quando cabecalhos de cache estao corretos. |
| `sql/` | funcoes de idioma e diagnostico | Migracao de idioma nao acelera as consultas de dados; ajustes de indices requerem analise no banco. |
| `modelos/` e `docs/` | planilha modelo, auditoria e instrucoes | Nao interferem na navegacao ate serem abertos pelo usuario. |

## Otimizacoes aplicadas nesta versao

- Removido o temporizador inicial de 1,2 segundo do menu Registrar Coleta.
- Inicio das consultas independentes de Registrar Coleta em paralelo, apos
  validar a transportadora; restauracao do rascunho local vem antes da rede.
- Contagem de coletas limitada aos IDs das solicitacoes liberadas exibidas,
  em lotes, com paginacao para evitar cortes de 1000 linhas.
- Lista de coletas reduzida aos campos necessarios ao resumo. O detalhe
  completo continua sendo buscado ao retomar um registro.
- Processos: a mesma consulta de autorizacao agora alimenta a consulta de dados.
- Analise Processos: uma autenticacao e uma leitura de perfil; mantida a mesma
  regra de Master e Administrador aprovado.
- Gestao: perfil recem-validado reutilizado somente na primeira consulta;
  atualizacoes subsequentes revalidam acesso; adicionado bloqueio de consulta
  duplicada concorrente.
- Gestao: `getSession()` local na verificacao inicial (sem chamada inicial
  extra a Auth); a consulta ao perfil remoto continua obrigatoria.
- Gestao: retiradas as atualizacoes duplas dos graficos. A pedido do
  operador, restaurada a animacao de 560 ms, agora com uma unica atualizacao
  para cada um dos cinco graficos.
- Gestao: linhas da tabela montadas em DocumentFragment e anexadas em lote.
- Booking: consulta de sessao local substitui getUser em cada atualizacao;
  as operacoes de dados continuam protegidas pelas politicas do banco (RLS).
- Inicializacao de varios menus adiantada de `load` para `DOMContentLoaded`.
- Traducoes ja em cache sao aplicadas antes das chamadas remotas; observer
  ignora processamento de tradutor quando lingua e portugues.
- Preconexao antecipada aos dominios usados por bibliotecas e Supabase.
- Prefetch de menus ao passar o cursor e da Home a partir dos submenus.
- Botao Voltar: quando o menu veio diretamente da Home, o historico do
  navegador permite restauracao rapida da Home (bfcache), se disponivel.
  Acesso direto continua com navegacao convencional.
- Na Gestao, validacao inicial da sessao passou a usar o token ja mantido
  pelo cliente Supabase (`getSession`); o perfil e autorizado pelo banco.
  Isso evita a primeira chamada remota extra ao endpoint Auth.
- O retorno a Home agora guarda um marcador temporario da navegacao na aba,
  para funcionar tambem em navegacoes onde `document.referrer` vem vazio.
- Revisao da Gestao V7 apos diagnostico real: 1509 ms ate DOM pronto;
  110 ms de autenticacao/perfil; 129 ms na consulta Supabase e 96 ms na
  preparacao. A principal espera medida ocorre no carregamento inicial do
  documento e suas dependencias, nao na consulta dos dados.
- Segunda medicao V8: 1515 ms ate DOM pronto, dos quais 254 ms ate receber
  HTML e 1261 ms depois da resposta do HTML. A autenticacao levou 65 ms,
  a consulta de coletas 165 ms, a preparacao 31 ms e o total pos-DOM 280 ms.
- V8: Home mantem prefetch do documento de Gestao, mas prepara Chart.js e
  seu plugin com scripts reais, baixados e executados em segundo plano quando
  o navegador esta ocioso. A intencao e aproveitar cache HTTP regular no
  primeiro acesso; o navegador e a rede ainda podem limitar o ganho.
- Diagnostico mostra duracoes individuais de bibliotecas externas quando
  o CDN expõe Resource Timing. Sem medicao antes/depois em producao, nao ha
  como prometer eliminacao integral dos 1,2 s no primeiro acesso a frio.
- Terceira medicao V9 (antes do novo ajuste): 1302 ms ate DOM pronto; 231 ms
  ate receber o HTML, 1071 ms em CSS/scripts, 95 ms de perfil, 137 ms no
  Supabase, 29 ms em graficos/tabela, 284 ms de processamento pos-DOM.
- V9: o download de Chart.js e do plugin nao bloqueia mais DOMContentLoaded.
  A consulta de coletas inicia depois de validar o perfil, em paralelo ao
  download dos graficos. Quando ambos terminam, os dados sao desenhados uma
  unica vez. A transferencia continua dependendo de CDN/rede; a otimizacao
  reduz uma espera SEQUENCIAL, sem mascarar o tempo real ate ver os dados.
- Diagnostico de Network (V10): CDN das bibliotecas estava em cache
  (Chart.js 9 ms, plugin 8 ms e Supabase JS 13 ms). Os arquivos do proprio
  ColetaWeb estavam mais lentos: CSS e scripts aproximadamente 1,09 s,
  navigation-fast.js 1,35 s. Foram observados 42 requests em uma janela
  com refreshes repetidos, inclusive /auth/v1/user, perfil e coletas.
- Gestao V10: integra CSS base/fundo, tradutor e navegacao no HTML somente
  nesta tela, reduzindo a dependencia de requisicoes locais demoradas.
  O bootstrap minimo do Supabase e extraido do js/script.js; toda a fonte
  original permanece em pastas e pode ser reintegrada com
  `node scripts/build-gestao.js`. O HTML passa a ~128 KB (antes ~73 KB),
  economizando varios round-trips de arquivos pequenos.
- Refresh da Gestao consulta o perfil novamente, mas usa getSession local,
  reduzindo uma chamada Auth por ciclo de 20 segundos. RLS permanece ativa.
- Beneficio em milissegundos requer nova medicao do usuario: tempo no
  DevTools inclui politica de cache, hospedagem e condicoes de rede.
- Animacoes dos filtros agora duram 280 ms com easing suave. A abertura de
  dados e os refreshes usam `chart.update('none')`; filtros usam o modo animado.
- As linhas da tabela nao possuem mais animacao individual, evitando centenas
  de transicoes simultaneas. Os graficos recebem os valores antes da tabela;
  a tabela e montada em fragmentos, em fatias de tempo por frame, e trocada
  integralmente quando pronta. Novos filtros cancelam a montagem anterior.
- A recriacao das listas auxiliares de filtros foi postergada para depois da
  animacao. Opcoes iguais nao sao inseridas novamente no DOM. Foram eliminadas
  varreduras redundantes das colunas container e placa.
- Removido o efeito de transicao que repintava corpo, cards e tabelas a cada
  clique, concorrendo com a pintura dos cinco canvas.
- O script XLSX deixou de ser obrigatorio na abertura da Gestao: carrega
  apenas na exportacao. Supabase, Chart.js e plugin continuam necessarios,
  mas em scripts `defer` que nao bloqueiam a analise do documento.

## Pontos de risco que ainda exigem decisao arquitetural / backend

1. **Limites de 1000 registros:** Booking possui `.limit(1000)`; Gestao e
   Registrar Coleta usam consultas que, sem paginacao completa, podem receber
   so uma parte do historico. Nao retirar limites sem definir filtros,
   paginacao e os indices apropriados. Processos ja tem paginacao por tela;
   Analise Processos busca paginas de 1000 e carrega o historico completo.
2. **`select('*')` em Gestao:** responde com mais colunas do que parte dos
   indicadores precisa. Para otimizar sem quebrar graficos, primeiro mapear
   os campos consumidos e considerar visoes/RPCs agregadas por filtro.
3. **CDN em caminho critico:** bibliotecas Supabase, XLSX e Chart.js sao
   scripts sincronizados em varios `head`. Mover para carregamento diferido
   exige reorganizar a ordem dos scripts e as rotinas de inicializacao,
   para evitar erros por bibliotecas ainda indisponiveis.
4. **Dados atualizados a todo momento:** polling de 12/20/30 segundos e
   assinaturas Realtime coexistem. Consolidar por tabela/evento e limitar
   frequencia de consultas reduziria trafego. Nao suprimir polling antes de
   testar se o Realtime esta habilitado em producao.
5. **Indice e RLS:** conferir planos `EXPLAIN (ANALYZE, BUFFERS)` das queries
   de `coletas`, `cw_solicitacoes` e `usuarios`. Indices candidatos:
   `coletas(transportadora, created_at DESC)`,
   `coletas(cw_solicitacao_id)`,
   `cw_solicitacoes(transportadora, status, created_at DESC)` e
   `usuarios(lower(email))`. A existencia, cardinalidade e custo dos indices
   devem ser validados antes de qualquer DDL em producao.
6. **Protecao de rotas:** esconder botoes na Home nao protege endpoints.
   Cada tela precisa validar o perfil e as politicas RLS no Supabase precisam
   restringir leituras/escritas. Em particular, revisar o cadastro de
   transportadora aberto via URL direta; hoje a pagina nao verifica perfil
   antes de exibir o formulario.
7. **Experiencia realmente imediata:** para navegação consistentemente sem
   recarga, a evolucao adequada e um shell de pagina unica (SPA), com rotas,
   cliente Supabase compartilhado, cache de consultas por usuario/transportadora,
   invalidacao por Realtime e estados de carregamento. Essa migracao requer
   testes de regressao de formularios, fotos, permissoes e exportacoes.

## Como medir os 3 segundos no navegador de producao

1. Chrome/Edge: `F12` > Network. Marque `Preserve log`; teste com cache e sem cache.
2. Clique em Home > Booking > Voltar. Observe os tempos de `index.html`,
   `booking.html`, bibliotecas CDN e chamadas `rest/v1` / `auth/v1`.
3. Em Performance, grave a navegacao e identifique `DOMContentLoaded`,
   `Load`, eventos de rede e tarefas JS longas.
4. Repita nas telas Coleta, Processos, Gestao e Analise Processos com dados reais.
5. Registre: `tempo ate o cabecalho`, `tempo ate os controles`,
   `tempo ate a primeira linha` e `tempo ate atualizar todos os dados`.

### Medidor incorporado no Painel de Gestao

Abra `gestao.html?diagnostico=1` para exibir uma caixa no canto da pagina,
somente neste modo, com tempos de:
- HTML/CSS/JS ate `DOMContentLoaded` (inclui possivel espera de CDN);
- parcela ate a resposta final do HTML e parcela posterior (scripts/CSS);
- validacao de sessao e perfil;
- consulta de coletas no Supabase;
- preparacao dos graficos e tabela;
- total a partir de `DOMContentLoaded`.

Esses valores permitem diferenciar espera de rede de processamento local.
O tempo de animacao dos graficos ocorre apos o inicio das atualizacoes visuais.

## Validacao realizada

- Sintaxe dos JS externos e scripts inline checada localmente.
- Existencia de caminhos relativos locais conferida.
- Nao houve acesso autenticado ao banco de producao nem teste de desempenho
  de rede real. Portanto, nao se atribui economia em segundos sem medicao.
- Nao foi executado nenhum SQL de alteracao, exclusao ou criacao de indices.
