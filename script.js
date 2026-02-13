// --- AUTOMATISIERUNG DER FEIERTAGSBERECHNUNG ---

// Hilfsfunktion, um ein Datum als YYYY-MM-DD zu formatieren
function formatDate(date) {
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	return `${year}-${month}-${day}`;
}

// Hilfsfunktion für Toast-Nachrichten (Toastify)
function showToast(message, type = 'info') {
	if (typeof Toastify === 'function') {
		let backgroundColor;
		if (type === 'error') {
			backgroundColor = "#dc3545"; // Rot für Fehler
		} else if (type === 'success') {
			backgroundColor = "#28a745"; // Grün für Erfolg
		} else {
			backgroundColor = "#333"; // Dunkelgrau für Info
		}

		Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top",    // Erscheint oben
    position: "center", // Horizontal zentriert
    offset: {
        x: 0,  // Horizontale Verschiebung
        y: 50  // Vertikale Verschiebung nach unten (50px reichen meist für die Notch)
    },
    style: {
        background: backgroundColor,
    },
    stopOnFocus: true,
}).showToast();
	} else {
		alert(message); // Fallback, falls Toastify nicht geladen ist
	}
}

// Osterberechnung mit dem Gauss-Algorithmus (Computus)
function calculateEaster(year) {
	const a = year % 19;
	const b = Math.floor(year / 100);
	const c = year % 100;
	const d = Math.floor(b / 4);
	const e = b % 4;
	const f = Math.floor((b + 8) / 25);
	const g = Math.floor((b - f + 1) / 3);
	const h = (19 * a + b - d - g + 15) % 30;
	const i = Math.floor(c / 4);
	const k = c % 4;
	const l = (32 + 2 * e + 2 * i - h - k) % 7;
	const m = Math.floor((a + 11 * h + 22 * l) / 451);
	const month = Math.floor((h + l - 7 * m + 114) / 31);
	const day = ((h + l - 7 * m + 114) % 31) + 1;
	// Gibt ein Datumsobjekt für den Ostersonntag zurück
	return new Date(year, month - 1, day);
}

// Generiert alle Feiertage für ein bestimmtes Jahr
function getHolidaysForYear(year) {
	const easterSunday = calculateEaster(year);
	const holidays = [];

	const addHoliday = (date, names) => {
		holidays.push({ date: formatDate(date), names });
	};

	// Feiertage mit festem Datum
	addHoliday(new Date(year, 0, 1), holidayNames.neujahr);
	addHoliday(new Date(year, 0, 6), holidayNames.heiligeDreiKoenige);
	addHoliday(new Date(year, 4, 1), holidayNames.tagDerArbeit);
	addHoliday(new Date(year, 7, 15), holidayNames.mariaeHimmelfahrt);
	addHoliday(new Date(year, 9, 3), holidayNames.tagDerDeutschenEinheit);
	addHoliday(new Date(year, 10, 1), holidayNames.allerheiligen);
	addHoliday(new Date(year, 11, 24), holidayNames.heiligabend);
	addHoliday(new Date(year, 11, 25), holidayNames.weihnachtstag1);
	addHoliday(new Date(year, 11, 26), holidayNames.weihnachtstag2);
	addHoliday(new Date(year, 11, 31), holidayNames.silvester);

	// Feiertage, die vom Osterdatum abhängen
	const addEasterRelativeHoliday = (offset, names) => {
		const date = new Date(easterSunday);
		date.setDate(date.getDate() + offset);
		addHoliday(date, names);
	};

	addEasterRelativeHoliday(-2, holidayNames.karfreitag); // Karfreitag
	addEasterRelativeHoliday(0, holidayNames.ostersonntag); // Ostersonntag
	addEasterRelativeHoliday(1, holidayNames.ostermontag); // Ostermontag
	addEasterRelativeHoliday(39, holidayNames.christiHimmelfahrt); // Christi Himmelfahrt
	addEasterRelativeHoliday(49, holidayNames.pfingstsonntag); // Pfingstsonntag
	addEasterRelativeHoliday(50, holidayNames.pfingstmontag); // Pfingstmontag
	addEasterRelativeHoliday(60, holidayNames.fronleichnam); // Fronleichnam

	return holidays;
}

