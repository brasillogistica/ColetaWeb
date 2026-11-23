COLETAWEB - PACOTE ORGANIZADO E IDIOMAS

ESTRUTURA
- Raiz: 10 paginas HTML (index, login, solicitacao-transporte, booking,
  coleta, processos, gestao, analise-processos, admin, cadastro-transportadora).
- css/: style.css, booking-style.css e site-background.css.
- js/: script.js, idioma.js, i18n-global.js, booking.js,
  solicitacao-transporte.js, unidades.js e navigation-fast.js.
- assets/: fundo-menu.jpg, excel-alerta.png e icone-lapis.png.
- modelos/: modelo_solicitar_container.xlsx.
- sql/: INSTALAR_IDIOMA_SUPABASE.sql e VERIFICAR_IDIOMA_SUPABASE.sql.

PUBLICACAO
1. Faca backup da pasta atual do site e do banco antes de substituir.
2. Publique a ESTRUTURA COMPLETA, preservando as pastas e os nomes.
   Nao substitua somente o index: os caminhos de CSS e JS mudaram.
3. Confirme que as paginas HTML permanecem na raiz do site.
4. Se a migracao de idioma ja foi executada no Supabase, NAO e necessario
   executa-la novamente. Se nao foi, valide a estrutura da tabela usuarios
   e execute sql/INSTALAR_IDIOMA_SUPABASE.sql no SQL Editor.
5. Limpe o cache do navegador (Ctrl+F5); entre e escolha o idioma na Home.
6. Teste em cada perfil (User, Master, Administrador) e cada tela.

FUNDO DE TODAS AS TELAS
- A imagem assets/fundo-menu.jpg agora e compartilhada nas 10 paginas por
  css/site-background.css, inclusive Booking e Solicitar Conteiner.

NAVEGACAO MAIS RAPIDA
- Home: leitura remota do idioma nao bloqueia mais a exibicao do menu.
- Paginas internas: aplica imediatamente idioma do navegador; consulta
  de sincronizacao da conta continua em segundo plano.
- O arquivo js/navigation-fast.js antecipa o carregamento de paginas
  ao apontar/clicar em menus e busca a Home nos submenus.
- A validacao de sessao e de perfil permanece obrigatoria.
- A melhoria reduz esperas evitaveis, mas o tempo final tambem depende
  da hospedagem, da rede e da resposta do Supabase.
- Versao auditada: eliminada espera fixa de 1,2 segundo da coleta;
  contagem de saldo restrita aos pedidos relevantes; perfis reaproveitados
  na primeira leitura de Processos, Gestao e Analise; inicializacao
  antecipada para DOMContentLoaded; reduzidas consultas repetidas.
- Relatorio detalhado em docs/AUDITORIA_CRITICA_DESEMPENHO.md.
- IMPORTANTE: nao existe garantia de resposta instantanea dos dados remotos.
- Gestao: a verificacao inicial usa getSession local (em vez de getUser
  remoto) e continua consultando o perfil no Supabase antes de ler coletas.
- Gestao: filtros continuam animados, com uma atualizacao por grafico (5 no
  total), e a primeira carga exibe os valores sem animacao de espera.
- Diagnostico da demora: abra gestao.html?diagnostico=1 para mostrar, em um
  pequeno painel, tempos de carregamento inicial, autenticacao/perfil,
  consulta de coletas e preparacao de graficos/tabela. Nada muda no uso normal.
- Gestao V7: diagnostico do usuario apontou 1509 ms ate DOM pronto, 110 ms
  no perfil, 129 ms de Supabase e 96 ms de preparacao. A maior espera
  observada ocorreu ANTES das consultas e graficos.
- Gestao V7: a Home tenta preparar em cache Chart.js, plugin e a pagina de
  Gestao em horario ocioso (se o navegador permitir prefetch). Na abertura,
  os graficos recebem os dados antes da criacao das linhas da tabela.
- Gestao V7: tabela construida fora da tela em lotes de ate 5 ms/frame, com
  cancelamento das atualizacoes ultrapassadas. As opcoes dos filtros sao
  atualizadas apos o movimento dos graficos e reaproveitadas quando iguais.
- Gestao V7: animacao dos graficos em 280 ms, removida transicao do corpo
  inteiro (evita concorrencia de pintura); busca digitada com pausa 220 ms.
- Gestao V8: segunda medicao em producao indicou 1515 ms ate DOM pronto,
  sendo 254 ms ate receber o HTML e 1261 ms aguardando CSS/scripts; depois,
  perfil 65 ms, Supabase 165 ms, preparacao 31 ms, total 280 ms.
- Gestao V8: a Home agora solicita e executa Chart.js + plugin em segundo
  plano quando o navegador estiver ocioso, aquecendo o cache HTTP real.
  Isso substitui o prefetch especulativo dos scripts que podia ser ignorado.
  O desempenho do PRIMEIRO acesso depende do tempo em que a Home ficou
  aberta, do cache, da rede e das politicas do navegador/hospedagem.
- Diagnostico V8: se Resource Timing permitir, exibe tambem a duracao de
  cada biblioteca externa (Supabase, Chart.js e plugin de rotulos).
