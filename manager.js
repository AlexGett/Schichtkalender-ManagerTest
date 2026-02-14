let currentRequestData = null;
let managerDecision = null;
let managerSignaturePad = null;
let isDrawing = false;
let managerSettings = JSON.parse(localStorage.getItem('managerSettings')) || { signature: null };

// Init
document.addEventListener('DOMContentLoaded', () => {
    // File Upload Logic
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#007bff';
        dropZone.style.background = '#e3f2fd';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';
        dropZone.style.background = '#f8f9fa';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';
        dropZone.style.background = '#f8f9fa';
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    // Signature Canvas Logic
    const canvas = document.getElementById('managerSignatureCanvas');
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';

    // Load saved signature
    if (managerSettings.signature) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = managerSettings.signature;
    }

    const startDrawing = (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = ((e.clientX || e.touches[0].clientX) - rect.left) * scaleX;
        const y = ((e.clientY || e.touches[0].clientY) - rect.top) * scaleY;
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = ((e.clientX || e.touches[0].clientX) - rect.left) * scaleX;
        const y = ((e.clientY || e.touches[0].clientY) - rect.top) * scaleY;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        isDrawing = false;
        ctx.closePath();
        checkFormValidity();
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);

    document.getElementById('clearManagerSig').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        checkFormValidity();
    });

    document.getElementById('saveManagerSig').addEventListener('click', () => {
        managerSettings.signature = canvas.toDataURL('image/png');
        localStorage.setItem('managerSettings', JSON.stringify(managerSettings));
        Toastify({ text: "Unterschrift gespeichert", duration: 3000, style: { background: "#28a745" } }).showToast();
    });

    const uploadBtn = document.getElementById('uploadManagerSig');
    const fileInputSig = document.getElementById('managerSigInput');
    
    uploadBtn.addEventListener('click', () => fileInputSig.click());
    
    fileInputSig.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                    const x = (canvas.width / 2) - (img.width / 2) * scale;
                    const y = (canvas.height / 2) - (img.height / 2) * scale;
                    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('generateFinalPdfBtn').addEventListener('click', generateFinalPDF);
    document.getElementById('exportDecisionBtn').addEventListener('click', exportDecisionJSON);

    // Signature Toggle Logic
    const sigHeader = document.getElementById('managerSignatureHeader');
    const sigContent = document.getElementById('managerSignatureContent');
    const sigIcon = document.getElementById('managerSigToggleIcon');

    if (sigHeader && sigContent && sigIcon) {
        // Initial state: Collapse if signature exists
        if (managerSettings.signature) {
            sigContent.style.display = 'none';
            sigIcon.className = 'fas fa-chevron-down';
        }

        sigHeader.addEventListener('click', () => {
            const isHidden = sigContent.style.display === 'none';
            sigContent.style.display = isHidden ? 'block' : 'none';
            sigIcon.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
        });
    }

    // Copyright Year
    const yearSpan = document.getElementById('copyrightYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Dark Mode Check
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
    }

    // Service Worker registrieren (für Offline-Funktionalität & Updates)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('Service Worker für Manager registriert');

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            const updateBanner = document.getElementById('update-banner');
                            if (updateBanner) updateBanner.style.display = 'flex';
                        }
                    });
                });

                const reloadButton = document.getElementById('reload-button');
                if (reloadButton) {
                    reloadButton.addEventListener('click', () => {
                        if (registration.waiting) {
                            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                }
            })
            .catch(err => console.error('Service Worker Fehler:', err));

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    }
});

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            loadRequestData(data);
        } catch (err) {
            alert('Fehler beim Lesen der Datei. Ungültiges Format.');
        }
    };
    reader.readAsText(file);
}

function loadRequestData(data) {
    currentRequestData = data;
    
    // UI füllen
    document.getElementById('dispName').textContent = data.name;
    document.getElementById('dispPersNr').textContent = data.personalNummer;
    document.getElementById('dispDept').textContent = data.abteilung || '-';
    
    const d1 = new Date(data.dateFrom).toLocaleDateString('de-DE');
    const d2 = new Date(data.dateTo).toLocaleDateString('de-DE');
    document.getElementById('dispDate').textContent = `${d1} - ${d2}`;
    document.getElementById('dispDays').textContent = data.workingDays !== undefined ? data.workingDays : '-';
    
    // Typ Text holen
    const types = uiTranslations['de'].vacation.types;
    document.getElementById('dispType').textContent = types[data.type] || data.type;
    
    document.getElementById('dispReason').textContent = (data.grund || '') + (data.zusatzBemerkung ? ' / ' + data.zusatzBemerkung : '');

    // Signatur anzeigen
    const sigBox = document.getElementById('dispSig');
    sigBox.innerHTML = '';
    if (data.signature) {
        const img = document.createElement('img');
        img.src = data.signature;
        sigBox.appendChild(img);
    } else {
        sigBox.textContent = 'Keine Unterschrift vorhanden';
    }

    // View wechseln
    document.getElementById('dropZone').style.display = 'none';
    document.getElementById('requestDetails').style.display = 'block';
    
    Toastify({ text: "Antrag geladen", duration: 3000, style: { background: "#28a745" } }).showToast();
}

