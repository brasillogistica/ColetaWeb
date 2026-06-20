// Configuração do Supabase
const SUPABASE_URL = 'https://ekmcgifpvqrdgcikvepe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrbWNnaWZwdnFyZGdjaWt2ZXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MDY4NTgsImV4cCI6MjA5NTE4Mjg1OH0.sLIg__XSOSM7VD95FcUDr2ZCuDFCxxCWlF98sJkyBTg';

// Inicialização segura
const clienteSupabase = (typeof supabase !== 'undefined') 
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
    : null;

// Variáveis Globais
window.dadosExtraidos = { container: "N/A" };
const armadores = ["MSC", "CMA", "MAERSK", "HAPAG", "ALPHA", "HAPPAG", "VUXX", "TOZZO", "HAPAG LLOYD", "PIL", "ONE"];
const locaisColeta = ["oceanic", "Lechman terminais", "VMG Terminais"];

// Funções Globais Registradas no Objeto Window
window.fazerLogout = async function() {
    if (clienteSupabase) await clienteSupabase.auth.signOut();
    window.location.href = 'login.html';
};

window.processarOCR = async function(imagemBase64) {
    const status = document.getElementById('status');
    if (status) status.innerText = "Lendo recibo, aguarde...";
    
    try {
        const { data: { text } } = await Tesseract.recognize(imagemBase64, 'por');
        const extrair = (regex) => (text.match(regex) || [])[1] || "N/A";

        window.dadosExtraidos = {
            container: extrair(/CONTAINER:\s*([A-Z0-9\.\-]+)/i)
        };

        if (status) status.innerText = "Leitura concluída!";
    } catch (err) {
        console.error("Erro no OCR:", err);
        if (status) status.innerText = "Erro ao ler imagem.";
    }
};

// Função de permissão com sanitização (trata espaços e maiúsculas/minúsculas)
async function checarPermissaoMaster() {
    if (!clienteSupabase) return false;
    try {
        const { data: { user } } = await clienteSupabase.auth.getUser();
        
        if (user) {
            const { data: userData } = await clienteSupabase
                .from('usuarios')
                .select('perfil, status')
                .eq('email', user.email)
                .single();

            if (userData) {
                const perfil = userData.perfil ? userData.perfil.trim().toLowerCase() : "";
                const status = userData.status ? userData.status.trim().toLowerCase() : "";
                
                // Agora aceita qualquer variação de escrita (Master/master/Mestre/mestre/Administrador/administrador)
                const ehAdmin = (perfil === 'master' || perfil === 'mestre' || perfil === 'administrador');
                return (ehAdmin && status === 'aprovado');
            }
        }
    } catch (e) {
        console.error("Erro ao checar permissão:", e);
    }
    return false;
}

async function inicializarPainel() {
    const isMaster = await checarPermissaoMaster();
    if (isMaster) {
        const adminContainer = document.getElementById('admin-container');
        if (adminContainer) {
            adminContainer.style.display = 'flex'; 
        }
    }
}

async function protegerPaginaAdmin() {
    const isMaster = await checarPermissaoMaster();
    if (!isMaster) {
        alert("Acesso negado!");
        window.location.href = 'index.html';
    }
}

window.carregarTransportadoras = async function() {
    if (!clienteSupabase) return;
    try {
        const { data, error } = await clienteSupabase.from('transportadoras').select('nome');
        const sel = document.getElementById('novaTransportadora');
        if (sel && data) {
            sel.innerHTML = '<option value="">SELECIONE...</option>';
            data.forEach(t => {
                let option = document.createElement('option');
                option.value = t.nome;
                option.text = t.nome;
                sel.add(option);
            });
        }
    } catch (e) {
        console.error("Erro ao carregar transportadoras:", e);
    }
};

function popularArmadores() {
    const sel = document.getElementById('armadorSelect');
    if(sel) {
        sel.innerHTML = '<option value="">SELECIONE...</option>';
        armadores.forEach(a => sel.add(new Option(a, a)));
    }
}