// Funktion zur Berechnung des Buß- und Bettags
function getBußUndBettag(year) {
	// Der Buß- und Bettag ist der Mittwoch vor dem 23. November
	let date = new Date(year, 10, 22); // 22. November
	while (date.getDay() !== 3) { // 3 steht für Mittwoch
		date.setDate(date.getDate() - 1);
	}
	return `${year}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

let currentCalendarYear = parseInt(localStorage.getItem('currentCalendarYear')) || new Date().getFullYear();
let notesData = JSON.parse(localStorage.getItem('calendarNotes')) || {};
let vacationData = JSON.parse(localStorage.getItem('calendarVacations')) || {};
let importantDates = JSON.parse(localStorage.getItem('importantDates')) || [];
// NEU: Telefonnummern aus localStorage laden
let phoneNumbers = JSON.parse(localStorage.getItem('phoneNumbers')) || [];
let appVersion = '...'; // Version wird dynamisch geladen

// --- SPRACHEINSTELLUNGEN ---
let currentLanguage = localStorage.getItem('calendarLanguage') || 'de';
const validLanguages = ['de', 'en', 'ru', 'tr', 'sq', 'ar', 'hr', 'sk'];
if (!validLanguages.includes(currentLanguage)) currentLanguage = 'de';

function injectLanguageSelector() {
    const settingsDialog = document.querySelector('#settingsDialogOverlay .dialog');
    if (!settingsDialog) return;

    if (document.getElementById('languageSelectorContainer')) return;

    const container = document.createElement('div');
    container.id = 'languageSelectorContainer';
    container.className = 'settings-section';
    container.innerHTML = `
        <h4>🌐 ${uiTranslations[currentLanguage].settings.language}</h4>
        <div class="settings-option">
            <select id="languageSelect" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ccc;">
                <option value="de">Deutsch 🇩🇪</option>
                <option value="en">English 🇬🇧</option>
                <option value="ru">Русский 🇷🇺</option>
                <option value="tr">Türkçe 🇹🇷</option>
                <option value="sq">Shqip 🇦🇱</option>
                <option value="ar">العربية 🇸🇦</option>
                <option value="hr">Hrvatski 🇭🇷</option>
                <option value="sk">Slovenčina 🇸🇰</option>
            </select>
        </div>
    `;

    // NEU: In den "Allgemein" Tab einfügen
    const generalTab = document.getElementById('tab-general');
    if (generalTab) generalTab.insertBefore(container, generalTab.firstChild);

    const select = document.getElementById('languageSelect');
    select.value = currentLanguage;
    select.addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        localStorage.setItem('calendarLanguage', currentLanguage);
        
        generateCalendar(currentCalendarYear);
        
        const oldDock = document.getElementById('bottomAppDock');
        if(oldDock) oldDock.remove();
        createBottomAppDock();
        
        container.querySelector('h4').textContent = '🌐 ' + uiTranslations[currentLanguage].settings.language;
        
        applyLanguageToUI(); // NEU: UI-Texte aktualisieren
        loadProfile(); // NEU: Profil-UI aktualisieren (Summary Card)
        showToast('Sprache geändert / Language changed', 'success');
    });
}

// NEU: Funktion zum Anwenden der Sprache auf statische UI-Elemente
function applyLanguageToUI() {
    const t = uiTranslations[currentLanguage];

    // Settings Dialog
    const settingsDialog = document.getElementById('settingsDialogOverlay');
    if (settingsDialog) {
        const title = settingsDialog.querySelector('h3');
        if (title) title.textContent = '⚙️ ' + t.settings.title;
        
        const setLabel = (id, text) => {
            const el = document.querySelector(`label[for="${id}"]`);
            if (el) el.textContent = text;
        };

        const setPlaceholder = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.placeholder = text;
        };
        
        setLabel('toggleAnimations', t.settings.animations);
        setLabel('toggleScrollToToday', t.settings.scrollToToday);
        setLabel('borderColorPicker', t.settings.borderColor);
        setLabel('toggleDarkMode', t.settings.darkMode);
        setLabel('toggleAutoDarkMode', t.settings.autoDarkMode);
        setLabel('profileVornameInput', t.settings.firstName);
        setLabel('profileNachnameInput', t.settings.lastName);
        setLabel('profilePersonalNummer', t.settings.personId);
        setLabel('profileAbteilung', t.settings.department);
        setLabel('profileCountWeekends', t.settings.countWeekends);

        // Tabs übersetzen
        const tabLabels = document.querySelectorAll('.settings-tab .tab-label');
        if (tabLabels.length >= 4 && t.settings.tabs) {
            tabLabels[0].textContent = t.settings.tabs.general;
            tabLabels[1].textContent = t.settings.tabs.profile;
            tabLabels[2].textContent = t.settings.tabs.shifts;
            tabLabels[3].textContent = t.settings.tabs.data;
        }

        setPlaceholder('profileVornameInput', t.settings.firstNamePlaceholder);
        setPlaceholder('profileNachnameInput', t.settings.lastNamePlaceholder);
        setPlaceholder('profilePersonalNummer', t.settings.personIdPlaceholder);
        setPlaceholder('profileAbteilung', t.settings.departmentPlaceholder);
        
        // Buttons
        
        const btnSaveShift = document.getElementById('saveCustomShiftSystem');
        if (btnSaveShift) btnSaveShift.textContent = t.settings.saveShift;
        
        const btnBackup = document.getElementById('backupSettingsButton');
        if (btnBackup) btnBackup.innerHTML = `<i class="fas fa-download"></i> ${t.settings.backupCreate}`;
        
        const btnRestore = document.getElementById('restoreSettingsButton');
        if (btnRestore) btnRestore.innerHTML = `<i class="fas fa-upload"></i> ${t.settings.restore}`;
        
        const btnSaveProfile = document.getElementById('saveProfileButton');
        if (btnSaveProfile) btnSaveProfile.textContent = t.settings.saveProfile;
        
        const btnClearSig = document.getElementById('clearSignatureButton');
        if (btnClearSig) btnClearSig.textContent = t.settings.clear;
        
        const btnResetSig = document.getElementById('resetSignatureButton');
        if (btnResetSig) btnResetSig.textContent = t.settings.reset;
        
        const btnUploadSig = document.getElementById('signatureUploadButton');
        if (btnUploadSig) btnUploadSig.textContent = t.settings.upload;

        // Version Display
        const versionDisplay = document.getElementById('versionDisplay');
        if (versionDisplay) {
            versionDisplay.textContent = `${t.settings.version}: ${appVersion}`;
        }

        // Headers in Settings (jetzt mit IDs für zuverlässige Auswahl)
        const headerProfile = document.getElementById('settingsHeaderProfile');
        if (headerProfile) headerProfile.innerHTML = `<span>${t.settings.profile}</span><i class="fas fa-chevron-down"></i>`;

        const headerCustomShift = document.getElementById('settingsHeaderCustomShift');
        if (headerCustomShift) headerCustomShift.textContent = t.settings.customShiftDetails;

        const headerBackup = document.getElementById('settingsHeaderBackup');
        if (headerBackup) headerBackup.textContent = t.settings.backupTitle;

        // Schichtfarben Header (dynamisch generiert, daher Suche im Container)
        const colorSection = document.getElementById('shiftColorSettingsSection');
        if (colorSection) {
            const h4 = colorSection.querySelector('h4');
            if (h4) h4.innerHTML = `<span>${t.settings.shiftColors}</span><i class="fas fa-chevron-down"></i>`;
        }
        
        // Shift Time Labels
        const shiftTimeLabels = settingsDialog.querySelectorAll('.shift-time-row span');
        if (shiftTimeLabels.length >= 3) {
            shiftTimeLabels[0].textContent = t.settings.early + ':';
            shiftTimeLabels[1].textContent = t.settings.late + ':';
            shiftTimeLabels[2].textContent = t.settings.night + ':';
        }

        // Shift Times Label (Header for the section)
        const shiftTimeRows = settingsDialog.querySelectorAll('.shift-time-row');
        if (shiftTimeRows.length > 0) {
            const container = shiftTimeRows[0].parentElement;
            const label = container.querySelector('label');
            if (label) label.textContent = t.settings.shiftTimesLabel;
        }
        
        // Signature Label
        const sigContainer = settingsDialog.querySelector('.signature-container');
        if (sigContainer) {
             const label = sigContainer.previousElementSibling;
             if (label && label.tagName === 'LABEL') label.textContent = t.settings.signatureLabel;
        }
        
        // Color Section Buttons
        const btnApplyColors = document.getElementById('applyShiftColorsBtn');
        if (btnApplyColors) btnApplyColors.textContent = t.settings.apply;
        const btnResetColors = document.getElementById('resetShiftColorsBtn');
        if (btnResetColors) btnResetColors.textContent = t.settings.reset;

        // Update Dropdown Options in Color Section
        if (colorSection) {
            const selects = colorSection.querySelectorAll('.shift-select');
            selects.forEach(select => {
                const options = select.options;
                for (let i = 0; i < options.length; i++) {
                    if (options[i].value === 'fruehschicht') options[i].text = t.settings.early;
                    if (options[i].value === 'spaetschicht') options[i].text = t.settings.late;
                    if (options[i].value === 'nachtschicht') options[i].text = t.settings.night;
                    if (options[i].value === 'freischicht') options[i].text = t.settings.free;
                }
            });
        }

        // Update Backup Section Text
        const backupIntro = settingsDialog.querySelector('.backup-intro');
        if (backupIntro) backupIntro.textContent = t.settings.backupIntro;
        
        const backupSteps = settingsDialog.querySelectorAll('.backup-steps li');
        if (backupSteps.length === 3) {
            backupSteps[0].textContent = t.settings.backupSteps[0];
            backupSteps[1].textContent = t.settings.backupSteps[1];
            backupSteps[2].textContent = t.settings.backupSteps[2];
        }

        // Update Custom Shift Section
        const customShiftSection = document.getElementById('customShiftSystemSection');
        if (customShiftSection) {
            // NEU: Update Model Selector (Vorlagen & Gruppen)
            const modelContainer = document.getElementById('shiftModelSelectorContainer');
            if (modelContainer) {
                const h4 = modelContainer.querySelector('h4');
                if (h4) h4.textContent = '📂 ' + (t.settings.shiftModelHeader || 'Vorlagen & Gruppen');
                
                const labels = modelContainer.querySelectorAll('label');
                if (labels[0]) labels[0].textContent = t.settings.selectModel || 'Modell:';
                if (labels[1]) labels[1].textContent = t.settings.selectGroup || 'Deine Gruppe:';
                
                const applyBtn = document.getElementById('applyModelBtn');
                if (applyBtn) applyBtn.textContent = t.settings.applyModel || 'Anwenden';
                
                const modelSelect = document.getElementById('shiftModelSelect');
                if (modelSelect && modelSelect.options[0] && modelSelect.options[0].value === "") {
                    modelSelect.options[0].text = `-- ${t.settings.selectModel || 'Vorlage wählen'} --`;
                }
            }

            const p = customShiftSection.querySelector('.small-text');
            if (p) p.innerHTML = t.settings.customShiftIntro;
            
            setLabel('customShiftSequence', t.settings.customShiftSequenceLabel);
            setPlaceholder('customShiftSequence', t.settings.customShiftSequencePlaceholder);
            setLabel('customShiftStartDate', t.settings.customShiftStartLabel);
            setLabel('customShiftStartType', t.settings.customShiftTypeLabel);

            // NEU: Sequenz und Starttyp im Eingabefeld übersetzen, wenn Sprache geändert wird
            if (typeof customShiftSystem !== 'undefined' && customShiftSystem.sequence && customShiftSystem.sequence.length > 0) {
                const tButtons = t.shiftButtons;
                if (tButtons) {
                    const translatedSequence = customShiftSystem.sequence.map(type => {
                        if (type === 'fruehschicht') return tButtons.early;
                        if (type === 'spaetschicht') return tButtons.late;
                        if (type === 'nachtschicht') return tButtons.night;
                        if (type === 'freischicht') return tButtons.free;
                        if (type === 'samstag') return tButtons.saturday;
                        if (type === 'sonntag') return tButtons.sunday;
                        return type;
                    }).join(',');
                    
                    const seqInput = document.getElementById('customShiftSequence');
                    if (seqInput) seqInput.value = translatedSequence;

                    const startTypeInput = document.getElementById('customShiftStartType');
                    if (startTypeInput && customShiftSystem.referenceShiftType) {
                        let translatedStartType = '';
                        if (customShiftSystem.referenceShiftType === 'fruehschicht') translatedStartType = tButtons.early;
                        else if (customShiftSystem.referenceShiftType === 'spaetschicht') translatedStartType = tButtons.late;
                        else if (customShiftSystem.referenceShiftType === 'nachtschicht') translatedStartType = tButtons.night;
                        else if (customShiftSystem.referenceShiftType === 'freischicht') translatedStartType = tButtons.free;
                        else if (customShiftSystem.referenceShiftType === 'samstag') translatedStartType = tButtons.saturday;
                        else if (customShiftSystem.referenceShiftType === 'sonntag') translatedStartType = tButtons.sunday;
                        
                        if (translatedStartType) startTypeInput.value = translatedStartType;
                    }
                }
            }
        }
    }

    // Important Dates Dialog
    const impDialog = document.getElementById('importantDatesDialogOverlay');
    if (impDialog) {
        const title = impDialog.querySelector('h3');
        if (title) title.textContent = '⭐ ' + t.important.title;
        
        const btnAdd = document.getElementById('addImportantDateBtn');
        if (btnAdd) btnAdd.textContent = t.important.add;
        
        const inputs = impDialog.querySelectorAll('input');
        if (inputs.length > 0) {
            const nameInput = document.getElementById('importantDateName');
            if (nameInput) nameInput.placeholder = t.important.name;
        }
        
        const recurringLabel = impDialog.querySelector('label[for="importantDateRecurring"]');
        if (recurringLabel) recurringLabel.textContent = ' ' + t.important.recurring;
    }

    // Info Dialog
    const infoDialog = document.getElementById('shiftInfoDialogOverlay');
    if (infoDialog) {
        const title = infoDialog.querySelector('h3');
        if (title) title.textContent = 'ℹ️ ' + t.info.title;
        
        // Update static labels in Info Dialog
        const infoItems = infoDialog.querySelectorAll('.shift-info-item span:not([id])');
        // Reihenfolge im HTML: Frei, Samstag, Sonntag, Feiertag, Urlaub
        if (infoItems.length >= 5) {
            infoItems[0].textContent = t.info.free;
            infoItems[1].textContent = t.info.saturday;
            infoItems[2].textContent = t.info.sunday;
            infoItems[3].textContent = t.info.holiday;
            infoItems[4].textContent = t.info.vacation;
        }

        // Update Headers and Links
        const headers = infoDialog.querySelectorAll('h3');
        if (headers.length >= 2) {
            headers[0].textContent = t.info.shiftTimesColors;
            headers[1].textContent = t.info.furtherInfo;
        }
        const linkSpan = infoDialog.querySelector('ul li span');
        if (linkSpan) linkSpan.textContent = t.info.workwear + ':';
        const linkA = infoDialog.querySelector('ul li a');
        if (linkA) linkA.textContent = t.info.toOrder;

        updateShiftInfoDisplay(); // Update dynamic text
    }

    // Vacation Dialog (Static parts)
    const vacDialog = document.getElementById('urlaubsantragDialogOverlay');
    if (vacDialog) {
        const title = vacDialog.querySelector('h3');
        if (title) title.textContent = '📝 ' + t.vacation.title;
        
        const setVacLabel = (id, text) => {
             const el = vacDialog.querySelector(`label[for="${id}"]`);
             if (el) el.textContent = text + ':';
        };
        
        // Update placeholders/labels if possible
        const nameInput = document.getElementById('urlaubsantrag_name');
        if (nameInput && nameInput.previousElementSibling) nameInput.previousElementSibling.textContent = t.vacation.name + ':';
        
        const persInput = document.getElementById('urlaubsantrag_personalnummer');
        if (persInput && persInput.previousElementSibling) persInput.previousElementSibling.textContent = t.vacation.personId + ':';
        
        const fromInput = document.getElementById('urlaubsantrag_date_from');
        if (fromInput && fromInput.previousElementSibling) fromInput.previousElementSibling.textContent = t.vacation.from + ':';
        
        const toInput = document.getElementById('urlaubsantrag_date_to');
        if (toInput && toInput.previousElementSibling) toInput.previousElementSibling.textContent = t.vacation.to + ':';
        
        const reasonInput = document.getElementById('urlaubsantrag_grund');
        if (reasonInput) {
            if (reasonInput.previousElementSibling) reasonInput.previousElementSibling.textContent = t.vacation.reason + ':';
            reasonInput.placeholder = t.vacation.reasonPlaceholder;
        }
        
        const remarkInput = document.getElementById('urlaubsantrag_zusatz_bemerkung');
        if (remarkInput) {
            if (remarkInput.previousElementSibling) remarkInput.previousElementSibling.textContent = t.vacation.remark + ':';
            remarkInput.placeholder = t.vacation.remarkPlaceholder;
        }

        const btnGen = document.getElementById('generatePdfButton');
        if (btnGen) btnGen.textContent = t.vacation.generatePdf;
        
        const btnPrint = document.getElementById('sendUrlaubsantragButton');
        if (btnPrint) btnPrint.textContent = t.vacation.print;
        
        // Update Type Radio Labels
        const typeContainer = document.getElementById('urlaubsantrag_type_container');
        if (typeContainer) {
            const label = typeContainer.querySelector('label');
            if (label) label.textContent = t.vacation.type;
            
            const radios = typeContainer.querySelectorAll('input[type="radio"]');
            radios.forEach(radio => {
                if (t.vacation.types[radio.value]) {
                    radio.nextSibling.textContent = ' ' + t.vacation.types[radio.value];
                }
            });
        }
    }

    // Phone Dialog
    const phoneDialog = document.getElementById('phoneDialogOverlay');
    if (phoneDialog) {
        const title = phoneDialog.querySelector('h3');
        if (title) title.textContent = '📞 ' + t.phone.title;
        // NEU: Dynamisches Rendern der Telefonliste aufrufen
        renderPhoneDialog();
    }

    // Year Input Dialog
    const yearDialog = document.getElementById('yearInputDialogOverlay');
    if (yearDialog) {
        const title = yearDialog.querySelector('h3');
        if (title) title.textContent = '📅 ' + t.yearInput.title;
        const label = yearDialog.querySelector('label');
        if (label) label.textContent = t.yearInput.label;
        const btn = document.getElementById('setYearButton');
        if (btn) btn.textContent = t.yearInput.confirm;
    }

    // Holiday Dialog
    const holidayDialog = document.getElementById('holidayDialogOverlay');
    if (holidayDialog) {
        const title = holidayDialog.querySelector('h3');
        if (title) title.textContent = '🌍 ' + t.holiday.title;
    }

    // Update Banner
    const updateBanner = document.getElementById('update-banner');
    if (updateBanner) {
        const span = updateBanner.querySelector('span');
        if (span) span.textContent = t.update.message;
        const btn = document.getElementById('reload-button');
        if (btn) btn.textContent = t.update.button;
    }

    injectCustomShiftButtons(); // NEU: Buttons aktualisieren, wenn Sprache geändert wird
}

// NEU: Globale Variablen für die Urlaubsauswahl im Kalender
let isSelectingVacationRange = false;
let selectionStartDate = null;

// Stellt sicher, dass die Notiz für den Buß- und Bettag für das aktuelle Jahr existiert.
function ensureBussUndBettagNote(year) {
	const bussUndBettagDate = getBußUndBettag(year);
	if (!notesData[bussUndBettagDate]) {
		notesData[bussUndBettagDate] = 'Buß- und Bettag';
	}
}

// NEUE KONSTANTEN FÜR GITHUB-DATEN
const GITHUB_USERNAME = 'alexgett'; // Passe dies an deinen GitHub-Benutzernamen an
const GITHUB_REPO_NAME = 'Schichtkalender-ManagerTest'; // Passe dies an den Namen deines GitHub-Repositorys an
const INFO_FOLDER_PATH = 'info_data'; // Der neue Ordner für deine PDFs und Bilder

// Symbolisches Passwort für das Schichtsystem
const SHIFT_SYSTEM_PASSWORD = ""; // Passwortprüfung ist jetzt deaktiviert

// --- BENUTZERDEFINIERTES SCHICHTSYSTEM ---
// Schichttypen und ihre CSS-Klassen
const SHIFT_TYPES = {
	'F': 'fruehschicht',
	'N': 'nachtschicht',
	'S': 'spaetschicht',
	'Frei': 'freischicht',
	'Früh': 'fruehschicht', // Alternative Bezeichnungen für bessere UX
	'Nacht': 'nachtschicht',
	'Spät': 'spaetschicht',
    'Sa': 'samstag',
    'So': 'sonntag'
};

// NEU: Definition der Schichtmodelle und Vorlagen
const SHIFT_MODELS = {
    'standard': {
        name: '3-Schicht (Wöchentlich: F, S, N)',
        sequence: 'N,N,N,N,N,Sa,So,S,S,S,S,S,Sa,So,F,F,F,F,F,Sa,So',
        cycleLength: 21,
        refDate: '2030-01-07',
        refType: 'nachtschicht'
    },
    '2schicht': {
        name: '2-Schicht (Wöchentlich: F, S)',
        sequence: 'F,F,F,F,F,Sa,So,S,S,S,S,S,Sa,So',
        cycleLength: 14,
        refDate: '2030-01-07',
        refType: 'fruehschicht'
    },
    'vollkonti_10': {
        name: 'Vollkonti (2F - 2S - 2N - 4Frei)',
        sequence: 'F,F,S,S,N,N,Frei,Frei,Frei,Frei',
        cycleLength: 10,
        refDate: '2030-01-01',
        refType: 'fruehschicht'
    },
    'vollkonti_8': {
        name: 'Vollkonti (2F - 2S - 2N - 2Frei)',
        sequence: 'F,F,S,S,N,N,Frei,Frei',
        cycleLength: 8,
        refDate: '2030-01-01',
        refType: 'fruehschicht'
    },
    'groupA': {
        name: 'Motherson Gruppe A',
        sequence: 'N,N,N,N,N,Sa,So,S,S,S,S,S,S,So,F,F,F,F,F,Sa,So,N,N,N,N,N,Sa,So,S,S,S,S,S,Sa,So,F,F,F,F,F,F,N',
        cycleLength: 42,
        refDate: '2030-01-07',
        refType: 'nachtschicht'
    },
    'groupB': {
        name: 'Motherson Gruppe B',
        sequence: 'N,N,N,N,N,Sa,So,S,S,S,S,S,S,So,F,F,F,F,F,Sa,So,N,N,N,N,N,Sa,So,S,S,S,S,S,Sa,So,F,F,F,F,F,F,N',
        cycleLength: 42,
        refDate: '2030-01-28',
        refType: 'nachtschicht'
    },
    '7tage': {
        name: '7-Tage-Woche (7 Arbeit - 1 Frei)',
        sequence: '', // Wird dynamisch generiert (168 Tage Zyklus)
        cycleLength: 8,
        refDate: '2024-01-01',
        refType: 'fruehschicht'
    }
};

// Laden des benutzerdefinierten Schichtsystems aus dem localStorage
let customShiftSystem = JSON.parse(localStorage.getItem('customShiftSystem')) || {
	sequence: [],
	referenceStartDate: null,
	referenceShiftType: null
};

// Standard-Schichtsystem, falls kein benutzerdefiniertes gesetzt ist
// (Dies ist ein Beispiel für ein 3-Schicht-System, falls der Benutzer noch nichts eingegeben hat)
const defaultShiftSystem = {
	sequence: ['fruehschicht', 'fruehschicht', 'fruehschicht', 'fruehschicht', 'fruehschicht', 'samstag', 'sonntag', 'nachtschicht', 'nachtschicht', 'nachtschicht', 'nachtschicht', 'nachtschicht', 'samstag', 'sonntag', 'spaetschicht', 'spaetschicht', 'spaetschicht', 'spaetschicht', 'spaetschicht', 'samstag', 'sonntag'],
	// WICHTIG: Passe dieses Datum an einen bekannten Startpunkt an, z.B. einen Montag, an dem die erste Schicht des Zyklus war
	referenceStartDate: '2030-01-07', // Beispiel: Ein Montag
	referenceShiftType: 'nachtschicht' // Beispiel: Die Schicht, die am 2025-01-06 beginnt
};

// Überprüfen, ob ein benutzerdefiniertes System gültig ist, sonst Standard verwenden
function getActiveShiftSystem() {
	if (customShiftSystem.sequence.length > 0 && customShiftSystem.referenceStartDate && customShiftSystem.referenceShiftType) {
		// Validierung der benutzerdefinierten Schichtsequenz
		const validSequence = customShiftSystem.sequence.every(shift => Object.values(SHIFT_TYPES).includes(shift));
		const validReferenceType = Object.values(SHIFT_TYPES).includes(customShiftSystem.referenceShiftType);

		if (validSequence && validReferenceType) {
			return {
				sequence: customShiftSystem.sequence,
				referenceStartDate: new Date(customShiftSystem.referenceStartDate + 'T12:00:00Z'), // Wichtig: UTC für konsistente Datumsberechnung
				referenceShiftType: customShiftSystem.referenceShiftType
			};
		}
	}
	// Fallback zum Standard, wenn kein gültiges benutzerdefiniertes System vorhanden ist
	return {
		sequence: defaultShiftSystem.sequence,
		referenceStartDate: new Date(defaultShiftSystem.referenceStartDate + 'T12:00:00Z'),
		referenceShiftType: defaultShiftSystem.referenceShiftType
	};
}
// --- ENDE ANPASSUNG FÜR INDIVIDUELLES SCHICHTSYSTEM ---


function getWeekNumber(d) {
	d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
	var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
	return weekNo;
}


function generateCalendar(year) {
	currentCalendarYear = year;
	localStorage.setItem('currentCalendarYear', year);
	document.getElementById('currentYearDisplay').textContent = year; // Aktualisiere die Jahresanzeige
	const monthGrid = document.querySelector('.month-grid');
	monthGrid.innerHTML = '';

	// Stelle sicher, dass die Buß- und Bettag-Notiz für das angezeigte Jahr vorhanden ist
	ensureBussUndBettagNote(year);

	// --- ANPASSUNG FÜR INDIVIDUELLES SCHICHTSYSTEM ---
	const activeSystem = getActiveShiftSystem();
	const shiftSequence = activeSystem.sequence;
	const referenceShiftStartDate = activeSystem.referenceStartDate;
	const referenceShiftType = activeSystem.referenceShiftType;

	// Finde den Index des Referenz-Schichttyps in der Sequenz
	const referenceShiftStartIndex = shiftSequence.indexOf(referenceShiftType);
	if (referenceShiftStartIndex === -1) {
		console.error(`Referenz-Schichttyp "${referenceShiftType}" nicht in der benutzerdefinierten Sequenz gefunden.`);
		// Fallback zur Standardsequenz, wenn der Referenztyp nicht in der benutzerdefinierten Sequenz ist
		// Dies sollte durch bessere Validierung bei der Eingabe verhindert werden.
	}
	// --- ENDE ANPASSUNG FÜR INDIVIDUELLES SCHICHTSYSTEM ---

	const orderedDayNames = uiTranslations[currentLanguage].days;
	const orderedDayIndices = [1, 2, 3, 4, 5, 6, 0];

	// Heutiges Datum für die Markierung einmalig abrufen (Performance-Optimierung)
	const todayDate = new Date();

	const CELL_WIDTH = 42;
	const CELL_HEIGHT = 42;
	const CELL_GAP = 4;

	const DAY_LABEL_WIDTH = 55;

	const MAX_COLUMNS_FOR_DATES = 6;
	const MAX_DATE_COLUMNS_WIDTH = (MAX_COLUMNS_FOR_DATES * CELL_WIDTH) + ((MAX_COLUMNS_FOR_DATES - 1) * CELL_GAP);

	const MONTH_CARD_WIDTH = DAY_LABEL_WIDTH + MAX_DATE_COLUMNS_WIDTH + (20 * 2);

	document.documentElement.style.setProperty('--cell-width', `${CELL_WIDTH}px`);
	document.documentElement.style.setProperty('--cell-height', `${CELL_HEIGHT}px`);
	document.documentElement.style.setProperty('--cell-height-kw', `${CELL_HEIGHT * 0.8}px`);
	document.documentElement.style.setProperty('--cell-gap', `${CELL_GAP}px`);
	document.documentElement.style.setProperty('--day-label-width', `${DAY_LABEL_WIDTH}px`);
	document.documentElement.style.setProperty('--month-card-width', `${MONTH_CARD_WIDTH}px`);
	document.documentElement.style.setProperty('--month-grid-gap', `30px`);

	const yearHolidays = getHolidaysForYear(year);

	for (let month = 0; month < 12; month++) {
		const monthCard = document.createElement('div');
		monthCard.classList.add('month-card');

		monthCard.innerHTML = `<div class="month-title">${new Date(year, month, 1).toLocaleString(locales[currentLanguage], { month: 'long' }).toUpperCase()}</div>`;

		const weeksData = [];
		const firstDayOfMonth = new Date(year, month, 1);
		const firstDayRelativePosition = (firstDayOfMonth.getDay() === 0) ? 6 : firstDayOfMonth.getDay() - 1;

		let currentWeek = [];

		for (let i = 0; i < firstDayRelativePosition; i++) {
			currentWeek.push({ day: '', classes: 'empty-cell', weekNumber: null });
		}

		for (let day = 1; day <= daysInMonth(year, month); day++) {
			const currentDate = new Date(year, month, day, 12, 0, 0); // 12 Uhr mittags, um DST-Probleme zu minimieren
			const dayOfWeek = currentDate.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday

			const currentFormattedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
			const holiday = yearHolidays.find(h => h.date === currentFormattedDate);
			const isVacation = vacationData[currentFormattedDate];
            const importantDateEntries = importantDates.filter(entry => entry.recurring ? entry.date.slice(5) === currentFormattedDate.slice(5) : entry.date === currentFormattedDate);

			let classes = [];
			let holidayNames = {};

			// Überprüfen, ob es der heutige Tag ist
			if (year === todayDate.getFullYear() && month === todayDate.getMonth() && day === todayDate.getDate()) {
				classes.push('heute');
			}

			if (isVacation) {
				classes.push('urlaub');
			} else if (holiday) {
				classes.push('feiertag');
				holidayNames = holiday.names;
			} else {
				// --- ANPASSUNG FÜR INDIVIDUELLES SCHICHTSYSTEM FÜR ALLE TAGE ---
				const oneDay = 1000 * 60 * 60 * 24;
				const diffDays = Math.round((currentDate.getTime() - referenceShiftStartDate.getTime()) / oneDay);

				let shiftIndex = (referenceShiftStartIndex + diffDays) % shiftSequence.length;
				if (shiftIndex < 0) {
					shiftIndex += shiftSequence.length;
				}
				const assignedShiftClass = shiftSequence[shiftIndex];

                // NEU: Logik angepasst. Frei ist jetzt immer farbig (Cyan).
                // Samstag/Sonntag Buttons erzwingen die Wochenend-Optik.
				if (assignedShiftClass === 'samstag') {
                    classes.push('samstag');
                } else if (assignedShiftClass === 'sonntag') {
                    classes.push('sonntag');
                } else {
                    // Für frueh, spaet, nacht UND frei (jetzt immer farbig)
					classes.push(assignedShiftClass);
				}
				// --- ENDE ANPASSUNG FÜR INDIVIDUELLES SCHICHTSYSTEM FÜR ALLE TAGE ---
			}

			const weekNumber = getWeekNumber(currentDate);

			currentWeek.push({ day: day, classes: classes.join(' '), originalDayOfWeek: dayOfWeek, weekNumber: weekNumber, holidayNames: holidayNames, fullDate: currentFormattedDate, importantDates: importantDateEntries });
		}

		// Fill up the last week if it's not full
		if (currentWeek.length % 7 !== 0) {
			while (currentWeek.length % 7 !== 0) {
				currentWeek.push({ day: '', classes: 'empty-cell', weekNumber: null, holidayNames: {}, fullDate: null, importantDates: [] });
			}
		}

		for (let i = 0; i < currentWeek.length; i += 7) {
			weeksData.push(currentWeek.slice(i, i + 7));
		}

		const weekNumbersContainer = document.createElement('div');
		weekNumbersContainer.classList.add('week-numbers-container');

		const kwLabelColumn = document.createElement('div');
		kwLabelColumn.classList.add('kw-label-column');
		kwLabelColumn.textContent = 'KW';
		weekNumbersContainer.appendChild(kwLabelColumn);

		const kwNumbersGrid = document.createElement('div');
		kwNumbersGrid.classList.add('kw-numbers-grid');

		const kwsInMonth = new Set();
		weeksData.forEach(week => {
			week.forEach(day => {
				if (day.weekNumber !== null) {
					kwsInMonth.add(day.weekNumber);
				}
			});
		});

		let actualKWsInMonth = Array.from(kwsInMonth);

		actualKWsInMonth.sort((a, b) => {
			const isAHigh = a > 50;
			const isBHigh = b > 50;

			if (a === 1 && isBHigh) {
				return 1;
			}
			if (b === 1 && isAHigh) {
				return -1;
			}
			return a - b;
		});

		for (let col = 0; col < MAX_COLUMNS_FOR_DATES; col++) {
			const kwCell = document.createElement('div');
			kwCell.classList.add('kw-cell');
			if (actualKWsInMonth[col] !== undefined) {
				kwCell.textContent = actualKWsInMonth[col];
			} else {
				kwCell.classList.add('empty-kw');
			}
			kwNumbersGrid.appendChild(kwCell);
		}

		weekNumbersContainer.appendChild(kwNumbersGrid);
		monthCard.appendChild(weekNumbersContainer);

		const dayGridContainer = document.createElement('div');
		dayGridContainer.classList.add('day-grid-container');

		const dayLabelColumn = document.createElement('div');
		dayLabelColumn.classList.add('day-label-column');
		dayLabelColumn.style.width = `var(--day-label-width)`;
		orderedDayNames.forEach(name => {
			const label = document.createElement('div');
			label.classList.add('day-label');
			if (name === 'So') {
				label.classList.add('sunday');
			}
			label.textContent = name;
			dayLabelColumn.appendChild(label);
		});
		dayGridContainer.appendChild(dayLabelColumn);

		const dateColumnsContainer = document.createElement('div');
		dateColumnsContainer.classList.add('date-columns-container');
		dateColumnsContainer.style.width = `${MAX_DATE_COLUMNS_WIDTH}px`;

		weeksData.forEach(week => {
			const columnDiv = document.createElement('div');
			columnDiv.classList.add('day-column');

			orderedDayIndices.forEach(dayIndex => {
				const cellData = week.find(data => data.originalDayOfWeek === dayIndex);
				const dateCell = document.createElement('div');
				if (cellData && cellData.fullDate) {
					dateCell.className = `date-cell ${cellData.classes}`;
					dateCell.dataset.fullDate = cellData.fullDate;
                    
                    let emojiHtml = '';
                    if (cellData.importantDates && cellData.importantDates.length > 0) {
                        emojiHtml = `<div class="emoji-indicator">${cellData.importantDates.map(e => e.emoji).join('')}</div>`;
                    }

					dateCell.innerHTML = `<div class="day-number">${cellData.day}</div>${emojiHtml}<div class="note-indicator"></div>`;

					// Notiz direkt beim Generieren des Kalenders setzen
					const noteText = notesData[cellData.fullDate];
					if (noteText) { // NEU: [auto] Präfix entfernen
						let displayNote = noteText.startsWith('[auto]') ? noteText.substring(7) : noteText;
                        if (displayNote === 'Buß- und Bettag') {
                            displayNote = uiTranslations[currentLanguage].bussUndBettag || displayNote;
                        }
						dateCell.querySelector('.note-indicator').textContent = displayNote;
					}

					if (Object.keys(cellData.holidayNames).length > 0) {
						dateCell.dataset.holidayNames = JSON.stringify(cellData.holidayNames);
					}
				} else {
					dateCell.classList.add('date-cell', 'empty-cell');
				}
				columnDiv.appendChild(dateCell);
			});
			dateColumnsContainer.appendChild(columnDiv);
		});

		dayGridContainer.appendChild(dateColumnsContainer);
		monthCard.appendChild(dayGridContainer);
		monthGrid.appendChild(monthCard);
	}

	document.querySelectorAll('.date-cell').forEach(cell => {
		if (!cell.classList.contains('empty-cell')) {
			cell.addEventListener('click', function(event) {
				// NEU: Auswahlmodus für Urlaubsantrag
				if (isSelectingVacationRange) {
					handleVacationSelection(this.dataset.fullDate);
					return;
				}

				const holidayNamesJson = this.dataset.holidayNames;
				if (this.classList.contains('feiertag') && holidayNamesJson && (event.target === this || event.target.classList.contains('day-number'))) {
					const holidayNames = JSON.parse(holidayNamesJson);
					const holidayTranslationsDiv = document.getElementById('holidayTranslations');
					holidayTranslationsDiv.innerHTML = '';

					for (const langCode in holidayNames) {
						const p = document.createElement('p');
						p.textContent = `${langCode.toUpperCase()}: ${holidayNames[langCode]}`;
						holidayTranslationsDiv.appendChild(p);
					}
					document.getElementById('holidayDialogOverlay').classList.add('active');
				} else {
					openNoteDialog(this);
				}
			});
		}
	});
}

function daysInMonth(year, month) {
	return new Date(year, month + 1, 0).getDate();
}

// Initialisierung bei DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
	// Lade die gespeicherten Einstellungen für das benutzerdefinierte Schichtsystem
	const storedShiftSystem = localStorage.getItem('customShiftSystem');
	if (storedShiftSystem) {
		try {
			const parsedSystem = JSON.parse(storedShiftSystem);
			document.getElementById('customShiftSequence').value = parsedSystem.sequence_input || '';
			document.getElementById('customShiftStartDate').value = parsedSystem.referenceStartDate_input || '';
			document.getElementById('customShiftStartType').value = parsedSystem.referenceShiftType_input || '';
		} catch (e) {
			console.error('Fehler beim Parsen des gespeicherten Schichtsystems:', e);
			// Optional: Daten zurücksetzen, wenn sie ungültig sind
			localStorage.removeItem('customShiftSystem');
		}
	}

	// Event Listener für Speichern des benutzerdefinierten Schichtsystems
	const saveButton = document.getElementById('saveCustomShiftSystem');
	if (saveButton) { // Sicherstellen, dass das Element existiert
		saveButton.addEventListener('click', saveCustomShiftSystem);
	}

	// Event Listener für die Preset-Buttons (Standard, Gruppe A, Gruppe B)
	const btnStandard = document.getElementById('setStandardShiftSystem');
	if (btnStandard) {
		btnStandard.addEventListener('click', () => setShiftGroup('Standard'));
	}

	const btnGroupA = document.getElementById('setGroupAShiftSystem');
	if (btnGroupA) {
		btnGroupA.addEventListener('click', () => setShiftGroup('A'));
	}

	const btnGroupB = document.getElementById('setGroupBShiftSystem');
	if (btnGroupB) {
		btnGroupB.addEventListener('click', () => setShiftGroup('B'));
	}

	// Event Listener für Backup und Restore
	const backupButton = document.getElementById('backupSettingsButton');
	const restoreButton = document.getElementById('restoreSettingsButton');

	if (backupButton) {
		backupButton.addEventListener('click', backupSettings);
	}
	if (restoreButton) {
		restoreButton.addEventListener('click', restoreSettings);
	}

	// NEU: Event Listener für den allgemeinen Einstellungs-Button
	const openSettingsBtn = document.getElementById('openSettingsDialog');
	if (openSettingsBtn) {
		openSettingsBtn.addEventListener('click', () => {
			toggleSettingsVisibility('general');
		});
	}

    // Event Listener für Wichtige Termine
    const addImportantDateBtn = document.getElementById('addImportantDateBtn');
    if (addImportantDateBtn) {
        addImportantDateBtn.addEventListener('click', addImportantDate);
    }
    
    // Titel des Dialogs anpassen und Inhalt zwischen h3 und h4 entfernen
    const impDialog = document.getElementById('importantDatesDialogOverlay');
    if(impDialog) {
        const h3 = impDialog.querySelector('h3');
        const h4 = impDialog.querySelector('h4');
        if(h3) h3.textContent = '⭐ Notizen';
        
        if (h3 && h4) {
            let nextSibling = h3.nextElementSibling;
            while (nextSibling && nextSibling !== h4) {
                const toRemove = nextSibling;
                nextSibling = nextSibling.nextElementSibling;
                toRemove.remove();
            }
        }
    }

    // Event Listener für Emoji-Schnellauswahl
    document.querySelectorAll('.emoji-option').forEach(option => {
        option.addEventListener('click', () => {
            document.getElementById('importantDateEmoji').value = option.textContent;
        });
    });

    // Icons zu den Dialog-Überschriften hinzufügen
    const dialogIcons = {
        'phoneDialogOverlay': '📞',
        'shiftInfoDialogOverlay': 'ℹ️',
        'settingsDialogOverlay': '⚙️',
        'holidayDialogOverlay': '🌍',
        'yearInputDialogOverlay': '📅',
        'urlaubsantragDialogOverlay': '📝'
    };

    for (const [id, icon] of Object.entries(dialogIcons)) {
        const dialog = document.getElementById(id);
        if (dialog) {
            const h3 = dialog.querySelector('h3');
            if (h3 && !h3.textContent.includes(icon)) {
                h3.textContent = `${icon} ${h3.textContent}`;
            }
        }
    }

    renderImportantDatesList();

    injectLanguageSelector(); // NEU: Sprachauswahl einfügen
    applyLanguageToUI(); // NEU: Initiale Übersetzung anwenden

    determineAppVersion(); // NEU: Version vom Service Worker abrufen

	generateCalendar(currentCalendarYear); // Initialer Kalenderaufbau

    injectModelSelector(); // NEU: Modell-Auswahl in Einstellungen einfügen

    // TABS INITIALISIERUNG
    const tabs = document.querySelectorAll('.settings-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            switchSettingsTab(target);
        });
    });

	registerServiceWorker(); // Service Worker mit Update-Funktion registrieren
	createBottomAppDock(); // NEU: Untere App-Leiste erstellen und Elemente verschieben

    // NEU: Zum aktuellen Tag scrollen, falls aktiviert
    if (localStorage.getItem('scrollToTodayEnabled') === 'true') {
        setTimeout(() => {
            const today = new Date();
            if (today.getFullYear() === currentCalendarYear) {
                const todayMonth = today.getMonth();
                const monthCards = document.querySelectorAll('.month-card');
                if (monthCards[todayMonth]) {
                    monthCards[todayMonth].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, 800); // Kurze Verzögerung für Rendering
    }
});

// NEU: Funktion zum Abrufen der Version aus dem Service Worker
function determineAppVersion() {
    const updateUI = (ver) => {
        appVersion = ver;
        const versionDisplay = document.getElementById('versionDisplay');
        if (versionDisplay && uiTranslations[currentLanguage]) {
            versionDisplay.textContent = `${uiTranslations[currentLanguage].settings.version}: ${appVersion}`;
        }
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
            if (event.data && event.data.version) {
                updateUI(event.data.version);
            }
        };
        navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
    } else {
        // Fallback: Versuche die Datei direkt zu lesen (z.B. beim ersten Laden)
        fetch('./service-worker.js')
            .then(res => res.text())
            .then(text => {
                const match = text.match(/CACHE_NAME\s*=\s*['"`].*v(\d+\.\d+\.\d+)['"`]/);
                if (match) updateUI(match[1]);
            })
            .catch(err => console.log('Version detection failed', err));
    }
}

