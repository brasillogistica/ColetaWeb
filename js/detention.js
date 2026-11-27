"use strict";
// Contagem baseada no registro real da coleta, não na previsão do Booking.
const $d=id=>document.getElementById(id);
const safeD=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dinheiroD=n=>n==null?'—':'$ '+Number(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const normalizarD=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
const aliasD={'HAPAG LLOYD':'HAPAG LLOYD','HAPAG LLOYD AG':'HAPAG LLOYD','CMA CGM':'CMA CGM','BR X CARGO':'BR X CARGO'};
const regrasD=new Map((window.DETENTION_REGRAS||[]).map(x=>[normalizarD(x.armador),x]));
let todosD=[],apresentadosD=[],carregandoD=false;

function dataUtcD(valor){
  if(!valor)return null;
  const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor));
  if(!m)return null;
  const ano=+m[1],mes=+m[2],dia=+m[3];
  const d=new Date(Date.UTC(ano,mes-1,dia));
  return d.getUTCFullYear()===ano&&d.getUTCMonth()===mes-1&&d.getUTCDate()===dia?d:null;
}
const diaISOd=()=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const x=Object.fromEntries(p.map(o=>[o.type,o.value]));return `${x.year}-${x.month}-${x.day}`;};
const dataBRd=s=>{const d=dataUtcD(s);return d?`${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`:'—';};
const diasD=(a,b)=>Math.round((b.getTime()-a.getTime())/86400000);
function regraD(armador){const nome=normalizarD(armador);return regrasD.get(nome)||regrasD.get(aliasD[nome])||null;}
function tipoD(c,s){let valor=normalizarD(s?.tipo||c.carga_pulmao);return valor.includes('PULMAO')?'PULMÃO':'CARGA';}

function calcularD(reg,s,hoje){
  const inicio=dataUtcD(reg.data_retirada),terminoReal=dataUtcD(reg.data_finalizado),hojeData=dataUtcD(hoje);
  const regra=regraD(reg.armador||s?.armador);
  const finalizado=reg.finalizado===true||String(reg.finalizado).toLowerCase()==='true';
  const tipo=tipoD(reg,s);
  const armador=String(reg.armador||s?.armador||'').trim();
  const base={...reg,tipo,armador,ft:regra?.ft??null,diaria:regra?.diaria??null,termino:regra?.termino||'—',dias:null,restantes:null,excedentes:null,total:null,estado:'PENDENCIA',detalhe:'',projecao:false};
  if(!inicio){base.detalhe='Sem data de retirada (GATE OUT)';return base;}
  if(!regra){base.detalhe='Armador sem tabela de free time';return base;}
  if(inicio>hojeData){base.detalhe='Retirada com data futura';return base;}
  if(finalizado&&!terminoReal){base.detalhe='Registro finalizado sem data de depósito';return base;}
  if(terminoReal&&terminoReal<inicio){base.detalhe='Data de finalização anterior à retirada';return base;}
  // Para ON BOARD não há campo próprio na tabela coletas. O depósito não prova ON BOARD.
  const fim=finalizado&&regra.termino==='GATE IN'?terminoReal:hojeData;
  base.dias=diasD(inicio,fim);
  base.restantes=Math.max(0,regra.ft-base.dias);
  base.excedentes=Math.max(0,base.dias-regra.ft);
  if(regra.termino==='ON BOARD'){
    base.projecao=true;
    base.estado='PENDENCIA';
    base.detalhe='BR-X: falta data ON BOARD; valor não consolidado';
    return base;
  }
  base.total=Math.round(base.excedentes*regra.diaria*100)/100;
  if(finalizado){base.estado='ENCERRADO';base.detalhe='Encerrado no depósito / GATE IN';}
  else if(base.excedentes>0){base.estado='COBRANDO';base.detalhe='Free time excedido';}
  else if(base.restantes<=5){base.estado='ALERTA';base.detalhe='Vence em até 5 dias';}
  else{base.estado='LIVRE';base.detalhe='Dentro do free time';}
  return base;
}

