const armadores = ["MSC", "CMA", "MAERSK", "HAPAG", "ALPHA", "HAPPAG", "VUXX", "TOZZO", "HAPAG LLOYD", "PIL", "ONE"];

// Lista corrigida apenas com os locais da aba específica
const locaisColeta = ["oceanic", "Lechman terminais", "VMG Terminais"];

function popularArmadores() {
    const sel = document.getElementById('armadorSelect');
    if(sel) {
        // Limpa antes de popular para evitar duplicatas
        sel.innerHTML = '<option value="">SELECIONE...</option>';
        armadores.forEach(a => sel.add(new Option(a, a)));
    }
}

function popularLocais() {
    const sel = document.getElementById('localColetaSelect');
    if(sel) {
        // Limpa antes de popular
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

    const dynamicElements = grid.querySelectorAll('.day-number, .week-number, .cal-cell:not(.head)');
    dynamicElements.forEach(el => el.remove());

    grid.innerHTML += `<div class="cal-cell week-number">${currentWeek}</div>`;
    
    for(let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
        grid.innerHTML += `<div class="cal-cell"></div>`;
    }

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
    modal.style.display = 'block';
    
    container.innerHTML = '';
    const now = new Date();
    const year = now.getFullYear();
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    
    meses.forEach((mes, mIndex) => {
        const daysInMonth = new Date(year, mIndex + 1, 0).getDate();
        const firstDay = new Date(year, mIndex, 1).getDay();
        
        let gridHTML = `
            <div class="card" style="padding:10px;">
                <h3 style="color: var(--navy); margin-bottom: 5px; font-size: 14px; text-align:center;">${mes}</h3>
                <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap: 2px; font-size: 11px; text-align:center;">
                    <div style="font-weight:bold; color:var(--navy);">S</div><div style="font-weight:bold; color:var(--navy);">T</div>
                    <div style="font-weight:bold; color:var(--navy);">Q</div><div style="font-weight:bold; color:var(--navy);">Q</div>
                    <div style="font-weight:bold; color:var(--navy);">S</div><div style="font-weight:bold; color:var(--navy);">S</div>
                    <div style="font-weight:bold; color:var(--navy);">D</div>`;

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

function closeFullCalendar() {
    document.getElementById('full-calendar-modal').style.display = 'none';
}