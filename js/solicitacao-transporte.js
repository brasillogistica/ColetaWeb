"use strict";
const $ = id => document.getElementById(id);
const fila=[];
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tipoAtual=()=>document.querySelector('input[name="tipo"]:checked').value;
const origemAtual=()=>document.querySelector('input[name="origem"]:checked').value;
function aviso(t,erro=false){$('msg').hidden=false;$('msg').textContent=t;$('msg').style.color=erro?'#ba3030':'#2d4b5e';}
function atualizarLocal(){const sel=$('planta'),old=sel.value;sel.replaceChildren(new Option('SELECIONE...',''));(origemAtual()==='INDÚSTRIA'?INDUSTRIAS:ARMAZENS).forEach(n=>sel.add(new Option(n,n)));if([...sel.options].some(o=>o.value===old))sel.value=old;}
function atualizarTipo(){let p=tipoAtual()==='PULMÃO';for(const id of ['ordemBox','origemBox','localBox','pcpBox'])$(id).hidden=p;$('qtd').readOnly=!p;if(!p)$('qtd').value='1';}
function opcao(sel,value){if(!value)return;if(![...sel.options].some(o=>o.value===value))sel.add(new Option(value,value));sel.value=value;}
async function iniciar(){atualizarLocal();atualizarTipo();document.querySelectorAll('input[name="tipo"]').forEach(x=>x.addEventListener('change',atualizarTipo));document.querySelectorAll('input[name="origem"]').forEach(x=>x.addEventListener('change',atualizarLocal));document.querySelectorAll('input.date-clickable').forEach(x=>x.addEventListener('click',()=>{try{x.showPicker()}catch(e){}}));$('arquivo').addEventListener('change',importar);
if(typeof clienteSupabase==='undefined'){aviso('Não foi encontrado o script.js com a conexão Supabase. Mantenha o arquivo de configuração original nesta pasta.',true);return;}
try{const {data:{user},error}=await clienteSupabase.auth.getUser();if(error||!user){location.href='login.html';return;}const {data:transp,error:te}=await clienteSupabase.rpc('cw_transportadora_usuario');if(te)throw te;$('transp').value=transp||'';if(!transp)aviso('Seu usuário precisa estar vinculado a uma transportadora.',true);
const {data:common}=await clienteSupabase.from('cw_catalogos').select('*').limit(300);if(common){for(const row of common){let tipo=String(row.tipo||row.categoria||'').toLowerCase();let nome=row.nome||row.valor;if(tipo.includes('armador'))opcao($('armadorSolic'),nome);}}
if(!$('armadorSolic').options.length)for(const x of ['MSC','MAERSK','CMA CGM','HAPAG-LLOYD','ONE','COSCO','EVERGREEN','PIL','HMM','ZIM'])$('armadorSolic').add(new Option(x,x));
await pendencias();}catch(e){aviso('Não foi possível carregar os dados: '+e.message,true);}}
function normalizar(v){return String(v||'').trim().toUpperCase()}
function validar(item){if(item.tipo==='CARGA'){if(!item.ordem||!item.pcp||!item.planta||!item.origem)throw Error('Para CARGA, informe ordem, PCP, origem e local de carregamento.');if(!([...INDUSTRIAS,...ARMAZENS].includes(item.planta)))throw Error('Local de carregamento não cadastrado.');if(item.quantidade!==1)throw Error('Solicitações do tipo CARGA devem ter exatamente 1 contêiner.');}else{item.ordem=null;item.pcp=null;item.planta=null;item.origem=null;}if(!Number.isInteger(item.quantidade)||item.quantidade<1||item.quantidade>300)throw Error('Quantidade deve ficar entre 1 e 300.');if(!item.temperatura||!item.armador||!item.data_coleta||!item.regiao)throw Error('Preencha temperatura, armador, data e região da coleta.');}
function lerFormulario(){return{tipo:tipoAtual(),ordem:normalizar($('ordem').value)||null,pcp:$('pcp').value||null,origem:tipoAtual()==='CARGA'?origemAtual():null,planta:$('planta').value||null,temperatura:$('temp').value,armador:$('armadorSolic').value,quantidade:Number($('qtd').value),data_coleta:$('data').value,regiao:$('regiao').value};}
function adicionar(){try{const x=lerFormulario();validar(x);if(x.ordem&&fila.some(y=>y.ordem===x.ordem))throw Error('A ordem já está na lista.');fila.push(x);desenharFila();$('ordem').value='';$('qtd').value='1';aviso('Solicitação adicionada para envio.');}catch(e){aviso(e.message,true)}}
function desenharFila(){$('count').textContent=`(${fila.length})`;$('linhas').innerHTML=fila.map((s,i)=>`<tr><td>${safe(s.tipo)}</td><td>${safe(s.ordem||'—')}</td><td>${safe(s.pcp||'—')}</td><td>${safe(s.origem||'—')}</td><td>${safe(s.planta||'—')}</td><td>${safe(s.temperatura)}</td><td>${safe(s.armador)}</td><td>${s.quantidade}</td><td>${safe(s.data_coleta)}</td><td>${safe(s.regiao)}</td><td><button class="secondary" onclick="remover(${i})">REMOVER</button></td></tr>`).join('');}
function remover(i){fila.splice(i,1);desenharFila();}
async function enviar(){if(!fila.length)return aviso('Adicione ao menos uma solicitação.',true);try{fila.forEach(validar);$('enviar').disabled=true;const {data,error}=await clienteSupabase.rpc('cw_enviar_solicitacoes',{p_itens:fila});if(error)throw error;fila.length=0;desenharFila();aviso(`${data} solicitação(ões) enviada(s) para Booking.`);await pendencias();}catch(e){aviso('Erro ao enviar: '+e.message,true)}finally{$('enviar').disabled=false}}
let carregandoMinhasSolicitacoes=false;
let atualizarMinhasSolicitacoesDepois=false;
async function pendencias(){
  if(carregandoMinhasSolicitacoes){atualizarMinhasSolicitacoesDepois=true;return;}
  carregandoMinhasSolicitacoes=true;
  try{
    const {data,error}=await clienteSupabase.from('cw_solicitacoes')
      .select('id,tipo,ordem,pcp,planta,armador,armador_solicitado,quantidade,status,depot_coleta,observacao_booking,cw_atrelamentos(container,depot)')
      .order('created_at',{ascending:false}).limit(300);
    if(error)throw error;
    const solicitacoes=data||[];
    $('historico').innerHTML=solicitacoes.map(s=>{
      const alterado=!!s.armador_solicitado && normalizar(s.armador_solicitado)!==normalizar(s.armador);
      const detalhe=alterado?`Armador solicitado: ${s.armador_solicitado}. Confirmado pelo Booking: ${s.armador}.`:'';
      const avisoAlteracao=alterado?` <span class="alteracao-armador" role="img" aria-label="Armador alterado pelo Booking: ${safe(detalhe)}" title="${safe(detalhe)}">!</span><div class="detalhe-armador">Antes: ${safe(s.armador_solicitado)}<br>Booking: ${safe(s.armador)}</div>`:'';
      // Booking registra o depot diretamente na solicitação, antes de existir contêiner atrelado.
      // Mantém os depots dos atrelamentos apenas como compatibilidade com registros antigos.
      const depotConfirmado=String(s.depot_coleta||'').trim();
      const depotsAtrelados=[...new Set((s.cw_atrelamentos||[]).map(a=>String(a.depot||'').trim()).filter(Boolean))].join(', ');
      const depotExibido=depotConfirmado||depotsAtrelados||'—';
      return `<tr class="${alterado?'linha-armador-alterado':''}"><td>${safe(s.tipo||'CARGA')}</td><td>${safe(s.ordem||'—')}</td><td>${safe(s.pcp||'—')}</td><td>${safe(s.planta||'—')}</td><td class="coluna-armador">${safe(s.armador)}${avisoAlteracao}</td><td>${s.quantidade}</td><td>${safe((s.cw_atrelamentos||[]).map(a=>a.container).join(', ')||'—')}</td><td>${safe(depotExibido)}</td><td>${safe(s.status)}</td><td class="obs-transport" title="${safe(s.observacao_booking||'')}">${safe(s.observacao_booking||'—')}</td></tr>`;
    }).join('');
  }catch(e){aviso('Erro ao consultar solicitações: '+e.message,true)}
  finally{
    carregandoMinhasSolicitacoes=false;
    if(atualizarMinhasSolicitacoesDepois){atualizarMinhasSolicitacoesDepois=false;pendencias();}
  }
}
// Atualiza a sinalização após mudanças do Booking, sem precisar de mensagem escrita.
function ativarNotificacoesBooking(){
  if(typeof clienteSupabase==='undefined')return;
  const painel=$('historico')?.closest('.panel');
  if(painel && !document.getElementById('estilo-armador-alterado')){
    const estilo=document.createElement('style');
    estilo.id='estilo-armador-alterado';
    estilo.textContent=`
      .alteracao-armador{display:inline-flex;align-items:center;justify-content:center;background:#e99b17;color:#fff;font-size:13px;font-weight:900;width:20px;height:20px;border-radius:100%;margin-left:6px;vertical-align:middle}
      .detalhe-armador{font-size:10px;line-height:1.5;color:#87530b;margin-top:4px;font-weight:700;white-space:normal}
      .linha-armador-alterado .coluna-armador{background:#fff8e6}
    `;
    document.head.appendChild(estilo);
  }
  pendencias();
  const intervalo=setInterval(()=>{if(!document.hidden)pendencias();},30000);
  const visibilidade=()=>{if(!document.hidden)pendencias();};
  document.addEventListener('visibilitychange',visibilidade);
  window.addEventListener('pagehide',()=>{clearInterval(intervalo);document.removeEventListener('visibilitychange',visibilidade);},{once:true});
  try{
    const canal=clienteSupabase.channel('solicitar-armador-'+Math.random().toString(36).slice(2))
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'cw_solicitacoes'},()=>{if(!document.hidden)pendencias();}).subscribe();
    window.addEventListener('pagehide',()=>clienteSupabase.removeChannel(canal),{once:true});
  }catch(e){console.warn('Realtime não disponível; atualização periódica continua ativa.',e);}
}
document.addEventListener('DOMContentLoaded',ativarNotificacoesBooking,{once:true});
function modelo(){const cab=['TIPO','ORDEM','PCP','ORIGEM','LOCAL CARREGAMENTO','TEMPERATURA','ARMADOR','QUANTIDADE DE CONTAINERS','DATA DE COLETA','REGIÃO DE COLETA'];const linhas=[cab,['CARGA','O/1234-5','2026-10-27','INDÚSTRIA','MINERVA BARRETOS','40" REEFER HIGH CUBIC (-18ºC)','MSC',1,'2026-10-27','SANTOS'],['PULMÃO','','','','','40" REEFER HIGH CUBIC (-18ºC)','MSC',5,'2026-10-27','ITAJAÍ']];const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(linhas),'Solicitações');XLSX.writeFile(wb,'modelo_solicitar_container.xlsx');}
function excelData(v){if(typeof v==='number' && v>20000&&v<100000){const d=XLSX.SSF.parse_date_code(v);return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`}const s=String(v||'').trim();if(/^\d{2}\/\d{2}\/\d{4}$/.test(s)){const [d,m,y]=s.split('/');return `${y}-${m}-${d}`}return s.slice(0,10)}
async function importar(ev){const file=ev.target.files?.[0];if(!file)return;try{const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});let qtd=0,erros=[];for(let [i,r] of rows.entries()){try{let t=normalizar(r.TIPO||'CARGA');if(t==='PULMAO')t='PULMÃO';const org=normalizar(r.ORIGEM||'INDÚSTRIA');let x={tipo:t,ordem:normalizar(r.ORDEM)||null,pcp:excelData(r.PCP)||null,origem:org,planta:normalizar(r['LOCAL CARREGAMENTO']||r.PLANTA)||null,temperatura:String(r.TEMPERATURA||'').trim(),armador:String(r.ARMADOR||'').trim(),quantidade:Number(r['QUANTIDADE DE CONTAINERS']||r.QUANTIDADE||1),data_coleta:excelData(r['DATA DE COLETA']||r.DATA_COLETA),regiao:normalizar(r['REGIÃO DE COLETA']||r.REGIAO)};validar(x);if(x.ordem&&fila.some(y=>y.ordem===x.ordem))throw Error('Ordem repetida');fila.push(x);qtd++;}catch(e){erros.push(`Linha ${i+2}: ${e.message}`)}}desenharFila();aviso(`${qtd} linha(s) importada(s).${erros.length?'\n'+erros.join('\n'):''}`,!!erros.length);}catch(e){aviso('Erro na importação: '+e.message,true)}finally{ev.target.value='';}}
document.addEventListener('DOMContentLoaded',iniciar);
