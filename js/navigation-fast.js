/* Antecipacao leve de paginas sem mudar login, perfil ou navegacao. */
(function () {
  'use strict';
  const cached = new Set();
  function prefetch(url) {
    try {
      const resolved = new URL(url, location.href);
      if (resolved.origin !== location.origin || !resolved.pathname.endsWith('.html')) return;
      if (resolved.pathname === location.pathname || cached.has(resolved.href)) return;
      cached.add(resolved.href);
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'document';
      link.href = resolved.href;
      document.head.appendChild(link);
    } catch (_) {}
  }
  // Ao voltar de um submenu, o navegador ja pode ter buscado a Home.
  if (!/\/index\.html$/i.test(location.pathname) && !location.pathname.endsWith('/')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => prefetch('index.html'), { once:true });
    else prefetch('index.html');
  }
  // Descobre URLs de links e botoes com onclick="location.href=...".
  function prepare(event) {
    const target = event.target?.closest?.('a[href],button[onclick],input[onclick]');
    if (!target) return;
    const href = target.getAttribute('href');
    if (href) { prefetch(href); return; }
    const code = target.getAttribute('onclick') || '';
    const match = code.match(/(?:window\.)?location\.href\s*=\s*['"]([^'"]+\.html)['"]/i);
    if (match) prefetch(match[1]);
  }
  document.addEventListener('pointerover', prepare, { passive:true });
  document.addEventListener('pointerdown', prepare, { passive:true });
  document.addEventListener('focusin', prepare, { passive:true });
  const originHome = /(?:\/index\.html|\/)$/i.test(location.pathname);
  const markerKey = 'coletaweb:retorno-home';
  if (originHome) {
    // Um link rel=prefetch pode ser ignorado pelo Chrome e não garantir o
    // aproveitamento em arquivos locais. Buscar/EXECUTAR as bibliotecas em
    // segundo plano, depois que a Home estiver ociosa, aquece o cache HTTP
    // normal e permite reutilizar o codigo no primeiro acesso à Gestao.
    const prepararGestao = () => {
      if (navigator.connection?.saveData || /(?:^|\b)2g\b/i.test(navigator.connection?.effectiveType || '')) return;
      prefetch('gestao.html');
      [
        'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-datalabels/2.1.0/chartjs-plugin-datalabels.min.js'
      ].forEach(src => {
        const script = document.createElement('script');
        // Scripts dinamicos com async=false executam na ordem de insercao:
        // Chart.js precisa estar disponivel quando o plugin for inicializado.
        script.async = false;
        script.src = src;
        script.dataset.coletawebPreload = 'gestao';
        script.onerror = () => console.debug('[ColetaWeb] Biblioteca da Gestao sera carregada ao acessar o painel.');
        document.head.appendChild(script);
      });
    };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(prepararGestao, { timeout: 1800 });
    } else {
      setTimeout(prepararGestao, 600);
    }
    // Registro valido somente para a navegacao seguinte desta aba.
    try { sessionStorage.removeItem(markerKey); } catch (_) {}
    document.addEventListener('click', function (event) {
      const item=event.target?.closest?.('button[onclick],a[href]');
      if (!item) return;
      const code=item.getAttribute('onclick') || '';
      const href=item.getAttribute('href') || code.match(/(?:window\.)?location\.href\s*=\s*['"]([^'"]+\.html)['"]/i)?.[1];
      if (!href) return;
      try {
        const target=new URL(href,location.href);
        if (target.origin===location.origin && target.pathname.endsWith('.html')) {
          sessionStorage.setItem(markerKey,JSON.stringify({path:target.pathname,at:Date.now()}));
        }
      } catch (_) {}
    }, true);
  } else {
    // Um reload da pagina interna invalida a suposicao sobre o historico.
    const nav=performance.getEntriesByType('navigation')[0];
    if (nav?.type==='reload') try { sessionStorage.removeItem(markerKey); } catch (_) {}
  }
  // Se o menu foi aberto diretamente a partir da Home, voltar pelo historico
  // permite ao navegador restaurar a tela da memoria (bfcache), sem recriar
  // o documento nem consultar o Supabase. Em acessos diretos, usa o link normal.
  document.addEventListener('click', function (event) {
    const button=event.target?.closest?.('button[onclick],a[href]');
    if (!button) return;
    const link=button.getAttribute('href') || button.getAttribute('onclick') || '';
    if (!/index\.html/i.test(link)) return;
    try {
      const previous=document.referrer ? new URL(document.referrer) : null;
      const here=new URL(location.href);
      let veioDaHome=!!previous && previous.origin===here.origin && /\/index\.html$/i.test(previous.pathname);
      if (!veioDaHome) {
        // document.referrer pode vir vazio em paginas locais/file://.
        const saved=JSON.parse(sessionStorage.getItem(markerKey) || 'null');
        veioDaHome=!!saved && saved.path===here.pathname && Date.now()-saved.at<120000;
      }
      if (!veioDaHome || history.length<=1) return;
      try { sessionStorage.removeItem(markerKey); } catch (_) {}
      event.preventDefault();
      event.stopImmediatePropagation();
      history.back();
    } catch (_) { /* sem referrer: deixa o onclick/href original funcionar */ }
  }, true);
})();