// NEU: Funktion zum Wechseln der Tabs
function switchSettingsTab(tabName) {
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const activeTab = document.querySelector(`.settings-tab[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`tab-${tabName}`);

    if (activeTab) activeTab.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
}

// --- FUNKTIONEN FÜR BENUTZERDEFINIERTES SCHICHTSYSTEM ---
function injectCustomShiftButtons() {
    const input = document.getElementById('customShiftSequence');
    if (!input) return;

    // Input verstecken
    input.style.display = 'none';

    // Starttyp-Input verstecken, da wir diesen automatisch aus dem ersten Tag der Sequenz ermitteln
    const startTypeInput = document.getElementById('customShiftStartType');
    if (startTypeInput && startTypeInput.parentElement) {
        startTypeInput.parentElement.style.display = 'none';
    }

    // Container für den visuellen Builder erstellen
    let builderContainer = document.getElementById('visualShiftBuilder');
    if (!builderContainer) {
        builderContainer = document.createElement('div');
        builderContainer.id = 'visualShiftBuilder';
        // Container-Klasse wird im render gesetzt oder ist generisch
        input.parentNode.insertBefore(builderContainer, input);
    }

    // Event Listener für Startdatum, um die Tage im Builder zu aktualisieren
    const startDateInput = document.getElementById('customShiftStartDate');
    if (startDateInput) {
        startDateInput.addEventListener('change', renderSequenceCalendar);
    }

    // Funktion am Input speichern für externen Zugriff
    input.renderVisuals = renderSequenceCalendar;

    // Initial rendern
    renderSequenceCalendar();
}

// NEU: Funktion zum Rendern des Sequenz-Kalenders
function renderSequenceCalendar() {
    const container = document.getElementById('visualShiftBuilder');
    if (!container) return;
    
    const input = document.getElementById('customShiftSequence');
    const startDateInput = document.getElementById('customShiftStartDate');
    
    container.innerHTML = '';
    
    let sequence = input.value.split(',').filter(x => x.trim() !== '');
    let startDate = new Date();
    if (startDateInput && startDateInput.value) {
        startDate = new Date(startDateInput.value);
    }
    
    // Wochentag des Startdatums ermitteln (0=So, 1=Mo, ..., 6=Sa)
    // Wir wollen Mo=0, ..., So=6 für das Raster
    let startDayOfWeek = startDate.getDay(); 
    let gridStartOffset = (startDayOfWeek + 6) % 7;

    // Grid erstellen
    const grid = document.createElement('div');
    grid.className = 'sequence-calendar-grid';

    // Header (Mo, Di, ...)
    const days = uiTranslations[currentLanguage].days;
    days.forEach(d => {
        const header = document.createElement('div');
        header.className = 'seq-cal-header';
        header.textContent = d;
        grid.appendChild(header);
    });

    // Leere Zellen für Offset am Anfang
    for(let i=0; i<gridStartOffset; i++) {
        const empty = document.createElement('div');
        empty.className = 'seq-cal-cell empty';
        empty.style.cursor = 'default';
        empty.style.background = 'transparent';
        empty.style.border = 'none';
        grid.appendChild(empty);
    }

    // Sequenz-Tage rendern
    sequence.forEach((shift, index) => {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + index);
        
        const dateLabel = currentDate.getDate();
        
        const cell = document.createElement('div');
        cell.className = 'seq-cal-cell filled';
        
        // Style basierend auf Schicht bestimmen
        let shiftClass = '';
        let shiftLabel = shift.substring(0, 1).toUpperCase();
        const sLower = shift.toLowerCase();
        const t = uiTranslations[currentLanguage].shiftButtons;
        
        if (sLower === 'fruehschicht' || sLower === 'f' || sLower === t.early.toLowerCase()) { shiftClass = 'fruehschicht'; shiftLabel = t.early; }
        else if (sLower === 'spaetschicht' || sLower === 's' || sLower === t.late.toLowerCase()) { shiftClass = 'spaetschicht'; shiftLabel = t.late; }
        else if (sLower === 'nachtschicht' || sLower === 'n' || sLower === t.night.toLowerCase()) { shiftClass = 'nachtschicht'; shiftLabel = t.night; }
        else if (sLower === 'freischicht' || sLower === 'frei' || sLower === t.free.toLowerCase()) { shiftClass = 'freischicht'; shiftLabel = t.free; }
        else if (sLower === 'samstag' || sLower === 'sa' || sLower === t.saturday.toLowerCase()) { shiftClass = 'samstag'; shiftLabel = t.saturday; }
        else if (sLower === 'sonntag' || sLower === 'so' || sLower === t.sunday.toLowerCase()) { shiftClass = 'sonntag'; shiftLabel = t.sunday; }
        
        cell.classList.add(shiftClass);
        cell.innerHTML = `<span class="seq-date">${dateLabel}</span><span class="seq-shift">${shiftLabel}</span>`;
        
        // Klick zum Ändern der Schicht
        cell.addEventListener('click', () => {
            openShiftPicker((newShift) => {
                sequence[index] = newShift;
                input.value = sequence.join(',');
                renderSequenceCalendar();
            });
        });
        
        grid.appendChild(cell);
    });
    
    // Plus-Button am Ende
    const addBtn = document.createElement('div');
    addBtn.className = 'seq-cal-cell add-btn';
    addBtn.innerHTML = '<i class="fas fa-plus"></i>';
    addBtn.title = "Tag zum Zyklus hinzufügen";
    addBtn.addEventListener('click', () => {
        // Standardmäßig Frühschicht oder die letzte Schicht kopieren
        const defaultShift = uiTranslations[currentLanguage].shiftButtons.early;
        sequence.push(defaultShift);
        input.value = sequence.join(',');
        renderSequenceCalendar();
    });
    grid.appendChild(addBtn);
    
    container.appendChild(grid);

    // Löschen-Button unter dem Kalender (nur wenn Sequenz existiert)
    if (sequence.length > 0) {
        const controls = document.createElement('div');
        controls.style.marginTop = '5px';
        controls.style.textAlign = 'right';
        controls.innerHTML = `<button type="button" class="delete-button" style="width:auto; padding:5px 10px; font-size:0.9em;"><i class="fas fa-backspace"></i> ${uiTranslations[currentLanguage].shiftButtons.backspace || 'Löschen'}</button>`;
        controls.querySelector('button').onclick = () => {
            sequence.pop();
            input.value = sequence.join(',');
            renderSequenceCalendar();
        };
        container.appendChild(controls);
    }
}

// NEU: Schicht-Auswahl-Modal
function openShiftPicker(callback) {
    const overlay = document.createElement('div');
    overlay.className = 'shift-picker-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'shift-picker-modal';
    
    const t = uiTranslations[currentLanguage].shiftButtons;
    const options = [
        { label: t.early, val: t.early, cls: 'fruehschicht' },
        { label: t.late, val: t.late, cls: 'spaetschicht' },
        { label: t.night, val: t.night, cls: 'nachtschicht' },
        { label: t.free, val: t.free, cls: 'freischicht' },
        { label: t.saturday, val: t.saturday, cls: 'samstag' },
        { label: t.sunday, val: t.sunday, cls: 'sonntag' }
    ];
    
    options.forEach(opt => {
        const btn = document.createElement('div');
        btn.className = `shift-picker-option ${opt.cls}`;
        btn.textContent = opt.label;
        btn.onclick = () => {
            callback(opt.val);
            document.body.removeChild(overlay);
        };
        modal.appendChild(btn);
    });
    
    overlay.appendChild(modal);
    
    // Schließen bei Klick außerhalb
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) document.body.removeChild(overlay);
    });
    
    document.body.appendChild(overlay);
}

function saveCustomShiftSystem() {
	const sequenceInput = document.getElementById('customShiftSequence').value.trim();
	const startDateInput = document.getElementById('customShiftStartDate').value; //YYYY-MM-DD
	// const startTypeInput = document.getElementById('customShiftStartType').value.trim(); // Nicht mehr benötigt

	// Eingaben validieren
	if (!sequenceInput || !startDateInput) {
		showToast(uiTranslations[currentLanguage].prompts.fillAllFields, 'error');
		return;
	}

    const t = uiTranslations[currentLanguage].shiftButtons || uiTranslations['de'].shiftButtons;

	const sequenceArrayRaw = sequenceInput.split(',').map(s => s.trim().toLowerCase());
	const sequenceArray = sequenceArrayRaw.map(s => {
        // Prüfen gegen die aktuellen Button-Werte (Übersetzung)
        if (s === t.early.toLowerCase()) return 'fruehschicht';
        if (s === t.late.toLowerCase()) return 'spaetschicht';
        if (s === t.night.toLowerCase()) return 'nachtschicht';
        if (s === t.free.toLowerCase()) return 'freischicht';
        if (s === t.saturday.toLowerCase()) return 'samstag';
        if (s === t.sunday.toLowerCase()) return 'sonntag';

        // Fallbacks für Standard-Eingaben (Deutsch/Englisch)
		if (['f', 'früh', 'e', 'early'].includes(s)) return 'fruehschicht';
		if (['n', 'nacht', 'night'].includes(s)) return 'nachtschicht';
		if (['s', 'spät', 'l', 'late'].includes(s)) return 'spaetschicht';
		if (['frei', 'free'].includes(s)) return 'freischicht';
        
        if (['sa', 'samstag', 'sat', 'saturday'].includes(s)) return 'samstag';
        if (['so', 'sonntag', 'sun', 'sunday'].includes(s)) return 'sonntag';

		return null; // Ungültiger Typ
	}).filter(s => s !== null); // Entferne ungültige Einträge

	if (sequenceArray.length === 0 || sequenceArray.length !== sequenceArrayRaw.length) {
		showToast(uiTranslations[currentLanguage].prompts.invalidSequence, 'error');
		return;
	}

	// NEU: Der Starttyp ist IMMER der erste Eintrag der Sequenz, da der Benutzer
    // den Zyklus ab dem Startdatum definiert.
    const parsedStartType = sequenceArray[0];
    const startTypeInput = parsedStartType; // Für Kompatibilität

	// Speichere die Eingabewerte, um sie beim Laden wieder anzuzeigen
	customShiftSystem = {
		sequence: sequenceArray,
		referenceStartDate: startDateInput,
		referenceShiftType: parsedStartType,
		sequence_input: sequenceInput, // Speichere die Roh-Eingabe
		referenceStartDate_input: startDateInput, // Speichere die Roh-Eingabe
		referenceShiftType_input: startTypeInput // Speichere die Roh-Eingabe
	};

	localStorage.setItem('customShiftSystem', JSON.stringify(customShiftSystem));
	showToast(uiTranslations[currentLanguage].prompts.shiftSystemSaved, 'success');
	generateCalendar(currentCalendarYear); // Kalender neu generieren
	document.getElementById('settingsDialogOverlay').classList.remove('active'); // Dialog schließen
}

// NEU: Funktion zum Einfügen des Modell-Selectors in die Einstellungen
function injectModelSelector() {
    const container = document.getElementById('customShiftSystemSection');
    if (!container || document.getElementById('shiftModelSelectorContainer')) return;

    const t = uiTranslations[currentLanguage];
    const wrapper = document.createElement('div');
    wrapper.id = 'shiftModelSelectorContainer';
    wrapper.className = 'settings-section';
    wrapper.style.marginBottom = '20px';
    wrapper.style.backgroundColor = '#f0f0f0';
    
    let optionsHtml = `<option value="">-- ${t.settings.selectModel || 'Vorlage wählen'} --</option>`;
    for (const [key, model] of Object.entries(SHIFT_MODELS)) {
        optionsHtml += `<option value="${key}">${model.name}</option>`;
    }

    wrapper.innerHTML = `
        <h4 style="margin-top:0; margin-bottom:10px;">📂 ${t.settings.shiftModelHeader || 'Vorlagen & Gruppen'}</h4>
        <div class="settings-option">
            <label>${t.settings.selectModel || 'Modell:'}</label>
            <select id="shiftModelSelect" style="width:100%; padding:8px; border-radius:5px;">
                ${optionsHtml}
            </select>
        </div>
        <div class="settings-option" id="groupOffsetContainer" style="display:none;">
            <label>${t.settings.selectGroup || 'Deine Gruppe:'}</label>
            <select id="shiftGroupSelect" style="width:100%; padding:8px; border-radius:5px;">
                <!-- Wird dynamisch gefüllt -->
            </select>
        </div>
        <button id="applyModelBtn" class="confirm-button" style="width:100%; margin-top:10px;">${t.settings.applyModel || 'Anwenden'}</button>
        <hr style="margin: 15px 0;">
    `;

    // Einfügen VOR den manuellen Eingabefeldern
    container.insertBefore(wrapper, container.firstChild);

    const modelSelect = document.getElementById('shiftModelSelect');
    const groupSelect = document.getElementById('shiftGroupSelect');
    const groupContainer = document.getElementById('groupOffsetContainer');
    const applyBtn = document.getElementById('applyModelBtn');

    modelSelect.addEventListener('change', () => {
        const key = modelSelect.value;
        if (key && SHIFT_MODELS[key]) {
            const model = SHIFT_MODELS[key];
            groupSelect.innerHTML = '';
            
            // Gruppen basierend auf Zykluslänge generieren
            // Bei 8 Tagen Zyklus gibt es 8 mögliche Starttage (Gruppen)
            const maxGroups = model.cycleLength > 60 ? 1 : model.cycleLength; // Begrenzung für sehr lange Zyklen
            
            for (let i = 0; i < maxGroups; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `Gruppe ${i + 1}`;
                groupSelect.appendChild(option);
            }
            groupContainer.style.display = 'block';
        } else {
            groupContainer.style.display = 'none';
        }
    });

    applyBtn.addEventListener('click', () => {
        const key = modelSelect.value;
        const offset = parseInt(groupSelect.value) || 0;
        
        if (key && SHIFT_MODELS[key]) {
            const model = SHIFT_MODELS[key];
            let sequence = model.sequence;
            let refDate = new Date(model.refDate);
            
            // Speziallogik für 7-Tage-Modell (56 Tage Sequenz generieren)
            if (key === '7tage') {
                // Wir generieren eine 56-Tage Sequenz (LCM von 7 und 8)
                // Startdatum muss ein Montag sein (2024-01-01 ist Montag)
                // Offset verschiebt den "Frei"-Tag im 8-Tage-Zyklus
                
                let seqArr = [];
                // Wochen-Rotation: F, S, N, F, S, N, F, S (8 Wochen)
                const weekRotation = ['F', 'S', 'F', 'S', 'F', 'S', 'F', 'S'];

                for(let i=0; i<56; i++) {
                    // 8-Tage Zyklus Berechnung mit Offset
                    // Offset 0: Tag 7 ist Frei (Index 7, 15...) -> W W W W W W W F
                    // Offset 1: Tag 0 ist Frei (Index 0, 8...) -> F W W W W W W W (Frei ist einen Tag später im Kalender relativ zum Start, wenn wir den Starttag verschieben würden, aber hier verschieben wir den Zyklus)
                    // User will: "Gruppe die einen Tag später schichtfrei haben".
                    // Das bedeutet, wir verschieben den Index des freien Tages.
                    
                    // Berechnung des Zyklus-Index (0-7)
                    // Wir nutzen (i - offset) um den Zyklus zu verschieben
                    let cycleIndex = (i - offset) % 8;
                    if (cycleIndex < 0) cycleIndex += 8;

                    if (cycleIndex === 7) {
                        seqArr.push('Frei');
                    } else {
                        // Wochentag bestimmen (0=Mo, ..., 6=So) da refDate ein Montag ist
                        const weekday = i % 7;
                        const weekIndex = Math.floor(i / 7);
                        const baseShift = weekRotation[weekIndex];

                        if (weekday === 6) { // Sonntag
                            seqArr.push('N'); // Sonntag immer Nacht
                        } else if (weekday === 5) { // Samstag
                            // Samstag entspricht der Schichtwoche (Früh oder Spät)
                            seqArr.push(baseShift);
                        } else { // Mo-Fr
                            seqArr.push(baseShift);
                        }
                    }
                }
                sequence = seqArr.join(',');
                // Bei diesem Modell bleibt das Startdatum fix auf dem Referenz-Montag,
                // damit die Wochentags-Logik (Mo-Fr, Sa, So) stimmt.
            } else {
                // Für andere Modelle: Startdatum verschieben
                refDate.setDate(refDate.getDate() + offset);
            }

            const newStartDate = formatDate(refDate);

            // Werte in die Inputs setzen und speichern
            document.getElementById('customShiftSequence').value = sequence;
            document.getElementById('customShiftStartDate').value = newStartDate;
            
            // Visuals aktualisieren falls vorhanden
            const seqInput = document.getElementById('customShiftSequence');
            if (seqInput.renderVisuals) seqInput.renderVisuals();

            saveCustomShiftSystem(); // Speichern auslösen
        }
    });
}

// Funktion zum Einstellen der Gruppen A und B
function setShiftGroup(group) {
	let sequenceInput = "";
	let startDate = "";
	let startType = "";
	let startTypeInput = "";

	if (group === 'A') {
		sequenceInput = "N,N,N,N,N,Sa,So,S,S,S,S,S,S,So,F,F,F,F,F,Sa,So,N,N,N,N,N,Sa,So,S,S,S,S,S,Sa,So,F,F,F,F,F,F,N";
		startDate = "2030-01-07";
		startType = "nachtschicht";
		startTypeInput = "Nacht";
	} else if (group === 'B') {
		sequenceInput = "N,N,N,N,N,Sa,So,S,S,S,S,S,S,So,F,F,F,F,F,Sa,So,N,N,N,N,N,Sa,So,S,S,S,S,S,Sa,So,F,F,F,F,F,F,N";
		startDate = "2030-01-28";
		startType = "nachtschicht";
		startTypeInput = "Nacht";
	} else if (group === 'Standard') {
		sequenceInput = "N,N,N,N,N,Sa,So,S,S,S,S,S,Sa,So,F,F,F,F,F,Sa,So";
		startDate = "2030-01-07";
		startType = "nachtschicht";
		startTypeInput = "Nacht";
	} else {
		return;
	}

	// Sequenz parsen
	const sequenceArrayRaw = sequenceInput.split(',').map(s => s.trim());
	const sequenceArray = sequenceArrayRaw.map(s => {
		const lower = s.toLowerCase();
		if (lower === 'f' || lower === 'früh') return 'fruehschicht';
		if (lower === 'n' || lower === 'nacht') return 'nachtschicht';
		if (lower === 's' || lower === 'spät') return 'spaetschicht';
		if (lower === 'frei') return 'freischicht';
		if (lower === 'sa' || lower === 'samstag') return 'samstag';
		if (lower === 'so' || lower === 'sonntag') return 'sonntag';
		return 'freischicht'; // Fallback
	});

	const newCustomShiftSystem = {
		sequence: sequenceArray,
		referenceStartDate: startDate,
		referenceShiftType: startType,
		sequence_input: sequenceInput,
		referenceStartDate_input: startDate,
		referenceShiftType_input: startTypeInput
	};

	localStorage.setItem('customShiftSystem', JSON.stringify(newCustomShiftSystem));
	customShiftSystem = newCustomShiftSystem;

	// Update UI inputs
	const seqInput = document.getElementById('customShiftSequence');
    seqInput.value = sequenceInput;
    if (seqInput.renderVisuals) seqInput.renderVisuals(); // Visuals aktualisieren

	document.getElementById('customShiftStartDate').value = startDate;
	document.getElementById('customShiftStartType').value = startTypeInput;

	showToast(uiTranslations[currentLanguage].prompts.groupSet.replace('{0}', group), 'success');
	generateCalendar(currentCalendarYear);
	document.getElementById('settingsDialogOverlay').classList.remove('active');
}
// --- ENDE FUNKTIONEN FÜR BENUTZERDEFINIERTES SCHICHTSYSTEM ---

// --- FUNKTIONEN FÜR WICHTIGE TERMINE ---

// NEUE HILFSFUNKTION zum Aktualisieren der automatischen Notiz für ein Datum
function updateAutoNoteForDate(dateStr) {
    // Finde alle wichtigen Termine für dieses Datum
    // NEU: Urlaubstypen (1,2,5,6) ausschließen, damit sie nicht als Text im Kalender erscheinen
    const datesOnThisDay = importantDates.filter(d => d.date === dateStr && d.type !== 'vacation');

    // Wenn keine Termine mehr an diesem Tag sind, lösche die Auto-Notiz (falls vorhanden)
    if (datesOnThisDay.length === 0) {
        if (notesData[dateStr] && notesData[dateStr].startsWith('[auto]')) {
            delete notesData[dateStr];
        }
    } else {
        // Erstelle eine neue kombinierte Auto-Notiz
        const combinedNote = datesOnThisDay.map(d => `${d.emoji} ${d.name}`.trim()).join(', ');
        const autoNoteText = `[auto] ${combinedNote}`;

        // Setze die Notiz, aber nur, wenn keine manuelle Notiz existiert
        if (!notesData[dateStr] || (notesData[dateStr] && notesData[dateStr].startsWith('[auto]'))) {
            notesData[dateStr] = autoNoteText;
        }
    }
    // Speichere die (möglicherweise geänderten) Notizen
    localStorage.setItem('calendarNotes', JSON.stringify(notesData));
}

function addImportantDate() {
    const dateInput = document.getElementById('importantDateInput').value;
    const nameInput = document.getElementById('importantDateName').value.trim();
    const emojiInput = document.getElementById('importantDateEmoji').value.trim();
    const recurringInput = document.getElementById('importantDateRecurring').checked;

    if (!dateInput || !nameInput || !emojiInput) {
        showToast(uiTranslations[currentLanguage].prompts.fillAllFields, 'error');
        return;
    }

    const newEntry = {
        id: Date.now(),
        date: dateInput,
        name: nameInput,
        emoji: emojiInput,
        recurring: recurringInput
    };

    importantDates.push(newEntry);
    localStorage.setItem('importantDates', JSON.stringify(importantDates));
    
    // NEU: Automatische Notiz aktualisieren
    updateAutoNoteForDate(dateInput);

    // Reset Inputs
    document.getElementById('importantDateName').value = '';
    document.getElementById('importantDateEmoji').value = '';
    
    renderImportantDatesList();
    generateCalendar(currentCalendarYear);
    showToast(uiTranslations[currentLanguage].prompts.dateAdded, 'success');
}

function deleteImportantDate(id) {
    const entryToDelete = importantDates.find(entry => entry.id === id);
    if (!entryToDelete) return;
    const dateOfDeletedEntry = entryToDelete.date;

    importantDates = importantDates.filter(entry => entry.id !== id);
    localStorage.setItem('importantDates', JSON.stringify(importantDates));

    // NEU: Automatische Notiz für das betroffene Datum aktualisieren
    updateAutoNoteForDate(dateOfDeletedEntry);

    renderImportantDatesList();
    generateCalendar(currentCalendarYear);
    showToast(uiTranslations[currentLanguage].prompts.dateDeleted, 'info');
}

function renderImportantDatesList() {
    const list = document.getElementById('importantDatesList');
    if (!list) return;
    list.innerHTML = '';

    // Sortieren nach Datum (MM-DD)
    // NEU: Urlaubs-Einträge (Typ vacation) ausblenden
    const filteredDates = importantDates.filter(entry => entry.type !== 'vacation');
    const sortedDates = [...filteredDates].sort((a, b) => {
        const dateA = a.date.slice(5);
        const dateB = b.date.slice(5);
        return dateA.localeCompare(dateB);
    });

    sortedDates.forEach(entry => {
        const li = document.createElement('li');
        li.className = 'important-date-item';
        const dateDisplay = entry.recurring ? entry.date.slice(5).split('-').reverse().join('.') + ' (jährl.)' : entry.date.split('-').reverse().join('.');
        
        li.innerHTML = `
            <div class="date-info">
                <span class="date-emoji">${entry.emoji}</span>
                <span class="date-text"><strong>${dateDisplay}</strong>: ${entry.name}</span>
            </div>
            <button class="delete-date-btn" onclick="deleteImportantDate(${entry.id})">&times;</button>
        `;
        list.appendChild(li);
    });
}
// --- ENDE FUNKTIONEN FÜR WICHTIGE TERMINE ---

// --- NEU: FUNKTIONEN FÜR TELEFONNUMMERN-VERWALTUNG ---
let isPhoneManagementMode = false;

function renderPhoneDialog() {
    const dialogOverlay = document.getElementById('phoneDialogOverlay');
    if (!dialogOverlay) return;
    const dialog = dialogOverlay.querySelector('.dialog');
    if (!dialog) return;

    const t = uiTranslations[currentLanguage];
    
    // Titel sicherstellen
    let h3 = dialog.querySelector('h3');
    if (!h3) {
        h3 = document.createElement('h3');
        dialog.prepend(h3);
    }
    h3.textContent = '📞 ' + t.phone.title;

    // Schließen-Button finden
    const closeBtn = dialog.querySelector('.close-button');
    
    // Alles außer Titel und Schließen-Button entfernen
    Array.from(dialog.children).forEach(child => {
        if (child !== h3 && child !== closeBtn) {
            child.remove();
        }
    });

    if (!isPhoneManagementMode) {
        // ANSICHTS-MODUS
        const ul = document.createElement('ul');
        ul.className = 'phone-list';
        
        if (phoneNumbers.length === 0) {
            ul.innerHTML = `<li style="justify-content:center; color:#666;">${t.overview.empty || 'Keine Nummern'}</li>`;
        } else {
            phoneNumbers.forEach(entry => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${entry.name}:</span>
                    <a href="tel:${entry.number}">${entry.number}</a>
                `;
                ul.appendChild(li);
            });
        }
        dialog.appendChild(ul);

        const manageBtn = document.createElement('button');
        manageBtn.className = 'action-button';
        manageBtn.style.marginTop = '20px';
        manageBtn.textContent = t.phone.manage;
        manageBtn.onclick = () => {
            isPhoneManagementMode = true;
            renderPhoneDialog();
        };
        dialog.appendChild(manageBtn);

    } else {
        // VERWALTUNGS-MODUS
        const listContainer = document.createElement('div');
        listContainer.style.maxHeight = '40vh';
        listContainer.style.overflowY = 'auto';
        listContainer.style.marginBottom = '15px';

        phoneNumbers.forEach((entry, index) => {
            const row = document.createElement('div');
            row.className = 'phone-manage-row';
            
            // Container für Info (Anzeige & Bearbeitung)
            const infoDiv = document.createElement('div');
            infoDiv.className = 'phone-info';
            infoDiv.style.flexGrow = '1';

            // Anzeige-Modus
            const displayDiv = document.createElement('div');
            displayDiv.className = 'phone-display';
            displayDiv.innerHTML = `<strong>${entry.name}</strong><br><small>${entry.number}</small>`;

            // Bearbeitungs-Modus (initial ausgeblendet)
            const editDiv = document.createElement('div');
            editDiv.className = 'phone-edit';
            editDiv.style.display = 'none';
            
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = entry.name;
            nameInput.style.width = '95%';
            nameInput.style.marginBottom = '5px';
            nameInput.style.padding = '5px';
            
            const numberInput = document.createElement('input');
            numberInput.type = 'tel';
            numberInput.value = entry.number;
            numberInput.style.width = '95%';
            numberInput.style.padding = '5px';

            editDiv.appendChild(nameInput);
            editDiv.appendChild(numberInput);

            infoDiv.appendChild(displayDiv);
            infoDiv.appendChild(editDiv);

            // Buttons
            const actionsDiv = document.createElement('div');
            actionsDiv.style.display = 'flex';
            actionsDiv.style.alignItems = 'center';

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-phone-btn';
            editBtn.innerHTML = '<i class="fas fa-pen"></i>';
            editBtn.title = t.phone.edit;

            const saveBtn = document.createElement('button');
            saveBtn.className = 'save-phone-btn';
            saveBtn.innerHTML = '<i class="fas fa-save"></i>';
            saveBtn.title = t.phone.save;
            saveBtn.style.display = 'none';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-phone-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = t.phone.delete;

            // Event Listener
            editBtn.onclick = () => {
                displayDiv.style.display = 'none';
                editDiv.style.display = 'block';
                editBtn.style.display = 'none';
                saveBtn.style.display = 'inline-block';
            };

            saveBtn.onclick = () => {
                const newName = nameInput.value.trim();
                const newNumber = numberInput.value.trim();
                if (newName && newNumber) {
                    phoneNumbers[index] = { name: newName, number: newNumber };
                    localStorage.setItem('phoneNumbers', JSON.stringify(phoneNumbers));
                    renderPhoneDialog();
                } else {
                    showToast(t.prompts.fillAllFields, 'error');
                }
            };

            deleteBtn.onclick = () => {
                if(confirm(t.prompts.deleteEntryConfirm)) {
                    phoneNumbers.splice(index, 1);
                    localStorage.setItem('phoneNumbers', JSON.stringify(phoneNumbers));
                    renderPhoneDialog();
                }
            };

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(saveBtn);
            actionsDiv.appendChild(deleteBtn);

            row.appendChild(infoDiv);
            row.appendChild(actionsDiv);
            listContainer.appendChild(row);
        });
        dialog.appendChild(listContainer);

        // Hinzufügen-Bereich
        const addContainer = document.createElement('div');
        addContainer.className = 'phone-add-container';
        addContainer.innerHTML = `
            <input type="text" id="newPhoneName" placeholder="${t.phone.name}" style="margin-bottom:5px; font-size: 16px; width:100%;">
            <input type="tel" id="newPhoneNumber" placeholder="${t.phone.number}" style="margin-bottom:5px; font-size: 16px; width:100%;">
            <button id="addNewPhoneBtn" class="confirm-button" style="width:100%;">${t.phone.add}</button>
        `;
        dialog.appendChild(addContainer);
        
        dialog.querySelector('#addNewPhoneBtn').onclick = () => {
            const name = dialog.querySelector('#newPhoneName').value.trim();
            const number = dialog.querySelector('#newPhoneNumber').value.trim();
            if (name && number) {
                phoneNumbers.push({ name, number });
                localStorage.setItem('phoneNumbers', JSON.stringify(phoneNumbers));
                renderPhoneDialog();
            } else {
                showToast(t.prompts.fillAllFields, 'error');
            }
        };

        // Import / Zurück Buttons
        const btnGroup = document.createElement('div');
        btnGroup.className = 'button-group';
        btnGroup.style.marginTop = '15px';

        const importBtn = document.createElement('button');
        importBtn.className = 'btn-grey';
        importBtn.textContent = t.phone.import;
        importBtn.onclick = () => document.getElementById('phoneImportInput').click();
        
        const importInput = document.createElement('input');
        importInput.type = 'file';
        importInput.id = 'phoneImportInput';
        importInput.accept = '.json';
        importInput.style.display = 'none';
        importInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (Array.isArray(data)) {
                        phoneNumbers = data;
                        localStorage.setItem('phoneNumbers', JSON.stringify(phoneNumbers));
                        renderPhoneDialog();
                        showToast('Import erfolgreich', 'success');
                    } else {
                        throw new Error('Invalid format');
                    }
                } catch (err) {
                    showToast(t.prompts.backupError, 'error');
                }
            };
            reader.readAsText(file);
        };

        const backBtn = document.createElement('button');
        backBtn.className = 'btn-grey';
        backBtn.textContent = t.phone.back;
        backBtn.onclick = () => {
            isPhoneManagementMode = false;
            renderPhoneDialog();
        };

        btnGroup.appendChild(importBtn);
        btnGroup.appendChild(backBtn);
        dialog.appendChild(btnGroup);
        dialog.appendChild(importInput);
    }
}
// --- ENDE FUNKTIONEN FÜR TELEFONNUMMERN-VERWALTUNG ---

