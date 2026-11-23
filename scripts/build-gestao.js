/*
 * Empacota os recursos criticos da Gestao dentro de gestao.html.
 * As fontes continuam em css/ e js/, sendo a unica versao a manter/editar.
 * Execute: node scripts/build-gestao.js (a partir de COLETAWEB_FINAL).
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const raiz = path.resolve(__dirname, '..');
const pagina = path.join(raiz, 'gestao.html');
let html = fs.readFileSync(pagina, 'utf8');

const ler = arquivo => fs.readFileSync(path.join(raiz, arquivo), 'utf8').trimEnd();
const cssInline = (arquivo) => {
  const css = ler(arquivo).replaceAll('../assets/', 'assets/');
  if (/<\/style/i.test(css)) throw new Error(`CSS com fechamento de tag inesperado: ${arquivo}`);
  return `<style data-cw-source="${arquivo}">\n${css}\n</style>`;
};
const jsInline = arquivo => {
  const codigo = ler(arquivo);
  if (/<\/script/i.test(codigo)) throw new Error(`JS com fechamento de tag inesperado: ${arquivo}`);
  return `<script data-cw-source="${arquivo}">\n${codigo}\n</script>`;
};

function bloco(id, original, conteudo) {
  const inicio = `<!-- CW-GESTAO-${id}-INICIO -->`;
  const fim = `<!-- CW-GESTAO-${id}-FIM -->`;
  const novo = `${inicio}\n${conteudo}\n${fim}`;
  const de = html.indexOf(inicio);
  const ate = html.indexOf(fim);
  if (de !== -1 && ate > de) {
    html = html.slice(0, de) + novo + html.slice(ate + fim.length);
  } else {
    if (!html.includes(original)) throw new Error(`Ponto de inclusao nao encontrado: ${id}`);
    html = html.replace(original, novo);
  }
}

// Apenas a configuracao e a criacao do cliente Supabase sao necessarias nesta
// tela; o restante de js/script.js e usado nos outros menus. A inicializacao
// ocorre antes do listener da Gestao, mas depois dos scripts defer da pagina.
const baseScript = ler('js/script.js');
const ponto = baseScript.indexOf('// Logout global');
if (ponto < 0) throw new Error('Nao foi possivel localizar o bootstrap Supabase em js/script.js');
const configuracao = baseScript.slice(0, ponto)
  .replace('const clienteSupabase =', 'globalThis.clienteSupabase =');

const bootstrap = `<script data-cw-source="js/script.js#bootstrap">\n` +
  `document.addEventListener('DOMContentLoaded', () => {\n${configuracao}\n}, { once: true });\n` +
  `</script>`;

bloco('CSS-GLOBAL', '<link rel="stylesheet" href="css/style.css">', cssInline('css/style.css'));
bloco('CSS-FUNDO', '<link rel="stylesheet" href="css/site-background.css">', cssInline('css/site-background.css'));
bloco('CLIENTE-SUPABASE', '<script defer src="js/script.js"></script>', bootstrap);
bloco('IDIOMA', '<script src="js/i18n-global.js"></script>', jsInline('js/i18n-global.js'));
bloco('NAVEGACAO', '<script src="js/navigation-fast.js" defer></script>', jsInline('js/navigation-fast.js'));

fs.writeFileSync(pagina, html, 'utf8');
console.log('gestao.html otimizado: CSS, idioma e navegacao integrados; fontes externas preservadas.');
