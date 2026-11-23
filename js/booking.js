"use strict";
const $=id=>document.getElementById(id);
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dt=v=>v?String(v).slice(0,10).split('-').reverse().join('/'):'—';
const stamp=v=>v?new Date(v).toLocaleString('pt-BR'):'—';
const ARMADORES=['MSC','MAERSK','CMA CGM','HAPAG-LLOYD','HAPAG LLOYD','ONE','COSCO','EVERGREEN','PIL','HMM','ZIM','YANG MING','ALPHA SHIPPING','INTERTRANS','BR-X CARGO'];
let registros=[],historico=[],pending=null,loadingHistory=false,obsId=null,obsFoco=null;
let avisoTimer=null;
// Atualização automática: Supabase Realtime + sincronização periódica de segurança.
let bookingRealtime=null, bookingRefreshTimer=null, bookingPolling=null;
let bookingCarregando=false, bookingRecarregarDepois=false;
let bookingHistoricoPendente=false;
// Alterações ainda não confirmadas ficam na memória, inclusive após salvar observação,
// aplicar filtros ou receber atualização automática do Supabase.
const edicoesBookingPendentes=new Map();
function memorizarEdicaoBooking(id){
 const r=registros.find(x=>x.id===id);if(!r||r.status!=='AG. BOOKING')return;
 const depot=$('dep-'+id),armador=$('arm-'+id);
 if(!depot||!armador)return;
 const valores={depot:depot.value,armador:armador.value};
 if(valores.depot===(r.depot_coleta||'')&&valores.armador===(r.armador||''))edicoesBookingPendentes.delete(id);
 else edicoesBookingPendentes.set(id,valores);
}
function solicitarAtualizacaoBooking(delay=300){
 clearTimeout(bookingRefreshTimer);
 bookingRefreshTimer=setTimeout(()=>{if(!document.hidden)carregar({automatico:true});},delay);
}
function iniciarAtualizacaoAutomatica(){
 if(bookingRealtime||typeof clienteSupabase==='undefined')return;
 try{
  bookingRealtime=clienteSupabase.channel('coletaweb-booking-live-'+Math.random().toString(36).slice(2))
   .on('postgres_changes',{event:'*',schema:'public',table:'cw_solicitacoes'},payload=>{
     if(!$('painel-pulmao').hidden)carregarPulmao(true);
     if(payload.eventType==='INSERT')solicitarAtualizacaoBooking(250);
     else solicitarAtualizacaoBooking(800);
   })
   .subscribe((status)=>{
     if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')console.warn('Realtime indisponível: sincronização periódica continuará ativa.');
   });
 }catch(e){console.warn('Não foi possível iniciar Realtime:',e);}
 bookingPolling=setInterval(()=>{if(!document.hidden)carregar({automatico:true});},20000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)solicitarAtualizacaoBooking(150);});
 window.addEventListener('pageshow',()=>solicitarAtualizacaoBooking(300));
 window.addEventListener('beforeunload',()=>{clearInterval(bookingPolling);clearTimeout(bookingRefreshTimer);if(bookingRealtime)clienteSupabase.removeChannel(bookingRealtime);});
}

function aviso(t,erro=false){const m=$('msg');clearTimeout(avisoTimer);m.hidden=false;m.textContent=t;m.className='notice '+(erro?'error':'success');if(!erro)avisoTimer=setTimeout(()=>{m.hidden=true;m.textContent='';},3500);}
let toastTimer=null;
function sucessoBooking(){const el=$('booking-toast');if(!el)return;clearTimeout(toastTimer);el.hidden=false;el.classList.remove('toast-visible');void el.offsetWidth;el.classList.add('toast-visible');toastTimer=setTimeout(()=>{el.hidden=true;el.classList.remove('toast-visible');},2600);}
function armadorMudou(sel,original){sel.classList.toggle('armador-alterado',sel.value!==original);sel.classList.toggle('armador-original',sel.value===original);}