function setDecision(decision) {
    managerDecision = decision;
    
    document.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('selected'));
    if (decision === 'approved') {
        document.querySelector('.status-btn.approve').classList.add('selected');
    } else {
        document.querySelector('.status-btn.reject').classList.add('selected');
    }
    checkFormValidity();
}

function checkFormValidity() {
    const btn = document.getElementById('generateFinalPdfBtn');
    const exportBtn = document.getElementById('exportDecisionBtn');
    // Einfache Prüfung: Entscheidung muss getroffen sein. Unterschrift ist optional aber empfohlen.
    if (managerDecision) {
        btn.disabled = false;
        btn.style.opacity = 1;
        exportBtn.disabled = false;
        exportBtn.style.opacity = 1;
    } else {
        btn.disabled = true;
        btn.style.opacity = 0.5;
        exportBtn.disabled = true;
        exportBtn.style.opacity = 0.5;
    }
}

function generateFinalPDF() {
    if (!currentRequestData) return;

    // Viewport fix to prevent layout shifts
    const metaViewport = document.querySelector('meta[name="viewport"]');
    const originalViewportContent = metaViewport ? metaViewport.getAttribute('content') : '';
    const restoreViewport = () => {
        if (metaViewport && originalViewportContent) {
            metaViewport.setAttribute('content', originalViewportContent);
        }
    };
    if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
    }

    // Temporarily remove dark mode for PDF generation
    const wasDarkMode = document.body.classList.contains('dark-mode');
    if (wasDarkMode) document.body.classList.remove('dark-mode');

    try {
        const data = currentRequestData;
        const managerCanvas = document.getElementById('managerSignatureCanvas');
        const managerSigData = managerCanvas.toDataURL('image/png');
        
        // Logo
        const logoImg = document.getElementById('hiddenLogo');
        let logoDataUrl = '';
        if (logoImg) {
            const c = document.createElement('canvas');
            c.width = logoImg.naturalWidth || 150;
            c.height = logoImg.naturalHeight || 100;
            c.getContext('2d').drawImage(logoImg, 0, 0);
            logoDataUrl = c.toDataURL('image/png');
        }

        // Status Stempel
        const statusColor = managerDecision === 'approved' ? 'green' : 'red';
        const statusText = managerDecision === 'approved' ? 'GENEHMIGT' : 'ABGELEHNT';
        const statusStamp = `
            <div style="
                position: absolute; 
                top: 150px; 
                right: 50px; 
                border: 3px solid ${statusColor}; 
                color: ${statusColor}; 
                font-size: 24pt; 
                font-weight: bold; 
                padding: 10px; 
                transform: rotate(-15deg);
                opacity: 0.8;
                z-index: 100;
            ">${statusText}</div>
        `;

        // Hilfsfunktion für Datum
        const formatGermanDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString + 'T00:00:00');
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
        };

        const selectedType = data.type;
        const workingDays = data.workingDays !== undefined ? data.workingDays : '';

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <style>
                    @page {
                        size: A5 landscape;
                        margin: 5mm;
                    }
            
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 9pt;
                        color: #000;
                        line-height: 1.1;
                        margin: 0;
                        padding: 10px;
                        background-color: #fff;
                        position: relative;
                        -webkit-text-size-adjust: none;
                        text-size-adjust: none;
                    }
            
                    /* Wrapper für Zentrierung auf dem Blatt */
                    .pdf-wrapper {
                        width: 100%;
                        height: 130mm; /* A5 Höhe (148mm) minus Ränder (10mm) minus Puffer */
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }

                    .container {
                        width: 100%;
                        max-width: 195mm;
                        margin: 0 auto;
                    }
            
                    /* Header */
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                    }
            
                    .header h1 {
                        font-size: 14pt;
                        margin: 0;
                    }
            
                    .logo {
                        color: #db261f;
                        font-weight: 1;
                        font-size: 1;
                        position: absolute;
                        top: -30px;
                        margin-right: 40px;
                    }
            
                    /* Top Info */
                    .top-fields {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 10px;
                    }
            
                    .field-group {
                        display: flex;
                        align-items: flex-end;
                        border-bottom: 1px solid #000;
                    }
            
                    .field-group label {
                        font-weight: bold;
                        margin-right: 3px;
                        white-space: nowrap;
                    }
            
                    .field-group input {
                        border: none;
                        width: 100%;
                        outline: none;
                        font-size: 9pt;
                        background: transparent;
                    }
            
                    /* Table */
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
            
                    td {
                        padding: 3px 0;
                        vertical-align: middle;
                    }
            
                    .col-num {
                        width: 15px;
                        font-weight: bold;
                        font-size: 9pt;
                    }
            
                    .col-label {
                        width: 180px;
                        font-weight: bold;
                        font-size: 9pt;
                    }
            
                    /* Kleine Schrift für Hilfstexte */
                    .small-label {
                        font-size: 9pt;
                        font-weight: normal;
                    }
            
                    .inline-input {
                        border: none;
                        border-bottom: 1px solid #000;
                        outline: none;
                        font-size: 8.5pt;
                        background: transparent;
                        text-align: center;
                    }
            
                    /* Krank Section */
                    .krank-container {
                        margin-top: 10px;
                        font-size: 8.7pt;
                    }
            
                    .krank-title {
                        font-weight: bold;
                        font-size: 8.6pt;
                    }
            
                    /* Bottom Grid */
                    .bottom-grid {
                        display: grid;
                        grid-template-columns: 1fr 320px;
                        gap: 15px;
                        margin-top: 10px;
                    }
            
                    .remarks-area div {
                        margin-bottom: 6px;
                        display: flex;
                        font-size: 8pt;
                        font-weight: bold;
                        align-items: center;
                    }
            
                    .doctor-box {
                        border: 1px solid #000;
                        padding: 5px;
                        min-height: 55px;
						max-width: 270px;
                        font-size: 6pt;
                    }
            
                    .doctor-stamp {
                        margin-top: 12px;
                        border-top: 1px dotted #666;
                        font-size: 6pt;
                    }
            
                    /* Signatures */
                    .signature-section {
                        display: grid;
                        grid-template-columns: 1fr 1fr; /* Zwei Spalten: Antragsteller und Vorgesetzter */
                        gap: 40px;
                        margin-top: 15px;
                    }
            
                    .sig-block {
                        /* Container für einen Unterschriftenblock */
                    }

                    .sig-row {
                        display: flex;
                        gap: 20px;
                        margin-top: 30px; /* Platz für die Unterschrift (Bild) */
                        align-items: flex-end;
                    }

                    .sig-field {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-end;
                    }
            
                    .sig-line {
                        border-bottom: 1px solid #000;
                        height: 1px;
                        width: 100%;
                        margin-bottom: 2px;
                    }

                    .sig-val {
                        text-align: center;
                        font-size: 9pt;
                        margin-bottom: 2px;
                        min-height: 15px;
                        position: relative;
                    }

                    .sig-label {
                        font-size: 7pt;
                        text-align: center;
                    }
                </style>
            </head>
                
                <body>
                <div class="logo">
                                ${logoDataUrl ? `<img src="${logoDataUrl}" style="max-height: 95px;">` : 'motherson |||'}
                            </div>
                    <div class="pdf-wrapper">
                    <div class="container">
                        ${statusStamp}
                        <div class="header">
                            <h1>Urlaubsantrag/ Abwesenheitsmeldung</h1>
                        </div>
                
                        <div class="top-fields">
                            <div class="field-group" style="flex: 2;"><label>Name:</label><input type="text" value="${data.name}"></div>
                            <div class="field-group" style="flex: 1;"><label>Pers-Nr:</label><input type="text" value="${data.personalNummer}"></div>
                            <div class="field-group" style="flex: 1;"><label>Kst./ Abtlg:</label><input type="text" value="${data.abteilung || ''}"></div>
                        </div>
                
                        <table>
                            <tr>
                                <td class="col-num">1.</td>
                                <td class="col-label">Tarifurlaub (01)</td>
                                <td>
                                    <span class="small-label">vom</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '1' ? formatGermanDate(data.dateFrom) : ''}"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '1' ? formatGermanDate(data.dateTo) : ''}">
                                    <span class="small-label">=</span> <input type="text" class="inline-input" style="width: 25px;" value="${selectedType === '1' ? workingDays : ''}"> <span class="small-label">Tage &nbsp; Rest:</span> <input type="text" class="inline-input" style="width: 50px;">
                                </td>
                            </tr>
                            <tr>
                                <td class="col-num">2.</td>
                                <td class="col-label">Abbau (Gleit-)Zeitkonto (17)</td>
                                <td>
                                    <span class="small-label">vom</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '2' ? formatGermanDate(data.dateFrom) : ''}"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '2' ? formatGermanDate(data.dateTo) : ''}">
                                    <span class="small-label">=</span> <input type="text" class="inline-input" style="width: 25px;" value="${selectedType === '2' ? workingDays : ''}"> <span class="small-label">Tage / von</span> <input type="text" class="inline-input" style="width: 35px;"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 35px;"> <span class="small-label">Uhr</span>
                                </td>
                            </tr>
                            <tr>
                                <td class="col-num">3.</td>
                                <td class="col-label">Dienstreise/- gang (97)</td>
                                <td>
                                    <span class="small-label">vom</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '3' ? formatGermanDate(data.dateFrom) : ''}"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '3' ? formatGermanDate(data.dateTo) : ''}">
                                    <span class="small-label">=</span> <input type="text" class="inline-input" style="width: 25px;" value="${selectedType === '3' ? workingDays : ''}"> <span class="small-label">Tage / von</span> <input type="text" class="inline-input" style="width: 35px;"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 35px;"> <span class="small-label">Uhr</span>
                                </td>
                            </tr>
                            <tr>
                                <td class="col-num">4.</td>
                                <td class="col-label">Schulung (74)</td>
                                <td>
                                    <span class="small-label">vom</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '4' ? formatGermanDate(data.dateFrom) : ''}"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '4' ? formatGermanDate(data.dateTo) : ''}"> <span class="small-label">=</span> <input type="text" class="inline-input" style="width: 25px;" value="${selectedType === '4' ? workingDays : ''}"> <span class="small-label">Tage</span>
                                </td>
                            </tr>
                            <tr>
                                <td class="col-num">5.</td>
                                <td class="col-label">tarifl. Freistellung (20/21)</td>
                                <td>
                                    <span class="small-label">vom</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '5' ? formatGermanDate(data.dateFrom) : ''}"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '5' ? formatGermanDate(data.dateTo) : ''}">
                                    <span class="small-label">=</span> <input type="text" class="inline-input" style="width: 25px;" value="${selectedType === '5' ? workingDays : ''}"> <span class="small-label">Tage / von</span> <input type="text" class="inline-input" style="width: 35px;"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 35px;"> <span class="small-label">Uhr</span>
                                </td>
                            </tr>
                            <tr>
                                <td class="col-num">6.</td>
                                <td class="col-label">unbez. Urlaub ( 30/34)</td>
                                <td>
                                    <span class="small-label">vom</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '6' ? formatGermanDate(data.dateFrom) : ''}"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '6' ? formatGermanDate(data.dateTo) : ''}"> <span class="small-label">=</span> <input type="text" class="inline-input" style="width: 25px;" value="${selectedType === '6' ? workingDays : ''}"> <span class="small-label">Tage</span>
                                    <span style="font-size: 6pt;">(Umzug: Adresse/Tel angeben)</span>
                                </td>
                            </tr>
                        </table>
                
                        <div class="krank-container">
                            <span class="col-num">7.</span> <span class="krank-title" style="${selectedType === '7'}">Krank (41)</span> &nbsp;
                            <span class="small-label">Datum:</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '7' ? formatGermanDate(data.dateFrom) : ''}">
                            <span class="small-label">um</span> <input type="text" class="inline-input" style="width: 35px;"> <span class="small-label">Uhr</span>
                            <span class="small-label">Schicht:</span> <input type="text" class="inline-input" style="width: 100px;">
                            <div style="margin-top: 5px; margin-left: 17px;">
                                <span class="small-label">voraussichtliche Dauer:</span> <input type="text" class="inline-input" style="width: 60%;">
                            </div>
                        </div>
                
                        <div class="bottom-grid">
                            <div class="remarks-area">
                                <div><span style="width: 80px; font-size: 8pt;">Grund 5, 6:</span> <input type="text" class="inline-input" style="width: 70%;" value="${(selectedType === '5' || selectedType === '6') ? (data.grund || '') : ''}"></div>
                                <div><span style="width: 80px; font-size: 8pt;">Bemerkung:</span> <input type="text" class="inline-input" style="width: 70%;" value="${(selectedType === '5' || selectedType === '6') ? '' : (data.grund || '')}"></div>
                                <div><span style="width: 80px; font-size: 8pt;"></span> <input type="text" class="inline-input" style="width: 70%;" value="${data.zusatzBemerkung || ''}"></div>
                            </div>
                            <div class="doctor-box">
                                <span class="small-label">Arztbesuch am</span> <input type="text" class="inline-input" style="width: 170px;">
                                <span class="small-label">von</span> <input type="text" class="inline-input" style="width: 80px;"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 80px;"> <span class="small-label">Uhr</span>
                                <div class="doctor-stamp">Unterschrift/ Stempel Arzt</div>
                            </div>
                        </div>
                
                        <div class="signature-section">
                            <div class="sig-block">
                                <strong>Antragsteller:</strong>
                                <div class="sig-row">
                                    <div class="sig-field" style="flex: 0.4;">
                                        <div class="sig-val">${new Date(data.createdDate).toLocaleDateString('de-DE')}</div>
                                        <div class="sig-line"></div>
                                        <div class="sig-label">Datum</div>
                                    </div>
                                    <div class="sig-field">
                                        <div class="sig-val" style="height: 40px; display: flex; align-items: flex-end; justify-content: flex-end;">
                                            ${data.signature ? `<img src="${data.signature}" style="max-height: 50px; max-width: 100%; position: relative; right: 55px;">` : ''}
                                        </div>
                                        <div class="sig-line"></div>
                                        <div class="sig-label">Unterschrift</div>
                                    </div>
                                </div>
                            </div>
                            <div class="sig-block">
                                <strong>Vorgesetzter:</strong>
                                <div class="sig-row">
                                    <div class="sig-field" style="flex: 0.4;">
                                        <div class="sig-val">${new Date().toLocaleDateString('de-DE')}</div>
                                        <div class="sig-line"></div>
                                        <div class="sig-label">Datum</div>
                                    </div>
                                    <div class="sig-field">
                                        <div class="sig-val" style="height: 40px; display: flex; align-items: flex-end; justify-content: center;">
                                            <img src="${managerSigData}" style="max-height: 50px; max-width: 100%;">
                                        </div>
                                        <div class="sig-line"></div>
                                        <div class="sig-label">Unterschrift</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                
                </body>
                </html>
        `;

        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        // Fix für mobile Geräte: Breite erzwingen, damit das Layout A5 Querformat entspricht
        // und nicht auf die Bildschirmbreite des Handys gequetscht wird.
        // element.style.width = '210mm';

        let pdfName = data.name;
        if (data.nachname && data.vorname) {
            pdfName = `${data.nachname}, ${data.vorname}`;
        }

        const opt = {
            margin: [5, 5, 5, 5],
            filename: `${pdfName}, ${formatGermanDate(data.dateFrom)} - ${formatGermanDate(data.dateTo)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                logging: false,
                scrollY: 0,
                scrollX: 0
            },
            jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a5' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            if (wasDarkMode) document.body.classList.add('dark-mode');
            restoreViewport();
            Toastify({ text: "PDF erfolgreich erstellt!", duration: 3000, style: { background: "#28a745" } }).showToast();
        }).catch(err => {
            if (wasDarkMode) document.body.classList.add('dark-mode');
            restoreViewport();
            console.error(err);
            alert('Fehler beim Erstellen des PDFs');
        });

    } catch (e) {
        if (wasDarkMode) document.body.classList.add('dark-mode');
        restoreViewport();
        console.error(e);
        alert('Ein Fehler ist aufgetreten');
    }
}

// NEU: Funktion zum Exportieren der Entscheidung als JSON
function exportDecisionJSON() {
    if (!currentRequestData || !managerDecision) return;

    // Grund abfragen bei Ablehnung (optional auch bei Genehmigung als Kommentar)
    let reason = '';
    if (managerDecision === 'rejected') {
        reason = prompt("Bitte geben Sie einen Grund für die Ablehnung ein:", "Betriebliche Gründe");
        if (reason === null) return; // Abbrechen
    }

    const responseData = {
        requestId: currentRequestData.requestId, // ID vom Originalantrag
        status: managerDecision, // 'approved' oder 'rejected'
        rejectionReason: reason,
        managerSignature: managerSettings.signature, // Optional zurücksenden
        processedDate: new Date().toISOString(),
        // NEU: Originalantrag mitsenden, falls der Mitarbeiter ihn gelöscht hat und wiederherstellen muss
        originalRequest: currentRequestData
    };

    const dataStr = JSON.stringify(responseData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Entscheidung_${currentRequestData.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    Toastify({ text: "Entscheidungs-Datei erstellt!", duration: 3000, style: { background: "#28a745" } }).showToast();
}