function popularLocais() {
    const sel = document.getElementById('localColetaSelect');
    if(sel) {
        sel.innerHTML = '<option value="">SELECIONE...</option>';
        locaisColeta.forEach(local => sel.add(new Option(local, local)));
    }
}

function autoFill() {
    const val = document.getElementById('cnt')?.value;
    if(val === "TEMU9295736") {
        document.getElementById('tara').value = "4730";
        document.getElementById('gross').value = "35000";
    }
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

function renderCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const tituloMes = now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
    const header = document.getElementById('calendar-header');
    if(header) {
        header.innerHTML = `
            <span style="display: inline-block; vertical-align: middle;">${tituloMes}</span>
            <button onclick="expandCalendar()" style="margin-left:10px; cursor:pointer; background: var(--navy); color: white; border: none; border-radius: 50%; width: 25px; height: 25px; font-weight: 800; font-size: 16px;">+</button>
        `;
    }
    const grid = document.getElementById('calendar-grid');
    if(!grid) return;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let currentWeek = getWeekNumber(new Date(year, month, 1));
    const elementsToRemove = grid.querySelectorAll('.day-number, .week-number, .cal-cell:not(.head)');
    elementsToRemove.forEach(el => el.remove());
    grid.innerHTML += `<div class="cal-cell week-number">${currentWeek}</div>`;
    for(let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) { grid.innerHTML += `<div class="cal-cell"></div>`; }
    for(let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dayOfWeek = date.getDay(); 
        const isToday = (d === now.getDate() && month === now.getMonth() && year === now.getFullYear());
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        let classList = "cal-cell day-number";
        if (isToday) classList += " today";
        if (isWeekend) classList += " weekend";
        grid.innerHTML += `<div class="${classList}">${d}</div>`;
        if(dayOfWeek === 0 && d < daysInMonth) {
            currentWeek++;
            grid.innerHTML += `<div class="cal-cell week-number">${currentWeek}</div>`;
        }
    }
}

function expandCalendar() {
    const modal = document.getElementById('full-calendar-modal');
    const container = document.getElementById('full-calendar-content');
    if (modal) modal.style.display = 'block';
    if (container) {
        container.innerHTML = '';
        const now = new Date();
        const year = now.getFullYear();
        const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        meses.forEach((mes, mIndex) => {
            const daysInMonth = new Date(year, mIndex + 1, 0).getDate();
            const firstDay = new Date(year, mIndex, 1).getDay();
            let gridHTML = `<div class="card" style="padding:10px;"><h3 style="color: var(--navy); margin-bottom: 5px; font-size: 14px; text-align:center;">${mes}</h3><div style="display:grid; grid-template-columns: repeat(7, 1fr); gap: 2px; font-size: 11px; text-align:center;"><div style="font-weight:bold; color:var(--navy);">S</div><div style="font-weight:bold; color:var(--navy);">T</div><div style="font-weight:bold; color:var(--navy);">Q</div><div style="font-weight:bold; color:var(--navy);">Q</div><div style="font-weight:bold; color:var(--navy);">S</div><div style="font-weight:bold; color:var(--navy);">S</div><div style="font-weight:bold; color:var(--navy);">D</div>`;
            let offset = (firstDay === 0) ? 6 : firstDay - 1;
            for(let i = 0; i < offset; i++) gridHTML += `<div></div>`;
            for(let d = 1; d <= daysInMonth; d++) {
                const date = new Date(year, mIndex, d);
                const dayOfWeek = date.getDay();
                const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
                gridHTML += `<div class="annual-day ${isWeekend ? 'annual-weekend' : ''}">${d}</div>`;
            }
            gridHTML += `</div></div>`;
            container.innerHTML += gridHTML;
        });
    }
}

function closeFullCalendar() {
    const modal = document.getElementById('full-calendar-modal');
    if (modal) modal.style.display = 'none';
}

document.getElementById('cameraInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const preview = document.getElementById('preview');
            if(preview) {
                preview.src = event.target.result;
                preview.style.display = 'block';
            }
        }
        reader.readAsDataURL(file);
    }
});