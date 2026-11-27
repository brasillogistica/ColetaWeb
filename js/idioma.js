/* ColetaWeb - idiomas da Home; preferencia local + perfil autenticado no Supabase. */
(function () {
  'use strict';
  const LANGS = ['pt-BR', 'en', 'es'];
  const D = {
    'pt-BR': {
      subtitle:'Sistema ColetaWeb - Logística Internacional', language:'Idioma', logout:'SAIR', welcome:'Bem-vindo, ',
      buttons:{solicitar:'SOLICITAR CONTÊINER',booking:'BOOKING',coleta:'REGISTRAR COLETA',processos:'PROCESSOS - CONTAINER',gestao:'PAINEL DE GESTÃO',analise:'ANÁLISE PROCESSOS',detention:'DETENTION',gerenciamento:'GERENCIAMENTO',transportadora:'CADASTRAR TRANSPORTADORA'},
      weekdays:['Nº','Seg','Ter','Qua','Qui','Sex','Sáb','Dom'], daysShort:['S','T','Q','Q','S','S','D'],
      annual:'CALENDÁRIO ANUAL', footer:'Desenvolvido por', localOnly:'Idioma salvo neste navegador. Não foi possível sincronizar com sua conta.'
    },
    en: {
      subtitle:'ColetaWeb System - International Logistics', language:'Language', logout:'LOG OUT', welcome:'Welcome, ',
      buttons:{solicitar:'REQUEST CONTAINER',booking:'BOOKING',coleta:'REGISTER PICKUP',processos:'CONTAINER PROCESSES',gestao:'MANAGEMENT DASHBOARD',analise:'PROCESS ANALYSIS',detention:'DETENTION',gerenciamento:'ADMINISTRATION',transportadora:'REGISTER CARRIER'},
      weekdays:['Wk','Mon','Tue','Wed','Thu','Fri','Sat','Sun'], daysShort:['M','T','W','T','F','S','S'],
      annual:'YEARLY CALENDAR', footer:'Developed by', localOnly:'Language saved in this browser. Your account could not be updated.'
    },
    es: {
      subtitle:'Sistema ColetaWeb - Logística Internacional', language:'Idioma', logout:'SALIR', welcome:'Bienvenido, ',
      buttons:{solicitar:'SOLICITAR CONTENEDOR',booking:'BOOKING',coleta:'REGISTRAR RECOGIDA',processos:'PROCESOS - CONTENEDOR',gestao:'PANEL DE GESTIÓN',analise:'ANÁLISIS DE PROCESOS',detention:'DETENTION',gerenciamento:'ADMINISTRACIÓN',transportadora:'REGISTRAR TRANSPORTISTA'},
      weekdays:['N.º','Lun','Mar','Mié','Jue','Vie','Sáb','Dom'], daysShort:['L','M','X','J','V','S','D'],
      annual:'CALENDARIO ANUAL', footer:'Desarrollado por', localOnly:'Idioma guardado en este navegador. No se pudo sincronizar con tu cuenta.'
    }
  };
  let current = 'pt-BR', email = '', displayName = '';
  let changeSequence = 0;
  const storageKey = (mail) => 'coletaweb:idioma:' + String(mail).toLowerCase();
  const valid = (v) => LANGS.includes(v) ? v : 'pt-BR';
  function showSyncStatus(lang, error) {
    const picker = document.getElementById('language-select');
    if (!picker) return;
    let status = document.getElementById('language-sync-status');
    if (!status) {
      status = document.createElement('div');
      status.id = 'language-sync-status';
      status.setAttribute('role', 'status');
      status.style.cssText = 'font: 12px/1.45 Arial,sans-serif;max-width:330px;padding:7px 10px;border-radius:9px;background:#fff8e5;color:#624200;border:1px solid #e3c776;overflow-wrap:anywhere;';
      picker.parentElement.insertAdjacentElement('afterend', status);
    }
    if (!error) { status.hidden = true; return; }
    const code = String(error.code || '');
    const hint = code === 'PGRST202' || code === '42883'
      ? (lang === 'en' ? 'Install sql/INSTALAR_IDIOMA_SUPABASE.sql in Supabase.' : lang === 'es' ? 'Instala sql/INSTALAR_IDIOMA_SUPABASE.sql en Supabase.' : 'Execute sql/INSTALAR_IDIOMA_SUPABASE.sql no Supabase.')
      : (lang === 'en' ? 'Check your login and Supabase function permissions.' : lang === 'es' ? 'Comprueba tu sesión y los permisos de Supabase.' : 'Verifique a sessão e as permissões da função no Supabase.');
    status.textContent = D[lang].localOnly + ' ' + hint + (code ? ' [' + code + ']' : '');
    status.hidden = false;
  }
  const api = {
    get current() { return current; },
    get daysShort() { return D[current].daysShort; },
    apply(lang) {
      current = valid(lang);
      const t = D[current];
      document.documentElement.lang = current;
      document.title = (current === 'en' ? 'Home' : current === 'es' ? 'Inicio' : 'Home') + ' | ColetaWeb';
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (Object.prototype.hasOwnProperty.call(t, key)) el.textContent = t[key];
      });
      const welcome = document.getElementById('welcome-message');
      if (welcome && displayName) welcome.textContent = t.welcome + displayName;
      // O identificador do menu é estável: adicionar/reordenar botões não desloca traduções.
      document.querySelectorAll('.side-menu .container-btn > span[data-menu]').forEach(el => {
        const traducao = t.buttons[el.dataset.menu];
        if (traducao) el.textContent = traducao;
      });
      document.querySelectorAll('#calendar-grid .cal-cell.head').forEach((el, i) => {
        if (t.weekdays[i]) el.textContent = t.weekdays[i];
      });
      const annual = document.querySelector('#full-calendar-modal > h2');
      if (annual) annual.textContent = t.annual;
      const footer = document.querySelector('.footer');
      if (footer) {
        // Preserva o identificador da versão no rodapé, usado para diagnosticar cache.
        const versao = footer.querySelector('[data-app-version]');
        if (versao) {
          footer.firstChild.textContent = t.footer + ' Leandro Brasil • 2026 ';
        } else footer.textContent = t.footer + ' Leandro Brasil • 2026';
      }
      const picker = document.getElementById('language-select');
      if (picker) picker.value = current;
      if (typeof window.renderCalendarRapido === 'function') window.renderCalendarRapido();
      const modal = document.getElementById('full-calendar-modal');
      if (modal && getComputedStyle(modal).display !== 'none' && typeof window.expandCalendar === 'function') window.expandCalendar();
    },
    async init(mail, name) {
      email = String(mail || '').toLowerCase();
      displayName = name || '';
      const picker = document.getElementById('language-select');
      if (picker && !picker.dataset.idiomaConfigurado) {
        picker.dataset.idiomaConfigurado = '1';
        picker.addEventListener('change', async () => {
          const selected = valid(picker.value);
          const seq = ++changeSequence;
          api.apply(selected);
          showSyncStatus(selected, null);
          try { localStorage.setItem(storageKey(email), selected); localStorage.setItem('coletaweb:ultimo-idioma', selected); } catch (_) {}
          const client = window.clienteSupabase || (typeof clienteSupabase !== 'undefined' ? clienteSupabase : null);
          if (!client) {
            showSyncStatus(selected, { code: 'CLIENT_UNAVAILABLE' });
            return;
          }
          try {
            const { error } = await client.rpc('cw_definir_idioma', { p_idioma: selected });
            if (seq !== changeSequence) return;
            if (error) throw error;
            showSyncStatus(selected, null);
          } catch (error) {
            if (seq !== changeSequence) return;
            console.error('Falha ao salvar idioma na conta:', error);
            showSyncStatus(selected, error || {});
          }
        });
      }
      let cached = 'pt-BR';
      try { cached = valid(localStorage.getItem(storageKey(email)) || localStorage.getItem('coletaweb:ultimo-idioma')); } catch (_) {}
      api.apply(cached);
      const version = changeSequence;
      // A leitura remota nao deve bloquear os botoes da Home.
      void (async () => { try {
        const client = window.clienteSupabase || (typeof clienteSupabase !== 'undefined' ? clienteSupabase : null);
        if (!client) return;
        const { data, error } = await client.rpc('cw_obter_idioma');
        if (error) throw error;
        if (version !== changeSequence) return;
        const remote = valid(data);
        api.apply(remote);
        try { localStorage.setItem(storageKey(email), remote); localStorage.setItem('coletaweb:ultimo-idioma', remote); } catch (_) {}
      } catch (error) {
        console.warn('Preferencia remota indisponivel; usando preferencia local:', error);
      } })();
    }
  };
  window.ColetaIdioma = api;
})();