async function carregar({automatico=false}={}){
 if(bookingCarregando){bookingRecarregarDepois=true;return;}
 bookingCarregando=true;
 try{
  if(typeof clienteSupabase==='undefined')throw Error('Conexão do Supabase não encontrada (script.js).');
  // getUser consulta o Auth remoto a cada atualizacao (inclusive polling).
  // getSession reaproveita a sessao local; as consultas continuam sujeitas a RLS.
  const {data:{session},error:authError}=await clienteSupabase.auth.getSession();if(authError)throw authError;
  const user=session?.user;
  if(!user){location.href='login.html';return;}
  const {data,error}=await clienteSupabase.from('cw_solicitacoes').select('id,transportadora,tipo,ordem,pcp,planta,temperatura,quantidade,data_coleta,regiao,depot_coleta,armador,status,created_at,armador_confirmado_em,observacao_booking').order('created_at',{ascending:false}).limit(1000);
  if(error)throw error;
  const anteriores=registros;
  const novos=data||[];
  // Não destruir um texto que o operador ainda está digitando no Booking.
  const campoAtivo=document.activeElement;
  const editando=automatico&&campoAtivo&&(['INPUT','SELECT','TEXTAREA'].includes(campoAtivo.tagName))&&!!campoAtivo.closest('#tabela');
  registros=novos;
  const sel=$('filtro'),old=sel.value;
  sel.replaceChildren(new Option('TODAS',''));
  [...new Set(registros.map(r=>r.transportadora).filter(Boolean))].sort().forEach(t=>sel.add(new Option(t,t)));
  sel.value=old;
  if(!editando)desenhar();
  else{
   // Solicitações novas ainda aparecem em tempo real, sem perder os campos em edição.
   const antigosIds=new Set(anteriores.map(r=>r.id));
   const novosItens=novos.filter(r=>!antigosIds.has(r.id));
   if(novosItens.length){
    const tbody=$('tabela'), antes=tbody.innerHTML;
    // Mantém a edição atual; assim que o operador sair do campo, aplica a atualização.
    campoAtivo.addEventListener('blur',()=>solicitarAtualizacaoBooking(100),{once:true});
    if(!antes.includes('Nenhuma solicitação encontrada.')){
      const idAtual=campoAtivo.id,valorAtual=campoAtivo.value;
      desenhar();const campoNovo=$(idAtual);if(campoNovo){campoNovo.value=valorAtual;campoNovo.focus();}
    }else desenhar();
   }
  }
  if(!automatico||!$('painel-historico').hidden)await carregarHistorico();
  else bookingHistoricoPendente=true;
  iniciarAtualizacaoAutomatica();
 }catch(e){if(!automatico)aviso('Erro ao carregar: '+e.message,true);else console.warn('Sincronização automática:',e.message);}
 finally{bookingCarregando=false;if(bookingRecarregarDepois){bookingRecarregarDepois=false;solicitarAtualizacaoBooking(500);}}
}
function armOptions(current,selecionado=current){
 const c=(current||'').trim(),valor=(selecionado||'').trim();
 const a=[c,valor,...ARMADORES,...registros.map(r=>r.armador)].filter(Boolean);
 return [...new Set(a.map(x=>x.trim()))].map(x=>`<option value="${safe(x)}" ${x===valor?'selected':''}>${safe(x)}</option>`).join('');
}
function desenhar(){
 const f=$('filtro').value,s=$('status').value,q=$('busca').value.trim().toUpperCase();
 const lista=registros.filter(r=>(!f||r.transportadora===f)&&(!s||r.status===s)&&(!q||`${r.ordem||''} ${r.tipo||''}`.toUpperCase().includes(q)));
 $('tabela').innerHTML=lista.map(r=>{
  const pend=r.status==='AG. BOOKING';
  const edit=pend?edicoesBookingPendentes.get(r.id):null;
  const depot=edit?edit.depot:(r.depot_coleta||'');
  const armador=edit?edit.armador:(r.armador||'');
  const classeArmador=armador!==(r.armador||'')?'armador-alterado':'armador-original';
  return `<tr><td>${safe(r.transportadora)}</td><td>${safe(r.tipo||'CARGA')}</td><td>${safe(r.ordem||'—')}</td><td>${dt(r.pcp)}</td><td>${safe(r.planta||'—')}</td><td>${safe(r.temperatura)}</td><td>${safe(r.quantidade)}</td><td>${dt(r.data_coleta)}</td><td>${safe(r.regiao)}</td><td>${pend?`<input id="dep-${r.id}" aria-label="Depot de coleta" placeholder="DEPOT" value="${safe(depot)}" oninput="memorizarEdicaoBooking('${r.id}')">`:safe(r.depot_coleta||'—')}</td><td>${pend?`<select class="armador-edit ${classeArmador}" id="arm-${r.id}" aria-label="Armador a confirmar" data-original="${safe(r.armador||'')}" onchange="armadorMudou(this,this.dataset.original);memorizarEdicaoBooking('${r.id}')">${armOptions(r.armador,armador)}</select>`:`<span class="armador-confirmado">${safe(r.armador)}</span>`}</td><td>${safe(r.status)}</td><td class="obs-cell"><button class="obs-pencil ${r.observacao_booking?.trim()?'obs-pencil-filled':'obs-pencil-empty'}" title="${r.observacao_booking?.trim()?'Observação registrada — clique para visualizar ou editar':'Sem observação — clique para adicionar'}" aria-label="${r.observacao_booking?.trim()?'Ver ou editar observação':'Adicionar observação'} da ordem ${safe(r.ordem||'PULMÃO')}" onclick="abrirObservacao('${r.id}')"><img src="assets/icone-lapis.png" alt=""></button></td><td>${pend?`<button onclick="confirmar('${r.id}')">CONFIRMAR</button>`:'—'}</td></tr>`;
 }).join('')||'<tr><td colspan="14">Nenhuma solicitação encontrada.</td></tr>';
}
function confirmar(id){const r=registros.find(x=>x.id===id);if(!r)return;const depot=$('dep-'+id).value.trim().toUpperCase(),armador=$('arm-'+id).value.trim();if(!depot)return aviso('Informe o depot de coleta antes de confirmar.',true);if(!armador)return aviso('Selecione o armador correto.',true);pending={id,armador,depot};$('resumo-confirmacao').innerHTML=`<b>Ordem:</b> ${safe(r.ordem||'PULMÃO')}<br><b>Transportadora:</b> ${safe(r.transportadora)}<br><b>Armador solicitado:</b> ${safe(r.armador)}<br><b>Armador confirmado:</b> <b>${safe(armador)}</b>${armador!==r.armador?' <span class="changed">(ALTERADO)</span>':''}<br><b>Depot:</b> ${safe(depot)}<br><b>Quantidade:</b> ${safe(r.quantidade)}`;
 $('confirmacao-observacao').textContent=r.observacao_booking?.trim()||'Nenhuma observação registrada.';
 $('confirmacao-observacao-wrap').classList.toggle('sem-observacao',!r.observacao_booking?.trim());$('modal-confirmacao').hidden=false;$('modal-aprovar').focus();}
