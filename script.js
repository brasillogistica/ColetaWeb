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
        console.log("TEXTO EXTRAÍDO:", text);

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

            if (userData && 
                (userData.perfil === 'master' || userData.perfil === 'mestre' || userData.perfil === 'administrador') &&
                userData.status === 'aprovado') {
                return true;
            }
        }
    } catch (e) {
        console.error("Erro ao checar permissão:", e);
    }
    return false;
}

async function inicializarPainel() {
    // Verifica se estamos no index antes de buscar o admin-container
    const isMaster = await checarPermissaoMaster();
    const adminContainer = document.getElementById('admin-container');
    if (isMaster && adminContainer) {
        adminContainer.style.display = 'flex'; 
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

// ... (Restante das funções: popularArmadores, popularLocais, renderCalendar, etc, mantêm-se iguais)