/* ColetaWeb: tradução de rótulos de interface, inclusive conteúdo renderizado dinamicamente.
   Não altera valores enviados ao banco, identificadores ou dados digitados pelo usuário. */
(function () {
  'use strict';
  const PAIRS = [
    // Navegação, acesso e controles
    ['SAIR','LOG OUT','SALIR'],['ENTRAR','SIGN IN','INGRESAR'],['SENHA','PASSWORD','CONTRASEÑA'],['E-MAIL','EMAIL','CORREO ELECTRÓNICO'],
    ['VOLTAR','BACK','VOLVER'],['Voltar','Back','Volver'],['Cancelar','Cancel','Cancelar'],['CANCELAR','CANCEL','CANCELAR'],
    ['Confirmar','Confirm','Confirmar'],['CONFIRMAR','CONFIRM','CONFIRMAR'],['OK','OK','ACEPTAR'],['SALVAR','SAVE','GUARDAR'],
    ['Salvar','Save','Guardar'],['ATUALIZAR','REFRESH','ACTUALIZAR'],['Atualizar','Refresh','Actualizar'],
    ['Fechar','Close','Cerrar'],['FECHAR','CLOSE','CERRAR'],['Limpar','Clear','Limpiar'],['LIMPAR','CLEAR','LIMPIAR'],
    ['Filtrar','Filter','Filtrar'],['BUSCAR','SEARCH','BUSCAR'],['Buscar','Search','Buscar'],
    ['Todos','All','Todos'],['TODOS','ALL','TODOS'],['Todas','All','Todas'],['TODAS','ALL','TODAS'],
    ['SELECIONE...','SELECT...','SELECCIONE...'],['Carregando...','Loading...','Cargando...'],
    ['CRIAR','CREATE','CREAR'],['Criar','Create','Crear'],['NOVO REGISTRO','NEW RECORD','NUEVO REGISTRO'],
    ['Anterior','Previous','Anterior'],['Próxima','Next','Siguiente'],['Página 1','Page 1','Página 1'],
    ['Desenvolvido por Leandro Brasil • 2026','Developed by Leandro Brasil • 2026','Desarrollado por Leandro Brasil • 2026'],
    // Menus
    ['SOLICITAR CONTÊINER','REQUEST CONTAINER','SOLICITAR CONTENEDOR'],
    ['REGISTRAR COLETA','REGISTER PICKUP','REGISTRAR RECOGIDA'],
    ['PROCESSOS - CONTAINER','CONTAINER PROCESSES','PROCESOS - CONTENEDOR'],
    ['PAINEL DE GESTÃO','MANAGEMENT DASHBOARD','PANEL DE GESTIÓN'],
    ['ANÁLISE PROCESSOS','PROCESS ANALYSIS','ANÁLISIS DE PROCESOS'],
    ['GERENCIAMENTO','ADMINISTRATION','ADMINISTRACIÓN'],
    ['CADASTRAR TRANSPORTADORA','REGISTER CARRIER','REGISTRAR TRANSPORTISTA'],
    ['Sistema ColetaWeb - Logística Internacional','ColetaWeb System - International Logistics','Sistema ColetaWeb - Logística Internacional'],
    ['CALENDÁRIO ANUAL','YEARLY CALENDAR','CALENDARIO ANUAL'],
    // Campos mais recorrentes
    ['ORDEM','ORDER','ORDEN'],['Ordem','Order','Orden'],['TIPO','TYPE','TIPO'],['TIPO DE CARGA','CARGO TYPE','TIPO DE CARGA'],
    ['TIPO DE SOLICITAÇÃO','REQUEST TYPE','TIPO DE SOLICITUD'],['CARGA','CARGO','CARGA'],['Carga','Cargo','Carga'],
    ['PULMÃO','BUFFER STOCK','PULMÓN'],['Pulmão','Buffer stock','Pulmón'],['Carga / Pulmão','Cargo / Buffer stock','Carga / Pulmón'],
    ['Carga/Pulmão','Cargo/Buffer','Carga/Pulmón'],['TRANSPORTADORA','CARRIER','TRANSPORTISTA'],
    ['Transportadora','Carrier','Transportista'],['TRANSPORTADOR','CARRIER','TRANSPORTISTA'],
    ['ARMADOR','SHIPPING LINE','NAVIERA'],['Armador','Shipping line','Naviera'],
    ['ARMADOR SOLICITADO','REQUESTED SHIPPING LINE','NAVIERA SOLICITADA'],
    ['ARMADOR CONFIRMADO','CONFIRMED SHIPPING LINE','NAVIERA CONFIRMADA'],
    ['QUANTIDADE','QUANTITY','CANTIDAD'],['QTD.','QTY.','CANT.'],['QTDE.','QTY.','CANT.'],
    ['QUANTIDADE DE CONTÊINERES','NUMBER OF CONTAINERS','CANTIDAD DE CONTENEDORES'],
    ['QUANTIDADE DE CONTAINERS','NUMBER OF CONTAINERS','CANTIDAD DE CONTENEDORES'],
    ['CONTÊINER','CONTAINER','CONTENEDOR'],['CONTAINER','CONTAINER','CONTENEDOR'],
    ['CONTÊINERES LIBERADOS','RELEASED CONTAINERS','CONTENEDORES LIBERADOS'],
    ['DEPOT DE COLETA','PICKUP DEPOT','DEPÓSITO DE RECOGIDA'],['DEPOT','DEPOT','DEPÓSITO'],
    ['LOCAL CARREGAMENTO','LOADING LOCATION','LUGAR DE CARGA'],['LOCAL DE CARREGAMENTO','LOADING LOCATION','LUGAR DE CARGA'],
    ['ORIGEM','ORIGIN','ORIGEN'],['ORIGEM DO CARREGAMENTO','LOADING ORIGIN','ORIGEN DE CARGA'],
    ['INDÚSTRIA','PLANT','PLANTA'],['ARMAZÉM','WAREHOUSE','ALMACÉN'],
    ['TEMPERATURA','TEMPERATURE','TEMPERATURA'],['REGIÃO','REGION','REGIÓN'],['REGIÃO DE COLETA','PICKUP REGION','REGIÓN DE RECOGIDA'],
    ['DATA COLETA','PICKUP DATE','FECHA DE RECOGIDA'],['DATA DE COLETA','PICKUP DATE','FECHA DE RECOGIDA'],
    ['DATA DA COLETA (PREVISTA)','EXPECTED PICKUP DATE','FECHA PREVISTA DE RECOGIDA'],
    ['PCP - DATA DO CARREGAMENTO','PCP - LOADING DATE','PCP - FECHA DE CARGA'],
    ['DATA DA RETIRADA','PICKUP DATE','FECHA DE RETIRO'],['Data Retirada','Pickup date','Fecha de retiro'],
    ['Retirada','Pickup','Retiro'],['Data Registro','Record date','Fecha de registro'],
    ['DATA REGISTRO','RECORD DATE','FECHA DE REGISTRO'],['Data Finalizado','Completion date','Fecha de finalización'],
    ['STATUS','STATUS','ESTADO'],['Status','Status','Estado'],['AÇÃO','ACTION','ACCIÓN'],['Ações','Actions','Acciones'],
    ['OBSERVAÇÃO','NOTE','OBSERVACIÓN'],['OBSERVAÇÃO DO BOOKING','BOOKING NOTE','OBSERVACIÓN DEL BOOKING'],
    ['Placa','License plate','Matrícula'],['PLACA','LICENSE PLATE','MATRÍCULA'],
    ['Localização','Location','Ubicación'],['Transp.','Carrier','Transp.'],['até','to','hasta'],
    ['Descrição','Description','Descripción'],['Destino','Destination','Destino'],['País','Country','País'],
    ['PERFIL','ROLE','PERFIL'],['Perfil','Role','Perfil'],['TIPO DE HISTÓRICO','HISTORY TYPE','TIPO DE HISTORIAL'],
    // Booking e Pulmão
    ['GESTÃO DE SOLICITAÇÕES','REQUEST MANAGEMENT','GESTIÓN DE SOLICITUDES'],
    ['Filtrar transportadora','Filter carrier','Filtrar transportista'],['Filtrar status','Filter status','Filtrar estado'],
    ['AG. BOOKING','WAITING FOR BOOKING','PEND. BOOKING'],
    ['LIBERADO PARA COLETA','RELEASED FOR PICKUP','LIBERADO PARA RECOGIDA'],
    ['COLETADO','PICKED UP','RECOGIDO'],['AG. CARREGAMENTO','WAITING FOR LOADING','PEND. CARGA'],
    ['LIBERADO','RELEASED','LIBERADO'],['DEPOSITADO','DEPOSITED','DEPOSITADO'],
    ['Buscar ordem / tipo','Search order / type','Buscar orden / tipo'],
    ['VER HISTÓRICO','VIEW HISTORY','VER HISTORIAL'],['HISTÓRICO DE BOOKING E UTILIZAÇÃO DE CONTÊINERES','BOOKING AND CONTAINER USAGE HISTORY','HISTORIAL DE BOOKING Y USO DE CONTENEDORES'],
    ['ATUALIZAR HISTÓRICO','REFRESH HISTORY','ACTUALIZAR HISTORIAL'],
    ['Pesquisar ordem, contêiner, armador ou depot','Search order, container, shipping line or depot','Buscar orden, contenedor, naviera o depósito'],
    ['Tipo de histórico','History type','Tipo de historial'],
    ['CONFIRMAÇÕES DE BOOKING','BOOKING CONFIRMATIONS','CONFIRMACIONES DE BOOKING'],
    ['UTILIZAÇÕES DE CONTÊINERES','CONTAINER USAGE','USO DE CONTENEDORES'],
    ['BAIXAR HISTÓRICO EXCEL','DOWNLOAD HISTORY EXCEL','DESCARGAR HISTORIAL EXCEL'],
    ['ETAPA','STAGE','ETAPA'],['STATUS / ORIGEM','STATUS / ORIGIN','ESTADO / ORIGEN'],
    ['PULMÃO — CONTROLE DE CONTÊINERES','BUFFER STOCK — CONTAINER CONTROL','PULMÓN — CONTROL DE CONTENEDORES'],
    ['Saldo confirmado por transportadora e armador','Confirmed balance by carrier and shipping line','Saldo confirmado por transportista y naviera'],
    ['ATUALIZAR SALDOS','REFRESH BALANCES','ACTUALIZAR SALDOS'],
    ['Confirmados','Confirmed','Confirmados'],['Disponíveis','Available','Disponibles'],
    ['Em operação','In operation','En operación'],['Utilizados / finalizados','Used / completed','Utilizados / finalizados'],
    ['BOOKING CONFIRMADO!','BOOKING CONFIRMED!','¡BOOKING CONFIRMADO!'],
    ['OBSERVAÇÃO DA SOLICITAÇÃO','REQUEST NOTE','OBSERVACIÓN DE LA SOLICITUD'],
    ['Mensagem para a transportadora / justificativa da troca de armador','Message to carrier / reason for changing shipping line','Mensaje al transportista / motivo del cambio de naviera'],
    ['SALVAR OBSERVAÇÃO','SAVE NOTE','GUARDAR OBSERVACIÓN'],
    ['CONFIRMAR ARMADOR','CONFIRM SHIPPING LINE','CONFIRMAR NAVIERA'],
    ['Confira os dados antes de liberar esta solicitação para a transportadora.','Review the information before releasing this request to the carrier.','Revise los datos antes de liberar la solicitud al transportista.'],
    ['OBSERVAÇÃO PARA A TRANSPORTADORA','NOTE TO CARRIER','OBSERVACIÓN PARA EL TRANSPORTISTA'],
    ['O número do contêiner será registrado somente no menu REGISTRAR COLETA.','The container number will only be recorded in REGISTER PICKUP.','El número de contenedor solo se registrará en REGISTRAR RECOGIDA.'],
    ['CONFIRMAR E LIBERAR','CONFIRM AND RELEASE','CONFIRMAR Y LIBERAR'],
    // Solicitação
    ['+ ADICIONAR SOLICITAÇÃO','+ ADD REQUEST','+ AÑADIR SOLICITUD'],
    ['IMPORTAR EXCEL','IMPORT EXCEL','IMPORTAR EXCEL'],['BAIXAR MODELO EXCEL','DOWNLOAD EXCEL TEMPLATE','DESCARGAR PLANTILLA EXCEL'],
    ['— Clique no ícone para ver as instruções de importação.','— Click the icon to see import instructions.','— Haga clic en el icono para ver las instrucciones de importación.'],
    ['Atenção — Importação Excel','Attention — Excel Import','Atención — Importación Excel'],
    ['A planilha deve conter as colunas, nesta sequência:','The spreadsheet must contain these columns in this order:','La hoja debe contener estas columnas en este orden:'],
    ['Para solicitações PULMÃO:','For BUFFER STOCK requests:','Para solicitudes de PULMÓN:'],
    ['deixe as colunas ORDEM, PCP, ORIGEM e LOCAL CARREGAMENTO vazias.','leave ORDER, PCP, ORIGIN and LOADING LOCATION blank.','deje vacías las columnas ORDEN, PCP, ORIGEN y LUGAR DE CARGA.'],
    ['ENTENDI','GOT IT','ENTENDIDO'],['Solicitações para enviar','Requests to submit','Solicitudes para enviar'],
    ['ENVIAR PARA BOOKING','SEND TO BOOKING','ENVIAR A BOOKING'],
    ['ATUALIZAR MINHAS SOLICITAÇÕES','REFRESH MY REQUESTS','ACTUALIZAR MIS SOLICITUDES'],
    ['Minhas solicitações','My requests','Mis solicitudes'],
    // Coleta
    ['NOVO REGISTRO / RETOMAR PROCESSO','NEW RECORD / RESUME PROCESS','NUEVO REGISTRO / REANUDAR PROCESO'],
    ['Nenhum registro aberto.','No open record.','Ningún registro abierto.'],
    ['1) Selecione o tipo de carga.','1) Select the cargo type.','1) Seleccione el tipo de carga.'],
    ['(OBRIGATÓRIA PARA PULMÃO)','(REQUIRED FOR BUFFER STOCK)','(OBLIGATORIA PARA PULMÓN)'],
    ['Contêiner disponível no pulmão: informe a ordem de carregamento antes de iniciar um novo registro.','Buffer container available: enter the loading order before starting a new record.','Contenedor disponible en pulmón: indique la orden de carga antes de iniciar un registro.'],
    ['TIRAR FOTO (RIC) — 1/4','TAKE PHOTO (RIC) — 1/4','TOMAR FOTO (RIC) — 1/4'],
    ['TIRAR FOTO (PAINEL GENSET) — 2/4','TAKE PHOTO (GENSET PANEL) — 2/4','TOMAR FOTO (PANEL GENSET) — 2/4'],
    ['ORDENS LIBERADAS','RELEASED ORDERS','ÓRDENES LIBERADAS'],
    ['Consultando Booking...','Checking Booking...','Consultando Booking...'],
    ['Selecione a ordem confirmada pelo Booking. Informe contêiner e placa para iniciar o processo.','Select the Booking-confirmed order. Enter container and license plate to begin.','Seleccione la orden confirmada por Booking. Informe contenedor y matrícula para comenzar.'],
    ['ORDEM EM OPERAÇÃO','ORDER IN OPERATION','ORDEN EN OPERACIÓN'],
    ['LIMPAR BUSCA','CLEAR SEARCH','LIMPIAR BÚSQUEDA'],
    ['Nenhum processo selecionado.','No process selected.','Ningún proceso seleccionado.'],
    ['0 registros em andamento.','0 records in progress.','0 registros en curso.'],
    ['Registro salvo com sucesso!','Record saved successfully!','¡Registro guardado correctamente!'],
    ['Selecione a data','Select date','Seleccione la fecha'],
    ['Deseja iniciar um novo registro? O processo atual será limpo da tela.','Start a new record? The current process will be cleared from the screen.','¿Desea iniciar un nuevo registro? El proceso actual se quitará de la pantalla.'],
    // Processos, gestão, análise e administração
    ['Processos - Container','Container Processes','Procesos - Contenedor'],
    ['Preparando consulta...','Preparing query...','Preparando consulta...'],
    ['Dias Rest.','Days Left','Días Rest.'],['Vencido?','Overdue?','¿Vencido?'],
    ['Selecione a data do depósito','Select deposit date','Seleccione la fecha de depósito'],
    ['Painel de Gestão – Progresso dos Containers','Management Dashboard – Container Progress','Panel de Gestión – Progreso de Contenedores'],
    ['Ordens por Status','Orders by Status','Órdenes por Estado'],
    ['Free Time Consumido (%)','Free Time Used (%)','Free Time Consumido (%)'],
    ['Depositados em Atraso','Overdue Deposits','Depósitos Atrasados'],
    ['Containers por Transportadora','Containers by Carrier','Contenedores por Transportista'],
    ['Exibe automaticamente somente transportadoras liberadas com movimentação no filtro atual.','Only approved carriers with movement in the current filter are shown.','Solo se muestran transportistas habilitados con movimientos en el filtro actual.'],
    ['Custo Total em Atraso (USD)','Total Overdue Cost (USD)','Costo Total Atrasado (USD)'],
    ['Registros de Containers','Container Records','Registros de Contenedores'],
    ['Tipologia','Type','Tipología'],['FT Total','Total Free Time','Free Time Total'],
    ['FT Restante','Free Time Left','Free Time Restante'],['Dias Venc.','Days Overdue','Días Vencidos'],
    ['Valor Diário','Daily Amount','Importe Diario'],['Valor Total','Total Amount','Importe Total'],
    ['Foto RIC','RIC Photo','Foto RIC'],['Foto AG.','Waiting Photo','Foto Pend.'],
    ['Foto LIB.','Release Photo','Foto Liberación'],['Foto DEP.','Deposit Photo','Foto Depósito'],
    ['Gerenciamento de Usuários','User Management','Gestión de Usuarios'],
    ['Adicionar novo usuário (cadastre antes em Authentication)','Add new user (register in Authentication first)','Añadir usuario (registrar antes en Authentication)'],
    ['Administrador','Administrator','Administrador'],['Usuários cadastrados','Registered users','Usuarios registrados'],
    ['NOVA TRANSPORTADORA','NEW CARRIER','NUEVO TRANSPORTISTA'],['NOME DA TRANSPORTADORA','CARRIER NAME','NOMBRE DEL TRANSPORTISTA'],
    ['Data Finalizado','Completion Date','Fecha Finalizada'],
    ['Tipo de Carga','Cargo Type','Tipo de Carga'],['Regra da Análise','Analysis Rule','Regla del Análisis'],
    ['Selecione a data do carregamento','Select loading date','Seleccione la fecha de carga'],
    ['EXPORTAR EXCEL','EXPORT TO EXCEL','EXPORTAR A EXCEL'],['Exportar Excel','Export to Excel','Exportar a Excel'],
    ['RESFRIADO','CHILLED','REFRIGERADO'],['CONGELADO','FROZEN','CONGELADO'],
    ['CONGELADO COM GENSET','FROZEN WITH GENSET','CONGELADO CON GENSET'],
    ['Resfriado','Chilled','Refrigerado'],['Congelado com GenSet','Frozen with GenSet','Congelado con GenSet'],
    ['Congelado','Frozen','Congelado'],
    // Análise de processos e faturamento
    ['Análise Processos','Process Analysis','Análisis de Procesos'],
    ['Ainda não há dados mensais para esta visão.','No monthly data is available for this view yet.','Todavía no hay datos mensuales para esta vista.'],
    ['Ano','Year','Año'],['Análise acumulada atual • mês da dta_embarque','Current cumulative analysis • shipment date month','Análisis acumulado actual • mes de embarque'],
    ['Análise acumulada atual • mês do Carregamento','Current cumulative analysis • loading month','Análisis acumulado actual • mes de carga'],
    ['Arquivo faturado como referência','Billed file as reference','Archivo facturado como referencia'],
    ['Atualizar histórico','Refresh history','Actualizar historial'],
    ['Auditoria das ordens GEN SET faturadas','Audit of invoiced GENSET orders','Auditoría de órdenes GENSET facturadas'],
    ['Base do gráfico','Chart basis','Base del gráfico'],['Buscar Ordem / Container','Search Order / Container','Buscar Orden / Contenedor'],
    ['Carregamento','Loading','Carga'],['Carregando histórico...','Loading history...','Cargando historial...'],
    ['Cobertura ColetaWeb','ColetaWeb coverage','Cobertura ColetaWeb'],
    ['Como o ColetaWeb realiza o cruzamento das ordens faturadas.','How ColetaWeb matches billed orders.','Cómo ColetaWeb cruza las órdenes facturadas.'],
    ['Comparativo mensal • Arquivo faturado x ColetaWeb','Monthly comparison • Billing file vs. ColetaWeb','Comparación mensual • Archivo facturado vs. ColetaWeb'],
    ['Conferência Transportadora','Carrier Verification','Verificación de Transportista'],
    ['Conferência da transportadora','Carrier verification','Verificación del transportista'],
    ['Conferência do processo','Process verification','Verificación del proceso'],
    ['Conferência transportadora','Carrier verification','Verificación del transportista'],
    ['Container ColetaWeb','ColetaWeb Container','Contenedor ColetaWeb'],
    ['Cruzamento principal pela ORDEM','Main match by ORDER','Cruce principal por ORDEN'],
    ['DIVERGENTE','MISMATCH','DIVERGENTE'],['Divergente','Mismatch','Divergente'],
    ['E-mail','Email','Correo electrónico'],['Etapa ColetaWeb','ColetaWeb Stage','Etapa ColetaWeb'],
    ['Exportar Resultado','Export Results','Exportar Resultado'],
    ['Faturada + em aberto','Billed + open','Facturada + abierta'],
    ['Faturada + finalizada','Billed + completed','Facturada + finalizada'],
    ['Faturada + sem registro','Billed + no record','Facturada + sin registro'],
    ['Faturada no arquivo','Billed in file','Facturada en el archivo'],
    ['Faturadas e finalizadas no ColetaWeb','Billed and completed in ColetaWeb','Facturadas y finalizadas en ColetaWeb'],
    ['Faturadas em aberto no ColetaWeb','Billed and open in ColetaWeb','Facturadas y abiertas en ColetaWeb'],
    ['Faturadas encontradas no ColetaWeb','Billed and found in ColetaWeb','Facturadas encontradas en ColetaWeb'],
    ['Faturadas sem registro no ColetaWeb','Billed without ColetaWeb record','Facturadas sin registro en ColetaWeb'],
    ['Faturado no arquivo','Billed in file','Facturado en el archivo'],
    ['Filtrar histórico','Filter history','Filtrar historial'],
    ['GAP • sem registro','GAP • no record','GAP • sin registro'],
    ['GEN SET ColetaWeb','ColetaWeb GENSET','GENSET ColetaWeb'],
    ['GEN SET faturadas no arquivo','GENSET billed in file','GENSET facturados en el archivo'],
    ['Histórico acumulado • mês da dta_embarque','Cumulative history • shipment month','Historial acumulado • mes de embarque'],
    ['Histórico de análises','Analysis history','Historial de análisis'],
    ['Importar Excel','Import Excel','Importar Excel'],
    ['Importe o arquivo faturado para iniciar a análise.','Import the billed file to start analysis.','Importe el archivo facturado para iniciar el análisis.'],
    ['Nro. Container Arquivo','Container No. in File','N.º Contenedor del Archivo'],
    ['Ordens GEN SET faturadas x ColetaWeb','Billed GENSET orders vs. ColetaWeb','Órdenes GENSET facturadas vs. ColetaWeb'],
    ['Ordens fora do escopo GEN SET / transportadoras liberadas não entram na análise.','Orders outside GENSET scope / approved carriers are excluded from analysis.','Las órdenes fuera del alcance GENSET / transportistas habilitados quedan excluidas.'],
    ['País Destino Final','Final Destination Country','País de Destino Final'],
    ['Processando...','Processing...','Procesando...'],
    ['Registrada no ColetaWeb','Recorded in ColetaWeb','Registrada en ColetaWeb'],
    ['Regra de cruzamento','Matching rule','Regla de cruce'],
    ['SEM REGISTRO','NO RECORD','SIN REGISTRO'],['Sem registro','No record','Sin registro'],
    ['Situação','Situation','Situación'],['Situação da ordem','Order status','Estado de la orden'],
    ['Status ColetaWeb','ColetaWeb Status','Estado ColetaWeb'],
    ['Tipo Carga ColetaWeb','ColetaWeb Cargo Type','Tipo de Carga ColetaWeb'],
    ['Todas liberadas','All approved','Todas habilitadas'],
    ['Transportadora Arquivo','Carrier in File','Transportista del Archivo'],
    ['Transportadora ColetaWeb','ColetaWeb Carrier','Transportista ColetaWeb'],
    ['Transportadora do arquivo','Carrier in file','Transportista del archivo'],
    ['Transportadoras liberadas nesta análise','Approved carriers in this analysis','Transportistas habilitados en este análisis'],
    ['Voltar à análise atual','Return to current analysis','Volver al análisis actual'],
    ['Volume mensal e cobertura','Monthly volume and coverage','Volumen mensual y cobertura'],
    ['Último mês exibido','Last displayed month','Último mes mostrado'],
    ['AG. CARREG.','WAITING LOAD','PEND. CARGA'],['LIBER.','RELEASED','LIBER.'],['DEPOS.','DEPOSITED','DEPOS.'],
    ['0 ordem(ns)','0 order(s)','0 orden(es)'],['1º ORDEM','1st ORDER','1.ª ORDEN'],
    ['Seg','Mon','Lun'],['Ter','Tue','Mar'],['Qua','Wed','Mié'],['Qui','Thu','Jue'],
    ['Sex','Fri','Vie'],['Sáb','Sat','Sáb'],['Dom','Sun','Dom'],
    ['Saldo disponível = quantidade confirmada − registros iniciados. A finalização libera o contêiner físico para outra ordem, mas não devolve o saldo já consumido desta solicitação.','Available balance = confirmed quantity − started records. Completion releases the physical container for another order but does not restore this request’s consumed balance.','Saldo disponible = cantidad confirmada − registros iniciados. La finalización libera el contenedor físico para otra orden, pero no devuelve el saldo consumido de esta solicitud.'],
    ['Confira o ARMADOR, informe o DEPOT e confirme. O número do contêiner será registrado pela transportadora em REGISTRAR COLETA.','Check the SHIPPING LINE, enter the DEPOT and confirm. The carrier enters the container number in REGISTER PICKUP.','Verifique la NAVIERA, indique el DEPÓSITO y confirme. El transportista registrará el contenedor en REGISTRAR RECOGIDA.'],
    ['Cada ORDEM do arquivo é procurada no ColetaWeb somente dentro das transportadoras liberadas. O cruzamento principal continua sendo pela','Each ORDER in the file is searched in ColetaWeb only among approved carriers. The main match remains by','Cada ORDEN del archivo se busca en ColetaWeb solo entre los transportistas habilitados. El cruce principal sigue siendo por'],
    ['Depois de encontrar a ordem, o sistema verifica se o processo está finalizado ou em aberto e apresenta tipo de carga, container, transportadora e demais informações.','After finding the order, the system checks whether the process is completed or open and shows cargo type, container, carrier and other details.','Tras encontrar la orden, el sistema verifica si el proceso está finalizado o abierto y muestra tipo de carga, contenedor, transportista y demás información.'],
    ['O sistema compara a transportadora do arquivo com a transportadora do ColetaWeb e sinaliza','The system compares the carrier in the file with the ColetaWeb carrier and flags','El sistema compara el transportista del archivo con el de ColetaWeb y señala'],
    ['O sistema primeiro localiza a ORDEM. Somente depois confere status, etapa, tipo de carga, container, transportadora e demais dados.','The system first locates the ORDER, then checks status, stage, cargo type, container, carrier and other details.','El sistema primero localiza la ORDEN y después comprueba estado, etapa, tipo de carga, contenedor, transportista y demás datos.'],
    ['contém GEN SET e cuja transportadora está na lista liberada. Cada novo arquivo completa a base já salva, sem apagar os períodos anteriores.','contains GENSET and whose carrier is on the approved list. Each new file adds to the stored data without deleting earlier periods.','contiene GENSET y cuyo transportista figura en la lista habilitada. Cada archivo nuevo completa los datos guardados sin borrar períodos anteriores.'],
    ['Cada importação fica salva no Supabase.','Every import is saved in Supabase.','Cada importación se guarda en Supabase.'],
    ['• depois STATUS e demais informações.','• then STATUS and other details.','• después ESTADO y demás información.'],
    ['1º ORDEM','1st ORDER','1.ª ORDEN'],
    ['Análise Processos | ColetaWeb','Process Analysis | ColetaWeb','Análisis de Procesos | ColetaWeb'],
    ['Cadastro Transportadora | ColetaWeb','Carrier Registration | ColetaWeb','Registro de Transportista | ColetaWeb'],
    ['Painel de Gestão | ColetaWeb','Management Dashboard | ColetaWeb','Panel de Gestión | ColetaWeb'],
    ['Processos - Container | ColetaWeb','Container Processes | ColetaWeb','Procesos - Contenedor | ColetaWeb'],
    ['Solicitar Contêiner | ColetaWeb','Request Container | ColetaWeb','Solicitar Contenedor | ColetaWeb'],
    ['Gerenciamento | ColetaWeb','Administration | ColetaWeb','Administración | ColetaWeb'],
    ['Registro | ColetaWeb','Record | ColetaWeb','Registro | ColetaWeb'],
    ['Login - ColetaWeb','Sign in - ColetaWeb','Ingreso - ColetaWeb']
  ];

  const dictionaries = { en: new Map(), es: new Map() };
  for (const [pt,en,es] of PAIRS) {
    dictionaries.en.set(pt,en); dictionaries.es.set(pt,es);
    dictionaries.en.set(pt.toLocaleUpperCase('pt-BR'), en.toUpperCase());
    dictionaries.es.set(pt.toLocaleUpperCase('pt-BR'), es.toUpperCase());
  }
  let lang = 'pt-BR';
  const cacheKey = email => 'coletaweb:idioma:' + String(email || '').toLowerCase();
  let observer;
  function translateValue(value) {
    if (lang === 'pt-BR' || !value) return value;
    const dict = dictionaries[lang];
    const trimmed = value.trim();
    const fixed = dict.get(trimmed);
    if (fixed) return value.replace(trimmed, fixed);
    const patterns = [
      [/^(\d+) registros em andamento\.$/, lang === 'en' ? '$1 records in progress.' : '$1 registros en curso.'],
      [/^Página (\d+)$/, lang === 'en' ? 'Page $1' : 'Página $1'],
      [/^(\d+) solicitações? para enviar$/i, lang === 'en' ? '$1 requests to submit' : '$1 solicitudes para enviar']
    ];
    for (const [rx,replacement] of patterns) {
      if (rx.test(trimmed)) return value.replace(trimmed, trimmed.replace(rx,replacement));
    }
    return value;
  }
  const IGNORE = 'SCRIPT,STYLE,CODE,PRE,TEXTAREA,SVG,CANVAS,OPTION';
  function visit(root) {
    // Em portugues, nao existe transformacao a fazer. Evita percorrer cada
    // linha recriada nas tabelas durante atualizacoes em tempo real.
    if (lang === 'pt-BR') return;
    if (!root || root.nodeType === 8) return;
    if (root.nodeType === 3) {
      const p = root.parentElement;
      if (!p || p.closest('[translate="no"],[data-no-translate],'+IGNORE)) return;
      const next = translateValue(root.nodeValue);
      if (next !== root.nodeValue) root.nodeValue = next;
      return;
    }
    if (root.nodeType !== 1) return;
    if (root.matches(IGNORE) || root.closest('[translate="no"],[data-no-translate]')) return;
    for (const attr of ['placeholder','title','aria-label']) {
      if (!root.hasAttribute(attr)) continue;
      const original = root.getAttribute(attr);
      const next = translateValue(original);
      if (original !== next) root.setAttribute(attr,next);
    }
    if (root.tagName === 'SELECT') {
      for (const option of root.options) {
        // Garante que a tradução do rótulo não altere o valor usado pelo formulário.
        if (!option.hasAttribute('value')) option.setAttribute('value', option.value);
        const current = option.textContent;
        const next = translateValue(current);
        if (current !== next) option.textContent = next;
      }
    }
    for (const node of root.childNodes) visit(node);
  }
  function setLanguage(next) {
    const resolved = ['pt-BR','en','es'].includes(next) ? next : 'pt-BR';
    if (resolved === lang) return;
    lang = resolved;
    document.documentElement.lang = lang;
    document.title = translateValue(document.title);
    // Quando a preferência mudar em outra aba, restaurar rótulos exige recarregar.
    if (observer) observer.disconnect();
    if (document.body) visit(document.body);
    if (observer) observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']});
  }
  async function init() {
    const client = typeof clienteSupabase !== 'undefined' ? clienteSupabase : null;
    let cached = null;
    if (!cached) { try { cached = localStorage.getItem('coletaweb:ultimo-idioma'); } catch (_) {} }
    setLanguage(cached || 'pt-BR');
    observer = new MutationObserver(mutations => {
      observer.disconnect();
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') visit(mutation.target);
        else if (mutation.type === 'attributes') visit(mutation.target);
        else for (const added of mutation.addedNodes) visit(added);
      }
      observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']});
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']});
    window.addEventListener('storage', event => {
      if (event.key === 'coletaweb:ultimo-idioma' && event.newValue && event.newValue !== lang) location.reload();
    });
    // A traducao e a observacao do DOM ja estao ativas. Consultas de rede
    // nao podem deixar a pagina parecer travada durante a navegacao.
    if (client) void (async () => {
      try {
        const { data: sessionData } = await client.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) return;
        const userCached = localStorage.getItem(cacheKey(user.email));
        if (['pt-BR','en','es'].includes(userCached) && userCached !== lang) setLanguage(userCached);
        const { data, error } = await client.rpc('cw_obter_idioma');
        if (!error && ['pt-BR','en','es'].includes(data)) {
          setLanguage(data);
          try { localStorage.setItem(cacheKey(user.email), data); localStorage.setItem('coletaweb:ultimo-idioma', data); } catch (_) {}
        }
      } catch (error) { console.warn('Idioma remoto indisponível:', error); }
    })();
  }
  window.ColetaGlobalI18n = { setLanguage, get current() { return lang; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