function fecharModal(){if($('modal-aprovar').disabled)return;$('modal-confirmacao').hidden=true;pending=null;}
function abrirObservacao(id){
 const r=registros.find(x=>x.id===id);if(!r)return;
 obsId=id;obsFoco=document.activeElement;
 $('obs-resumo').textContent=(r.ordem||'PULMÃO')+' • '+r.transportadora+' • Armador: '+(r.armador||'—');
 $('obs-texto').value=r.observacao_booking||'';
 $('obs-caracteres').textContent=$('obs-texto').value.length+' / 2000';
 $('modal-observacao').hidden=false;$('obs-texto').focus();
}
function fecharObservacao(){if($('obs-salvar').disabled)return;$('modal-observacao').hidden=true;obsId=null;if(obsFoco&&obsFoco.isConnected)obsFoco.focus();}
async function salvarObservacao(){if(!obsId)return;
 const id=obsId, msg=$('obs-texto').value.trim(),btn=$('obs-salvar');
 if(msg.length>2000)return aviso('Limite de 2000 caracteres.',true);
 btn.disabled=true;btn.textContent='SALVANDO...';
 try{
  const {error}=await clienteSupabase.rpc('cw_salvar_observacao_booking',{p_solicitacao_id:id,p_observacao:msg});
  if(error)throw error;
  const r=registros.find(x=>x.id===id);if(r)r.observacao_booking=msg;
  $('modal-observacao').hidden=true;obsId=null;desenhar();
 }catch(e){aviso('Não foi possível salvar a observação: '+e.message,true);}
 finally{btn.disabled=false;btn.textContent='SALVAR OBSERVAÇÃO';}
}
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('modal-observacao').hidden){e.preventDefault();fecharObservacao();}});
async function executarConfirmacao(){if(!pending)return;const {id,armador,depot}=pending;const btn=$('modal-aprovar');btn.disabled=true;btn.textContent='CONFIRMANDO...';try{const {error}=await clienteSupabase.rpc('cw_aprovar_armador_booking',{p_solicitacao_id:id,p_armador_confirmado:armador,p_depot:depot});if(error)throw error;edicoesBookingPendentes.delete(id);$('modal-confirmacao').hidden=true;pending=null;$('msg').hidden=true;await carregar();sucessoBooking();}catch(e){aviso('Erro ao confirmar Booking: '+e.message,true);}finally{btn.disabled=false;btn.textContent='CONFIRMAR E LIBERAR';}}
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('modal-confirmacao').hidden)fecharModal();});
async function carregarHistorico(){if(loadingHistory)return;loadingHistory=true;try{const [a,b]=await Promise.all([clienteSupabase.rpc('cw_consultar_historico_booking'),clienteSupabase.rpc('cw_consultar_historico_containers')]);if(a.error)throw a.error;if(b.error)throw b.error;historico=[...(a.data||[]).map(r=>({...r,etapa:'BOOKING'})),...(b.data||[]).map(r=>({...r,etapa:'CONTÊINER'}))].sort((x,y)=>new Date(y.registrado_em||0)-new Date(x.registrado_em||0));renderHistorico();}catch(e){$('historico-contagem').textContent='Não foi possível carregar o histórico. Verifique se o SQL V13 foi executado.';aviso('Erro ao consultar histórico: '+e.message,true);}finally{loadingHistory=false;}}
function filtrarHistorico(){const q=$('pesquisa-historico').value.trim().toUpperCase(),tipo=$('tipo-historico').value;return historico.filter(r=>(tipo==='TODOS'||r.etapa===tipo)&&(!q||`${r.container||''} ${r.ordem||''} ${r.armador_solicitado||''} ${r.armador||''} ${r.depot||''} ${r.transportadora||''}`.toUpperCase().includes(q)));}
function renderHistorico(){const itens=filtrarHistorico();$('historico-contagem').textContent=`${itens.length} registro(s) encontrado(s). ${historico.filter(r=>r.etapa==='BOOKING').length} confirmação(ões) de Booking; ${historico.filter(r=>r.etapa==='CONTÊINER').length} utilização(ões) de contêiner.`;$('historico-linhas').innerHTML=itens.map(r=>`<tr><td>${safe(r.etapa)}</td><td>${safe(r.container||'—')}</td><td>${safe(r.ordem||'—')}</td><td>${safe(r.tipo||'—')}</td><td>${safe(r.transportadora||'—')}</td><td>${safe(r.armador_solicitado||'—')}</td><td>${safe(r.armador||'—')}</td><td>${safe(r.depot||'—')}</td><td>${dt(r.data_coleta)}</td><td>${safe(stamp(r.registrado_em))}</td><td>${safe(r.processo||'—')}</td></tr>`).join('')||'<tr><td colspan="11">Nenhum registro encontrado com os filtros selecionados.</td></tr>';}
function linhasExportacao(){return filtrarHistorico().map(r=>({'ETAPA':r.etapa,'CONTÊINER':r.container||'','ORDEM':r.ordem||'','TIPO':r.tipo||'','TRANSPORTADORA':r.transportadora||'','ARMADOR SOLICITADO':r.armador_solicitado||'','ARMADOR CONFIRMADO':r.armador||'','DEPOT':r.depot||'','DATA COLETA':dt(r.data_coleta),'DATA REGISTRO':stamp(r.registrado_em),'STATUS / ORIGEM':r.processo||''}));}
// A origem file:// bloqueia blob:file:// no Chrome. Nunca gerar URLs blob.
let historicoFocoAnterior=null;
function alternarHistorico(){
 const panel=$('painel-historico');
 if(!panel.hidden){fecharHistorico();return;}
 historicoFocoAnterior=document.activeElement;
 panel.hidden=false;document.body.style.overflow='hidden';
 $('btn-historico').setAttribute('aria-expanded','true');
 renderHistorico();
 if(bookingHistoricoPendente){bookingHistoricoPendente=false;carregarHistorico();}
 panel.querySelector('.hist-close').focus();
}
function fecharHistorico(){
 const panel=$('painel-historico');
 if(panel.hidden)return;
 panel.hidden=true;document.body.style.overflow='';
 $('btn-historico').setAttribute('aria-expanded','false');
 if(historicoFocoAnterior&&historicoFocoAnterior.isConnected)historicoFocoAnterior.focus();
}
window.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!$('painel-historico').hidden){e.preventDefault();fecharHistorico();}
 if(e.key==='Tab'&&!$('painel-historico').hidden){
  const nodes=[...$('painel-historico').querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')].filter(x=>x.getClientRects().length);
  if(!nodes.length)return;
  const first=nodes[0],last=nodes[nodes.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 }
});
function mensagemExportacao(msg,erro=false){
  const area=$('exportacao-ajuda'); area.hidden=false; area.textContent=msg;
  area.style.color=erro?'#a12a2a':'#2d4b5e';
}
function csvRelatorio(linhas){
 const cols=Object.keys(linhas[0]);
 const seguro=v=>{let x=String(v??'');if(/^[\s]*[=+\-@]/.test(x))x="'"+x;return '"'+x.replace(/"/g,'""')+'"'};
 return '\uFEFFsep=;\r\n'+[cols,...linhas.map(r=>cols.map(c=>r[c]))].map(row=>row.map(seguro).join(';')).join('\r\n');
}
async function exportarHistorico(){
 const linhas=linhasExportacao();
 if(!linhas.length){aviso('Não há registros para exportar. Verifique os filtros.',true);return;}
 const nome='ColetaWeb_Historico_Booking_Containers';
 try{
   let bytes,ext,mime;
   if(typeof XLSX!=='undefined'&&XLSX.utils&&XLSX.write){
     const book=XLSX.utils.book_new(),sheet=XLSX.utils.json_to_sheet(linhas);
     sheet['!cols']=[{wch:15},{wch:20},{wch:18},{wch:12},{wch:27},{wch:24},{wch:25},{wch:22},{wch:16},{wch:24},{wch:24}];
     XLSX.utils.book_append_sheet(book,sheet,'Historico');
     bytes=XLSX.write(book,{bookType:'xlsx',type:'array'});ext='.xlsx';mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
   }else{
     bytes=new TextEncoder().encode(csvRelatorio(linhas));ext='.csv';mime='text/csv;charset=utf-8';
   }
   // Chrome / Edge: salva bytes diretamente, sem URLs blob bloqueadas em file://.
   if(typeof window.showSaveFilePicker==='function'){
     try{
       const handle=await window.showSaveFilePicker({suggestedName:nome+ext,types:[{description:ext==='.xlsx'?'Pasta de trabalho Excel':'Planilha compatível com Excel',accept:{[mime.split(';')[0]]:[ext]}}]});
       const stream=await handle.createWritable();await stream.write(bytes);await stream.close();
       $('exportacao-ajuda').hidden=true;
       return;
     }catch(err){
       if(err.name==='AbortError'){mensagemExportacao('Salvamento cancelado.');return;}
       console.warn('Salvamento direto indisponível:',err);
     }
   }
   // Fallback sem blob: download via data URI. O usuário inicia por clique real.
   let binary='';const arr=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
   for(let i=0;i<arr.length;i+=8192)binary+=String.fromCharCode(...arr.subarray(i,i+8192));
   const a=document.createElement('a');a.download=nome+ext;
   a.href='data:'+mime.split(';')[0]+';base64,'+btoa(binary);
   a.style.display='none';document.body.appendChild(a);a.click();a.remove();
   $('exportacao-ajuda').hidden=true;
 }catch(e){console.error('Erro ao exportar histórico',e);mensagemExportacao('Falha ao exportar: '+e.message,true);aviso('Falha no Excel: '+e.message,true);}
}
document.addEventListener('DOMContentLoaded',carregar);

// PULMÃO V21 - saldos sempre calculados no banco, sem contagem local duplicada.
let pulmaoLinhas=[],pulmaoFocus=null,pulmaoBusy=false,pulmaoTimer=null;
function fecharPulmao(){const p=$('painel-pulmao');if(p.hidden)return;p.hidden=true;clearInterval(pulmaoTimer);pulmaoTimer=null;if(pulmaoFocus?.isConnected)pulmaoFocus.focus();}
async function abrirPulmao(){pulmaoFocus=document.activeElement;$('painel-pulmao').hidden=false;$('painel-pulmao').querySelector('.pulmao-card').focus();await carregarPulmao();clearInterval(pulmaoTimer);pulmaoTimer=setInterval(()=>{if(!document.hidden&&!$('painel-pulmao').hidden)carregarPulmao(true)},15000);}
function ajustarFiltroPulmao(id,valores,rotulo){const el=$(id),anterior=el.value;el.replaceChildren(new Option(rotulo,''));[...new Set(valores.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR')).forEach(x=>el.add(new Option(x,x)));if([...el.options].some(o=>o.value===anterior))el.value=anterior;}
async function carregarPulmao(silencioso=false){if(pulmaoBusy||$('painel-pulmao').hidden)return;pulmaoBusy=true;try{
 const {data,error}=await clienteSupabase.rpc('cw_painel_pulmao_v21');if(error)throw error;
 pulmaoLinhas=data||[];ajustarFiltroPulmao('pulmao-transportadora',pulmaoLinhas.map(x=>x.transportadora),'TODAS');ajustarFiltroPulmao('pulmao-armador',pulmaoLinhas.map(x=>x.armador),'TODOS');$('pulmao-erro').textContent='';desenharPulmao();
 }catch(e){$('pulmao-erro').textContent='Não foi possível consultar os saldos. Confirme a execução do SQL V21: '+e.message;if(!silencioso)console.error(e);}finally{pulmaoBusy=false;}}
function desenharPulmao(){const t=$('pulmao-transportadora').value,a=$('pulmao-armador').value;const linhas=pulmaoLinhas.filter(r=>(!t||r.transportadora===t)&&(!a||r.armador===a));const soma=k=>linhas.reduce((s,r)=>s+Number(r[k]||0),0);
 $('pulmao-confirmados').textContent=soma('confirmados');$('pulmao-disponiveis').textContent=soma('disponiveis');$('pulmao-operacao').textContent=soma('em_operacao');$('pulmao-finalizados').textContent=soma('finalizados');
 $('pulmao-grupos').innerHTML=linhas.length?linhas.map(r=>{const total=Number(r.confirmados)||0,disponivel=Number(r.disponiveis)||0,op=Number(r.em_operacao)||0,final=Number(r.finalizados)||0,pct=total?Math.round(100*disponivel/total):0;return `<div class="pulmao-group"><div class="pulmao-group-head"><span>${safe(r.armador)}</span><span style="color:#188454">${disponivel} disponível(is)</span></div><div class="pulmao-group-sub">${safe(r.transportadora)} · ${Number(r.solicitacoes)||0} solicitação(ões)</div><div class="pulmao-bar"><div style="width:${pct}%"></div></div><div class="pulmao-line"><span>Confirmados: <b>${total}</b></span><span>Em operação: <b>${op}</b></span><span>Finalizados: <b>${final}</b></span></div></div>`}).join(''):'<div class="pulmao-empty">Nenhum PULMÃO confirmado com estes filtros.</div>';
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('painel-pulmao').hidden){e.preventDefault();fecharPulmao();}});