// NEU: Funktion zum Zuklappen aller erweiterbaren Sektionen im Einstellungsdialog
function collapseAllSettingsSections() {
    const sections = document.querySelectorAll('#settingsDialogOverlay .settings-section.collapsible-init');
    sections.forEach(section => {
        // Der Inhalts-Wrapper ist das letzte div-Element in der Sektion
        const contentWrapper = section.querySelector('div:last-child');
        const header = section.querySelector('h4');
        if (contentWrapper && header && contentWrapper.style.display !== 'none') {
            contentWrapper.style.display = 'none';
            const icon = header.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-chevron-down';
            }
        }
    });


    // NEU: Profil-Details zuklappen
    const profileDetailsWrapper = document.getElementById('profileDetailsWrapper');
    if (profileDetailsWrapper) {
        profileDetailsWrapper.style.display = 'none';
    }
    const profileSummaryIcon = document.querySelector('#profileSummary .toggle-icon');
    if (profileSummaryIcon) {
        profileSummaryIcon.className = 'fas fa-chevron-down toggle-icon';
    }
}







const todayButton = document.getElementById('todayButton');
if (todayButton) {
	todayButton.addEventListener('click', () => {
		const today = new Date();
		const currentYear = today.getFullYear();

		if (currentYear !== currentCalendarYear) {
			generateCalendar(currentYear);
		}

		const todayMonth = today.getMonth();
		const monthCards = document.querySelectorAll('.month-card');
		if (monthCards[todayMonth]) {
			monthCards[todayMonth].scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	});
}

function setupDialog(openBtnId, dialogOverlayId, closeBtnId) {
	const openBtn = openBtnId ? document.getElementById(openBtnId) : null;
	const dialogOverlay = document.getElementById(dialogOverlayId);
	const closeBtn = document.getElementById(closeBtnId);

	if (openBtn) {
		openBtn.addEventListener('click', () => {
			dialogOverlay.classList.add('active');
			// Wenn der Info-Dialog geöffnet wird, Dateien laden
			if (dialogOverlayId === 'shiftInfoDialogOverlay') {
				loadInfoFiles();
				updateShiftInfoDisplay();
			}
            // NEU: Telefon-Dialog rendern
			if (dialogOverlayId === 'phoneDialogOverlay') {
				renderPhoneDialog();
			}
		});
	}

	if (closeBtn) {
		closeBtn.addEventListener('click', () => {
			dialogOverlay.classList.remove('active');
			// NEU: Alle Sektionen zuklappen beim Schließen
			if (dialogOverlayId === 'settingsDialogOverlay') {
				collapseAllSettingsSections();
			}
		});
	}

	if (dialogOverlay) {
		dialogOverlay.addEventListener('click', (event) => {
			if (event.target === dialogOverlay) {
				dialogOverlay.classList.remove('active');
				// NEU: Alle Sektionen zuklappen beim Schließen
				if (dialogOverlayId === 'settingsDialogOverlay') {
					collapseAllSettingsSections();
				}
			}
		});
	}
}

setupDialog('openPhoneDialog', 'phoneDialogOverlay', 'closePhoneDialog');
setupDialog(null, 'holidayDialogOverlay', 'closeHolidayDialog');
setupDialog('openShiftInfoDialog', 'shiftInfoDialogOverlay', 'closeShiftInfoDialog');
setupDialog('openSettingsDialog', 'settingsDialogOverlay', 'closeSettingsDialog');
setupDialog('openImportantDatesDialog', 'importantDatesDialogOverlay', 'closeImportantDatesDialog');


const settingsDialogOverlay = document.getElementById('settingsDialogOverlay');
const toggleAnimationsCheckbox = document.getElementById('toggleAnimations');
const toggleScrollToTodayCheckbox = document.getElementById('toggleScrollToToday');
const borderColorPicker = document.getElementById('borderColorPicker');
const calendarContainer = document.getElementById('calendarContainer');
const toggleDarkModeCheckbox = document.getElementById('toggleDarkMode');
const toggleAutoDarkModeCheckbox = document.getElementById('toggleAutoDarkMode');

const savedAnimationState = localStorage.getItem('animationsDisabled');
if (savedAnimationState === 'true' || savedAnimationState === null) {
	toggleAnimationsCheckbox.checked = true;
	calendarContainer.classList.add('no-animation');
} else {
	toggleAnimationsCheckbox.checked = false;
	calendarContainer.classList.remove('no-animation');
}

if (toggleScrollToTodayCheckbox) {
    toggleScrollToTodayCheckbox.checked = localStorage.getItem('scrollToTodayEnabled') === 'true';
    toggleScrollToTodayCheckbox.addEventListener('change', () => {
        localStorage.setItem('scrollToTodayEnabled', toggleScrollToTodayCheckbox.checked);
    });
}

const savedBorderColor = localStorage.getItem('calendarBorderColor');
if (savedBorderColor) {
	borderColorPicker.value = savedBorderColor;
	document.documentElement.style.setProperty('--calendar-border-color', savedBorderColor);
} else {
	borderColorPicker.value = '#0161FD';
	document.documentElement.style.setProperty('--calendar-border-color', '#0161FD');
}

function applyDarkMode(isDarkMode) {
	if (isDarkMode) {
		document.body.classList.add('dark-mode');
	} else {
		document.body.classList.remove('dark-mode');
	}
}

function updateDarkModeState() {
	const autoModeEnabled = localStorage.getItem('autoDarkModeEnabled') === 'true';
	const manualDarkModeEnabled = localStorage.getItem('darkModeEnabled') === 'true';

	toggleAutoDarkModeCheckbox.checked = autoModeEnabled;
	toggleDarkModeCheckbox.checked = manualDarkModeEnabled;
	toggleDarkModeCheckbox.disabled = autoModeEnabled;

	if (autoModeEnabled) {
		applyDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
	} else {
		applyDarkMode(manualDarkModeEnabled);
	}
}

if (localStorage.getItem('autoDarkModeEnabled') === null) {
	localStorage.setItem('autoDarkModeEnabled', 'true');
}

updateDarkModeState();

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
	if (localStorage.getItem('autoDarkModeEnabled') === 'true') {
		updateDarkModeState();
	}
});

toggleAnimationsCheckbox.addEventListener('change', () => {
	if (toggleAnimationsCheckbox.checked) {
		calendarContainer.classList.add('no-animation');
		localStorage.setItem('animationsDisabled', 'true');
	} else {
		calendarContainer.classList.remove('no-animation');
		localStorage.setItem('animationsDisabled', 'false');
	}
});

borderColorPicker.addEventListener('input', () => {
	const newColor = borderColorPicker.value;
	document.documentElement.style.setProperty('--calendar-border-color', newColor);
	localStorage.setItem('calendarBorderColor', newColor);
});

toggleAutoDarkModeCheckbox.addEventListener('change', () => {
	localStorage.setItem('autoDarkModeEnabled', toggleAutoDarkModeCheckbox.checked);
	updateDarkModeState();
});

toggleDarkModeCheckbox.addEventListener('change', () => {
	localStorage.setItem('darkModeEnabled', toggleDarkModeCheckbox.checked);
	updateDarkModeState();
});

const currentYearDisplay = document.getElementById('currentYearDisplay');
const yearInputDialogOverlay = document.getElementById('yearInputDialogOverlay');
const closeYearInputDialogBtn = document.getElementById('closeYearInputDialog');
const yearInput = document.getElementById('yearInput');
const setYearButton = document.getElementById('setYearButton');
const decreaseYearButton = document.getElementById('decreaseYear');
let increaseYearButton = document.getElementById('increaseYear');

currentYearDisplay.addEventListener('click', () => {
	yearInput.value = currentCalendarYear;
	yearInputDialogOverlay.classList.add('active');
});

closeYearInputDialogBtn.addEventListener('click', () => {
	yearInputDialogOverlay.classList.remove('active');
});

yearInputDialogOverlay.addEventListener('click', (event) => {
	if (event.target === yearInputDialogOverlay) {
		yearInputDialogOverlay.classList.remove('active');
	}
});

decreaseYearButton.addEventListener('click', () => {
	yearInput.value = parseInt(yearInput.value, 10) - 1;
});

increaseYearButton.addEventListener('click', () => {
	yearInput.value = parseInt(yearInput.value, 10) + 1;
});

setYearButton.addEventListener('click', () => {
	const newYear = parseInt(yearInput.value, 10);
	if (!isNaN(newYear) && newYear >= 1900 && newYear <= 2100) {
		generateCalendar(newYear);
		yearInputDialogOverlay.classList.remove('active');
	} else {
		showToast(uiTranslations[currentLanguage].prompts.invalidYear, 'error');
	}
});

const noteDialogOverlay = document.getElementById('noteDialogOverlay');
const closeNoteDialogBtn = document.getElementById('closeNoteDialog');
const noteDialogTitle = document.getElementById('noteDialogTitle');
const noteInput = document.getElementById('noteInput');
const saveNoteButton = document.getElementById('saveNoteButton');
const deleteNoteButton = document.getElementById('deleteNoteButton');
const toggleVacationButton = document.getElementById('toggleVacationButton');

let currentDayCell = null;

// Helper function for the new Note UI
function renderCustomNoteUi(container, dateStr) {
    container.innerHTML = '';
    
    // LIST
    const list = document.createElement('ul');
    list.className = 'day-note-list';
    list.style.listStyle = 'none';
    list.style.padding = '0';
    list.style.marginBottom = '15px';

    const entries = importantDates.filter(d => d.date === dateStr || (d.recurring && d.date.slice(5) === dateStr.slice(5)));
    
    entries.forEach(entry => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.padding = '8px';
        li.style.borderBottom = '1px solid #eee';
        li.style.backgroundColor = '#f9f9f9';
        li.style.marginBottom = '5px';
        li.style.borderRadius = '4px';
        
        li.innerHTML = `
            <span>${entry.emoji} ${entry.name} ${entry.recurring ? '<small style="color:#666">(jährl.)</small>' : ''}</span>
            <button class="delete-day-note" style="background:none;border:none;color:#dc3545;cursor:pointer;font-size:1.2em;padding:0 5px;">&times;</button>
        `;
        li.querySelector('.delete-day-note').addEventListener('click', () => {
            deleteImportantDate(entry.id);
            renderCustomNoteUi(container, dateStr);
        });
        list.appendChild(li);
    });
    container.appendChild(list);

    // FORM
    const form = document.createElement('div');
    const t = uiTranslations[currentLanguage];
    form.innerHTML = `
        <div style="display:flex; gap:5px; margin-bottom:5px;">
            <input type="text" id="dayNoteText" placeholder="${t.notes.placeholder}" style="flex:1; font-size: 16px; padding:8px; border:1px solid #ccc; border-radius:4px;">
            <div style="display:flex;">
                <input type="text" id="dayNoteEmoji" placeholder="Emoji" style="width:50px; padding:8px; font-size: 16px; border:1px solid #ccc; border-radius:4px 0 0 4px; text-align:center; border-right:none;">
                <button id="openEmojiPaletteBtn" type="button" style="padding: 0 10px; font-size: 16px; border: 1px solid #ccc; border-radius: 0 4px 4px 0; cursor: pointer; background: #f0f0f0;">😀</button>
            </div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <label style="font-size:0.9em; display:flex; align-items:center; gap:5px;"><input type="checkbox" id="dayNoteRecurring"> ${t.notes.recurring}</label>
            <button id="addDayNoteBtn" style="background-color:#333; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; font-weight:bold;">${t.notes.add}</button>
        </div>
        <div class="emoji-quick-select">
            <span class="emoji-option">🎂</span>
            <span class="emoji-option">🩺</span>
            <span class="emoji-option">🏖️</span>
            <span class="emoji-option">📅</span>
            <span class="emoji-option">🚗</span>
            <span class="emoji-option">⚠️</span>
            <span class="emoji-option">🏋️</span>
            <span class="emoji-option">💅</span>
        </div>
    `;
    
    form.querySelector('#addDayNoteBtn').addEventListener('click', () => {
        const text = form.querySelector('#dayNoteText').value.trim();
        const emoji = form.querySelector('#dayNoteEmoji').value.trim();
        const recurring = form.querySelector('#dayNoteRecurring').checked;
        
        if (text) {
            const newEntry = {
                id: Date.now(),
                date: dateStr,
                name: text,
                emoji: emoji,
                recurring: recurring
            };
            importantDates.push(newEntry);
            localStorage.setItem('importantDates', JSON.stringify(importantDates));
            updateAutoNoteForDate(dateStr);
            generateCalendar(currentCalendarYear);
            renderImportantDatesList();
            renderCustomNoteUi(container, dateStr);
        } else {
            showToast(uiTranslations[currentLanguage].prompts.enterText, 'error');
        }
    });

    form.querySelectorAll('.emoji-option').forEach(opt => {
        opt.addEventListener('click', () => {
            form.querySelector('#dayNoteEmoji').value = opt.textContent;
        });
    });

    form.querySelector('#openEmojiPaletteBtn').addEventListener('click', () => {
        showEmojiPicker((emoji) => {
            form.querySelector('#dayNoteEmoji').value = emoji;
        });
    });

    container.appendChild(form);
}

function openNoteDialog(cell) {
	currentDayCell = cell;
	const fullDate = cell.dataset.fullDate;
	const dateParts = fullDate.split('-');
	const day = dateParts[2];
	const monthIndex = parseInt(dateParts[1], 10) - 1;
	const year = dateParts[0];
	const monthName = new Date(year, monthIndex, 1).toLocaleString('de-DE', { month: 'long' });
    
    const t = uiTranslations[currentLanguage];
	noteDialogTitle.textContent = `📝 ${t.notes.titlePrefix} ${day}. ${monthName} ${year}`;
	
    // ALTE INPUTS VERSTECKEN
    noteInput.style.display = 'none';
    saveNoteButton.style.display = 'none';
    deleteNoteButton.style.display = 'none';
    if (toggleVacationButton) toggleVacationButton.style.display = '';
    const uaBtn = document.getElementById('urlaubsantragButton');
    if (uaBtn) uaBtn.style.display = 'none';

    // NEUE UI ERSTELLEN ODER HOLEN
    let ui = document.getElementById('customNoteUi');
    if (!ui) {
        ui = document.createElement('div');
        ui.id = 'customNoteUi';
        noteInput.parentNode.insertBefore(ui, noteInput.nextSibling);
    }
    
    // UI RENDERN
    renderCustomNoteUi(ui, fullDate);

	// Update vacation button text
	if (vacationData[fullDate]) {
		toggleVacationButton.textContent = t.notes.removeVacation;
	} else {
		toggleVacationButton.textContent = t.notes.markVacation;
	}

	noteDialogOverlay.classList.add('active');
}

closeNoteDialogBtn.addEventListener('click', () => {
	noteDialogOverlay.classList.remove('active');
});

noteDialogOverlay.addEventListener('click', (event) => {
	if (event.target === noteDialogOverlay) {
		noteDialogOverlay.classList.remove('active');
	}
});

saveNoteButton.addEventListener('click', () => {
	if (currentDayCell) {
		const fullDate = currentDayCell.dataset.fullDate;
		const note = noteInput.value.trim();

		if (note) {
			notesData[fullDate] = note;
			currentDayCell.querySelector('.note-indicator').textContent = note;
		} else {
			// Wenn die Notiz leer ist und es sich nicht um eine automatische Notiz handelt, lösche sie.
			// Ansonsten setze den Text auf den Standard ("Buß- und Bettag").
			if (notesData[fullDate] === 'Buß- und Bettag') {
				// Notiz des Buß- und Bettags kann nicht gelöscht werden, nur übertost werden
				// oder wenn sie leer ist, wieder auf den Standardwert zurückgesetzt werden.
				if (note === '') {
					currentDayCell.querySelector('.note-indicator').textContent = 'Buß- und Bettag';
				} else {
					currentDayCell.querySelector('.note-indicator').textContent = note;
				}
			} else {
				delete notesData[fullDate];
				currentDayCell.querySelector('.note-indicator').textContent = '';
			}
		}
		localStorage.setItem('calendarNotes', JSON.stringify(notesData));
		noteDialogOverlay.classList.remove('active');
	}
});