async function lerTodasPaginasD(tabela,campos,opcoes={}){
  const resultado=[];const tamanho=700;let inicio=0;
  while(true){
    let consulta=clienteSupabase.from(tabela).select(campos).order('id',{ascending:true}).range(inicio,inicio+tamanho-1);
    if(opcoes.ids)consulta=consulta.in('id',opcoes.ids);
    const {data,error}=await consulta;
    if(error)throw new Error(`Erro ao consultar ${tabela}: ${error.message}`);
    resultado.push(...(data||[]));
    if(!data||data.length<tamanho)break;
    inicio+=tamanho;
  }
  return resultado;
}

async function carregarD(){
  if(carregandoD)return;
  carregandoD=true;
  $d('atualizar').disabled=true;
  $d('mensagem').hidden=true;
  try{
    if(!clienteSupabase)throw Error('Conexão Supabase indisponível.');
    const {data:{session},error:authErro}=await clienteSupabase.auth.getSession();
    if(authErro)throw authErro;
    if(!session){location.replace('login.html');return;}
    const autorizado=await checarPermissaoMaster();
    if(!autorizado){location.replace('index.html');return;}
    const coletas=await lerTodasPaginasD('coletas','id,container,ordem,armador,transportadora,carga_pulmao,cw_solicitacao_id,data_retirada,data_finalizado,finalizado,created_at');
    const ids=[...new Set(coletas.map(x=>x.cw_solicitacao_id).filter(Boolean))];
    const solicitacoes=[];
    for(let i=0;i<ids.length;i+=150){
      const req=await clienteSupabase.from('cw_solicitacoes').select('id,tipo,ordem,armador').in('id',ids.slice(i,i+150));
      if(req.error)throw new Error('Erro ao consultar tipos de Booking: '+req.error.message);
      solicitacoes.push(...(req.data||[]));
    }
    const mapa=new Map(solicitacoes.map(x=>[String(x.id),x]));
    const hoje=diaISOd();
    todosD=coletas.filter(x=>String(x.container||'').trim()&&normalizarD(x.container)!=='N A').map(x=>calcularD(x,mapa.get(String(x.cw_solicitacao_id)),hoje));
    const armadores=[...new Set(todosD.map(x=>x.armador).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    const anterior=$d('armador').value;
    $d('armador').replaceChildren(new Option('TODOS',''),...armadores.map(x=>new Option(x,x)));
    if(armadores.includes(anterior))$d('armador').value=anterior;
    $d('atualizado').textContent='Atualizado em '+new Date().toLocaleTimeString('pt-BR');
    desenharD();
  }catch(e){$d('mensagem').textContent=e.message;$d('mensagem').hidden=false;console.error(e);}
  finally{carregandoD=false;$d('atualizar').disabled=false;}
}

function desenharD(){
  const busca=normalizarD($d('busca').value),armador=$d('armador').value,tipo=$d('tipo').value,situacao=$d('situacao').value;
  apresentadosD=todosD.filter(r=>(!busca||normalizarD(`${r.container} ${r.ordem} ${r.armador}`).includes(busca))&&(!armador||r.armador===armador)&&(!tipo||r.tipo===tipo)&&(!situacao||r.estado===situacao));
  $d('contador').textContent=`${apresentadosD.length} de ${todosD.length} contêiner(es)`;
  const count=e=>apresentadosD.filter(r=>r.estado===e).length;
  $d('kpi-total').textContent=apresentadosD.filter(r=>r.dias!==null).length;
  $d('kpi-livres').textContent=count('LIVRE')+count('ALERTA');
  $d('kpi-alertas').textContent=count('ALERTA');
  $d('kpi-cobrando').textContent=count('COBRANDO');
  // Soma apenas detention efetivamente gerada por dias excedidos.
  // Ignora free time, projecoes (ON BOARD) e registros com dados pendentes.
  const total=apresentadosD.reduce((s,r)=>
    s+((r.estado==='COBRANDO'||r.estado==='ENCERRADO')&&r.excedentes>0&&Number.isFinite(r.total)?r.total:0),0);
  $d('kpi-valor').textContent=dinheiroD(total);
  $d('linhas').innerHTML=apresentadosD.map(r=>{
    const estado={LIVRE:'NO PRAZO',ALERTA:'PRÓXIMO FT',COBRANDO:'DETENTION',ENCERRADO:'FINALIZADO',PENDENCIA:'CONFERIR'}[r.estado];
    const encerramento=r.termino==='ON BOARD'?'ON BOARD: não informado':(r.data_finalizado?dataBRd(r.data_finalizado):'EM ABERTO');
    const valor=r.projecao?'A confirmar':dinheiroD(r.total);
    return `<tr><td class="left">${safeD(r.container)}</td><td>${safeD(r.tipo)}</td><td>${safeD(r.ordem||'—')}</td><td>${safeD(r.armador||'—')}</td><td>${safeD(r.transportadora||'—')}</td><td>${dataBRd(r.data_retirada)}</td><td>${safeD(encerramento)}</td><td class="number">${r.dias??'—'}</td><td class="number">${r.ft??'—'}</td><td class="number">${r.restantes??'—'}</td><td class="number">${r.excedentes??'—'}</td><td class="number">${dinheiroD(r.diaria)}</td><td class="number"><b>${safeD(valor)}</b></td><td title="${safeD(r.detalhe)}"><span class="pill ${r.estado}">${estado}</span></td></tr>`;
  }).join('')||'<tr><td class="empty" colspan="14">Nenhum contêiner encontrado.</td></tr>';
}

async function exportarD(){
  if(!apresentadosD.length){
    $d('mensagem').textContent='Não há contêineres nos filtros selecionados para exportar.';
    $d('mensagem').hidden=false;
    return;
  }
  const cab=['CONTAINER','TIPO','ORDEM','ARMADOR','TRANSPORTADORA','DATA RETIRADA','DATA FINALIZACAO','DIAS DECORRIDOS','FREE TIME','DIAS RESTANTES','DIAS DETENTION','DIARIA ($)','TOTAL ($)','SITUACAO','OBSERVACAO'];
  const linhas=apresentadosD.map(r=>[r.container,r.tipo,r.ordem,r.armador,r.transportadora,r.data_retirada,r.termino==='ON BOARD'?'':r.data_finalizado,r.dias,r.ft,r.restantes,r.excedentes,r.diaria,r.total,r.estado,r.detalhe]);
  const csv='\ufeff'+[cab,...linhas].map(row=>row.map(v=>`"${String(v??'').replace(/^[=+@-]/,'\u0027$&').replace(/"/g,'""')}"`).join(';')).join('\r\n');
  const nome='ColetaWeb_Detention_'+diaISOd()+'.csv';
  const arquivo=new Blob([csv],{type:'text/csv;charset=utf-8'});
  // Em Chrome local/file://, o seletor nativo evita bloqueios no download de blobs.
  if(typeof window.showSaveFilePicker==='function'){
    try{
      const destino=await window.showSaveFilePicker({suggestedName:nome,types:[{description:'Arquivo CSV',accept:{'text/csv':['.csv']}}]});
      const gravacao=await destino.createWritable();
      await gravacao.write(arquivo);
      await gravacao.close();
      return;
    }catch(e){
      if(e.name==='AbortError')return; // Usuário cancelou a janela de salvamento.
      console.warn('Salvamento nativo indisponível; tentando download convencional.',e);
    }
  }
  let url;
  try{
    // Data URL evita a restrição de blob:file em páginas abertas diretamente da rede.
    url=location.protocol==='file:'&&csv.length<1000000
      ?'data:text/csv;charset=utf-8,'+encodeURIComponent(csv)
      :URL.createObjectURL(arquivo);
    const link=document.createElement('a');
    link.href=url;link.download=nome;link.style.display='none';
    document.body.appendChild(link);link.click();link.remove();
    if(url.startsWith('blob:'))setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch(e){
    console.error('Falha ao exportar CSV:',e);
    $d('mensagem').textContent='Não foi possível baixar o CSV automaticamente. Verifique se o navegador permite downloads nesta pasta: '+e.message;
    $d('mensagem').hidden=false;
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  $d('atualizar').addEventListener('click',carregarD);
  $d('exportar').addEventListener('click',exportarD);
  $d('limpar').addEventListener('click',()=>{
    for(const id of ['busca','armador','tipo','situacao'])$d(id).value='';
    desenharD();
  });
  for(const id of ['busca','armador','tipo','situacao'])$d(id).addEventListener(id==='busca'?'input':'change',desenharD);
  carregarD();
});