- Gestao V9: Chart.js e plugin sao carregados em paralelo ao HTML sem
  bloquear DOMContentLoaded. A autenticacao e a consulta ao Supabase agora
  podem ocorrer ENQUANTO as bibliotecas terminam de baixar, em vez de
  esperar a rede para iniciar a consulta.
- Gestao V9: se os dados chegam primeiro, ficam em memoria e sao desenhados
  uma unica vez assim que os graficos estao prontos; se Chart.js chega
  primeiro, o carregamento segue normalmente. Nenhum registro e perdido.
- Gestao V9: diagnostico mostra a espera das bibliotecas apos a verificacao
  do perfil; o tempo de DOMContentLoaded sozinho deixa de representar a
  conclusao dos graficos. Compare o tempo TOTAL desde o inicio da navegacao.
- Gestao V10: o DevTools mostrou Chart.js em 9 ms, plugin em 8 ms e Supabase
  em 13 ms (cache); os scripts locais levavam mais de 1 segundo cada.
  gestao.html agora inclui CSS global, CSS do fundo, tradutor e navegacao
  diretamente, evitando quatro requisicoes extras no caminho de abertura.
- Gestao V10: apenas a criacao do cliente Supabase e integrada a partir de
  js/script.js; suas funcoes gerais continuam nas outras paginas.
- IMPORTANTE: as fontes permanecem organizadas em js/ e css/. Se alterar
  algum desses arquivos, rode "node scripts/build-gestao.js" dentro da pasta
  COLETAWEB_FINAL para atualizar os trechos integrados em gestao.html.
- Gestao V10: a consulta periodica usa getSession local, consultando o
  perfil no Supabase a cada leitura; evita getUser remoto a cada 20s, sem
  alterar politicas RLS nem deixar de consultar o perfil.
- A imagem assets/fundo-menu.jpg continua como arquivo separado e deve
  permanecer na pasta assets/ para aparecer no fundo do painel.
- Gestao: XLSX carrega apenas na exportacao, sem bloquear a abertura.
- Diagnostico V7: incluidas as parcelas "HTML recebido" e "Apos HTML",
  permitindo medir se a demora inicial esta em arquivos e bibliotecas.
- Bibliotecas essenciais de Gestao usam defer para nao impedir o HTML de
  ser analisado; a inicializacao ainda respeita DOMContentLoaded.
- Voltar da Gestao: quando ela foi acessada pela Home nesta mesma aba,
  tenta restaurar o documento anterior pelo historico/bfcache, inclusive
  quando document.referrer vem vazio no acesso por arquivos locais.
- Se a Home tiver sido aberta diretamente ou a aba tiver sido recarregada,
  o retorno usa o caminho normal. A velocidade depende do navegador/cache.

AVISO AO ALTERAR O IDIOMA
- O aviso indicava que a preferencia foi salva apenas no navegador, porque
  a funcao de gravacao da conta no Supabase devolveu erro.
- Agora o aviso aparece junto ao seletor, sem janela bloqueante, e informa
  o codigo do erro quando disponivel.
- No SQL Editor do projeto utilizado pelo site, execute primeiro
  sql/VERIFICAR_IDIOMA_SUPABASE.sql (somente leitura).
- Se alguma verificacao for false, examine a tabela public.usuarios e
  execute sql/INSTALAR_IDIOMA_SUPABASE.sql no projeto correto.
- Se as tres verificacoes forem true, confira login, permissoes e a existencia
  do perfil do usuario em public.usuarios. Nao execute SQL de limpeza.
- Sem sincronizacao no banco, a escolha continua neste navegador, mas a
  persistencia entre dispositivos nao esta garantida.

IDIOMAS
- Home: seletor Portugues (Brasil), English e Espanol.
- Demais paginas: leem a preferencia individual do Supabase, com fallback
  para cache local quando a consulta falha.
- Rótulos estaticos e diversas mensagens dinamicas mapeadas em
  js/i18n-global.js; o script acompanha novas linhas e avisos inseridos
  no DOM e nao modifica dados gravados no Supabase.
- DADOS NAO TRADUZIDOS: identificadores, ordens, placa, nomes de empresas,
  textos escritos pelo usuario, e valores comerciais do banco.
- AVISO: a cobertura de mensagens construidas dinamicamente nao pode ser
  certificada como 100% sem testes funcionais no sistema conectado.
  Revise fluxos de erro, upload, fotos, exportacao, agendamento e historicos.

ARQUIVOS ANTIGOS OMITIDOS
- booking-common.js: nao era carregado por nenhuma pagina desta versao.
- SQL antigos: atualizacoes de versoes e historicos de migracao nao sao
  arquivos de publicacao, nem devem ser executados automaticamente.
- Instrucoes antigas repetidas: substituidas por este documento.
- Versoes antigas com sufixos (n): substituidas pela ultima versao recebida.
- Capturas de tela e arquivos CSV de diagnostico: nao fazem parte do site.

DEPENDENCIAS EXTERNAS
- Supabase JS e, em paginas especificas, Chart.js e XLSX via CDN.
- Requer sessao e banco Supabase existentes. Nenhum dado de producao foi
  alterado durante a preparacao do pacote.

VERIFICACOES LOCAIS
- Sintaxe dos JS externos e caminhos estaticos HTML verificados.
- Banco e comportamento visual autenticado nao foram testados ao vivo.