deleteNoteButton.addEventListener('click', () => {
	if (currentDayCell) {
		const fullDate = currentDayCell.dataset.fullDate;
		// Verhindere das Löschen der automatischen Buß- und Bettag Notiz
		if (notesData[fullDate] === 'Buß- und Bettag') {
			showToast(uiTranslations[currentLanguage].prompts.autoNoteDelete, 'info');
			return;
		}
		delete notesData[fullDate];
		localStorage.setItem('calendarNotes', JSON.stringify(notesData));
		currentDayCell.querySelector('.note-indicator').textContent = '';
		noteInput.value = '';
		noteDialogOverlay.classList.remove('active');
	}
});

toggleVacationButton.addEventListener('click', () => {
	if (currentDayCell) {
		const fullDate = currentDayCell.dataset.fullDate;
		if (vacationData[fullDate]) {
			delete vacationData[fullDate];
		} else {
			vacationData[fullDate] = true;
		}
		localStorage.setItem('calendarVacations', JSON.stringify(vacationData));
		noteDialogOverlay.classList.remove('active');
		generateCalendar(currentCalendarYear); // Re-render to apply changes and ensure consistency
	}
});

// NEUE FUNKTIONEN FÜR DIE ANZEIGE VON INFODATEIEN
async function fetchInfoFiles() {
	const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO_NAME}/contents/${INFO_FOLDER_PATH}`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			if (response.status === 404) {
				console.warn(`Der Ordner "${INFO_FOLDER_PATH}" wurde nicht gefunden. Bitte stelle sicher, dass er existiert und Dateien enthält.`);
				return [];
			}
			throw new Error(`GitHub API Fehler: ${response.statusText}`);
		}
		const data = await response.json();
		// Filtert nur Dateien und ignoriert Unterordner
		return data.filter(item => item.type === 'file');
	} catch (error) {
		console.error('Fehler beim Abrufen der Info-Dateien:', error);
		return [];
	}
}

async function loadInfoFiles() {
	const infoFilesList = document.getElementById('infoFilesList');
    const t = uiTranslations[currentLanguage];
	infoFilesList.innerHTML = `<p class="loading-message">${t.info.loading}</p>`; // Ladeanzeige

	const files = await fetchInfoFiles();

	infoFilesList.innerHTML = ''; // Lösche die Ladeanzeige

	if (files.length === 0) {
		infoFilesList.innerHTML = `<p>${t.info.noInfo}</p>`;
		return;
	}

	const ul = document.createElement('ul');
	ul.classList.add('info-files-ul');

	files.forEach(file => {
		const li = document.createElement('li');
		const fileLink = document.createElement('a');
		fileLink.href = file.download_url; // Direkter Link zur Datei
		fileLink.textContent = file.name;
		fileLink.target = '_blank'; // Öffnet Link in neuem Tab

		const fileIcon = document.createElement('i');
		const fileNameLower = file.name.toLowerCase();

		if (fileNameLower.endsWith('.pdf')) {
			fileIcon.classList.add('fas', 'fa-file-pdf');
			fileIcon.style.color = 'red';
		} else if (fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg') || fileNameLower.endsWith('.png') || fileNameLower.endsWith('.gif')) {
			fileIcon.classList.add('fas', 'fa-image');
			fileIcon.style.color = 'blue';
		} else {
			fileIcon.classList.add('fas', 'fa-file'); // Standard-Symbol für andere Dateitypen
		}
		fileIcon.classList.add('file-list-icon');

		li.appendChild(fileIcon);
		li.appendChild(fileLink);
		ul.appendChild(li);
	});
	infoFilesList.appendChild(ul);
}


// --- BACKUP UND RESTORE FUNKTIONEN ---

// Funktion zum Erstellen eines Backups der Einstellungen
function backupSettings() {
	// Sammle alle relevanten Daten aus dem localStorage
	const settingsToBackup = {};
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		// Schließe keine sensiblen Daten oder große, irrelevante Caches aus,
		// hier nehmen wir alles, was wir gesetzt haben.
		if (key.startsWith('currentCalendarYear') ||
			key.startsWith('calendarNotes') ||
			key.startsWith('customShiftSystem') ||
			key.startsWith('animationsDisabled') ||
			key.startsWith('calendarBorderColor') ||
			key.startsWith('darkModeEnabled') ||
			key.startsWith('autoDarkModeEnabled') ||
			key.startsWith('calendarVacations') ||
			key.startsWith('userProfile') ||
            key.startsWith('importantDates') ||
            key.startsWith('phoneNumbers') ||
            key.startsWith('calendarLanguage')) {
			settingsToBackup[key] = localStorage.getItem(key);
		}
	}

	// Erstelle einen JSON-String
	const backupData = JSON.stringify(settingsToBackup, null, 2);

	// Erstelle ein Blob und einen Download-Link
	const blob = new Blob([backupData], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `schichtkalender_backup_${new Date().toISOString().slice(0, 10)}.json`; // Dateiname mit Datum
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url); // Gib den URL-Speicher frei
	showToast(uiTranslations[currentLanguage].prompts.backupCreated, 'success');
}

// Funktion zum Laden eines Backups der Einstellungen
function restoreSettings() {
	if (!confirm(uiTranslations[currentLanguage].prompts.backupRestoreConfirm)) {
		return;
	}

	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.json'; // Akzeptiere nur JSON-Dateien

	input.onchange = e => {
		const file = e.target.files[0];
		if (!file) {
			return;
		}

		const reader = new FileReader();
		reader.onload = function(event) {
			try {
				const loadedData = JSON.parse(event.target.result);

				// Lösche nur die relevanten alten Daten, nicht das gesamte localStorage
				['currentCalendarYear', 'calendarNotes', 'customShiftSystem',
					'animationsDisabled', 'calendarBorderColor', 'darkModeEnabled', 'autoDarkModeEnabled', 'calendarVacations', 'userProfile', 'importantDates',
                    'phoneNumbers', 'calendarLanguage'
				]
				.forEach(key => localStorage.removeItem(key));

				// Lade die neuen Daten
				for (const key in loadedData) {
					if (loadedData.hasOwnProperty(key)) {
						localStorage.setItem(key, loadedData[key]);
					}
				}

				// Aktualisiere globale Variablen und UI
				currentCalendarYear = parseInt(localStorage.getItem('currentCalendarYear')) || new Date().getFullYear();
				notesData = JSON.parse(localStorage.getItem('calendarNotes')) || {};
				vacationData = JSON.parse(localStorage.getItem('calendarVacations')) || {};
				customShiftSystem = JSON.parse(localStorage.getItem('customShiftSystem')) || { sequence: [], referenceStartDate: null, referenceShiftType: null };
				userProfile = JSON.parse(localStorage.getItem('userProfile')) || { name: '', personalNummer: '', abteilung: '', signature: null };
                importantDates = JSON.parse(localStorage.getItem('importantDates')) || [];
                phoneNumbers = JSON.parse(localStorage.getItem('phoneNumbers')) || [];
                
                // Sprache aktualisieren
                const newLang = localStorage.getItem('calendarLanguage');
                if (newLang && validLanguages.includes(newLang)) {
                    currentLanguage = newLang;
                    const langSelect = document.getElementById('languageSelect');
                    if (langSelect) langSelect.value = currentLanguage;
                    applyLanguageToUI();
                    
                    const langContainer = document.getElementById('languageSelectorContainer');
                    if (langContainer) {
                        langContainer.querySelector('h4').textContent = '🌐 ' + uiTranslations[currentLanguage].settings.language;
                    }
                }

				loadProfile(); // Profil-UI aktualisieren
                renderImportantDatesList(); // Terminliste aktualisieren
                
				// Aktualisiere die UI-Elemente im Settings-Dialog sofort
				document.getElementById('toggleAnimations').checked = (localStorage.getItem('animationsDisabled') === 'true');
				document.getElementById('borderColorPicker').value = localStorage.getItem('calendarBorderColor') || '#0161FD';
				document.getElementById('toggleDarkMode').checked = (localStorage.getItem('darkModeEnabled') === 'true');
				document.getElementById('toggleAutoDarkMode').checked = (localStorage.getItem('autoDarkModeEnabled') === 'true');

				const parsedSystem = JSON.parse(localStorage.getItem('customShiftSystem'));
				document.getElementById('customShiftSequence').value = parsedSystem.sequence_input || '';
				document.getElementById('customShiftStartDate').value = parsedSystem.referenceStartDate_input || '';
				document.getElementById('customShiftStartType').value = parsedSystem.referenceShiftType_input || '';

				updateDarkModeState(); // Stelle sicher, dass der Dark Mode korrekt angewendet wird

				generateCalendar(currentCalendarYear); // Kalender neu rendern
				showToast(uiTranslations[currentLanguage].prompts.backupRestored, 'success');
				document.getElementById('settingsDialogOverlay').classList.remove('active'); // Dialog schließen
			} catch (error) {
				console.error('Fehler beim Laden des Backups:', error);
				showToast(uiTranslations[currentLanguage].prompts.backupError, 'error');
			}
		};
		reader.readAsText(file);
	};
	input.click(); // Öffne den Dateiauswahldialog
}

// --- SERVICE WORKER REGISTRIERUNG & UPDATE-LOGIK ---
function registerServiceWorker() {
	if ('serviceWorker' in navigator) {
		window.addEventListener('load', () => {
			navigator.serviceWorker.register('./service-worker.js')
				.then(registration => {
					console.log('Service Worker registriert mit Scope:', registration.scope);

					registration.addEventListener('updatefound', () => {
						// Eine neue Version des Service Workers wurde gefunden und wird installiert.
						const newWorker = registration.installing;
						newWorker.addEventListener('statechange', () => {
							// Der Status des neuen Workers hat sich geändert.
							if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
								// Der neue Worker ist installiert und wartet darauf, die Kontrolle zu übernehmen.
								// Wir zeigen dem Benutzer jetzt die Benachrichtigung an.
								const updateBanner = document.getElementById('update-banner');
								if (updateBanner) updateBanner.style.display = 'flex';
							}
						});
					});

                    const reloadButton = document.querySelector("#reload-button");
					if (reloadButton) {
						reloadButton.addEventListener('click', () => {
							// Sende eine Nachricht an den wartenden Service Worker, damit er die Kontrolle übernimmt.
							// Wir greifen direkt auf den 'waiting' worker der Registrierung zu.
							if (registration.waiting) {
								registration.waiting.postMessage({ type: 'SKIP_WAITING' });
							}
						});
					}

					// Lade die Seite neu, sobald der neue Service Worker die Kontrolle übernommen hat.
					navigator.serviceWorker.addEventListener('controllerchange', () => {
						window.location.reload();
					});
				})
				.catch(error => {
					console.error('Service Worker Registrierung fehlgeschlagen:', error);
				});
		});
	}
}

// ===== PROFILVERWALTUNG =====
let userProfile = JSON.parse(localStorage.getItem('userProfile')) || {
	vorname: '',
	nachname: '',
	personalNummer: '',
	abteilung: '',
	signature: null
};

// NEU: Standard-Schichtfarben
const DEFAULT_SHIFT_COLORS = {
	fruehschicht: { light: '#FFF3E0', dark: '#40362b' },
	spaetschicht: { light: '#C8E6C9', dark: '#314a32' },
	nachtschicht: { light: '#BBDEFB', dark: '#25394e' },
	freischicht:  { light: '#C4FFF8', dark: '#466F6A' }
};

// NEU: Feste Farbpaletten für die Auswahl
const COLOR_PALETTES = [
    { light: '#FFF3E0', dark: '#40362b', name: 'Orange' }, // Standard Früh
    { light: '#C8E6C9', dark: '#314a32', name: 'Grün' },   // Standard Spät
    { light: '#BBDEFB', dark: '#25394e', name: 'Blau' },   // Standard Nacht
    { light: '#C4FFF8', dark: '#466F6A', name: 'Türkis' }  // Standard Frei
];

// NEU: Funktion zum Anwenden der benutzerdefinierten Schichtfarben
function applyCustomShiftColors() {
    const colors = userProfile.shiftColors || DEFAULT_SHIFT_COLORS;
    let styleContent = '';
    
    // NEU: CSS Variablen für Statistik und andere Elemente definieren
    let rootVars = ':root {';
    let darkVars = 'body.dark-mode {';

    for (const shift in colors) {
        if (colors.hasOwnProperty(shift)) {
            styleContent += `
                .${shift} { background-color: ${colors[shift].light} !important; }
                body.dark-mode .${shift} { background-color: ${colors[shift].dark} !important; }
            `;
            // Variablen setzen (z.B. --fruehschicht-bg)
            rootVars += `--${shift}-bg: ${colors[shift].light};`;
            darkVars += `--${shift}-bg: ${colors[shift].dark};`;
        }
    }
    
    rootVars += '}';
    darkVars += '}';
    styleContent += rootVars + darkVars;
    
    let styleElement = document.getElementById('custom-shift-colors-style');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'custom-shift-colors-style';
        document.head.appendChild(styleElement);
    }
    styleElement.innerHTML = styleContent;
}

// Sicherstellen, dass Schichtzeiten existieren (für bestehende Profile)
if (!userProfile.shiftTimes) {
	userProfile.shiftTimes = {
		frueh: { start: '06:00', end: '14:00' },
		spaet: { start: '14:00', end: '22:00' },
		nacht: { start: '22:00', end: '06:00' }
	};
}

// NEU: Sicherstellen, dass Schichtfarben existieren
if (!userProfile.shiftColors) {
    userProfile.shiftColors = JSON.parse(JSON.stringify(DEFAULT_SHIFT_COLORS)); // Tiefe Kopie
}

const profileVornameInput = document.getElementById('profileVornameInput');
const profileNachnameInput = document.getElementById('profileNachnameInput');
const profileNameDisplay = document.getElementById('profileNameDisplay');
const profilePersonalNrInput = document.getElementById('profilePersonalNummer');
const signatureCanvas = document.getElementById('signatureCanvas');
const clearSignatureButton = document.getElementById('clearSignatureButton');
const resetSignatureButton = document.getElementById('resetSignatureButton');
const saveProfileButton = document.getElementById('saveProfileButton');

let signatureCtx = null;
let isDrawing = false;

// Canvas für Unterschrift initialisieren
if (signatureCanvas) {
	signatureCtx = signatureCanvas.getContext('2d');
	signatureCtx.lineCap = 'round';
	signatureCtx.lineJoin = 'round';
	signatureCtx.lineWidth = 2;
	signatureCtx.strokeStyle = '#000';

	// Hintergrund weiß
	signatureCtx.fillStyle = '#fff';
	signatureCtx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);

	// Touch und Maus Events
	signatureCanvas.addEventListener('mousedown', startDrawing);
	signatureCanvas.addEventListener('mousemove', draw);
	signatureCanvas.addEventListener('mouseup', stopDrawing);
	signatureCanvas.addEventListener('mouseout', stopDrawing);

	// Touch Events
	signatureCanvas.addEventListener('touchstart', handleTouch);
	signatureCanvas.addEventListener('touchmove', handleTouch);
	signatureCanvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
	isDrawing = true;
	const rect = signatureCanvas.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;
	signatureCtx.beginPath();
	signatureCtx.moveTo(x, y);
}

function draw(e) {
	if (!isDrawing) return;
	const rect = signatureCanvas.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;
	signatureCtx.lineTo(x, y);
	signatureCtx.stroke();
}

function handleTouch(e) {
	e.preventDefault();
	const touch = e.touches[0];
	const mouseEvent = new MouseEvent(
		e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
			clientX: touch.clientX,
			clientY: touch.clientY
		}
	);
	signatureCanvas.dispatchEvent(mouseEvent);
}

function stopDrawing() {
	isDrawing = false;
	signatureCtx.closePath();
}

if (clearSignatureButton) {
	clearSignatureButton.addEventListener('click', () => {
		signatureCtx.fillStyle = '#fff';
		signatureCtx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
	});
}

if (resetSignatureButton) {
	resetSignatureButton.addEventListener('click', () => {
		if (userProfile.signature) {
			signatureCtx.fillStyle = '#fff';
			signatureCtx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
			userProfile.signature = null;
			localStorage.setItem('userProfile', JSON.stringify(userProfile));
			showToast(uiTranslations[currentLanguage].prompts.signatureReset, 'success');
		}
	});

	// --- NEU: Button zum Hochladen einer Unterschrift als Bild ---
	if (!document.getElementById('signatureUploadButton')) {
		const uploadBtn = document.createElement('button');
		uploadBtn.id = 'signatureUploadButton';
		uploadBtn.textContent = 'Bild laden';
		uploadBtn.type = 'button';
		uploadBtn.style.marginLeft = '5px';

		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.id = 'signatureUploadInput';
		fileInput.accept = 'image/*';
		fileInput.style.display = 'none';

		// Einfügen nach dem Reset-Button
		resetSignatureButton.parentNode.insertBefore(uploadBtn, resetSignatureButton.nextSibling);
		resetSignatureButton.parentNode.insertBefore(fileInput, uploadBtn);

		uploadBtn.addEventListener('click', (e) => {
			e.preventDefault();
			fileInput.click();
		});

		fileInput.addEventListener('change', (e) => {
			const file = e.target.files[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (event) => {
					const img = new Image();
					img.onload = () => {
						if (signatureCtx && signatureCanvas) {
							// Canvas weiß füllen
							signatureCtx.fillStyle = '#fff';
							signatureCtx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
							
							// Bild proportional einpassen und zentrieren
							const scale = Math.min(signatureCanvas.width / img.width, signatureCanvas.height / img.height);
							const x = (signatureCanvas.width / 2) - (img.width / 2) * scale;
							const y = (signatureCanvas.height / 2) - (img.height / 2) * scale;
							
							signatureCtx.drawImage(img, x, y, img.width * scale, img.height * scale);
						}
					};
					img.src = event.target.result;
				};
				reader.readAsDataURL(file);
			}
		});
	}
}

// NEU: Hilfsfunktion, um eine Sektion im Einstellungsdialog einklappbar zu machen
function makeSectionCollapsible(section) {
    if (section && !section.classList.contains('collapsible-init')) {
        section.classList.add('collapsible-init');
        const header = section.querySelector('h4');
        if (header) {
            header.style.cursor = 'pointer';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            header.innerHTML = `<span>${header.textContent}</span><i class="fas fa-chevron-down"></i>`;

            const contentWrapper = document.createElement('div');
            contentWrapper.style.display = 'none'; // Standardmäßig zugeklappt

            // Alle nachfolgenden Elemente in den Wrapper verschieben
            while (header.nextSibling) {
                contentWrapper.appendChild(header.nextSibling);
            }
            section.appendChild(contentWrapper);

            header.addEventListener('click', () => {
                const isVisible = contentWrapper.style.display === 'block';
                contentWrapper.style.display = isVisible ? 'none' : 'block';
                const icon = header.querySelector('i');
                if (icon) {
                    icon.className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
                }
            });
        }
    }
}

// Laden des gespeicherten Profils
function loadProfile() {
    const t = uiTranslations[currentLanguage];

	// Inject Abteilung input if missing (da HTML nicht direkt bearbeitet werden kann)
	if (profilePersonalNrInput && !document.getElementById('profileAbteilung')) {
		const container = document.createElement('div');
		container.className = 'settings-option';
		container.innerHTML = `<label for="profileAbteilung">${t.settings.department}:</label><input type="text" id="profileAbteilung" placeholder="${t.settings.departmentPlaceholder}">`;
		const parent = profilePersonalNrInput.closest('.settings-option');
		if (parent && parent.parentNode) {
			parent.parentNode.insertBefore(container, parent.nextSibling);
		}
	}
    
    // NEU: Checkbox für Wochenende als Urlaub zählen (Positioniert nach Abteilung)
    const abteilungInput = document.getElementById('profileAbteilung');
    if (abteilungInput && !document.getElementById('profileCountWeekends')) {
        const container = document.createElement('div');
        container.className = 'settings-option inline';
        container.innerHTML = `<label for="profileCountWeekends">${t.settings.countWeekends}:</label><input type="checkbox" id="profileCountWeekends">`;
        const parent = abteilungInput.closest('.settings-option');
        if (parent && parent.parentNode) {
            parent.parentNode.insertBefore(container, parent.nextSibling);
        }
    } else if (profilePersonalNrInput && !document.getElementById('profileCountWeekends')) {
        // Fallback, falls Abteilung nicht existiert
        const container = document.createElement('div');
        container.className = 'settings-option inline';
        container.innerHTML = `<label for="profileCountWeekends">${t.settings.countWeekends}:</label><input type="checkbox" id="profileCountWeekends">`;
        const parent = profilePersonalNrInput.closest('.settings-option');
        if (parent && parent.parentNode) {
            parent.parentNode.insertBefore(container, parent.nextSibling);
        }
    }

	// NEU: Sektion für Schichtfarben einfügen, falls nicht vorhanden
	if (saveProfileButton && !document.getElementById('shiftColorSettingsSection')) {
		const colorSection = document.createElement('div');
		colorSection.className = 'settings-section';
		colorSection.id = 'shiftColorSettingsSection';
		
        // Aufbau der HTML-Struktur mit Paletten und Dropdowns
        let html = `<h4>${t.settings.shiftColors}</h4>`;
        
        COLOR_PALETTES.forEach((palette, index) => {
            // Versuchen herauszufinden, welche Schicht aktuell diese Farben hat
            let selectedShift = '';
            if (userProfile.shiftColors) {
                for (const [shift, colors] of Object.entries(userProfile.shiftColors)) {
                    // Vergleich der Farben (Groß-/Kleinschreibung ignorieren)
                    if (colors.light.toLowerCase() === palette.light.toLowerCase() && 
                        colors.dark.toLowerCase() === palette.dark.toLowerCase()) {
                        selectedShift = shift;
                        break;
                    }
                }
            }
            // Fallback: Standardzuordnung beim ersten Laden
            if (!selectedShift) {
                const defaults = ['fruehschicht', 'spaetschicht', 'nachtschicht', 'freischicht'];
                selectedShift = defaults[index] || '';
            }

            html += `
                <div class="settings-option inline color-assignment-row">
                    <div class="color-preview-group">
                        <div class="color-preview" style="background-color: ${palette.light};" title="Light Mode: ${palette.name}"></div>
                        <div class="color-preview" style="background-color: ${palette.dark};" title="Dark Mode: ${palette.name}"></div>
                    </div>
                    <select class="shift-select" data-light="${palette.light}" data-dark="${palette.dark}">
                        <option value="">- Keine -</option>
                        <option value="fruehschicht" ${selectedShift === 'fruehschicht' ? 'selected' : ''}>${t.settings.early}</option>
                        <option value="spaetschicht" ${selectedShift === 'spaetschicht' ? 'selected' : ''}>${t.settings.late}</option>
                        <option value="nachtschicht" ${selectedShift === 'nachtschicht' ? 'selected' : ''}>${t.settings.night}</option>
                        <option value="freischicht" ${selectedShift === 'freischicht' ? 'selected' : ''}>${t.settings.free}</option>
                    </select>
                </div>
            `;
        });

        html += `
            <div class="button-group" style="margin-top: 15px;">
                <button type="button" id="applyShiftColorsBtn" class="confirm-button">${t.settings.apply}</button>
                <button type="button" id="resetShiftColorsBtn" class="delete-button" style="background-color: #6c757d;">${t.settings.reset}</button>
            </div>
        `;

        colorSection.innerHTML = html;

        // Event Listeners für die neuen Buttons
        const applyBtn = colorSection.querySelector('#applyShiftColorsBtn');
        const resetBtn = colorSection.querySelector('#resetShiftColorsBtn');

        if (applyBtn) {
            applyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const newShiftColors = {};
                const selects = colorSection.querySelectorAll('.shift-select');
                selects.forEach(select => {
                    const shift = select.value;
                    if (shift) {
                        newShiftColors[shift] = {
                            light: select.dataset.light,
                            dark: select.dataset.dark
                        };
                    }
                });
                userProfile.shiftColors = newShiftColors;
                localStorage.setItem('userProfile', JSON.stringify(userProfile));
                applyCustomShiftColors();
                updateShiftInfoDisplay();
                showToast(uiTranslations[currentLanguage].prompts.colorsSaved, 'success');
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const selects = colorSection.querySelectorAll('.shift-select');
                const defaults = ['fruehschicht', 'spaetschicht', 'nachtschicht', 'freischicht'];
                selects.forEach((select, index) => {
                    select.value = defaults[index] || '';
                });
                showToast(uiTranslations[currentLanguage].prompts.standardColorsRestored, 'info');
            });
        }

		// Nach der Profil-Sektion einfügen
		const profileSection = profileVornameInput.closest('.settings-section');
		if (profileSection && profileSection.parentNode) {
			profileSection.parentNode.insertBefore(colorSection, profileSection.nextSibling);
		}
	}

    // CUSTOM PROFILE APP UI: Zusammenfassung und zugeklappte Details
    if (profileVornameInput) {
        const profileSection = profileVornameInput.closest('.settings-section');
        if (profileSection) {
            // 1. Standard-Header ausblenden
            const header = profileSection.querySelector('h4');
            if (header) header.style.display = 'none';

            // 2. Zusammenfassung erstellen (falls noch nicht vorhanden)
            let summary = document.getElementById('profileSummary');
            if (!summary) {
                summary = document.createElement('div');
                summary.id = 'profileSummary';
                summary.className = 'profile-summary-card';
                profileSection.insertBefore(summary, profileSection.firstChild);
                
                // Klick-Event zum Auf-/Zuklappen
                summary.addEventListener('click', () => {
                    const details = document.getElementById('profileDetailsWrapper');
                    if (details) {
                        const isHidden = details.style.display === 'none';
                        details.style.display = isHidden ? 'block' : 'none';
                        const icon = summary.querySelector('.toggle-icon');
                        if(icon) icon.className = isHidden ? 'fas fa-chevron-up toggle-icon' : 'fas fa-chevron-down toggle-icon';
                    }
                });
            }

            // Inhalt der Zusammenfassung aktualisieren
            const fullName = (userProfile.vorname || '') + ' ' + (userProfile.nachname || '');
            const persNr = userProfile.personalNummer || '-';
            const dept = userProfile.abteilung || '-';
            
            // Übersetzung für Labels
            const deptLabel = t.settings.department ? t.settings.department.substring(0, 3) : 'Abt';

            summary.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:space-between;">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="font-size:2.5em; color:#555;"><i class="fas fa-user-circle"></i></div>
                        <div>
                            <div style="font-weight:bold; font-size:1.2em;">${fullName.trim() || t.settings.guest}</div>
                            <div style="font-size:0.9em; color:#666;">${t.settings.idLabel}: ${persNr} | ${deptLabel}: ${dept}</div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-down toggle-icon"></i>
                </div>
            `;

            // 3. Eingabefelder in Wrapper verschieben (falls noch nicht geschehen)
            let details = document.getElementById('profileDetailsWrapper');
            if (!details) {
                details = document.createElement('div');
                details.id = 'profileDetailsWrapper';
                details.style.display = 'none'; // Standardmäßig zugeklappt
                details.style.marginTop = '15px';
                
                // Alle Kinder außer Summary und Header in den Wrapper verschieben
                const children = Array.from(profileSection.children);
                children.forEach(child => {
                    if (child !== summary && child !== details && child !== header) {
                        details.appendChild(child);
                    }
                });
                profileSection.appendChild(details);
            }
        }
    }

    // NEU: Werte der Dropdowns aktualisieren (falls Sektion bereits existiert oder neu erstellt wurde)
    const colorSection = document.getElementById('shiftColorSettingsSection');
    if (colorSection) {
        if (userProfile.shiftColors) {
            const selects = colorSection.querySelectorAll('.shift-select');
            selects.forEach(select => {
                let selectedShift = '';
                const pLight = select.dataset.light.toLowerCase();
                const pDark = select.dataset.dark.toLowerCase();
                
                for (const [shift, colors] of Object.entries(userProfile.shiftColors)) {
                    if (colors.light.toLowerCase() === pLight && colors.dark.toLowerCase() === pDark) {
                        selectedShift = shift;
                        break;
                    }
                }
                select.value = selectedShift;
            });
        }
        makeSectionCollapsible(colorSection);
    }

	if (profileVornameInput && profileNachnameInput) {
		profileVornameInput.value = userProfile.vorname || '';
		profileNachnameInput.value = userProfile.nachname || '';
		profilePersonalNrInput.value = userProfile.personalNummer || '';
		
		if (profileNameDisplay) {
			profileNameDisplay.textContent = userProfile.vorname || 'Profil';
			profileNameDisplay.style.cursor = 'pointer';
			profileNameDisplay.onclick = () => {
				document.getElementById('settingsDialogOverlay').classList.add('active');
				toggleSettingsVisibility('profile');
				if (profileVornameInput) profileVornameInput.focus();
			};
		}

		const greetingText = document.querySelector('.greeting-text');
		if (greetingText) {
			greetingText.style.display = userProfile.vorname ? 'block' : 'none';
		}

		const profileAbteilungInput = document.getElementById('profileAbteilung');
		if (profileAbteilungInput) {
			profileAbteilungInput.value = userProfile.abteilung || '';
		}
        
        const countWeekendsCb = document.getElementById('profileCountWeekends');
        if (countWeekendsCb) {
            countWeekendsCb.checked = userProfile.countWeekends || false;
        }

		// Schichtzeiten laden
		if (userProfile.shiftTimes) {
			document.getElementById('profileFruehStart').value = userProfile.shiftTimes.frueh.start;
			document.getElementById('profileFruehEnd').value = userProfile.shiftTimes.frueh.end;
			document.getElementById('profileSpaetStart').value = userProfile.shiftTimes.spaet.start;
			document.getElementById('profileSpaetEnd').value = userProfile.shiftTimes.spaet.end;
			document.getElementById('profileNachtStart').value = userProfile.shiftTimes.nacht.start;
			document.getElementById('profileNachtEnd').value = userProfile.shiftTimes.nacht.end;
		}

		if (userProfile.signature && signatureCtx) {
			const img = new Image();
			img.onload = () => {
				signatureCtx.drawImage(img, 0, 0);
			};
			img.src = userProfile.signature;
		}
	}

	// NEU: Benutzerdefinierte Farben anwenden
    applyCustomShiftColors();
}

// Profil speichern
if (saveProfileButton) {
	saveProfileButton.addEventListener('click', () => {
		userProfile.vorname = profileVornameInput.value.trim();
		userProfile.nachname = profileNachnameInput.value.trim();
		if (profileNameDisplay) {
			profileNameDisplay.textContent = userProfile.vorname || 'Profil';
		}

		const greetingText = document.querySelector('.greeting-text');
		if (greetingText) {
			greetingText.style.display = userProfile.vorname ? 'block' : 'none';
		}

		userProfile.personalNummer = profilePersonalNrInput.value.trim();

		const profileAbteilungInput = document.getElementById('profileAbteilung');
		if (profileAbteilungInput) {
			userProfile.abteilung = profileAbteilungInput.value.trim();
		}
        
        const countWeekendsCb = document.getElementById('profileCountWeekends');
        if (countWeekendsCb) {
            userProfile.countWeekends = countWeekendsCb.checked;
        }

		// Schichtzeiten speichern
		userProfile.shiftTimes = {
			frueh: {
				start: document.getElementById('profileFruehStart').value,
				end: document.getElementById('profileFruehEnd').value
			},
			spaet: {
				start: document.getElementById('profileSpaetStart').value,
				end: document.getElementById('profileSpaetEnd').value
			},
			nacht: {
				start: document.getElementById('profileNachtStart').value,
				end: document.getElementById('profileNachtEnd').value
			}
		};
		updateShiftInfoDisplay(); // Anzeige aktualisieren

		// NEU: Schichtfarben speichern
        const newShiftColors = {};
        const selects = document.querySelectorAll('.shift-select');
        selects.forEach(select => {
            const shift = select.value;
            if (shift) {
                newShiftColors[shift] = {
                    light: select.dataset.light,
                    dark: select.dataset.dark
                };
            }
        });
        userProfile.shiftColors = newShiftColors;
        
        applyCustomShiftColors(); // Neue Farben sofort anwenden

		// Speichere die Unterschrift vom Canvas
		if (signatureCanvas) {
			userProfile.signature = signatureCanvas.toDataURL('image/png');
		}

		localStorage.setItem('userProfile', JSON.stringify(userProfile));
		showToast(uiTranslations[currentLanguage].prompts.profileSaved, 'success');
	});
}

// Funktion zum Aktualisieren der Schichtzeiten-Anzeige im Info-Dialog
function updateShiftInfoDisplay() {
    const langT = uiTranslations[currentLanguage];
	if (userProfile.shiftTimes) {
		const t = userProfile.shiftTimes;
		const f = document.getElementById('infoFruehschicht');
		const s = document.getElementById('infoSpaetschicht');
		const n = document.getElementById('infoNachtschicht');

		if (f) f.textContent = `${langT.settings.early}: ${t.frueh.start} - ${t.frueh.end}`;
		if (s) s.textContent = `${langT.settings.late}: ${t.spaet.start} - ${t.spaet.end}`;
		if (n) n.textContent = `${langT.settings.night}: ${t.nacht.start} - ${t.nacht.end}`;
	}

	// NEU: Sichtbarkeit basierend auf dem aktiven Schichtsystem steuern
	const activeSystem = getActiveShiftSystem();
	const sequence = activeSystem.sequence;

	const setVisibility = (elementId, shiftClass) => {
		const element = document.getElementById(elementId);
		if (element) {
			const row = element.closest('.shift-info-item');
			if (row) {
				// Zeige die Zeile nur an, wenn die Schichtart im System vorkommt
				row.style.display = sequence.includes(shiftClass) ? 'flex' : 'none';
			}
		}
	};

	setVisibility('infoFruehschicht', 'fruehschicht');
	setVisibility('infoSpaetschicht', 'spaetschicht');
	setVisibility('infoNachtschicht', 'nachtschicht');
}

// ===== URLAUBSANTRAG-FUNKTIONALITÄT =====
const urlaubsantragButton = document.getElementById('urlaubsantragButton');
const urlaubsantragDialogOverlay = document.getElementById('urlaubsantragDialogOverlay');
const closeUrlaubsantragDialog = document.getElementById('closeUrlaubsantragDialog');
const generatePdfButton = document.getElementById('generatePdfButton');
const sendUrlaubsantragButton = document.getElementById('sendUrlaubsantragButton');

let urlaubsantragStartDate = null;

if (urlaubsantragButton) {
	urlaubsantragButton.addEventListener('click', () => {
		// Standardverhalten: Öffne Dialog mit aktuellem Tag oder heute
		let startDate = null;
		if (currentDayCell) {
			startDate = currentDayCell.dataset.fullDate;
		}
		openUrlaubsantragWithDates(startDate, null);
	});
}

// NEU: Funktion zum Öffnen des Urlaubsantrags mit vorgegebenen Daten
function openUrlaubsantragWithDates(startDateStr, endDateStr) {
	// Fallback, falls kein Startdatum übergeben wurde
	if (!startDateStr) {
		startDateStr = formatDate(new Date());
	}

	urlaubsantragStartDate = startDateStr;
	const dateInput = document.getElementById('urlaubsantrag_date_from');
	const nameInput = document.getElementById('urlaubsantrag_name');
	const personalnrInput = document.getElementById('urlaubsantrag_personalnummer');
	const signaturePreviewDiv = document.getElementById('urlaubsantrag_signature_preview');

	// Profildaten eintragen
	let fullName = '';
	if (userProfile.vorname) fullName += userProfile.vorname;
	if (userProfile.vorname && userProfile.nachname) fullName += ' ';
	if (userProfile.nachname) fullName += userProfile.nachname;
	
	if (nameInput) nameInput.value = fullName.trim();
	if (personalnrInput) personalnrInput.value = userProfile.personalNummer || '';
	if (dateInput) dateInput.value = urlaubsantragStartDate;
	
	const dateToInput = document.getElementById('urlaubsantrag_date_to');
	if (dateToInput) dateToInput.value = endDateStr || '';
	
	const grundInput = document.getElementById('urlaubsantrag_grund');
	if (grundInput) grundInput.value = '';

	// Unterschrift anzeigen
	if (signaturePreviewDiv) {
		signaturePreviewDiv.innerHTML = '';
		if (userProfile.signature) {
			signaturePreviewDiv.innerHTML = `<img src="${userProfile.signature}" style="max-width: 250px; max-height: 100px; border: 2px solid #ddd; border-radius: 4px; padding: 5px; display: block;">`;
		} else {
			signaturePreviewDiv.innerHTML = '<p style="color: #999; text-align: center;">Keine Unterschrift vorhanden. Bitte in den Einstellungen zeichnen.</p>';
		}
	}

	const dialogOverlay = document.getElementById('urlaubsantragDialogOverlay');
	if (dialogOverlay) dialogOverlay.classList.add('active');
	const noteDialog = document.getElementById('noteDialogOverlay');
	if (noteDialog) noteDialog.classList.remove('active');

	// Dynamische Felder einfügen
	ensureUrlaubsantragFields();
}

// NEU: Hilfsfunktion zum Sicherstellen der Zusatzfelder im Antrag
function ensureUrlaubsantragFields() {
    const t = uiTranslations[currentLanguage];
	const dateFromInput = document.getElementById('urlaubsantrag_date_from');
	if (dateFromInput && !document.getElementById('urlaubsantrag_type_container')) {
		const typeContainer = document.createElement('div');
		typeContainer.id = 'urlaubsantrag_type_container';
		typeContainer.className = 'urlaubsantrag-field';
		typeContainer.innerHTML = `
                <label>${t.vacation.type}</label>
                <div class="urlaubsantrag-type-grid">
                    <div><input type="radio" name="urlaubsantrag_type" value="1" checked> ${t.vacation.types[1]}</div>
                    <div><input type="radio" name="urlaubsantrag_type" value="2"> ${t.vacation.types[2]}</div>
                    <div><input type="radio" name="urlaubsantrag_type" value="3"> ${t.vacation.types[3]}</div>
                    <div><input type="radio" name="urlaubsantrag_type" value="4"> ${t.vacation.types[4]}</div>
                    <div><input type="radio" name="urlaubsantrag_type" value="5"> ${t.vacation.types[5]}</div>
                    <div><input type="radio" name="urlaubsantrag_type" value="6"> ${t.vacation.types[6]}</div>
                    <div><input type="radio" name="urlaubsantrag_type" value="7"> ${t.vacation.types[7]}</div>
                </div>
            `;
		if (dateFromInput.parentNode) dateFromInput.parentNode.parentNode.insertBefore(typeContainer, dateFromInput.parentNode);

		const grundInput = document.getElementById('urlaubsantrag_grund');
		if (grundInput && grundInput.parentNode) {
			const extraRemarkDiv = document.createElement('div');
			extraRemarkDiv.className = 'urlaubsantrag-field';
			extraRemarkDiv.innerHTML = `<label>${t.vacation.remark}:</label><input type="text" id="urlaubsantrag_zusatz_bemerkung" placeholder="${t.vacation.remarkPlaceholder}">`;
			grundInput.parentNode.parentNode.insertBefore(extraRemarkDiv, grundInput.parentNode.nextSibling);
		}
	}
}

if (closeUrlaubsantragDialog) {
	closeUrlaubsantragDialog.addEventListener('click', () => {
		urlaubsantragDialogOverlay.classList.remove('active');
	});

	urlaubsantragDialogOverlay.addEventListener('click', (event) => {
		if (event.target === urlaubsantragDialogOverlay) {
			urlaubsantragDialogOverlay.classList.remove('active');
		}
	});
}

// --- EMOJI PICKER FUNKTION ---
function showEmojiPicker(onSelect) {
    let overlay = document.getElementById('emojiPickerDialogOverlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'emojiPickerDialogOverlay';
        overlay.className = 'dialog-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'dialog';
        dialog.style.maxWidth = '400px';
        dialog.style.maxHeight = '80vh';
        dialog.style.display = 'flex';
        dialog.style.flexDirection = 'column';
        
        dialog.innerHTML = `
            <button class="close-button">&times;</button>
            <h3 style="margin-bottom: 10px;">${uiTranslations[currentLanguage].emoji.title}</h3>
            <div id="emojiGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(35px, 1fr)); gap: 5px; overflow-y: auto; padding: 5px; flex: 1;"></div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        const grid = dialog.querySelector('#emojiGrid');
        const emojis = ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","🤡","💩","👻","💀","☠️","👽","👾","🤖","🎃","😺","😸","😹","😻","😼","😽","🙀","😿","😾","👋","🤚","🖐","✋","🖖","👌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦵","🦶","👂","🦻","👃","🧠","🦷","🦴","👀","👁","👅","👄","💋","🩸","👶","👧","🧒","👦","👩","🧑","👨","👩‍🦱","🧑‍🦱","👨‍🦱","👩‍🦰","🧑‍🦰","👨‍🦰","👱‍♀️","👱","👱‍♂️","👩‍🦳","🧑‍🦳","👨‍🦳","👩‍🦲","🧑‍🦲","👨‍🦲","🧔","👵","🧓","👴","👲","👳‍♀️","👳","👳‍♂️","🧕","👮‍♀️","👮","👮‍♂️","👷‍♀️","👷","👷‍♂️","💂‍♀️","💂","💂‍♂️","🕵️‍♀️","🕵","🕵️‍♂️","👩‍⚕️","🧑‍⚕️","👨‍⚕️","👩‍🌾","🧑‍🌾","👨‍🌾","👩‍🍳","🧑‍🍳","👨‍🍳","👩‍🎓","🧑‍🎓","👨‍🎓","👩‍🎤","🧑‍🎤","👨‍🎤","👩‍🏫","🧑‍🏫","👨‍🏫","👩‍🏭","🧑‍🏭","👨‍🏭","👩‍💻","🧑‍💻","👨‍💻","👩‍💼","🧑‍💼","👨‍💼","👩‍🔧","🧑‍🔧","👨‍🔧","👩‍🔬","🧑‍🔬","👨‍🔬","👩‍🎨","🧑‍🎨","👨‍🎨","👩‍🚒","🧑‍🚒","👨‍🚒","👩‍✈️","🧑‍✈️","👨‍✈️","👩‍🚀","🧑‍🚀","👨‍🚀","👩‍⚖️","🧑‍⚖️","👨‍⚖️","👰","🤵","👸","🤴","🦸‍♀️","🦸","🦸‍♂️","🦹‍♀️","🦹","🦹‍♂️","🤶","🎅","🧙‍♀️","🧙","🧙‍♂️","🧝‍♀️","🧝","🧝‍♂️","🧛‍♀️","🧛","🧛‍♂️","🧟‍♀️","🧟","🧟‍♂️","🧞‍♀️","🧞","🧞‍♂️","🧜‍♀️","🧜","🧜‍♂️","🧚‍♀️","🧚","🧚‍♂️","👼","🤰","🤱","🙇‍♀️","🙇","🙇‍♂️","💁‍♀️","💁","💁‍♂️","🙅‍♀️","🙅","🙅‍♂️","🙆‍♀️","🙆","🙆‍♂️","🙋‍♀️","🙋","🙋‍♂️","🧏‍♀️","🧏","🧏‍♂️","🤦‍♀️","🤦","🤦‍♂️","🤷‍♀️","🤷","🤷‍♂️","🙎‍♀️","🙎","🙎‍♂️","🙍‍♀️","🙍","🙍‍♂️","💇‍♀️","💇","💇‍♂️","💆‍♀️","💆","💆‍♂️","🧖‍♀️","🧖","🧖‍♂️","💃","🕺","👯‍♀️","👯","👯‍♂️","🕴","👩‍🦽","🧑‍🦽","👨‍🦽","👩‍🦼","🧑‍🦼","👨‍🦼","🚶‍♀️","🚶","🚶‍♂️","👩‍🦯","🧑‍🦯","👨‍🦯","🧎‍♀️","🧎","🧎‍♂️","🏃‍♀️","🏃","🏃‍♂️","🧍‍♀️","🧍","🧍‍♂️","👭","🧑‍🤝‍🧑","👬","👫","👩‍❤️‍👩","💑","👨‍❤️‍👨","👩‍❤️‍💋‍👩","💏","👨‍❤️‍💋‍👨","👪","🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐽","🐸","🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🕷","🕸","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐓","🦃","🦚","🦜","🦢","🦩","🕊","🐇","🦝","🦨","🦡","🦦","🦥","🐁","🐀","🐿","🦔","🐾","🐉","🐲","🌵","🎄","🌲","🌳","🌴","🌱","🌿","☘️","🍀","🎍","🎋","🍃","🍂","🍁","🍄","🐚","🌾","💐","🌷","🌹","🥀","🌺","🌸","🌼","🌻","🌞","🌝","🌛","🌜","🌚","🌕","🌖","🌗","🌘","🌑","🌒","🌓","🌔","🌙","🌎","🌍","🌏","🪐","💫","⭐️","🌟","✨","⚡️","☄️","💥","🔥","🌪","🌈","☀️","🌤","⛅️","🌥","☁️","🌦","🌧","⛈","🌩","🌨","❄️","☃️","⛄️","🌬","💨","💧","💦","☔️","☂️","🌊","🌫","🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶","🌽","🥕","🧄","🧅","🥔","🍠","🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🦴","🌭","🍔","🍟","🍕","🥪","🥙","🧆","🌮","🌯","🥗","🥘","🥫","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🥠","🥮","🍢","🍡","🍧","🍨","🍦","🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯","🥛","🍼","☕️","🍵","🧃","🥤","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾","🧊","🥄","🍴","🍽","🥣","🥡","🥢","🧂","⚽️","🏀","🏈","⚾️","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🥅","⛳️","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛷","⛸","🥌","🎿","⛷","🏂","🪂","🏋️","🤼","🤸","⛹️","🤺","🤾","🏌️","🏇","🧘","🏄","🏊","🤽","🚣","🧗","🚵","🚴","🏆","🥇","🥈","🥉","🏅","🎖","🏵","🎗","🎫","🎟","🎪","🤹","🎭","🩰","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🪕","🎻","🎲","♟","🎯","🎳","🎮","🎰","🧩","🚗","🚕","🚙","🚌","🚎","🏎","🚓","🚑","🚒","🚐","🚚","🚛","🚜","🦯","🦽","🦼","🛴","🚲","🛵","🏍","🛺","🚨","🚔","🚍","🚘","🚖","🚡","🚠","🚟","🚃","🚋","🚞","🚝","🚄","🚅","🚈","🚂","🚆","🚇","🚊","🚉","✈️","🛫","🛬","🛩","💺","🛰","🚀","🛸","🚁","🛶","⛵️","🚤","🛥","🛳","⛴","🚢","⚓️","⛽️","🚧","🚦","🚥","🚏","🗺","🗿","🗽","🗼","🏰","🏯","🏟","🎡","🎢","🎠","⛲️","⛱","🏖","🏝","🏜","🌋","⛰","🏔","🗻","🏕","⛺️","🏠","🏡","🏘","🏚","🏗","🏭","🏢","🏬","🏣","🏤","🏥","🏦","🏨","🏪","🏫","🏩","💒","🏛","⛪️","🕌","🕍","🛕","🕋","⛩","🛤","🛣","🗾","🎑","🏞","🌅","🌄","🌠","🎇","🎆","🌇","🌆","🏙","🌃","🌌","🌉","🌁","⌚️","📱","📲","💻","⌨️","🖥","🖨","🖱","🖲","🕹","🗜","💽","💾","💿","📀","📼","📷","📸","📹","🎥","📽","🎞","📞","☎️","📟","📠","📺","📻","🎙","🎚","🎛","🧭","⏱","⏲","⏰","🕰","⌛️","⏳","📡","🔋","🔌","💡","🔦","🕯","🪔","🧯","🛢","💸","💵","💴","💶","💷","💰","💳","💎","⚖️","🧰","🔧","🔨","⚒","🛠","⛏","🪓","🔩","⚙️","🧱","⛓","🧲","🔫","💣","🧨","🪓","🔪","🗡","⚔️","🛡","🚬","⚰️","⚱️","🏺","🔮","📿","🧿","💈","⚗️","🔭","🔬","🕳","🩹","🩺","💊","💉","🩸","🧬","🦠","🧫","🧪","🌡","🧹","🧺","🧻","🚽","🚰","🚿","🛁","🛀","🧼","🪒","🧽","🧴","🛎","🔑","🗝","🚪","🪑","🛋","🛏","🛌","🧸","🖼","🛍","🛒","🎁","🎈","🎏","🎀","🎊","🎉","🎎","🏮","🎐","🧧","✉️","📩","📨","📧","💌","📥","📤","📦","🏷","📪","📫","📬","📭","📮","📯","📜","📃","📄","📑","🧾","📊","📈","📉","🗒","🗓","📆","📅","🗑","📇","🗃","🗳","🗄","📋","📁","📂","🗂","🗞","📰","📓","📔","📒","📕","📗","📘","📙","📚","📖","🔖","🧷","🔗","📎","🖇","📐","📏","🧮","📌","📍","✂️","🖊","🖋","✒️","🖌","🖍","📝","✏️","🔍","🔎","🔏","🔐","🔒","🔓","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈️","♉️","♊️","♋️","♌️","♍️","♎️","♏️","♐️","♑️","♒️","♓️","🆔","⚛️","🉑","☢️","☣️","📴","📳","🈶","🈚️","🈸","🈺","🈷️","✴️","🆚","💮","🉐","㊙️","㊗️","🈴","🈵","🈹","🈲","🅰️","🅱️","🆎","🆑","🅾️","🆘","❌","⭕️","🛑","⛔️","📛","🚫","💯","💢","♨️","🚷","🚯","🚳","🚱","🔞","📵","🚭","❗️","❕","❓","❔","‼️","⁉️","🔅","🔆","〽️","⚠️","🚸","🔱","⚜️","🔰","♻️","✅","🈯️","💹","❇️","✳️","❎","🌐","💠","Ⓜ️","🌀","💤","🏧","🚾","♿️","🅿️","🈳","🈂️","🛂","🛃","🛄","🛅","🚹","🚺","🚼","🚻","🚮","🎦","📶","🈁","🔣","ℹ️","🔤","🔡","🔠","🆖","🆗","🆙","🆒","🆕","🆓","0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟","🔢","#️⃣","*️⃣","⏏️","▶️","⏸","⏯","⏹","⏺","⏭","⏮","⏩","⏪","⏫","⏬","◀️","🔼","🔽","➡️","⬅️","⬆️","⬇️","↗️","↘️","↙️","↖️","↕️","↔️","↪️","↩️","⤴️","⤵️","🔀","🔁","🔂","🔄","🔃","🎵","🎶","➕","➖","➗","✖️","♾","💲","💱","™️","©️","®️","👁‍🗨","🔚","🔙","🔛","🔝","🔜","〰️","➰","➿","✔️","☑️","🔘","🔴","🟠","🟡","🟢","🔵","🟣","⚫️","⚪️","🟤","🔺","🔻","🔸","🔹","🔶","🔷","🔳","🔲","▪️","▫️","◾️","◽️","◼️","◻️","🟥","🟧","🟨","🟩","🟦","🟪","⬛️","⬜️","🟫","🔈","🔇","🔉","🔊","🔔","🔕","📣","📢","💬","💭","🗯","♠️","♣️","♥️","♦️","🃏","🎴","🀄️","🕐","🕑","🕒","🕓","🕔","🕕","🕖","🕗","🕘","🕙","🕚","🕛","🕜","🕝","🕞","🕟","🕠","🕡","🕢","🕣","🕤","🕥","🕦","🕧"];
        
        emojis.forEach(emoji => {
            const span = document.createElement('span');
            span.textContent = emoji;
            span.className = 'emoji-grid-item';
            span.onclick = () => {
                if (typeof onSelect === 'function') onSelect(emoji);
                overlay.classList.remove('active');
            };
            grid.appendChild(span);
        });
        
        overlay.querySelector('.close-button').addEventListener('click', () => overlay.classList.remove('active'));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    }
    
    // Update callback for existing overlay
    const gridSpans = overlay.querySelectorAll('.emoji-grid-item');
    gridSpans.forEach(span => {
        span.onclick = () => {
            if (typeof onSelect === 'function') onSelect(span.textContent);
            overlay.classList.remove('active');
        };
    });
    
    overlay.classList.add('active');
}

// PDF generieren
if (generatePdfButton) {
	generatePdfButton.addEventListener('click', () => {
		console.log('PDF-Button geklickt');
		try {
			generateUrlaubsantragPDF();
		} catch (error) {
			console.error('Fehler beim PDF-Generieren:', error);
			showToast(uiTranslations[currentLanguage].prompts.pdfError + ' ' + error.message, 'error');
		}
	});
}

function addVacationRangeToCalendar(startDateStr, endDateStr, typeName = '', remark = '', typeId = '1') {
	const start = new Date(startDateStr + 'T12:00:00');
	const end = new Date(endDateStr + 'T12:00:00');

    const countWeekends = userProfile.countWeekends || false;
    const isVacationType = ['1', '2', '5', '6'].includes(String(typeId));

	let cachedYear = null;
	let cachedHolidays = [];

	for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
		const dateString = formatDate(d);
		const year = d.getFullYear();

		if (year !== cachedYear) {
			cachedYear = year;
			cachedHolidays = getHolidaysForYear(year);
		}

		const isHoliday = cachedHolidays.some(h => h.date === dateString);
		const shiftClass = getShiftForDate(dateString);
        
        const dayOfWeek = d.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const isWorkDay = shiftClass !== 'freischicht';

        // NEU: Zählen wenn Arbeitstag UND (kein Wochenende ODER (Wochenende und Haken gesetzt))
		if (isWorkDay && (!isWeekend || countWeekends) && !isHoliday) {
            if (isVacationType) {
			    vacationData[dateString] = true;
            }
            
            // NEU: Notiz für den Urlaubstag erstellen
            if (typeName) {
                 const noteText = `${typeName}${remark ? ': ' + remark : ''}`;
                 // Prüfen ob Eintrag schon existiert um Duplikate zu vermeiden
                 const exists = importantDates.some(d => d.date === dateString && d.name === noteText);
                 if (!exists) {
                     importantDates.push({
                         id: Date.now() + Math.random(),
                         date: dateString,
                         name: noteText,
                         emoji: '',
                         recurring: false,
                         type: isVacationType ? 'vacation' : 'note',
                         vacationTypeId: typeId
                     });
                 }
            }
		}
	}
	localStorage.setItem('calendarVacations', JSON.stringify(vacationData));
    localStorage.setItem('importantDates', JSON.stringify(importantDates));
    // Auto-Notizen für alle betroffenen Tage aktualisieren
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        updateAutoNoteForDate(formatDate(d));
    }
	generateCalendar(currentCalendarYear);
	showToast(uiTranslations[currentLanguage].prompts.vacationAdded, 'success');
}

function generateUrlaubsantragPDF(action = 'download') {
	// NEU: Viewport speichern und Zoom zurücksetzen, um Verschiebungen zu vermeiden
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

	try {
		console.log('Starte PDF-Generierung...');

		const name = document.getElementById('urlaubsantrag_name').value;
		const personalnr = document.getElementById('urlaubsantrag_personalnummer').value;
		const dateFrom = document.getElementById('urlaubsantrag_date_from').value;
		const dateTo = document.getElementById('urlaubsantrag_date_to').value;
		const grund = document.getElementById('urlaubsantrag_grund').value;
		const zusatzBemerkung = document.getElementById('urlaubsantrag_zusatz_bemerkung') ? document.getElementById('urlaubsantrag_zusatz_bemerkung').value : '';
        
        const VACATION_TYPES = uiTranslations[currentLanguage].vacation.types;

		// Ausgewählten Typ ermitteln (1-7)
		let selectedType = '1';
		const selectedRadio = document.querySelector('input[name="urlaubsantrag_type"]:checked');
		if (selectedRadio) {
			selectedType = selectedRadio.value;
		}

		// Validierung für Punkt 5 und 6
		if ((selectedType === '5' || selectedType === '6') && !grund.trim()) {
			showToast(uiTranslations[currentLanguage].prompts.vacationReasonRequired, 'error');
			restoreViewport();
			return;
		}

		console.log('Name:', name, 'Von:', dateFrom, 'Bis:', dateTo);

		if (!dateTo) {
			showToast(uiTranslations[currentLanguage].prompts.enterEndDate, 'error');
			restoreViewport();
			return;
		}

		if (confirm(uiTranslations[currentLanguage].prompts.addVacationConfirm)) {
            const typeName = VACATION_TYPES[selectedType] || 'Urlaub';
			addVacationRangeToCalendar(dateFrom, dateTo, typeName, (selectedType === '5' || selectedType === '6') ? grund : zusatzBemerkung, selectedType);
		}

		// Hole alle Feiertage für das Jahr
		const fromDate = new Date(dateFrom);
		const toDate = new Date(dateTo);
		const year = fromDate.getFullYear();
		const yearHolidays = getHolidaysForYear(year);
        
        const countWeekends = userProfile.countWeekends || false;

		// Konvertiere Feiertage in ein Set für schnelle Suche
		const holidayDates = new Set(yearHolidays.map(h => h.date));

		// Berechne nur die Arbeitstage (nicht die Freischichten laut Schichtmodell und keine Feiertage)
		let workingDays = 0;

		console.log('Berechne Arbeitstage von', fromDate, 'bis', toDate);

		for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
			const dateStr = formatDate(d);
			const shiftClass = getShiftForDate(dateStr);
			const isHoliday = holidayDates.has(dateStr);
            
            const dayOfWeek = d.getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const isWorkDay = shiftClass !== 'freischicht';

			console.log(dateStr, '- Schicht:', shiftClass, ', Feiertag:', isHoliday);

			// Zähle nur Arbeitstage (nicht freischicht und keine Feiertage)
			if (isWorkDay && (!isWeekend || countWeekends) && !isHoliday) {
				workingDays++;
			}
		}

		console.log('Gesamt Arbeitstage:', workingDays);

		// Logo als Data-URL
		const logoImg = document.querySelector('.logo');
		let logoDataUrl = '';
		if (logoImg && logoImg.src) {
			// Versuche das Logo zu laden und zu konvertieren
			const canvas = document.createElement('canvas');
			canvas.width = logoImg.naturalWidth || 150;
			canvas.height = logoImg.naturalHeight || 100;
			const ctx = canvas.getContext('2d');
			ctx.drawImage(logoImg, 0, 0);
			logoDataUrl = canvas.toDataURL('image/png');
			console.log('Logo geladen');
		} else {
			console.log('Logo nicht gefunden');
		}

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
                        font-weight: 900;
                        font-size: 120pt;
                        position: absolute;
                        top: -38px;
                        right: 30px;
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
                    <div class="header">
                        <h1>Urlaubsantrag/ Abwesenheitsmeldung</h1>
                    </div>
            
                    <div class="top-fields">
                        <div class="field-group" style="flex: 2;"><label>Name:</label><input type="text" value="${name}"></div>
                        <div class="field-group" style="flex: 1;"><label>Pers-Nr:</label><input type="text" value="${personalnr}"></div>
                        <div class="field-group" style="flex: 1;"><label>Kst./ Abtlg:</label><input type="text" value="${userProfile.abteilung || ''}"></div>
                    </div>
            
                    <table>
                        <tr>
                            <td class="col-num">1.</td>
                            <td class="col-label">Tarifurlaub (01)</td>
                            <td>
                                <span class="small-label">vom</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '1' ? formatGermanDate(dateFrom) : ''}"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '1' ? formatGermanDate(dateTo) : ''}">
                                <span class="small-label">=</span> <input type="text" class="inline-input" style="width: 25px;" value="${selectedType === '1' ? workingDays : ''}"> <span class="small-label">Tage &nbsp; Rest:</span> <input type="text" class="inline-input" style="width: 50px;">
                            </td>
                        </tr>
                        <tr>
                            <td class="col-num">2.</td>
                            <td class="col-label">Abbau (Gleit-)Zeitkonto (17)</td>
                            <td>
                                <span class="small-label">vom</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '2' ? formatGermanDate(dateFrom) : ''}"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '2' ? formatGermanDate(dateTo) : ''}">
                                <span class="small-label">=</span> <input type="text" class="inline-input" style="width: 25px;" value="${selectedType === '2' ? workingDays : ''}"> <span class="small-label">Tage / von</span> <input type="text" class="inline-input" style="width: 35px;"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 35px;"> <span class="small-label">Uhr</span>
                            </td>
                        </tr>
                        <tr>
                            <td class="col-num">3.</td>
                            <td class="col-label">Dienstreise/- gang (97)</td>
                            <td>
                                <span class="small-label">vom</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '3' ? formatGermanDate(dateFrom) : ''}"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '3' ? formatGermanDate(dateTo) : ''}">
                                <span class="small-label">=</span> <input type="text" class="inline-input" style="width: 25px;" value="${selectedType === '3' ? workingDays : ''}"> <span class="small-label">Tage / von</span> <input type="text" class="inline-input" style="width: 35px;"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 35px;"> <span class="small-label">Uhr</span>
                            </td>
                        </tr>
                        <tr>
                            <td class="col-num">4.</td>
                            <td class="col-label">Schulung (74)</td>
                            <td>
                                <span class="small-label">vom</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '4' ? formatGermanDate(dateFrom) : ''}"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '4' ? formatGermanDate(dateTo) : ''}"> <span class="small-label">=</span> <input type="text" class="inline-input" style="width: 25px;" value="${selectedType === '4' ? workingDays : ''}"> <span class="small-label">Tage</span>
                            </td>
                        </tr>
                        <tr>
                            <td class="col-num">5.</td>
                            <td class="col-label">tarifl. Freistellung (20/21)</td>
                            <td>
                                <span class="small-label">vom</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '5' ? formatGermanDate(dateFrom) : ''}"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '5' ? formatGermanDate(dateTo) : ''}">
                                <span class="small-label">=</span> <input type="text" class="inline-input" style="width: 25px;" value="${selectedType === '5' ? workingDays : ''}"> <span class="small-label">Tage / von</span> <input type="text" class="inline-input" style="width: 35px;"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 35px;"> <span class="small-label">Uhr</span>
                            </td>
                        </tr>
                        <tr>
                            <td class="col-num">6.</td>
                            <td class="col-label">unbez. Urlaub ( 30/34)</td>
                            <td>
                                <span class="small-label">vom</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '6' ? formatGermanDate(dateFrom) : ''}"> <span class="small-label">bis</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '6' ? formatGermanDate(dateTo) : ''}"> <span class="small-label">=</span> <input type="text" class="inline-input" style="width: 25px;" value="${selectedType === '6' ? workingDays : ''}"> <span class="small-label">Tage</span>
                                <span style="font-size: 6pt;">(Umzug: Adresse/Tel angeben)</span>
                            </td>
                        </tr>
                    </table>
            
                    <div class="krank-container">
                        <span class="col-num">7.</span> <span class="krank-title" style="${selectedType === '7'}">Krank (41)</span> &nbsp;
                        <span class="small-label">Datum:</span> <input type="text" class="inline-input" style="width: 80px;" value="${selectedType === '7' ? formatGermanDate(dateFrom) : ''}">
                        <span class="small-label">um</span> <input type="text" class="inline-input" style="width: 35px;"> <span class="small-label">Uhr</span>
                        <span class="small-label">Schicht:</span> <input type="text" class="inline-input" style="width: 100px;">
                        <div style="margin-top: 5px; margin-left: 17px;">
                            <span class="small-label">voraussichtliche Dauer:</span> <input type="text" class="inline-input" style="width: 60%;">
                        </div>
                    </div>
            
                    <div class="bottom-grid">
                        <div class="remarks-area">
                            <div><span style="width: 80px; font-size: 8pt;">Grund 5, 6:</span> <input type="text" class="inline-input" style="width: 70%;" value="${(selectedType === '5' || selectedType === '6') ? grund : ''}"></div>
                            <div><span style="width: 80px; font-size: 8pt;">Bemerkung:</span> <input type="text" class="inline-input" style="width: 70%;" value="${(selectedType === '5' || selectedType === '6') ? '' : grund}"></div>
                            <div><span style="width: 80px; font-size: 8pt;"></span> <input type="text" class="inline-input" style="width: 70%;" value="${zusatzBemerkung}"></div>
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
                                    <div class="sig-val">${new Date().toLocaleDateString('de-DE')}</div>
                                    <div class="sig-line"></div>
                                    <div class="sig-label">Datum</div>
                                </div>
                                <div class="sig-field">
                                    <div class="sig-val" style="height: 40px; display: flex; align-items: flex-end; justify-content: flex-end;">
                                        ${userProfile.signature ? `<img src="${userProfile.signature}" style="max-height: 50px; max-width: 100%; position: relative; right: 55px;">` : ''}
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
                                    <div class="sig-val"></div>
                                    <div class="sig-line"></div>
                                    <div class="sig-label">Datum</div>
                                </div>
                                <div class="sig-field">
                                    <div class="sig-val" style="height: 40px;"></div>
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

		console.log('HTML Content erstellt');

		const element = document.createElement('div');
		element.innerHTML = htmlContent;

		let pdfFilenameName = name;
		if (userProfile.nachname && userProfile.vorname) {
			pdfFilenameName = `${userProfile.nachname}, ${userProfile.vorname}`;
		}

		const opt = {
			margin: [5, 5, 5, 5],
			filename: `${pdfFilenameName}, ${formatGermanDate(dateFrom)} - ${formatGermanDate(dateTo)}.pdf`,
			image: { type: 'jpeg', quality: 0.98 },
			html2canvas: {
				scale: 2,
				logging: false,
				scrollY: 0, // WICHTIG: Verhindert Verschiebung beim Scrollen
				scrollX: 0 // WICHTIG: Verhindert Verschiebung beim Scrollen
			},
			jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a5' }
		};

		console.log('Starte html2pdf...');

		if (typeof html2pdf === 'undefined') {
			throw new Error('html2pdf ist nicht geladen. Bitte überprüfen Sie die Bibliothek.');
		}

		// Temporär Dark Mode entfernen für PDF-Generierung
		const wasDarkMode = document.body.classList.contains('dark-mode');
		if (wasDarkMode) {
			document.body.classList.remove('dark-mode');
		}

		if (action === 'print') {
			html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf) => {
				if (wasDarkMode) document.body.classList.add('dark-mode');
				restoreViewport();
				pdf.autoPrint();
				window.open(pdf.output('bloburl'), '_blank');
			}).catch((error) => {
				if (wasDarkMode) document.body.classList.add('dark-mode');
				restoreViewport();
				console.error('PDF-Druckfehler:', error);
				showToast(uiTranslations[currentLanguage].prompts.printError + ' ' + error.message, 'error');
			});
		} else {
			// PDF als Blob generieren, um es teilen zu können
			html2pdf().set(opt).from(element).output('blob').then((blob) => {
				if (wasDarkMode) document.body.classList.add('dark-mode');
				restoreViewport();
				const file = new File([blob], opt.filename, { type: 'application/pdf' });

				// Prüfen, ob das Teilen von Dateien unterstützt wird (z.B. auf Mobilgeräten)
				if (navigator.canShare && navigator.canShare({ files: [file] })) {
					navigator.share({
						files: [file],
						title: 'Urlaubsantrag',
						text: `Hier ist mein Urlaubsantrag: ${opt.filename}`
					}).then(() => {
						console.log('PDF erfolgreich geteilt');
					}).catch((error) => {
						console.log('Teilen abgebrochen oder fehlgeschlagen', error);
					});
				} else {
					// Fallback: Download für Desktop oder nicht unterstützte Browser
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = opt.filename;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);
					showToast(uiTranslations[currentLanguage].prompts.pdfGenerated, 'success');
				}
			}).catch((error) => {
				if (wasDarkMode) document.body.classList.add('dark-mode');
				restoreViewport();
				console.error('PDF-Generierungsfehler:', error);
				showToast(uiTranslations[currentLanguage].prompts.pdfError + ' ' + error.message, 'error');
			});
		}

	} catch (error) {
		restoreViewport();
		console.error('Fehler in generateUrlaubsantragPDF:', error);
		showToast('Fehler beim Generieren der PDF: ' + error.message, 'error');
	}
}

// Hilfsfunktion: Abrufen der Schicht für ein bestimmtes Datum
function getShiftForDate(dateStr) {
	try {
		const activeShiftSystem = getActiveShiftSystem();
		const shiftSequence = activeShiftSystem.sequence;
		const referenceStartDate = activeShiftSystem.referenceStartDate;
		const referenceShiftType = activeShiftSystem.referenceShiftType;

		// Finde den Start-Index basierend auf dem Referenz-Shift-Type
		const referenceShiftIndex = shiftSequence.indexOf(referenceShiftType);
		if (referenceShiftIndex === -1) {
			console.error('Referenz-Schifttyp nicht in Sequenz gefunden:', referenceShiftType);
			return 'fruehschicht'; // Fallback
		}

		const targetDate = new Date(dateStr + 'T12:00:00Z');
		const oneDay = 1000 * 60 * 60 * 24;
		const diffDays = Math.round((targetDate.getTime() - referenceStartDate.getTime()) / oneDay);

		let shiftIndex = (referenceShiftIndex + diffDays) % shiftSequence.length;
		if (shiftIndex < 0) {
			shiftIndex += shiftSequence.length;
		}

		return shiftSequence[shiftIndex];
	} catch (error) {
		console.error('Fehler in getShiftForDate:', error);
		return 'fruehschicht'; // Fallback bei Fehler
	}
}

function formatGermanDate(dateString) {
	const date = new Date(dateString + 'T00:00:00');
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();
	return `${day}.${month}.${year}`;
}

// PDF drucken
if (sendUrlaubsantragButton) {
	sendUrlaubsantragButton.textContent = 'PDF drucken';
	sendUrlaubsantragButton.addEventListener('click', () => {
		generateUrlaubsantragPDF('print');
	});
}

// NEU: Funktion zum Exportieren des Antrags für den Manager
const exportUrlaubsantragButton = document.getElementById('exportUrlaubsantragButton');
if (exportUrlaubsantragButton) {
    exportUrlaubsantragButton.addEventListener('click', () => {
        const name = document.getElementById('urlaubsantrag_name').value;
        const dateFrom = document.getElementById('urlaubsantrag_date_from').value;
        const dateTo = document.getElementById('urlaubsantrag_date_to').value;
        
        // Typ ermitteln
        let selectedType = '1';
        const selectedRadio = document.querySelector('input[name="urlaubsantrag_type"]:checked');
        if (selectedRadio) selectedType = selectedRadio.value;

        // Arbeitstage berechnen für den Export
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        const year = fromDate.getFullYear();
        const yearHolidays = getHolidaysForYear(year);
        const countWeekends = userProfile.countWeekends || false;
        const holidayDates = new Set(yearHolidays.map(h => h.date));
        let workingDays = 0;

        for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
            const dateStr = formatDate(d);
            const shiftClass = getShiftForDate(dateStr);
            const isHoliday = holidayDates.has(dateStr);
            const dayOfWeek = d.getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const isWorkDay = shiftClass !== 'freischicht';
            if (isWorkDay && (!isWeekend || countWeekends) && !isHoliday) workingDays++;
        }

        const data = {
            name: name,
            vorname: userProfile.vorname,
            nachname: userProfile.nachname,
            personalNummer: document.getElementById('urlaubsantrag_personalnummer').value,
            abteilung: userProfile.abteilung || '',
            dateFrom: dateFrom,
            dateTo: dateTo,
            type: selectedType,
            workingDays: workingDays,
            grund: document.getElementById('urlaubsantrag_grund').value,
            zusatzBemerkung: document.getElementById('urlaubsantrag_zusatz_bemerkung') ? document.getElementById('urlaubsantrag_zusatz_bemerkung').value : '',
            signature: userProfile.signature, // Base64 Bild
            createdDate: new Date().toISOString()
        };

        if (!data.name || !data.dateFrom || !data.dateTo) {
            showToast(uiTranslations[currentLanguage].prompts.fillAllFields, 'error');
            return;
        }

        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Antrag_${name.replace(/\s+/g, '_')}_${data.dateFrom}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Antragsdatei für Manager erstellt!', 'success');
    });
}

// Funktion zum Umschalten der Sichtbarkeit im Einstellungsdialog
function toggleSettingsVisibility(mode) {
    // Vereinfachte Logik: Einfach den entsprechenden Tab öffnen
    if (mode === 'profile') {
        switchSettingsTab('profile');
    } else {
        switchSettingsTab('general');
    }
}

// Profil beim Laden der Seite laden
console.log('Profil-Verwaltung und Urlaubsantrag initialisiert');
loadProfile();
updateShiftInfoDisplay();

// NEU: Funktionen für den Auswahlmodus (Kalender vs. Manuell)
function showVacationModeDialog() {
    const t = uiTranslations[currentLanguage];
    // Immer neu erstellen, um Sprache zu aktualisieren
    let overlay = document.getElementById('vacationModeDialogOverlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'vacationModeDialogOverlay';
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
            <div class="dialog" style="text-align: center; max-width: 350px;">
                <h3>📝 ${t.vacation.title}</h3>
                <p style="margin-bottom: 20px;">${t.vacation.modeTitle}</p>
                <div class="button-group" style="flex-direction: column; gap: 10px;">
                    <button id="btnSelectInCalendar" class="action-button">${t.vacation.calendarSelect}</button>
                    <button id="btnManualEntry" class="action-button">${t.vacation.manualEntry}</button>
                </div>
                <button class="close-button" style="top: 5px; right: 5px;">&times;</button>
            </div>
        `;
    document.body.appendChild(overlay);
    
    overlay.querySelector('.close-button').addEventListener('click', () => overlay.classList.remove('active'));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    });
    
    document.getElementById('btnSelectInCalendar').addEventListener('click', () => {
        overlay.classList.remove('active');
        startCalendarSelectionMode();
    });
    
    document.getElementById('btnManualEntry').addEventListener('click', () => {
        overlay.classList.remove('active');
        openUrlaubsantragWithDates(null, null);
    });
    
    overlay.classList.add('active');
}

function startCalendarSelectionMode() {
    isSelectingVacationRange = true;
    selectionStartDate = null;
    showToast(uiTranslations[currentLanguage].prompts.selectStartDate, 'info');
    const dock = document.getElementById('bottomAppDock');
    if (dock) dock.classList.remove('open');
}

function handleVacationSelection(dateStr) {
    if (!selectionStartDate) {
        selectionStartDate = dateStr;
        showToast(uiTranslations[currentLanguage].prompts.selectEndDate.replace('{0}', dateStr.split('-').reverse().join('.')), 'info');
        const cell = document.querySelector(`.date-cell[data-full-date="${dateStr}"]`);
        if (cell) cell.style.backgroundColor = '#ffeeba';
    } else {
        const d1 = new Date(selectionStartDate);
        const d2 = new Date(dateStr);
        const start = d1 < d2 ? selectionStartDate : dateStr;
        const end = d1 < d2 ? dateStr : selectionStartDate;
        
        isSelectingVacationRange = false;
        selectionStartDate = null;
        
        openUrlaubsantragWithDates(start, end);
    }
}

// NEU: Funktion zum Löschen eines Urlaubsbereichs (für die Übersicht)
function deleteVacationRange(startDateStr, endDateStr) {
    const start = new Date(startDateStr + 'T12:00:00');
    const end = new Date(endDateStr + 'T12:00:00');
    
    // Iteriere durch den Bereich
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateString = formatDate(d);
        
        // Entferne aus vacationData
        if (vacationData[dateString]) {
            delete vacationData[dateString];
        }
        
        // Entferne aus importantDates (nur Einträge vom Typ 'vacation')
        importantDates = importantDates.filter(entry => !(entry.date === dateString && entry.type === 'vacation'));
        
        // Aktualisiere automatische Notizen
        updateAutoNoteForDate(dateString);
    }
    
    // Speichere Änderungen
    localStorage.setItem('calendarVacations', JSON.stringify(vacationData));
    localStorage.setItem('importantDates', JSON.stringify(importantDates));
    // calendarNotes wird bereits in updateAutoNoteForDate gespeichert, aber sicherheitshalber:
    localStorage.setItem('calendarNotes', JSON.stringify(notesData));
    
    // UI aktualisieren
    generateCalendar(currentCalendarYear);
    showOverview(); // Liste neu laden
    showToast(uiTranslations[currentLanguage].prompts.vacationDeleted, 'info');
}

// NEU: Funktionen für die Übersicht (Notizen & Urlaub)
function createOverviewDialog() {
    const t = uiTranslations[currentLanguage];
    // Dialog neu erstellen oder Titel aktualisieren
    let overlay = document.getElementById('overviewDialogOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overviewDialogOverlay';
        overlay.className = 'dialog-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'dialog';
        
        dialog.innerHTML = `
            <button id="closeOverviewDialog" class="close-button">&times;</button>
            <h3>🏖️ ${t.overview.title}</h3>
            <div id="overviewContent" style="max-height: 60vh; overflow-y: auto; margin-top: 10px;"></div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        const closeBtn = dialog.querySelector('#closeOverviewDialog');
        closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    } else {
        overlay.querySelector('h3').textContent = '🏖️ ' + t.overview.title;
    }
}

function showOverview() {
	createOverviewDialog();
    const t = uiTranslations[currentLanguage];
	const contentDiv = document.getElementById('overviewContent');
	contentDiv.innerHTML = '';
	
	const VACATION_TYPES = t.vacation.types;

	const allDates = new Set([...Object.keys(notesData), ...Object.keys(vacationData)]);
	const sortedDates = Array.from(allDates).sort();
	
    // Helper um Notiztext zu holen (auch wenn er nicht in notesData steht, z.B. bei Urlaubstyp 1,2,5,6)
    const getNoteText = (dStr) => {
        let txt = notesData[dStr];
        if (!txt && vacationData[dStr]) {
            const imp = importantDates.find(d => d.date === dStr && d.type === 'vacation');
            if (imp) txt = imp.name;
        }
        return txt;
    };

    // Gruppieren von zusammenhängenden Tagen
    const groupedEntries = [];
    if (sortedDates.length > 0) {
        let currentGroup = {
            dates: [sortedDates[0]],
            note: getNoteText(sortedDates[0]),
            isVacation: vacationData[sortedDates[0]]
        };
        
        for (let i = 1; i < sortedDates.length; i++) {
            const dateStr = sortedDates[i];
            const prevDateStr = sortedDates[i-1];
            const note = getNoteText(dateStr);
            const isVacation = vacationData[dateStr];
            
            const d1 = new Date(prevDateStr);
            const d2 = new Date(dateStr);
            const diffTime = Math.abs(d2 - d1);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Gruppieren wenn: 
            // 1. Lücke ist klein (<= 4 Tage, z.B. Wochenende dazwischen)
            // 2. Gleicher Typ (Urlaub) UND gleicher Notiz-Inhalt
            const isConnected = diffDays <= 4;
            const sameType = (isVacation === currentGroup.isVacation);
            const sameNote = (note === currentGroup.note);
            
            if (isConnected && sameType && sameNote) {
                currentGroup.dates.push(dateStr);
            } else {
                groupedEntries.push(currentGroup);
                currentGroup = {
                    dates: [dateStr],
                    note: note,
                    isVacation: isVacation
                };
            }
        }
        groupedEntries.push(currentGroup);
    }

	// Gruppieren nach Jahr
	const yearsData = {};
	
	groupedEntries.forEach(group => {
		// Filter: NUR Urlaubstage anzeigen
		if (!group.isVacation) return;

        const startDateStr = group.dates[0];
		const year = startDateStr.split('-')[0];
        
		if (!yearsData[year]) {
			yearsData[year] = { entries: [], vacationCount: 0, typeCounts: {} };
		}

		// Urlaubstage zählen
        let daysCount = 0;
        group.dates.forEach(d => {
            if (d.endsWith('-12-24') || d.endsWith('-12-31')) daysCount += 0.5;
            else daysCount += 1;
        });

		// Typ ermitteln und zählen
		let typeId = '1';
		const impDate = importantDates.find(d => d.date === group.dates[0] && d.type === 'vacation');
		if (impDate && impDate.vacationTypeId) {
			typeId = impDate.vacationTypeId;
		} else if (group.note) {
			for (const [tid, tname] of Object.entries(VACATION_TYPES)) {
				if (group.note.startsWith(tname)) {
					typeId = tid;
					break;
				}
			}
		}

		if (!yearsData[year].typeCounts[typeId]) yearsData[year].typeCounts[typeId] = 0;
		yearsData[year].typeCounts[typeId] += daysCount;
		yearsData[year].vacationCount += daysCount;
		yearsData[year].entries.push({ 
            startDate: group.dates[0],
            endDate: group.dates[group.dates.length - 1],
            daysCount: daysCount,
            note: group.note, 
            isVacation: group.isVacation 
        });
	});
	
	const sortedYears = Object.keys(yearsData).sort();
	
	if (sortedYears.length === 0) {
		contentDiv.innerHTML = `<p style="text-align: center; color: #666;">${t.overview.empty}</p>`;
	} else {
		sortedYears.forEach(year => {
			const yearData = yearsData[year];
			const currentRealYear = new Date().getFullYear();
			let yearLabel = year;
			if (parseInt(year) === currentRealYear) yearLabel += ` (${t.overview.currentYear})`;
			else if (parseInt(year) === currentRealYear - 1) yearLabel += ` (${t.overview.prevYear})`;
			else if (parseInt(year) === currentRealYear + 1) yearLabel += ` (${t.overview.nextYear})`;

			let breakdownHtml = '';
			const sortedTypes = Object.keys(yearData.typeCounts).sort();
			if (sortedTypes.length > 0) {
				breakdownHtml = '<div style="font-size: 0.85em; color: #555; margin-top: 5px; padding: 5px; background: #fff; border-radius: 4px; border: 1px solid #ddd;">';
				sortedTypes.forEach(tid => {
					const count = yearData.typeCounts[tid];
					const tname = VACATION_TYPES[tid] || 'Sonstiges';
					breakdownHtml += `<div style="display:flex; justify-content:space-between;"><span>${tname}:</span> <strong>${count} ${t.overview.days}</strong></div>`;
				});
				breakdownHtml += '</div>';
			}

			const yearSection = document.createElement('div');
			yearSection.innerHTML = `
				<div style="background-color: #eee; padding: 10px; font-weight: bold; border-radius: 5px; margin-bottom: 5px;">
					<div style="display: flex; justify-content: space-between; align-items: center;">
						<span>${yearLabel}</span>
						<span style="font-size: 0.9em; background: #fff; padding: 2px 6px; border-radius: 4px;">${t.overview.total}: ${yearData.vacationCount} ${t.overview.days}</span>
					</div>
					${breakdownHtml}
				</div>
			`;
			
			const ul = document.createElement('ul');
			ul.style.listStyle = 'none';
			ul.style.padding = '0';
			ul.style.margin = '0 0 20px 0';
			
			yearData.entries.forEach(entry => {
				const li = document.createElement('li');
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.style.alignItems = 'center';
				li.style.borderBottom = '1px solid #eee';
				li.style.padding = '12px 5px';
				li.style.cursor = 'pointer';
				
                const contentDiv = document.createElement('div');
                contentDiv.style.flex = '1';

				contentDiv.addEventListener('click', () => {
					document.getElementById('overviewDialogOverlay').classList.remove('active');
					const targetYear = parseInt(entry.startDate.split('-')[0]);
					if (targetYear !== currentCalendarYear) {
						generateCalendar(targetYear);
					}
					setTimeout(() => {
						const cell = document.querySelector(`.date-cell[data-full-date="${entry.startDate}"]`);
						if (cell) {
							cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
							cell.style.transition = 'background-color 0.5s';
							cell.style.backgroundColor = '#ffff99';
							setTimeout(() => cell.style.backgroundColor = '', 1000);
						}
					}, 100);
				});

				const startObj = new Date(entry.startDate);
                const endObj = new Date(entry.endDate);
				const formattedStart = startObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
                const formattedEnd = endObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
                
                const dateDisplay = (entry.startDate === entry.endDate) ? 
                    startObj.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) :
                    `${formattedStart} - ${formattedEnd}`;
				
				let html = `<div style="font-weight: bold; margin-bottom: 5px; font-size: 1.1em;">${dateDisplay}</div>`;
				
				if (entry.isVacation) {
					const vacText = `${t.overview.title} (${entry.daysCount} ${t.overview.days})`;
					html += `<div style="color: #6f42c1; margin-bottom: 3px; display: flex; align-items: center;"><i class="fas fa-calendar-minus" style="width: 25px; text-align: center; margin-right: 5px;"></i> ${vacText}</div>`;
				}
				
				if (entry.note) {
					const displayNote = entry.note.startsWith('[auto]') ? entry.note.substring(7) : entry.note;
					html += `<div style="display: flex; align-items: flex-start;"><i class="fas fa-sticky-note" style="width: 25px; text-align: center; margin-right: 5px; margin-top: 3px; color: #555;"></i> <span style="flex: 1;">${displayNote}</span></div>`;
				}
				
				contentDiv.innerHTML = html;
                li.appendChild(contentDiv);

                // Löschen-Button hinzufügen
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                deleteBtn.style.background = 'none';
                deleteBtn.style.border = 'none';
                deleteBtn.style.color = '#dc3545';
                deleteBtn.style.fontSize = '1.2em';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.style.padding = '0 10px';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if(confirm(uiTranslations[currentLanguage].prompts.deleteEntryConfirm)) {
                        deleteVacationRange(entry.startDate, entry.endDate);
                    }
                });
                li.appendChild(deleteBtn);

				ul.appendChild(li);
			});
			
			yearSection.appendChild(ul);
			contentDiv.appendChild(yearSection);
		});
	}
	
	document.getElementById('overviewDialogOverlay').classList.add('active');
}

// --- NEU: STATISTIK FUNKTIONEN ---
function createStatisticsDialog() {
    const t = uiTranslations[currentLanguage];
    let overlay = document.getElementById('statsDialogOverlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'statsDialogOverlay';
        overlay.className = 'dialog-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'dialog';
        dialog.innerHTML = `
            <button class="close-button">&times;</button>
            <h3>📊 ${t.stats.title} (${currentCalendarYear})</h3>
            <div id="statsContent" class="stats-container"></div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        overlay.querySelector('.close-button').addEventListener('click', () => overlay.classList.remove('active'));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    } else {
        overlay.querySelector('h3').textContent = `📊 ${t.stats.title} (${currentCalendarYear})`;
    }
    
    calculateAndShowStatistics();
    overlay.classList.add('active');
}

function calculateAndShowStatistics() {
    const t = uiTranslations[currentLanguage];
    const content = document.getElementById('statsContent');
    content.innerHTML = '<p class="loading-message">Berechne...</p>';

    // Zähler initialisieren
    let counts = {
        fruehschicht: 0,
        spaetschicht: 0,
        nachtschicht: 0,
        urlaub: 0,
        krank: 0
    };

    const startDate = new Date(currentCalendarYear, 0, 1);
    const endDate = new Date(currentCalendarYear, 11, 31);

    // Durch das Jahr iterieren
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDate(d);
        
        // 1. Prüfen auf Urlaub/Krank (hat Vorrang vor Schicht)
        if (vacationData[dateStr]) {
            // Versuchen, den Typ zu bestimmen (Krank vs Urlaub)
            const impEntry = importantDates.find(entry => entry.date === dateStr && entry.type === 'vacation');
            if (impEntry && impEntry.vacationTypeId === '7') {
                counts.krank++;
            } else {
                counts.urlaub++;
            }
            continue; // Wenn Urlaub, dann keine Schicht zählen
        }

        // 2. Schicht bestimmen
        const shift = getShiftForDate(dateStr);
        if (counts.hasOwnProperty(shift)) {
            counts[shift]++;
        }
    }

    const totalWorkDays = counts.fruehschicht + counts.spaetschicht + counts.nachtschicht;
    const maxVal = Math.max(counts.fruehschicht, counts.spaetschicht, counts.nachtschicht, counts.urlaub, 1);

    // HTML generieren
    const createBar = (label, value, colorClass) => {
        const percent = (value / maxVal) * 100;
        // Farbe aus CSS Variable oder Hardcoded holen, hier vereinfacht Mapping
        let color = '#ccc';
        if (colorClass === 'fruehschicht') color = '#FFF3E0'; // Fallback, besser wäre computedStyle
        if (colorClass === 'spaetschicht') color = '#C8E6C9';
        if (colorClass === 'nachtschicht') color = '#BBDEFB';
        if (colorClass === 'urlaub') color = '#D1C4E9';
        if (colorClass === 'krank') color = '#ffcdd2';

        return `
            <div class="stat-row">
                <div class="stat-label">${label}</div>
                <div class="stat-bar-container">
                    <div class="stat-bar ${colorClass}" style="width: ${percent}%; background-color: var(--${colorClass}-bg, ${color}); border: 1px solid #999;"></div>
                </div>
                <div class="stat-value">${value}</div>
            </div>
        `;
    };

    content.innerHTML = `
        <div class="stat-card">
            <h4 style="margin-top:0;">${t.stats.shiftDistribution}</h4>
            ${createBar(t.settings.early, counts.fruehschicht, 'fruehschicht')}
            ${createBar(t.settings.late, counts.spaetschicht, 'spaetschicht')}
            ${createBar(t.settings.night, counts.nachtschicht, 'nachtschicht')}
            <div style="text-align:right; font-size:0.9em; margin-top:5px; color:#666;">
                <strong>${t.stats.workDays}: ${totalWorkDays}</strong>
            </div>
        </div>

        <div class="stat-card">
            <h4 style="margin-top:0;">${t.stats.vacationUsed}</h4>
            ${createBar(t.info.vacation, counts.urlaub, 'urlaub')}
            ${counts.krank > 0 ? createBar(t.vacation.types[7], counts.krank, 'krank') : ''}
        </div>
    `;
    
    // Kleiner Hack, um die CSS-Klassen-Farben korrekt anzuwenden (da sie im CSS definiert sind)
    // Wir nutzen die existierenden Klassen .fruehschicht etc. für die Balken
}

// --- NEUE FUNKTION FÜR DIE APP-LEISTE (DOCK) ---
function createBottomAppDock() {
	// Container erstellen
	const dockContainer = document.createElement('div');
	dockContainer.id = 'bottomAppDock';

	const dockContent = document.createElement('div');
	dockContent.id = 'bottomAppDockContent';

	const dockTrigger = document.createElement('div');
	dockTrigger.id = 'bottomAppDockTrigger';
	dockTrigger.innerHTML = `<i class="fas fa-bars"></i> <span>${uiTranslations[currentLanguage].dock.menu}</span>`;

    // Auto-Close Logik
    let dockTimeout;
    const resetDockTimeout = () => {
        clearTimeout(dockTimeout);
        if (dockContainer.classList.contains('open')) {
            dockTimeout = setTimeout(() => {
                closeDock();
            }, 10000);
        }
    };

	// Struktur zusammenbauen
	dockContainer.appendChild(dockContent);
	dockContainer.appendChild(dockTrigger);
	document.body.appendChild(dockContainer);

	// Helper Funktion zum Schließen aller Overlays
	const closeAllOverlays = () => {
		document.querySelectorAll('.dialog-overlay.active').forEach(overlay => {
			overlay.classList.remove('active');
			if (overlay.id === 'settingsDialogOverlay') {
				collapseAllSettingsSections();
			}
		});
	};

	// Funktion zum Schließen des Docks
	const closeDock = () => {
		dockContainer.classList.remove('open');
		const icon = dockTrigger.querySelector('i');
		icon.className = 'fas fa-bars';
		dockContent.style.display = 'none';
        clearTimeout(dockTimeout);
	};

    dockContainer.addEventListener('mousemove', resetDockTimeout);
    dockContainer.addEventListener('click', resetDockTimeout);
    dockContainer.addEventListener('touchstart', resetDockTimeout);

    const t = uiTranslations[currentLanguage];

    // HIER KANNST DU DIE REIHENFOLGE DER APPS ÄNDERN
    // Einfach die Zeilen in diesem Array verschieben
    const dockApps = [
        { id: 'phone', label: t.dock.phone, icon: '📞', type: 'trigger', target: 'openPhoneDialog' },
        { id: 'today', label: t.dock.today, icon: '🗓️', type: 'trigger', target: 'todayButton' },
        { id: 'vacation', label: t.dock.vacation, icon: '📝', type: 'fn', fn: showVacationModeDialog },
        { id: 'absence', label: t.dock.absence, icon: '🏖️', type: 'fn', fn: showOverview },
        { id: 'important', label: t.dock.important, icon: '⭐', type: 'trigger', target: 'openImportantDatesDialog' },
        { id: 'info', label: t.dock.info, icon: 'ℹ️', type: 'trigger', target: 'openShiftInfoDialog' },
        { id: 'stats', label: t.stats.shortTitle || 'Stats', icon: '📊', type: 'fn', fn: createStatisticsDialog },
        { id: 'workwear', label: t.dock.workwear, icon: '👕', type: 'link', url: 'https://forms.office.com/e/YzwV8pCFgZ', iconStyle: 'filter: hue-rotate(258deg);' },
        { id: 'profile', label: t.dock.profile, icon: '👤', type: 'trigger', target: 'profileNameDisplay' },
        { id: 'settings', label: t.dock.settings, icon: '⚙️', type: 'trigger', target: 'openSettingsDialog' }
    ];

    dockApps.forEach(app => {
        // Prüfen, ob das Ziel-Element existiert (für Trigger-Typen)
        if (app.type === 'trigger') {
            const el = document.getElementById(app.target);
            if (!el) return; // Überspringen, wenn Element nicht da ist
            
            // Original-Elemente ausblenden (außer Settings und Profile, die oft sichtbar bleiben sollen oder woanders liegen)
            if (app.target !== 'openSettingsDialog' && app.target !== 'profileNameDisplay') {
                el.style.display = 'none';
            }
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'app-icon-wrapper';
        
        const icon = document.createElement('span');
        icon.textContent = app.icon;
        icon.style.fontSize = '28px';
        icon.style.marginBottom = '5px';
        if (app.iconStyle) icon.style.cssText += app.iconStyle;
        wrapper.appendChild(icon);
        
        const label = document.createElement('span');
        label.className = 'app-label';
        label.textContent = app.label;
        wrapper.appendChild(label);
        
        wrapper.addEventListener('click', () => {
            closeAllOverlays();
            if (app.type === 'trigger') {
                document.getElementById(app.target).click();
            } else if (app.type === 'fn') {
                app.fn();
            } else if (app.type === 'link') {
                window.open(app.url, '_blank');
            }
            closeDock();
        });
        
        dockContent.appendChild(wrapper);
    });

	// Toggle-Logik für das Menü
	dockTrigger.addEventListener('click', () => {
		dockContainer.classList.toggle('open');
		const icon = dockTrigger.querySelector('i');
		if (dockContainer.classList.contains('open')) {
			icon.className = 'fas fa-chevron-down';
			dockContent.style.display = 'grid';
            resetDockTimeout();
		} else {
			icon.className = 'fas fa-bars';
			dockContent.style.display = 'none';
            clearTimeout(dockTimeout);
		}
	});
}