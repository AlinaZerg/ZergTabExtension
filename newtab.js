document.addEventListener('DOMContentLoaded', () => {
  initBoard();
});

let currentWorkspace = null;
let currentWorkspaceIndex = 0;

let dragState = null;
let cardDragState = null;
let searchQuery = '';
let clockInterval = null;
let currentSettingsState = 'main'; // для перерисовки настроек при смене workspace

// ========== ИКОНКИ FEATHER (MIT License) ==========
// Источник: https://feathericons.com
// Copyright (c) 2013-2023 Cole Bemis
// Полный текст лицензии: см. файл LICENSE в корне расширения
function createFeatherIcon(name, size = 24) {
  const icons = {
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    'arrow-left': '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    'more-horizontal': '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    'more-vertical': '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
    'edit-2': '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
    'trash-2': '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
    layout: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'
  };

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.innerHTML = icons[name] || '';
  return svg;
}

// Глобальные настройки (без фона и акцентного цвета)
let settings = {
  theme: 'dark',
  openMode: 'current',
  columnsCount: 6,
  fontFamily: 'Segoe UI',
  fontSize: 16
};

// ========== ЗАГРУЗКА И СОХРАНЕНИЕ НАСТРОЕК ==========
async function loadSettings() {
  const defaults = {
    theme: 'dark',
    openMode: 'current',
    columnsCount: 6,
    fontFamily: 'Segoe UI',
    fontSize: 16,
    columnGap: 12,
    listGap: 12,
    columnWidth: 300
  };

  const data = await chrome.storage.local.get(['settings']);
  settings = { ...defaults, ...(data.settings || {}) };
  applySettings();
}

async function saveSettings() {
  await chrome.storage.local.set({ settings });
}

function applySettings() {
  document.body.classList.toggle('light-theme', settings.theme === 'light');

  document.body.style.setProperty('--app-font-family', settings.fontFamily);
  document.body.style.setProperty('--app-font-size', settings.fontSize + 'px');
  document.body.style.setProperty('--column-gap', settings.columnGap + 'px');
  document.body.style.setProperty('--list-gap', settings.listGap + 'px');
  document.body.style.setProperty('--column-width', settings.columnWidth + 'px');
}

// Применение визуальных настроек конкретного workspace
function applyWorkspaceVisuals(workspace) {
  if (!workspace) return;

  // Акцентный цвет
  const accent = workspace.accentColor || '#6b5b95';
  document.body.style.setProperty('--accent', accent);
  document.body.style.setProperty('--accent-light', hexToRgba(accent, 0.7));
  document.body.style.setProperty('--accent-glow', hexToRgba(accent, 0.4));
  document.body.style.setProperty('--bg-btn-primary', accent);
  document.body.style.setProperty('--bg-btn-primary-hover', hexToRgba(accent, 0.8));

  // Фон
  const bg = workspace.background;
  if (bg && bg.enabled) {
    if (bg.type === 'color') {
      document.body.style.setProperty('--bg-page', bg.color);
      document.body.style.setProperty('--bg-image', 'none');
    } else if (bg.type === 'url') {
      document.body.style.setProperty('--bg-page', 'transparent');
      document.body.style.setProperty('--bg-image', `url(${bg.url})`);
    } else if (bg.type === 'file') {
      document.body.style.setProperty('--bg-page', 'transparent');
      document.body.style.setProperty('--bg-image', `url(${bg.fileData})`);
    }
    document.body.style.setProperty('--bg-overlay-opacity', bg.overlayOpacity);
  } else {
    document.body.style.setProperty('--bg-page', settings.theme === 'light' ? '#eee5df' : '#1e1e1e');
    document.body.style.setProperty('--bg-image', 'none');
    document.body.style.setProperty('--bg-overlay-opacity', 0);
  }
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ========== ПАНЕЛЬ НАСТРОЕК ==========
function openSettingsPanel() {
  renderSettingsPanel('main');
}

async function renderSettingsPanel(state) {
  currentSettingsState = state; // запоминаем текущий экран

  let panel = document.querySelector('.settings-panel');

  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'settings-panel';
    document.body.appendChild(panel);
  }

  panel.innerHTML = '';

  if (state === 'main') {
    panel.innerHTML = `
      <div class="settings-header">
        <h2>Настройки</h2>
        <button class="settings-close-btn" title="Закрыть"></button>
      </div>
<div class="settings-section">
  <h3>Данные</h3>
  <div class="data-buttons-row">
    <button class="btn" id="export-data-btn">Экспорт</button>
    <button class="btn" id="import-data-btn">Импорт</button>
  </div>
  <button class="btn" id="import-friendly-btn" style="margin-top: 8px; width: 100%;">Импорт из Friendly Tab</button>
  <button class="btn btn-danger" id="reset-data-btn" style="margin-top: 12px; width: 100%;">Сбросить все данные</button>
</div>
      <div class="settings-section">
        <h3>Категории</h3>
        <button class="btn category-btn" data-category="appearance" style="display:block; width:100%; margin-bottom:8px;"></button>
        <button class="btn category-btn" data-category="behavior" style="display:block; width:100%; margin-bottom:8px;"></button>
        <button class="btn category-btn" data-category="workspaces" style="display:block; width:100%;"></button>
      </div>
    `;

    panel.querySelector('.settings-close-btn').addEventListener('click', closeSettingsPanel);
	panel.querySelector('.settings-close-btn').appendChild(createFeatherIcon('x', 24));
    panel.querySelector('#export-data-btn').addEventListener('click', exportData);
    panel.querySelector('#import-data-btn').addEventListener('click', () => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'application/json,.json';
      fileInput.style.display = 'none';
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) await importData(file);
        fileInput.remove();
      });
      document.body.appendChild(fileInput);
      fileInput.click();
    });
	panel.querySelector('#import-friendly-btn').addEventListener('click', () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json,.json';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) await importFriendlyTabData(file);
    fileInput.remove();
  });
  document.body.appendChild(fileInput);
  fileInput.click();
});
    panel.querySelector('#reset-data-btn').addEventListener('click', resetAllData);

    const categoryInfo = {
      appearance: { icon: 'layout', label: 'Оформление' },
      behavior: { icon: 'sliders', label: 'Поведение' },
      workspaces: { icon: 'folder', label: 'Рабочие пространства' }
    };
    panel.querySelectorAll('.category-btn').forEach(btn => {
      const info = categoryInfo[btn.dataset.category];
      if (info) {
        btn.appendChild(createFeatherIcon(info.icon, 20));
        btn.appendChild(document.createTextNode(' ' + info.label));
      }
      btn.addEventListener('click', () => {
        renderSettingsPanel(btn.dataset.category);
      });
    });

  } else if (state === 'appearance') {
    const accent = currentWorkspace?.accentColor || '#6b5b95';
    const bg = currentWorkspace?.background || { enabled: false, type: 'color', color: '#1e1e1e', url: '', fileData: '', overlayOpacity: 0.3 };

    panel.innerHTML = `
      <div class="settings-header">
        <button class="settings-back-btn" title="Назад"></button>
        <h2>Оформление</h2>
        <button class="settings-close-btn" title="Закрыть"></button>
      </div>
      <div class="settings-section">
        <h3>Тема</h3>
        <div class="setting-row no-label">
          <div class="theme-buttons">
            <button class="theme-btn ${settings.theme === 'dark' ? 'active' : ''}" data-theme="dark">Тёмная</button>
            <button class="theme-btn ${settings.theme === 'light' ? 'active' : ''}" data-theme="light">Светлая</button>
          </div>
        </div>
      </div>
      <div class="settings-section">
        <h3>Акцентный цвет</h3>
        <div class="setting-row no-label">
          <div class="color-options">
            <div class="color-row">
              ${['#6b5b95', '#5b8c5a', '#b85c5c', '#5c8cb8', '#b8a25c', '#B55AB9', '#5FACA1'].map(color => `
                <div class="color-swatch ${accent === color ? 'active' : ''}" style="background-color: ${color}" data-color="${color}"></div>
              `).join('')}
            </div>
            <div class="color-row">
              ${['#9b8ac4', '#7fb07b', '#d98d8d', '#7fb0d9', '#d4bc7f', '#D28CD6', '#87CAC1'].map(color => `
                <div class="color-swatch ${accent === color ? 'active' : ''}" style="background-color: ${color}" data-color="${color}"></div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
      <div class="settings-section">
        <h3>Шрифт</h3>
        <div class="setting-row">
          <label>Семейство</label>
          <select id="font-family-select">
            <option value="Segoe UI" ${settings.fontFamily === 'Segoe UI' ? 'selected' : ''}>Segoe UI</option>
            <option value="Arial" ${settings.fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
            <option value="Verdana" ${settings.fontFamily === 'Verdana' ? 'selected' : ''}>Verdana</option>
            <option value="Georgia" ${settings.fontFamily === 'Georgia' ? 'selected' : ''}>Georgia</option>
            <option value="Courier New" ${settings.fontFamily === 'Courier New' ? 'selected' : ''}>Courier New</option>
            <option value="Times New Roman" ${settings.fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
          </select>
        </div>
        <div class="setting-row">
          <label>Размер</label>
          <input type="range" id="font-size-range" min="12" max="20" value="${settings.fontSize}" />
          <span id="font-size-value">${settings.fontSize}px</span>
        </div>
        <div class="settings-section" style="padding: 10px 0; border-bottom: none;">
          <div id="font-preview" style="font-family: ${settings.fontFamily}; font-size: ${settings.fontSize}px; color: var(--text-main);">
            Пример текста
          </div>
        </div>
      </div>
	  <div class="settings-section">
  <h3>Размеры</h3>
  <div class="setting-row">
    <label>Компактный режим</label>
    <input type="checkbox" id="compact-mode-checkbox" ${(settings.columnGap === 6 && settings.listGap === 8 && settings.columnWidth === 200) ? 'checked' : ''}>
  </div>
  <div class="setting-row">
    <label>Между столбцами</label>
    <input type="range" id="column-gap-range" min="4" max="30" value="${settings.columnGap}" />
    <span id="column-gap-value">${settings.columnGap}px</span>
  </div>
  <div class="setting-row">
    <label>Между списками</label>
    <input type="range" id="list-gap-range" min="4" max="30" value="${settings.listGap}" />
    <span id="list-gap-value">${settings.listGap}px</span>
  </div>
  <div class="setting-row">
    <label>Ширина столбца</label>
    <input type="range" id="column-width-range" min="180" max="400" step="10" value="${settings.columnWidth}" />
    <span id="column-width-value">${settings.columnWidth}px</span>
  </div>
</div>
      <div class="settings-section">
        <h3>Фон</h3>
        <div class="setting-row">
          <label>Использовать фон</label>
          <input type="checkbox" id="bg-enabled" ${bg.enabled ? 'checked' : ''}>
        </div>
        <div class="setting-row">
          <label>Тип фона</label>
          <select id="bg-type">
            <option value="color" ${bg.type === 'color' ? 'selected' : ''}>Цвет</option>
            <option value="url" ${bg.type === 'url' ? 'selected' : ''}>URL</option>
            <option value="file" ${bg.type === 'file' ? 'selected' : ''}>Файл</option>
          </select>
        </div>
        <div class="setting-row" id="bg-color-row">
          <label>Цвет</label>
          <input type="color" id="bg-color" value="${bg.color}">
        </div>
        <div class="setting-row" id="bg-url-row">
          <label>URL изображения</label>
          <input type="url" id="bg-url" value="${bg.url}" placeholder="https://example.com/image.jpg">
        </div>
        <div class="setting-row" id="bg-file-row">
          <label>Файл</label>
          <button class="btn" id="bg-file-btn">Загрузить</button>
        </div>
        <div class="setting-row">
          <label id="bg-overlay-label">Затемнение (${Math.round(bg.overlayOpacity * 100)}%)</label>
          <input type="range" id="bg-overlay" min="0" max="100" value="${bg.overlayOpacity * 100}">
        </div>
      </div>
    `;

    panel.querySelector('.settings-close-btn').addEventListener('click', closeSettingsPanel);
    panel.querySelector('.settings-back-btn').addEventListener('click', () => renderSettingsPanel('main'));
	panel.querySelector('.settings-close-btn').appendChild(createFeatherIcon('x', 24));
	panel.querySelector('.settings-back-btn').appendChild(createFeatherIcon('arrow-left', 24));

    // Тема
    panel.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        settings.theme = btn.dataset.theme;
        saveSettings();
        applySettings();
        applyWorkspaceVisuals(currentWorkspace);
        panel.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Акцентный цвет
    panel.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        currentWorkspace.accentColor = swatch.dataset.color;
        saveCurrentWorkspace();
        applyWorkspaceVisuals(currentWorkspace);
        panel.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
      });
    });

    // Шрифт
    const fontFamilySelect = panel.querySelector('#font-family-select');
    const fontSizeRange = panel.querySelector('#font-size-range');
    const fontSizeValue = panel.querySelector('#font-size-value');
    const fontPreview = panel.querySelector('#font-preview');

    fontFamilySelect.addEventListener('change', () => {
      settings.fontFamily = fontFamilySelect.value;
      fontPreview.style.fontFamily = settings.fontFamily;
      saveSettings();
      applySettings();
    });

    fontSizeRange.addEventListener('input', () => {
      settings.fontSize = parseInt(fontSizeRange.value);
      fontSizeValue.textContent = settings.fontSize + 'px';
      fontPreview.style.fontSize = settings.fontSize + 'px';
      saveSettings();
      applySettings();
    });
	
	// Размеры
const compactCheckbox = panel.querySelector('#compact-mode-checkbox');
const columnGapRange = panel.querySelector('#column-gap-range');
const listGapRange = panel.querySelector('#list-gap-range');
const columnWidthRange = panel.querySelector('#column-width-range');
const columnGapValue = panel.querySelector('#column-gap-value');
const listGapValue = panel.querySelector('#list-gap-value');
const columnWidthValue = panel.querySelector('#column-width-value');

const checkCompactMode = () => {
  return settings.columnGap === 6 && settings.listGap === 8 && settings.columnWidth === 200;
};

const updateCompactCheckbox = () => {
  compactCheckbox.checked = checkCompactMode();
};

compactCheckbox.addEventListener('change', () => {
  if (compactCheckbox.checked) {
    settings.columnGap = 6;
    settings.listGap = 8;
    settings.columnWidth = 200;
  } else {
    settings.columnGap = 12;
    settings.listGap = 16;
    settings.columnWidth = 220;
  }
  columnGapRange.value = settings.columnGap;
  listGapRange.value = settings.listGap;
  columnWidthRange.value = settings.columnWidth;
  columnGapValue.textContent = settings.columnGap + 'px';
  listGapValue.textContent = settings.listGap + 'px';
  columnWidthValue.textContent = settings.columnWidth + 'px';
  saveSettings();
  applySettings();
});

columnGapRange.addEventListener('input', () => {
  settings.columnGap = parseInt(columnGapRange.value);
  columnGapValue.textContent = settings.columnGap + 'px';
  saveSettings();
  applySettings();
  updateCompactCheckbox();
});

listGapRange.addEventListener('input', () => {
  settings.listGap = parseInt(listGapRange.value);
  listGapValue.textContent = settings.listGap + 'px';
  saveSettings();
  applySettings();
  updateCompactCheckbox();
});

columnWidthRange.addEventListener('input', () => {
  settings.columnWidth = parseInt(columnWidthRange.value);
  columnWidthValue.textContent = settings.columnWidth + 'px';
  saveSettings();
  applySettings();
  updateCompactCheckbox();
});

    // Фон
    const bgEnabledCheckbox = panel.querySelector('#bg-enabled');
    const bgTypeSelect = panel.querySelector('#bg-type');
    const bgColorInput = panel.querySelector('#bg-color');
    const bgUrlInput = panel.querySelector('#bg-url');
    const overlayRange = panel.querySelector('#bg-overlay');
    const overlayLabel = panel.querySelector('#bg-overlay-label');

    bgEnabledCheckbox.addEventListener('change', () => {
      currentWorkspace.background.enabled = bgEnabledCheckbox.checked;
      saveCurrentWorkspace();
      applyWorkspaceVisuals(currentWorkspace);
      updateBackgroundControls();
    });

    bgTypeSelect.addEventListener('change', () => {
      currentWorkspace.background.type = bgTypeSelect.value;
      saveCurrentWorkspace();
      applyWorkspaceVisuals(currentWorkspace);
      updateBackgroundControls();
    });

    bgColorInput.addEventListener('input', () => {
      currentWorkspace.background.color = bgColorInput.value;
      saveCurrentWorkspace();
      applyWorkspaceVisuals(currentWorkspace);
    });

    bgUrlInput.addEventListener('input', () => {
      currentWorkspace.background.url = bgUrlInput.value;
      saveCurrentWorkspace();
      applyWorkspaceVisuals(currentWorkspace);
    });

    panel.querySelector('#bg-file-btn').addEventListener('click', () => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            currentWorkspace.background.fileData = reader.result;
            saveCurrentWorkspace();
            applyWorkspaceVisuals(currentWorkspace);
          };
          reader.readAsDataURL(file);
        }
        fileInput.remove();
      });
      document.body.appendChild(fileInput);
      fileInput.click();
    });

    overlayRange.addEventListener('input', () => {
      currentWorkspace.background.overlayOpacity = parseInt(overlayRange.value) / 100;
      overlayLabel.textContent = `Затемнение (${overlayRange.value}%)`;
      saveCurrentWorkspace();
      applyWorkspaceVisuals(currentWorkspace);
    });

    updateBackgroundControls();

  } else if (state === 'behavior') {
    panel.innerHTML = `
      <div class="settings-header">
        <button class="settings-back-btn" title="Назад"></button>
        <h2>Поведение</h2>
        <button class="settings-close-btn" title="Закрыть"></button>
      </div>
      <div class="settings-section">
        <div class="setting-row">
          <label>Клик по ссылке</label>
          <select id="open-mode-select">
            <option value="current" ${settings.openMode === 'current' ? 'selected' : ''}>Текущая вкладка</option>
            <option value="new" ${settings.openMode === 'new' ? 'selected' : ''}>Новая вкладка</option>
            <option value="background" ${settings.openMode === 'background' ? 'selected' : ''}>Фоновая вкладка</option>
          </select>
        </div>
        <div class="setting-row">
          <label>Количество столбцов</label>
          <input type="range" id="columns-range" min="1" max="12" value="${settings.columnsCount}" />
          <span id="columns-value">${settings.columnsCount}</span>
        </div>
      </div>
    `;

    panel.querySelector('.settings-close-btn').addEventListener('click', closeSettingsPanel);
    panel.querySelector('.settings-back-btn').addEventListener('click', () => renderSettingsPanel('main'));
	panel.querySelector('.settings-close-btn').appendChild(createFeatherIcon('x', 24));
	panel.querySelector('.settings-back-btn').appendChild(createFeatherIcon('arrow-left', 24));

    panel.querySelector('#open-mode-select').addEventListener('change', (e) => {
      settings.openMode = e.target.value;
      saveSettings();
    });

    const range = panel.querySelector('#columns-range');
    const valueSpan = panel.querySelector('#columns-value');
    range.addEventListener('input', () => {
      settings.columnsCount = parseInt(range.value);
      valueSpan.textContent = settings.columnsCount;
      saveSettings();
      redistributeLists();
      saveCurrentWorkspace().then(() => renderWorkspace(currentWorkspace));
    });

  } else if (state === 'workspaces') {
    const workspaces = await getWorkspaces();

    panel.innerHTML = `
      <div class="settings-header">
        <button class="settings-back-btn" title="Назад"></button>
        <h2>Рабочие пространства</h2>
        <button class="settings-close-btn" title="Закрыть"></button>
      </div>
      <div class="settings-section">
        <div class="workspaces-list">
          ${workspaces.map(ws => `
            <div class="workspace-item-row ${ws.id === currentWorkspace.id ? 'current' : ''}" draggable="true" data-ws-id="${ws.id}">
              <span class="drag-handle"></span>
              <span class="workspace-name">${ws.name}</span>
              <div class="workspace-item-actions">
                <button class="btn small-btn workspace-rename-btn" data-ws-id="${ws.id}"></button>
                <button class="btn small-btn workspace-delete-btn" data-ws-id="${ws.id}" ${workspaces.length === 1 ? 'disabled' : ''}></button>
              </div>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-primary" id="add-workspace-btn" style="margin-top: 12px; width: 100%;">Создать рабочее пространство</button>
      </div>
    `;

    panel.querySelector('.settings-close-btn').addEventListener('click', closeSettingsPanel);
    panel.querySelector('.settings-back-btn').addEventListener('click', () => renderSettingsPanel('main'));
	panel.querySelector('.settings-close-btn').appendChild(createFeatherIcon('x', 24));
	panel.querySelector('.settings-back-btn').appendChild(createFeatherIcon('arrow-left', 24));
    panel.querySelector('#add-workspace-btn').addEventListener('click', onAddWorkspaceFromSettings);
	
	panel.querySelectorAll('.workspace-rename-btn').forEach(btn => {
	  btn.appendChild(createFeatherIcon('edit-2', 14));
	});
	panel.querySelectorAll('.workspace-delete-btn').forEach(btn => {
	  btn.appendChild(createFeatherIcon('trash-2', 14));
	});

    panel.querySelectorAll('.workspace-rename-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wsId = btn.dataset.wsId;
        onRenameWorkspaceFromSettings(wsId);
      });
    });

    panel.querySelectorAll('.workspace-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wsId = btn.dataset.wsId;
        onDeleteWorkspaceFromSettings(wsId);
      });
    });

    panel.querySelectorAll('.drag-handle').forEach(el => {
      el.appendChild(createFeatherIcon('more-vertical', 16));
    });

    setupWorkspacesDragAndDrop(panel);
  }

  if (!panel.classList.contains('open')) {
    requestAnimationFrame(() => panel.classList.add('open'));
  }
}

function closeSettingsPanel() {
  const panel = document.querySelector('.settings-panel');
  if (panel) {
    panel.classList.remove('open');
    setTimeout(() => panel.remove(), 300);
  }
}

function updateBackgroundControls() {
  const panel = document.querySelector('.settings-panel');
  if (!panel) return;
  const type = currentWorkspace?.background?.type || 'color';
  panel.querySelector('#bg-color-row').style.display = type === 'color' ? 'flex' : 'none';
  panel.querySelector('#bg-url-row').style.display = type === 'url' ? 'flex' : 'none';
  panel.querySelector('#bg-file-row').style.display = type === 'file' ? 'flex' : 'none';
}

// ========== ЭКСПОРТ / ИМПОРТ / СБРОС ==========
async function exportData() {
  const data = await chrome.storage.local.get(['workspaces', 'settings']);
  const exportObj = {
    version: 1,
    exportedAt: new Date().toISOString(),
    workspaces: data.workspaces || [],
    settings: data.settings || {}
  };
  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().slice(0,10);
  a.download = `zergtab-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importData(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.workspaces || !Array.isArray(data.workspaces)) {
      alert('Неверный формат файла: отсутствует массив workspaces.');
      return;
    }
    if (!confirm('Импорт полностью заменит текущие данные. Продолжить?')) return;

    const newWorkspaces = normalizeWorkspaces(data.workspaces);
    const newSettings = { ...settings, ...(data.settings || {}) };

    await chrome.storage.local.set({
      workspaces: newWorkspaces,
      settings: newSettings
    });

    settings = newSettings;
    await loadSettings();

    const allWorkspaces = newWorkspaces;
    currentWorkspace = allWorkspaces[0] || createDefaultWorkspaces()[0];
    currentWorkspaceIndex = 0;
    applyWorkspaceVisuals(currentWorkspace);
    renderWorkspace(currentWorkspace);
    if (document.querySelector('.settings-panel.open')) {
      renderSettingsPanel(currentSettingsState);
    }
  } catch (err) {
    alert('Ошибка при импорте файла: ' + err.message);
  }
}

async function importFriendlyTabData(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Сначала проверяем, что это файл Friendly Tab
    if (!data.boards || !Array.isArray(data.boards)) {
      // Не Friendly Tab — пробуем прочитать как наш формат
      if (data.workspaces && Array.isArray(data.workspaces)) {
        // Вызываем обычный импорт, но без повторного чтения файла
        const newWorkspaces = normalizeWorkspaces(data.workspaces);
        const newSettings = { ...settings, ...(data.settings || {}) };
        if (!confirm('Это файл формата ZergTab, а не Friendly Tab. Импорт заменит текущие данные. Продолжить?')) return;
        await chrome.storage.local.set({
          workspaces: newWorkspaces,
          settings: newSettings
        });
        settings = newSettings;
        await loadSettings();
        currentWorkspace = newWorkspaces[0] || createDefaultWorkspaces()[0];
        currentWorkspaceIndex = 0;
        applyWorkspaceVisuals(currentWorkspace);
        renderWorkspace(currentWorkspace);
        if (document.querySelector('.settings-panel.open')) {
          renderSettingsPanel(currentSettingsState);
        }
        return;
      }
      alert('Не удалось распознать файл. Убедитесь, что выбран JSON из Friendly Tab или из ZergTab.');
      return;
    }

    // === Конвертация Friendly Tab ===
    const importedWorkspaces = data.boards.map(board => {
      // Определяем фон
      let background = {
        enabled: false,
        type: 'color',
        color: '#1e1e1e',
        url: '',
        fileData: '',
        overlayOpacity: 0.3
      };

      if (board.bgImage && String(board.bgImage).trim() !== '') {
        background.enabled = true;
        background.type = 'url';
        background.url = board.bgImage;
      } else if (board.bgColor && String(board.bgColor).trim() !== '') {
        background.enabled = true;
        background.type = 'color';
        background.color = board.bgColor;
      }

      const wsId = 'ws_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

      const lists = (board.lists || []).map((list, listIndex) => {
        const listId = 'list_' + Date.now() + '_' + listIndex + '_' + Math.random().toString(36).slice(2, 8);

        const cards = (list.links || []).map((link, linkIndex) => ({
          id: 'card_' + Date.now() + '_' + listIndex + '_' + linkIndex + '_' + Math.random().toString(36).slice(2, 8),
          title: link.title || '',
          url: link.url || '',
          createdAt: Date.now()
        }));

        return {
          id: listId,
          name: list.title || 'Без названия',
          column: typeof list.column === 'number' ? list.column : 0,
          order: 0,
          cards: cards
        };
      });

      return {
        id: wsId,
        name: board.name || 'Импортированное пространство',
        lists: lists,
        accentColor: '#6b5b95',
        background: background
      };
    });

    // Нормализуем импортированные (расставит order, поправит column)
    const normalized = normalizeWorkspaces(importedWorkspaces);

    // Добавляем к текущим, не удаляя их
    const existing = await getWorkspaces();
    const combined = [...existing, ...normalized];
    await chrome.storage.local.set({ workspaces: combined });

    alert(`Импортировано пространств: ${normalized.length}`);

    // Переключаемся на первое импортированное
    if (normalized.length > 0) {
      currentWorkspace = normalized[0];
      currentWorkspaceIndex = existing.length;
      applyWorkspaceVisuals(currentWorkspace);
      renderWorkspace(currentWorkspace);
    }

    if (document.querySelector('.settings-panel.open')) {
      renderSettingsPanel(currentSettingsState);
    }
  } catch (err) {
    alert('Ошибка при импорте файла: ' + err.message);
  }
}

async function resetAllData() {
  if (!confirm('Удалить все данные и начать с чистого листа? Это действие нельзя отменить.')) return;

  await chrome.storage.local.remove(['workspaces', 'settings']);
let settings = {
  theme: 'dark',
  openMode: 'current',
  columnsCount: 6,
  fontFamily: 'Segoe UI',
  fontSize: 16,
  columnGap: 12,
  listGap: 16,
  columnWidth: 220
};
  await saveSettings();
  const workspaces = createDefaultWorkspaces();
  await chrome.storage.local.set({ workspaces });
  currentWorkspace = workspaces[0];
  currentWorkspaceIndex = 0;
  applyWorkspaceVisuals(currentWorkspace);
  renderWorkspace(currentWorkspace);
  if (document.querySelector('.settings-panel.open')) {
    renderSettingsPanel(currentSettingsState);
  }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
async function initBoard() {
  await loadSettings();
  const data = await chrome.storage.local.get(['workspaces']);
  let workspaces = data.workspaces;

  if (!workspaces || workspaces.length === 0) {
    workspaces = createDefaultWorkspaces();
    await chrome.storage.local.set({ workspaces });
  } else {
    workspaces = normalizeWorkspaces(workspaces);
    await chrome.storage.local.set({ workspaces });
  }

  currentWorkspace = workspaces[0];
  currentWorkspaceIndex = 0;
  applyWorkspaceVisuals(currentWorkspace);
  renderWorkspace(currentWorkspace);
}

function createDefaultWorkspaces() {
  const now = Date.now();
  return [{
    id: 'ws_' + now,
    name: 'Моё пространство',
    lists: [
      {
        id: 'list_' + now + '_1',
        name: 'Идеи',
        column: 0,
        order: 0,
        cards: [
          { id: 'card_' + now + '_1', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', createdAt: now },
          { id: 'card_' + now + '_2', title: 'Хабр', url: 'https://habr.com', createdAt: now + 1 }
        ]
      },
      {
        id: 'list_' + now + '_2',
        name: 'Читать позже',
        column: 1,
        order: 0,
        cards: []
      }
    ],
    accentColor: '#6b5b95',
    background: {
      enabled: false,
      type: 'color',
      color: '#1e1e1e',
      url: '',
      fileData: '',
      overlayOpacity: 0.3
    }
  }];
}

function normalizeWorkspaces(workspaces) {
  workspaces.forEach(ws => {
    if (!ws.accentColor) {
      ws.accentColor = '#6b5b95';
    }
    if (!ws.background) {
      ws.background = {
        enabled: false,
        type: 'color',
        color: '#1e1e1e',
        url: '',
        fileData: '',
        overlayOpacity: 0.3
      };
    }

    ws.lists.forEach(list => {
      if (typeof list.column !== 'number' || list.column < 0 || list.column >= settings.columnsCount) {
        const counts = Array(settings.columnsCount).fill(0);
        ws.lists.forEach(l => {
          if (typeof l.column === 'number' && l.column >= 0 && l.column < settings.columnsCount) {
            counts[l.column]++;
          }
        });
        let minCol = 0;
        for (let i = 1; i < settings.columnsCount; i++) {
          if (counts[i] < counts[minCol]) minCol = i;
        }
        list.column = minCol;
      }
      if (typeof list.order !== 'number') {
        list.order = 0;
      }
    });

    const columnLists = {};
    ws.lists.forEach((list, index) => {
      if (!columnLists[list.column]) columnLists[list.column] = [];
      columnLists[list.column].push({ list, index });
    });

    Object.keys(columnLists).forEach(col => {
      columnLists[col].sort((a, b) => (a.list.order - b.list.order) || (a.index - b.index));
      columnLists[col].forEach((item, order) => {
        item.list.order = order;
      });
    });
  });
  return workspaces;
}

// ========== СОХРАНЕНИЕ ==========
async function saveWorkspaces(workspaces) {
  await chrome.storage.local.set({ workspaces });
}

async function saveCurrentWorkspace() {
  const data = await chrome.storage.local.get(['workspaces']);
  let workspaces = data.workspaces || [];
  const index = workspaces.findIndex(ws => ws.id === currentWorkspace.id);
  if (index !== -1) {
    workspaces[index] = currentWorkspace;
  } else {
    workspaces.push(currentWorkspace);
  }
  await chrome.storage.local.set({ workspaces });
}

function redistributeLists() {
  if (!currentWorkspace) return;
  const lists = currentWorkspace.lists;
  if (lists.length === 0) return;

  const sorted = [...lists].sort((a, b) => (a.column - b.column) || (a.order - b.order));
  const orders = Array(settings.columnsCount).fill(0);
  sorted.forEach((list, index) => {
    list.column = index % settings.columnsCount;
    list.order = orders[list.column]++;
  });
}

// ========== РЕНДЕР ==========
function renderWorkspace(workspace) {
  applyWorkspaceVisuals(workspace);

  const board = document.getElementById('board');
  board.innerHTML = '';

  const topBar = document.createElement('div');
  topBar.className = 'top-bar';

  const topLeft = document.createElement('div');
  topLeft.className = 'top-bar-left';

  // Часы
const clockElement = document.createElement('div');
clockElement.className = 'clock';
topLeft.appendChild(clockElement);

const updateClock = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const newTime = `${hours}:${minutes}`;
  if (clockElement.textContent !== newTime) {
    clockElement.textContent = newTime;
  }
};

// Очищаем старый интервал, если был
if (clockInterval) {
  clearInterval(clockInterval);
}

updateClock();
clockInterval = setInterval(updateClock, 1000);

  // Поле поиска
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Поиск...';
  searchInput.className = 'search-input';
  searchInput.value = searchQuery;
  topLeft.appendChild(searchInput);

  const clearSearchBtn = document.createElement('button');
  clearSearchBtn.className = 'search-clear-btn';
  clearSearchBtn.appendChild(createFeatherIcon('x', 20));
  clearSearchBtn.title = 'Очистить поиск';
  clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
  topLeft.appendChild(clearSearchBtn);

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
    applySearchFilter();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    applySearchFilter();
  });

  const topRight = document.createElement('div');
  topRight.className = 'top-bar-right';

  const addListBtn = document.createElement('button');
  addListBtn.className = 'icon-btn';
  addListBtn.appendChild(createFeatherIcon('plus', 24));
  addListBtn.title = 'Добавить список';
  addListBtn.addEventListener('click', onAddList);

  const saveSessionBtn = document.createElement('button');
  saveSessionBtn.className = 'icon-btn';
  saveSessionBtn.appendChild(createFeatherIcon('save', 24));
  saveSessionBtn.title = 'Сохранить вкладки';
  saveSessionBtn.addEventListener('click', onSaveSessionClick);

  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'icon-btn';
  settingsBtn.appendChild(createFeatherIcon('settings', 24));
  settingsBtn.title = 'Настройки';
  settingsBtn.addEventListener('click', openSettingsPanel);

  topRight.appendChild(addListBtn);
  topRight.appendChild(saveSessionBtn);
  topRight.appendChild(settingsBtn);

  topBar.appendChild(topLeft);
  topBar.appendChild(topRight);
  board.appendChild(topBar);

  const mainArea = document.createElement('div');
  mainArea.className = 'main-area';

  const columnsContainer = document.createElement('div');
  columnsContainer.className = 'columns-container';

  for (let col = 0; col < settings.columnsCount; col++) {
    const columnDiv = document.createElement('div');
    columnDiv.className = 'column';
    columnDiv.dataset.columnIndex = col;

    const listsInColumn = workspace.lists
      .filter(list => list.column === col)
      .sort((a, b) => a.order - b.order);

    listsInColumn.forEach(list => {
      columnDiv.appendChild(createListElement(list));
    });

    columnsContainer.appendChild(columnDiv);
  }

  mainArea.appendChild(columnsContainer);
  board.appendChild(mainArea);

  renderBottomBar(board, workspace);

  applySearchFilter();
}

function renderBottomBar(board, workspace) {
  const bottomBar = document.createElement('div');
  bottomBar.className = 'bottom-bar';

  const leftPanel = document.createElement('div');
  leftPanel.className = 'workspace-panel left';

const toggle = document.createElement('div');
toggle.className = 'workspace-toggle';
toggle.title = 'Создать workspace';

// Устанавливаем начальную иконку
toggle.appendChild(createFeatherIcon('more-horizontal', 24));

toggle.addEventListener('mouseenter', () => {
  toggle.innerHTML = '';
  toggle.appendChild(createFeatherIcon('plus', 24));
});
toggle.addEventListener('mouseleave', () => {
  toggle.innerHTML = '';
  toggle.appendChild(createFeatherIcon('more-horizontal', 24));
});
  toggle.addEventListener('click', () => onAddWorkspace());

  const rightPanel = document.createElement('div');
  rightPanel.className = 'workspace-panel right';

  chrome.storage.local.get(['workspaces']).then(data => {
    const workspaces = data.workspaces || [];

    leftPanel.innerHTML = '';
    rightPanel.innerHTML = '';

    const middle = Math.ceil(workspaces.length / 2);
    const leftWorkspaces = workspaces.slice(0, middle);
    const rightWorkspaces = workspaces.slice(middle);

    const createWsItem = (ws) => {
      const item = document.createElement('div');
      item.className = 'workspace-item';
      item.textContent = ws.name;
      item.dataset.wsId = ws.id;
      item.addEventListener('click', () => {
        currentWorkspace = ws;
        currentWorkspaceIndex = workspaces.indexOf(ws);
        applyWorkspaceVisuals(ws);
        renderWorkspace(ws);
        if (document.querySelector('.settings-panel.open')) {
          renderSettingsPanel(currentSettingsState);
        }
      });
      return item;
    };

    leftWorkspaces.forEach(ws => leftPanel.appendChild(createWsItem(ws)));
    rightWorkspaces.forEach(ws => rightPanel.appendChild(createWsItem(ws)));

    leftPanel.style.display = leftWorkspaces.length === 0 ? 'none' : 'flex';
    rightPanel.style.display = rightWorkspaces.length === 0 ? 'none' : 'flex';
  });

  bottomBar.appendChild(leftPanel);
  bottomBar.appendChild(toggle);
  bottomBar.appendChild(rightPanel);
  board.appendChild(bottomBar);
}

function createListElement(list) {
  const listDiv = document.createElement('div');
  listDiv.className = 'list';
  listDiv.dataset.listId = list.id;
  listDiv.dataset.column = list.column;
  listDiv.dataset.order = list.order;

  const header = document.createElement('div');
  header.className = 'list-header';
  header.addEventListener('mousedown', (e) => onListMouseDown(e, list.id));

  const nameSpan = document.createElement('span');
  nameSpan.className = 'list-name';
  nameSpan.textContent = list.name;
  header.appendChild(nameSpan);

  const actions = document.createElement('div');
  actions.className = 'list-actions';

  if (list.cards.length > 0) {
    const addCardBtn = document.createElement('button');
    addCardBtn.className = 'list-action-btn';
    addCardBtn.appendChild(createFeatherIcon('plus', 16));
    addCardBtn.title = 'Добавить ссылку';
    addCardBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onAddCard(list.id);
    });
    actions.appendChild(addCardBtn);
  }

  const menuBtn = document.createElement('button');
  menuBtn.className = 'list-action-btn';
  menuBtn.appendChild(createFeatherIcon('more-horizontal', 16));
  menuBtn.title = 'Меню списка';
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onListMenu(e, list.id);
  });
  actions.appendChild(menuBtn);

  header.appendChild(actions);
  listDiv.appendChild(header);

  if (list.cards.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'empty-list-placeholder';
    placeholder.textContent = '+ Добавить ссылку';
    placeholder.addEventListener('click', () => onAddCard(list.id));
    listDiv.appendChild(placeholder);
  } else {
    list.cards.forEach(card => listDiv.appendChild(createCardElement(card)));
  }

  return listDiv;
}

function createCardElement(card) {
  const cardDiv = document.createElement('div');
  cardDiv.className = 'card';
  cardDiv.dataset.cardId = card.id;
  cardDiv.dataset.url = card.url;

// Favicon через Google API с кэшированием
const faviconWrapper = document.createElement('div');
faviconWrapper.className = 'card-favicon-wrapper';

let domain = '';
let initial = '?';
try {
  const urlObj = new URL(card.url);
  domain = urlObj.hostname;
  initial = (urlObj.hostname.replace('www.', '')[0] || '?').toUpperCase();
} catch (e) {
  // некорректный URL
}

// Показываем букву-заглушку сразу, чтобы не было пустого места
const showLetter = () => {
  faviconWrapper.innerHTML = '';
  const letter = document.createElement('div');
  letter.className = 'card-favicon-letter';
  letter.textContent = initial;
  faviconWrapper.appendChild(letter);
};

if (domain) {
  // Если есть сохранённая иконка — используем её
  if (card.favicon) {
    const favicon = document.createElement('img');
    favicon.className = 'card-favicon';
    favicon.src = card.favicon;
    favicon.onerror = showLetter;
    faviconWrapper.appendChild(favicon);
  } else {
    // Если нет — грузим с Google и сохраняем
    showLetter(); // Сначала показываем букву
    const favicon = document.createElement('img');
    favicon.className = 'card-favicon';
    favicon.style.display = 'none'; // Скрываем, пока не загрузится
    favicon.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    
    favicon.onload = () => {
      // Иконка загрузилась — сохраняем в данных карточки
      card.favicon = favicon.src;
      saveCurrentWorkspace(); // Сохраняем изменения
      // Показываем картинку, убираем букву
      faviconWrapper.innerHTML = '';
      favicon.style.display = '';
      faviconWrapper.appendChild(favicon);
    };
    
    favicon.onerror = () => {
      // Не удалось загрузить — оставляем букву
      favicon.remove();
    };
  }
} else {
  showLetter();
}

cardDiv.appendChild(faviconWrapper);

  const content = document.createElement('div');
  content.className = 'card-content';

  const title = document.createElement('div');
  title.className = 'card-title';
  title.textContent = card.title || card.url;
  content.appendChild(title);

  if (!card.title) {
    const url = document.createElement('div');
    url.className = 'card-title';
    url.style.fontSize = '0.85rem';
    url.style.color = 'var(--text-secondary)';
    url.textContent = card.url;
    content.appendChild(url);
  }

  cardDiv.appendChild(content);

  // Перетаскивание
  cardDiv.addEventListener('mousedown', (e) => onCardMouseDown(e, card));

  // Клик левой кнопкой
  cardDiv.addEventListener('click', (e) => {
    if (e.button !== 0) return;
    if (cardDragState && cardDragState.moved) return;
    openCard(card.url);
  });

  // Средняя кнопка — открыть в новой фоновой вкладке
  cardDiv.addEventListener('mousedown', (e) => {
    if (e.button === 1) {
      e.preventDefault();
      chrome.tabs.create({ url: card.url, active: false });
    }
  });

  cardDiv.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showCardContextMenu(e.clientX, e.clientY, card);
  });

  return cardDiv;
}

function openCard(url) {
  if (settings.openMode === 'current') {
    window.location.href = url;
  } else if (settings.openMode === 'new') {
    chrome.tabs.create({ url, active: true });
  } else if (settings.openMode === 'background') {
    chrome.tabs.create({ url, active: false });
  }
}

// ========== ПЕРЕТАСКИВАНИЕ СПИСКОВ ==========
function onListMouseDown(e, listId) {
  if (e.target.closest('.list-action-btn') || e.target.closest('.list-actions')) return;
  if (e.button !== 0) return;
  if (dragState) cleanupDrag();

  e.preventDefault();

  const list = currentWorkspace.lists.find(l => l.id === listId);
  if (!list) return;

  const listElement = e.target.closest('.list');
  if (!listElement) return;

  const rect = listElement.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

  dragState = {
    listId: list.id,
    listElement: listElement,
    clone: null,
    offsetX: offsetX,
    offsetY: offsetY,
    startX: e.clientX,
    startY: e.clientY,
    moved: false,
    originalColumn: list.column,
    originalOrder: list.order
  };

  document.addEventListener('mousemove', onListMouseMove);
  document.addEventListener('mouseup', onListMouseUp);
}

function onListMouseMove(e) {
  if (!dragState) return;

  if (!dragState.moved) {
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    dragState.moved = true;

    // Инициализация перетаскивания
    const listElement = dragState.listElement;
    const rect = listElement.getBoundingClientRect();
    const clone = listElement.cloneNode(true);
    clone.classList.add('list-clone');
    clone.style.position = 'fixed';
    clone.style.width = listElement.offsetWidth + 'px';
    clone.style.left = (dragState.startX - dragState.offsetX) + 'px';
    clone.style.top = (dragState.startY - dragState.offsetY) + 'px';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '10000';
    clone.style.opacity = '0.8';
    clone.style.transform = 'none';
    document.body.appendChild(clone);

    dragState.clone = clone;
    listElement.classList.add('dragging');
    document.body.classList.add('dragging-active');
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  e.preventDefault();

  // Двигаем клон
  if (dragState.clone) {
    dragState.clone.style.left = (e.clientX - dragState.offsetX) + 'px';
    dragState.clone.style.top = (e.clientY - dragState.offsetY) + 'px';
  }

  // Определяем целевой столбец
  const columns = document.querySelectorAll('.column');
  let targetColumnDiv = null;
  for (const col of columns) {
    const rect = col.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right) {
      targetColumnDiv = col;
      break;
    }
  }
  if (!targetColumnDiv) return;

  const targetColumn = parseInt(targetColumnDiv.dataset.columnIndex);
  const allLists = Array.from(targetColumnDiv.querySelectorAll('.list'));

  if (allLists.length === 0) {
    targetColumnDiv.appendChild(dragState.listElement);
    return;
  }

  if (allLists.length === 1 && allLists[0] === dragState.listElement) {
    return;
  }

  const otherLists = allLists.filter(el => el !== dragState.listElement);
  otherLists.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

  const mouseY = e.clientY;
  let insertBeforeElement = null;
  let insertAfterElement = null;

  const firstRect = otherLists[0].getBoundingClientRect();
  if (mouseY < firstRect.top - 4) {
    insertBeforeElement = otherLists[0];
  } else if (mouseY > otherLists[otherLists.length - 1].getBoundingClientRect().bottom + 4) {
    insertAfterElement = otherLists[otherLists.length - 1];
  } else {
    for (let i = 0; i < otherLists.length; i++) {
      const listEl = otherLists[i];
      const rect = listEl.getBoundingClientRect();

      if (mouseY >= rect.top && mouseY <= rect.bottom) {
        if (mouseY < rect.top + rect.height / 2) {
          insertBeforeElement = listEl;
        } else {
          insertAfterElement = listEl;
        }
        break;
      } else if (i < otherLists.length - 1) {
        const nextRect = otherLists[i + 1].getBoundingClientRect();
        if (mouseY > rect.bottom && mouseY < nextRect.top) {
          insertAfterElement = listEl;
          break;
        }
      }
    }
  }

  if (!insertBeforeElement && !insertAfterElement) return;

  if (insertBeforeElement) {
    const currentPrev = dragState.listElement.previousElementSibling;
    const currentNext = dragState.listElement.nextElementSibling;
    const targetPrev = insertBeforeElement.previousElementSibling;
    const targetNext = insertBeforeElement;
    if (!(currentPrev === targetPrev && currentNext === targetNext)) {
      targetColumnDiv.insertBefore(dragState.listElement, insertBeforeElement);
    }
  } else if (insertAfterElement) {
    const targetNext = insertAfterElement.nextElementSibling;
    const currentPrev = dragState.listElement.previousElementSibling;
    const currentNext = dragState.listElement.nextElementSibling;
    if (!(currentPrev === insertAfterElement && currentNext === targetNext)) {
      targetColumnDiv.insertBefore(dragState.listElement, targetNext);
    }
  }
}

function onListMouseUp(e) {
  document.removeEventListener('mousemove', onListMouseMove);
  document.removeEventListener('mouseup', onListMouseUp);

  if (dragState && dragState.moved) {
    const columns = document.querySelectorAll('.column');
    columns.forEach((columnDiv, columnIndex) => {
      const listElements = Array.from(columnDiv.querySelectorAll('.list'));
      listElements.forEach((listEl, orderIndex) => {
        const listId = listEl.dataset.listId;
        const listData = currentWorkspace.lists.find(l => l.id === listId);
        if (listData) {
          listData.column = columnIndex;
          listData.order = orderIndex;
        }
      });
    });

    saveCurrentWorkspace().then(() => renderWorkspace(currentWorkspace));
  } else {
    renderWorkspace(currentWorkspace);
  }

  cleanupDrag();
}

function cleanupDrag() {
  if (dragState) {
    if (dragState.clone) dragState.clone.remove();
    if (dragState.listElement) dragState.listElement.classList.remove('dragging');
    document.body.classList.remove('dragging-active');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
  dragState = null;
}

// ========== ПЕРЕТАСКИВАНИЕ КАРТОЧЕК ==========
function onCardMouseDown(e, card) {
  if (e.button !== 0) return;
  if (cardDragState) cleanupCardDrag();

  e.preventDefault();

  const cardElement = e.target.closest('.card');
  if (!cardElement) return;

  const rect = cardElement.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

    cardDragState = {
      cardId: card.id,
      cardData: card,          // <-- добавляем сам объект
      cardElement: cardElement,
      clone: null,
      offsetX: offsetX,
      offsetY: offsetY,
      startX: e.clientX,
      startY: e.clientY,
      moved: false
};

  document.addEventListener('mousemove', onCardMouseMove);
  document.addEventListener('mouseup', onCardMouseUp);
}

function onCardMouseMove(e) {
  if (!cardDragState) return;

  if (!cardDragState.moved) {
    const dx = e.clientX - cardDragState.startX;
    const dy = e.clientY - cardDragState.startY;
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
    cardDragState.moved = true;

    // Инициализация перетаскивания
    const cardElement = cardDragState.cardElement;
    const clone = cardElement.cloneNode(true);
    clone.classList.add('card-clone');
    clone.style.position = 'fixed';
    clone.style.width = cardElement.offsetWidth + 'px';
    clone.style.left = (cardDragState.startX - cardDragState.offsetX) + 'px';
    clone.style.top = (cardDragState.startY - cardDragState.offsetY) + 'px';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '10000';
    clone.style.opacity = '0.8';
    clone.style.transform = 'none';
    document.body.appendChild(clone);

    cardDragState.clone = clone;
    cardElement.classList.add('dragging-card');
    document.body.classList.add('dragging-active');
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  e.preventDefault();

  if (cardDragState.clone) {
    cardDragState.clone.style.left = (e.clientX - cardDragState.offsetX) + 'px';
    cardDragState.clone.style.top = (e.clientY - cardDragState.offsetY) + 'px';
  }

  // Определяем целевой список
  const listElement = document.elementFromPoint(e.clientX, e.clientY)?.closest('.list');
  if (!listElement) return;
  if (listElement.classList.contains('list-clone')) return;

  const cards = Array.from(listElement.querySelectorAll('.card:not(.dragging-card)'));
  const mouseY = e.clientY;
  let insertBeforeCard = null;
  let insertAfterCard = null;

  if (cards.length === 0) {
    listElement.appendChild(cardDragState.cardElement);
    return;
  }

  cards.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

  const firstRect = cards[0].getBoundingClientRect();
  if (mouseY < firstRect.top - 4) {
    insertBeforeCard = cards[0];
  } else if (mouseY > cards[cards.length - 1].getBoundingClientRect().bottom + 4) {
    insertAfterCard = cards[cards.length - 1];
  } else {
    for (let i = 0; i < cards.length; i++) {
      const cardEl = cards[i];
      const rect = cardEl.getBoundingClientRect();

      if (mouseY >= rect.top && mouseY <= rect.bottom) {
        if (mouseY < rect.top + rect.height / 2) {
          insertBeforeCard = cardEl;
        } else {
          insertAfterCard = cardEl;
        }
        break;
      } else if (i < cards.length - 1) {
        const nextRect = cards[i + 1].getBoundingClientRect();
        if (mouseY > rect.bottom && mouseY < nextRect.top) {
          insertAfterCard = cardEl;
          break;
        }
      }
    }
  }

  if (!insertBeforeCard && !insertAfterCard) return;

  if (insertBeforeCard) {
    const currentPrev = cardDragState.cardElement.previousElementSibling;
    const currentNext = cardDragState.cardElement.nextElementSibling;
    const targetPrev = insertBeforeCard.previousElementSibling;
    const targetNext = insertBeforeCard;
    if (!(currentPrev === targetPrev && currentNext === targetNext)) {
      listElement.insertBefore(cardDragState.cardElement, insertBeforeCard);
    }
  } else if (insertAfterCard) {
    const targetNext = insertAfterCard.nextElementSibling;
    const currentPrev = cardDragState.cardElement.previousElementSibling;
    const currentNext = cardDragState.cardElement.nextElementSibling;
    if (!(currentPrev === insertAfterCard && currentNext === targetNext)) {
      listElement.insertBefore(cardDragState.cardElement, targetNext);
    }
  }
}

function onCardMouseUp(e) {
  document.removeEventListener('mousemove', onCardMouseMove);
  document.removeEventListener('mouseup', onCardMouseUp);

if (cardDragState && cardDragState.moved) {
  // Собираем все карточки из данных в Map по id
  const allCardsMap = new Map();
  currentWorkspace.lists.forEach(list => {
    list.cards.forEach(c => allCardsMap.set(c.id, c));
  });

  const movedCard = cardDragState.cardData || allCardsMap.get(cardDragState.cardId);
  if (!movedCard) {
    cleanupCardDrag();
    return;
  }

  // Удаляем перемещаемую карточку из всех списков
  currentWorkspace.lists.forEach(list => {
    list.cards = list.cards.filter(c => c.id !== movedCard.id);
  });

  // Проходим по DOM и пересоздаём массивы cards для каждого списка
  const listElements = document.querySelectorAll('.list');
  listElements.forEach(listEl => {
    const listId = listEl.dataset.listId;
    const listData = currentWorkspace.lists.find(l => l.id === listId);
    if (!listData) return;

    const cardElements = Array.from(listEl.querySelectorAll('.card'));
    const newCards = [];
    cardElements.forEach(cardEl => {
      const cardId = cardEl.dataset.cardId;
      const cardData = allCardsMap.get(cardId);
      if (cardData) newCards.push(cardData);
    });
    listData.cards = newCards;
  });

  saveCurrentWorkspace().then(() => renderWorkspace(currentWorkspace));
}

  cleanupCardDrag();
}

function cleanupCardDrag() {
  if (cardDragState) {
    if (cardDragState.clone) cardDragState.clone.remove();
    if (cardDragState.cardElement) cardDragState.cardElement.classList.remove('dragging-card');
    document.body.classList.remove('dragging-active');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
  cardDragState = null;
}

function cleanupCardDrag() {
  if (cardDragState) {
    if (cardDragState.clone) cardDragState.clone.remove();
    if (cardDragState.cardElement) cardDragState.cardElement.classList.remove('dragging-card');
    document.body.classList.remove('dragging-active');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
  cardDragState = null;
}

// ========== МЕНЮ СПИСКА ==========
function onListMenu(event, listId) {
  event.stopPropagation();
  closeAllMenus();

  const menu = document.createElement('div');
  menu.className = 'context-menu';

  const rename = document.createElement('div');
  rename.className = 'context-menu-item';
  rename.textContent = 'Переименовать список';
  rename.addEventListener('click', () => {
    closeAllMenus();
    onRenameList(listId);
  });
  menu.appendChild(rename);

  const openAll = document.createElement('div');
  openAll.className = 'context-menu-item';
  openAll.textContent = 'Открыть все вкладки';
  openAll.addEventListener('click', () => {
    closeAllMenus();
    onOpenAllCards(listId);
  });
  menu.appendChild(openAll);

  const moveItem = document.createElement('div');
  moveItem.className = 'context-menu-item';
  moveItem.textContent = 'Перенести…';

  chrome.storage.local.get(['workspaces']).then(data => {
    const workspaces = data.workspaces || [];
    const otherWorkspaces = workspaces.filter(ws => ws.id !== currentWorkspace.id);

    if (otherWorkspaces.length === 0) {
      moveItem.classList.add('disabled');
    } else {
      moveItem.addEventListener('click', () => {
        closeAllMenus();
        onMoveList(listId);
      });
    }
    menu.appendChild(moveItem);

    const deleteList = document.createElement('div');
    deleteList.className = 'context-menu-item';
    deleteList.textContent = 'Удалить список';
    deleteList.addEventListener('click', () => {
      closeAllMenus();
      onDeleteList(listId);
    });
    menu.appendChild(deleteList);

    document.body.appendChild(menu);

    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    const padding = 8;
    let left = event.clientX;
    let top = event.clientY;

    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }
    if (top + menuHeight > window.innerHeight - padding) {
      top = window.innerHeight - menuHeight - padding;
    }
    if (top < padding) top = padding;
    if (left < padding) left = padding;

    menu.style.left = left + 'px';
    menu.style.top = top + 'px';

    document.addEventListener('click', closeAllMenus, { once: true });
  });
}

function closeAllMenus() {
  document.querySelectorAll('.context-menu').forEach(m => m.remove());
}

// ========== ДЕЙСТВИЯ СО СПИСКАМИ ==========
async function onAddList() {
  const name = await showPromptModal('Новый список', 'Введите название списка:');
  if (!name) return;

  const columnCounts = {};
  for (let i = 0; i < settings.columnsCount; i++) columnCounts[i] = 0;
  currentWorkspace.lists.forEach(list => {
    if (list.column !== undefined) columnCounts[list.column]++;
  });

  let minColumn = 0;
  let minCount = columnCounts[0];
  for (let i = 1; i < settings.columnsCount; i++) {
    if (columnCounts[i] < minCount) {
      minCount = columnCounts[i];
      minColumn = i;
    }
  }

  const list = {
    id: 'list_' + Date.now(),
    name: name,
    column: minColumn,
    order: minCount,
    cards: []
  };

  currentWorkspace.lists.push(list);
  await saveCurrentWorkspace();
  renderWorkspace(currentWorkspace);
}

async function onRenameList(listId) {
  const list = currentWorkspace.lists.find(l => l.id === listId);
  if (!list) return;

  const newName = await showPromptModal('Переименовать список', 'Новое название:', list.name);
  if (!newName) return;

  list.name = newName;
  await saveCurrentWorkspace();
  renderWorkspace(currentWorkspace);
}

async function onDeleteList(listId) {
  if (!confirm('Удалить список со всеми ссылками?')) return;

  currentWorkspace.lists = currentWorkspace.lists.filter(l => l.id !== listId);
  const orders = {};
  currentWorkspace.lists.forEach(list => {
    if (!orders[list.column]) orders[list.column] = 0;
    list.order = orders[list.column]++;
  });
  await saveCurrentWorkspace();
  renderWorkspace(currentWorkspace);
}

async function onOpenAllCards(listId) {
  const list = currentWorkspace.lists.find(l => l.id === listId);
  if (!list) return;

  list.cards.forEach(card => {
    chrome.tabs.create({ url: card.url, active: false });
  });
}

async function onMoveList(listId) {
  const workspaces = await getWorkspaces();
  const otherWorkspaces = workspaces.filter(ws => ws.id !== currentWorkspace.id);
  if (otherWorkspaces.length === 0) return;

  const targetWsId = await showMoveListModal(otherWorkspaces);
  if (!targetWsId) return;

  const list = currentWorkspace.lists.find(l => l.id === listId);
  if (!list) return;

  currentWorkspace.lists = currentWorkspace.lists.filter(l => l.id !== listId);
  recalcListOrders(currentWorkspace);

  const targetWs = workspaces.find(ws => ws.id === targetWsId);
  if (!targetWs) return;

  const columnCounts = {};
  for (let i = 0; i < settings.columnsCount; i++) columnCounts[i] = 0;
  targetWs.lists.forEach(l => {
    if (l.column !== undefined) columnCounts[l.column]++;
  });

  let minColumn = 0;
  let minCount = columnCounts[0];
  for (let i = 1; i < settings.columnsCount; i++) {
    if (columnCounts[i] < minCount) {
      minCount = columnCounts[i];
      minColumn = i;
    }
  }

  list.column = minColumn;
  list.order = minCount;

  targetWs.lists.push(list);
  recalcListOrders(targetWs);

  const allWorkspaces = await getWorkspaces();
  const updatedWorkspaces = allWorkspaces.map(ws => {
    if (ws.id === currentWorkspace.id) return currentWorkspace;
    if (ws.id === targetWs.id) return targetWs;
    return ws;
  });
  await chrome.storage.local.set({ workspaces: updatedWorkspaces });

  renderWorkspace(currentWorkspace);
}

function recalcListOrders(workspace) {
  const orders = {};
  workspace.lists.forEach(list => {
    if (!orders[list.column]) orders[list.column] = 0;
    list.order = orders[list.column]++;
  });
}

function showMoveListModal(workspaces) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <h3>Перенести список</h3>
      <p>Выберите пространство:</p>
      <div class="modal-actions" style="flex-direction: column; align-items: stretch;">
        ${workspaces.map(ws => `
          <button class="btn move-ws-btn" data-ws-id="${ws.id}">${ws.name}</button>
        `).join('')}
        <button class="btn" id="move-cancel">Отмена</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const cleanup = () => overlay.remove();

    modal.querySelectorAll('.move-ws-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        cleanup();
        resolve(btn.dataset.wsId);
      });
    });

    modal.querySelector('#move-cancel').addEventListener('click', () => {
      cleanup();
      resolve(null);
    });
  });
}

// ========== ДОБАВЛЕНИЕ ССЫЛКИ ==========
async function onAddCard(listId) {
  const choice = await showAddCardModal();
  if (!choice) return;

  if (choice.type === 'manual') {
    const cardData = await showManualCardModal();
    if (!cardData) return;

    const list = currentWorkspace.lists.find(l => l.id === listId);
    list.cards.push({
      id: 'card_' + Date.now(),
      title: cardData.title,
      url: cardData.url,
      createdAt: Date.now()
    });
    await saveCurrentWorkspace();
    renderWorkspace(currentWorkspace);
  } else if (choice.type === 'tabs') {
    const selectedTabs = await showTabsModal();
    if (!selectedTabs || selectedTabs.length === 0) return;

    const list = currentWorkspace.lists.find(l => l.id === listId);
    selectedTabs.forEach(tab => {
      list.cards.push({
        id: 'card_' + Date.now() + '_' + Math.random(),
        title: tab.title || '',
        url: tab.url,
        createdAt: Date.now()
      });
    });
    await saveCurrentWorkspace();
    renderWorkspace(currentWorkspace);
  }
}

// ========== КОНТЕКСТНОЕ МЕНЮ КАРТОЧКИ ==========
function showCardContextMenu(x, y, card) {
  closeAllMenus();

  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.top = y + 'px';
  menu.style.left = x + 'px';

  const openCurrent = document.createElement('div');
  openCurrent.className = 'context-menu-item';
  openCurrent.textContent = 'Открыть';
  openCurrent.addEventListener('click', () => {
    closeAllMenus();
    openCard(card.url);
  });
  menu.appendChild(openCurrent);

  const openNew = document.createElement('div');
  openNew.className = 'context-menu-item';
  openNew.textContent = 'Открыть в новой вкладке';
  openNew.addEventListener('click', () => {
    closeAllMenus();
    chrome.tabs.create({ url: card.url });
  });
  menu.appendChild(openNew);

  const edit = document.createElement('div');
  edit.className = 'context-menu-item';
  edit.textContent = 'Редактировать';
  edit.addEventListener('click', () => {
    closeAllMenus();
    onEditCard(card);
  });
  menu.appendChild(edit);

  const deleteCard = document.createElement('div');
  deleteCard.className = 'context-menu-item';
  deleteCard.textContent = 'Удалить';
  deleteCard.addEventListener('click', () => {
    closeAllMenus();
    onDeleteCard(card.id);
  });
  menu.appendChild(deleteCard);

  document.body.appendChild(menu);
  document.addEventListener('click', closeAllMenus, { once: true });
}

// ========== РЕДАКТИРОВАНИЕ И УДАЛЕНИЕ КАРТОЧКИ ==========
async function onEditCard(card) {
  const result = await showEditCardModal(card);
  if (!result) return;

  card.title = result.title;
  card.url = result.url;
  await saveCurrentWorkspace();
  renderWorkspace(currentWorkspace);
}

async function onDeleteCard(cardId) {
  if (!confirm('Удалить эту ссылку?')) return;

  const list = currentWorkspace.lists.find(l => l.cards.some(c => c.id === cardId));
  if (!list) return;
  list.cards = list.cards.filter(c => c.id !== cardId);
  await saveCurrentWorkspace();
  renderWorkspace(currentWorkspace);
}

// ========== МОДАЛЬНЫЕ ОКНА ==========
function showPromptModal(title, label, defaultValue = '') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <h3>${title}</h3>
      <label>${label}</label>
      <input type="text" id="modal-input" value="${defaultValue}">
      <div class="modal-actions">
        <button class="btn" id="modal-cancel">Отмена</button>
        <button class="btn btn-primary" id="modal-ok">OK</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const input = modal.querySelector('#modal-input');
    input.focus();
    input.select();

    const cleanup = () => overlay.remove();

    modal.querySelector('#modal-cancel').addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    modal.querySelector('#modal-ok').addEventListener('click', () => {
      const value = input.value.trim();
      cleanup();
      resolve(value || null);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const value = input.value.trim();
        cleanup();
        resolve(value || null);
      }
      if (e.key === 'Escape') {
        cleanup();
        resolve(null);
      }
    });
  });
}

function showAddCardModal() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <h3>Добавить ссылку</h3>
      <p>Выберите способ:</p>
      <div class="modal-actions" style="flex-direction: column; align-items: stretch;">
        <button class="btn" id="add-manual">Вручную</button>
        <button class="btn" id="add-from-tabs">Из открытых вкладок</button>
        <button class="btn" id="add-cancel">Отмена</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const cleanup = () => overlay.remove();

    modal.querySelector('#add-manual').addEventListener('click', () => {
      cleanup();
      resolve({ type: 'manual' });
    });
    modal.querySelector('#add-from-tabs').addEventListener('click', () => {
      cleanup();
      resolve({ type: 'tabs' });
    });
    modal.querySelector('#add-cancel').addEventListener('click', () => {
      cleanup();
      resolve(null);
    });
  });
}

function showManualCardModal() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <h3>Новая ссылка</h3>
      <label>URL:</label>
      <input type="url" id="card-url" placeholder="https://example.com">
      <label>Название (необязательно):</label>
      <input type="text" id="card-title" placeholder="Оставьте пустым, чтобы использовать URL">
      <div class="modal-actions">
        <button class="btn" id="card-cancel">Отмена</button>
        <button class="btn btn-primary" id="card-ok">Добавить</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const urlInput = modal.querySelector('#card-url');
    const titleInput = modal.querySelector('#card-title');
    urlInput.focus();

    const cleanup = () => overlay.remove();

    modal.querySelector('#card-cancel').addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    modal.querySelector('#card-ok').addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (!url) return;
      const title = titleInput.value.trim();
      cleanup();
      resolve({ url, title });
    });

    urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const url = urlInput.value.trim();
        if (!url) return;
        const title = titleInput.value.trim();
        cleanup();
        resolve({ url, title });
      }
      if (e.key === 'Escape') {
        cleanup();
        resolve(null);
      }
    });
  });
}

function showEditCardModal(card) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <h3>Редактировать ссылку</h3>
      <label>URL:</label>
      <input type="url" id="edit-url" value="${card.url}">
      <label>Название:</label>
      <input type="text" id="edit-title" value="${card.title}">
      <div class="modal-actions">
        <button class="btn" id="edit-cancel">Отмена</button>
        <button class="btn btn-primary" id="edit-ok">Сохранить</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const urlInput = modal.querySelector('#edit-url');
    const titleInput = modal.querySelector('#edit-title');
    urlInput.focus();

    const cleanup = () => overlay.remove();

    modal.querySelector('#edit-cancel').addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    modal.querySelector('#edit-ok').addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (!url) return;
      const title = titleInput.value.trim();
      cleanup();
      resolve({ url, title });
    });

    urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const url = urlInput.value.trim();
        if (!url) return;
        const title = titleInput.value.trim();
        cleanup();
        resolve({ url, title });
      }
      if (e.key === 'Escape') {
        cleanup();
        resolve(null);
      }
    });
  });
}

async function showTabsModal() {
  const tabs = await chrome.tabs.query({});

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal modal-wide';
    modal.innerHTML = `
      <h3>Выберите вкладки</h3>
      <div class="tabs-list">
        ${tabs.map(tab => `
          <div class="tab-item">
            <input type="checkbox" id="tab-${tab.id}" value="${tab.url}">
            <div class="tab-info">
              <strong>${tab.title || 'Без названия'}</strong><br>
              <span style="font-size:0.8rem;color:#aaa">${tab.url}</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="modal-actions">
        <button class="btn" id="tabs-cancel">Отмена</button>
        <button class="btn btn-primary" id="tabs-ok">Добавить выбранные</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.querySelectorAll('.tab-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
          const checkbox = item.querySelector('input[type="checkbox"]');
          checkbox.checked = !checkbox.checked;
        }
      });
    });

    const cleanup = () => overlay.remove();

    modal.querySelector('#tabs-cancel').addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    modal.querySelector('#tabs-ok').addEventListener('click', () => {
      const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
      const selected = [];
      checkboxes.forEach(cb => {
        const tab = tabs.find(t => t.id == cb.id.replace('tab-', ''));
        if (tab) selected.push(tab);
      });
      cleanup();
      resolve(selected);
    });
  });
}

// ========== СОХРАНЕНИЕ СЕССИИ ==========
async function onSaveSessionClick() {
  const tabs = await chrome.tabs.query({});
  const ourTabUrl = chrome.runtime.getURL('newtab.html');
  const otherTabs = tabs.filter(tab => tab.url !== ourTabUrl);

  if (otherTabs.length === 0) {
    alert('Нет открытых вкладок для сохранения.');
    return;
  }

  const modalResult = await showSaveSessionModal(otherTabs.length);
  if (!modalResult) return;

  await saveSessionFromTabs(otherTabs, modalResult.closeAfter);
}

function showSaveSessionModal(tabsCount) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <h3>Сохранить сессию</h3>
      <p>Открыто вкладок: <strong>${tabsCount}</strong></p>
      <p>Будут созданы списки с ссылками. Продолжить?</p>
      <div class="modal-actions" style="justify-content: space-between;">
        <button class="btn" id="save-cancel">Отмена</button>
        <div style="display: flex; gap: 8px;">
          <button class="btn" id="save-only">Сохранить</button>
          <button class="btn btn-primary" id="save-close">Сохранить и закрыть</button>
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const cleanup = () => overlay.remove();

    modal.querySelector('#save-cancel').addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    modal.querySelector('#save-only').addEventListener('click', () => {
      cleanup();
      resolve({ closeAfter: false });
    });

    modal.querySelector('#save-close').addEventListener('click', () => {
      cleanup();
      resolve({ closeAfter: true });
    });
  });
}

async function saveSessionFromTabs(tabs, closeAfter) {
  const windowsMap = new Map();
  tabs.forEach(tab => {
    if (!windowsMap.has(tab.windowId)) {
      windowsMap.set(tab.windowId, []);
    }
    windowsMap.get(tab.windowId).push(tab);
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const baseName = `Сессия ${dateStr} ${timeStr}`;

  let windowIndex = 0;
  for (const [windowId, windowTabs] of windowsMap.entries()) {
    windowIndex++;
    const listName = windowsMap.size > 1 ? `${baseName} — Окно ${windowIndex}` : baseName;

    const list = {
      id: 'list_' + Date.now() + '_' + windowIndex,
      name: listName,
      column: 0,
      order: 0,
      cards: windowTabs.map(tab => ({
        id: 'card_' + Date.now() + '_' + Math.random(),
        title: tab.title || '',
        url: tab.url,
        createdAt: Date.now()
      }))
    };

    const columnCounts = {};
    for (let i = 0; i < settings.columnsCount; i++) columnCounts[i] = 0;
    currentWorkspace.lists.forEach(existingList => {
      if (existingList.column !== undefined) columnCounts[existingList.column]++;
    });

    let minColumn = 0;
    let minCount = columnCounts[0];
    for (let i = 1; i < settings.columnsCount; i++) {
      if (columnCounts[i] < minCount) {
        minCount = columnCounts[i];
        minColumn = i;
      }
    }

    list.column = minColumn;
    list.order = minCount;
    currentWorkspace.lists.push(list);
  }

  await saveCurrentWorkspace();

  if (closeAfter) {
    await closeAllOtherTabs();
  }

  renderWorkspace(currentWorkspace);
}

async function closeAllOtherTabs() {
  const ourTabUrl = chrome.runtime.getURL('newtab.html');

  let allTabs = await chrome.tabs.query({});
  let ourTab = allTabs.find(tab => tab.url === ourTabUrl);

  if (!ourTab) {
    ourTab = await chrome.tabs.create({ url: ourTabUrl });
  }

  const tabsToClose = (await chrome.tabs.query({})).filter(tab => tab.url !== ourTabUrl);
  if (tabsToClose.length > 0) {
    const ids = tabsToClose.map(tab => tab.id);
    await chrome.tabs.remove(ids);
  }
}

// ========== WORKSPACES (управление) ==========
async function getWorkspaces() {
  const data = await chrome.storage.local.get(['workspaces']);
  return data.workspaces || [];
}

function setupWorkspacesDragAndDrop(panel) {
  const rows = panel.querySelectorAll('.workspace-item-row');
  let draggedRow = null;

  rows.forEach(row => {
    row.addEventListener('dragstart', (e) => {
      if (e.target.closest('.workspace-item-actions')) {
        e.preventDefault();
        return;
      }
      draggedRow = row;
      row.classList.add('dragging');
      document.body.classList.add('dragging-active');
      e.dataTransfer.effectAllowed = 'move';
    });

    row.addEventListener('dragend', (e) => {
      row.classList.remove('dragging');
      document.body.classList.remove('dragging-active');
      draggedRow = null;
      saveWorkspaceOrder(panel);
      renderWorkspace(currentWorkspace);
    });

    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const target = e.target.closest('.workspace-item-row');
      if (target && target !== draggedRow) {
        const rect = target.getBoundingClientRect();
        const offset = e.clientY - rect.top - rect.height / 2;
        if (offset > 0) {
          target.parentNode.insertBefore(draggedRow, target.nextSibling);
        } else {
          target.parentNode.insertBefore(draggedRow, target);
        }
      }
    });

    row.addEventListener('drop', (e) => {
      e.preventDefault();
    });
  });
}

async function saveWorkspaceOrder(panel) {
  const rows = panel.querySelectorAll('.workspace-item-row');
  const orderedIds = Array.from(rows).map(row => row.dataset.wsId);
  const allWorkspaces = await getWorkspaces();
  const orderedWorkspaces = orderedIds.map(id => allWorkspaces.find(ws => ws.id === id)).filter(Boolean);
  await chrome.storage.local.set({ workspaces: orderedWorkspaces });
  if (currentWorkspace && !orderedWorkspaces.some(ws => ws.id === currentWorkspace.id)) {
    currentWorkspace = orderedWorkspaces[0];
    currentWorkspaceIndex = 0;
    applyWorkspaceVisuals(currentWorkspace);
  }
}

async function onAddWorkspaceFromSettings() {
  const name = await showPromptModal('Новый workspace', 'Введите название:');
  if (!name) return;

  const newWs = {
    id: 'ws_' + Date.now(),
    name: name,
    lists: [],
    accentColor: '#6b5b95',
    background: {
      enabled: false,
      type: 'color',
      color: '#1e1e1e',
      url: '',
      fileData: '',
      overlayOpacity: 0.3
    }
  };

  const workspaces = await getWorkspaces();
  workspaces.push(newWs);
  await chrome.storage.local.set({ workspaces });

  currentWorkspace = newWs;
  currentWorkspaceIndex = workspaces.length - 1;
  applyWorkspaceVisuals(newWs);
  renderWorkspace(newWs);
  renderSettingsPanel('workspaces');
}

async function onRenameWorkspaceFromSettings(wsId) {
  const workspaces = await getWorkspaces();
  const ws = workspaces.find(w => w.id === wsId);
  if (!ws) return;

  const newName = await showPromptModal('Переименовать workspace', 'Новое название:', ws.name);
  if (!newName) return;

  ws.name = newName;
  await chrome.storage.local.set({ workspaces });

  if (currentWorkspace && currentWorkspace.id === wsId) {
    currentWorkspace = ws;
  }
  renderWorkspace(currentWorkspace);
  renderSettingsPanel('workspaces');
}

async function onDeleteWorkspaceFromSettings(wsId) {
  const workspaces = await getWorkspaces();
  if (workspaces.length <= 1) {
    alert('Нельзя удалить последнее рабочее пространство.');
    return;
  }

  const ws = workspaces.find(w => w.id === wsId);
  if (!ws) return;

  if (!confirm(`Удалить рабочее пространство «${ws.name}» со всеми списками и ссылками?`)) return;

  const filtered = workspaces.filter(w => w.id !== wsId);
  await chrome.storage.local.set({ workspaces: filtered });

  if (currentWorkspace && currentWorkspace.id === wsId) {
    currentWorkspace = filtered[0];
    currentWorkspaceIndex = 0;
    applyWorkspaceVisuals(currentWorkspace);
  }
  renderWorkspace(currentWorkspace);
  renderSettingsPanel('workspaces');
}

async function onAddWorkspace() {
  const name = await showPromptModal('Новый workspace', 'Введите название:');
  if (!name) return;

  const newWs = {
    id: 'ws_' + Date.now(),
    name: name,
    lists: [],
    accentColor: '#6b5b95',
    background: {
      enabled: false,
      type: 'color',
      color: '#1e1e1e',
      url: '',
      fileData: '',
      overlayOpacity: 0.3
    }
  };

  const data = await chrome.storage.local.get(['workspaces']);
  const workspaces = data.workspaces || [];
  workspaces.push(newWs);
  await chrome.storage.local.set({ workspaces });

  currentWorkspace = newWs;
  currentWorkspaceIndex = workspaces.length - 1;
  applyWorkspaceVisuals(newWs);
  renderWorkspace(newWs);
  if (document.querySelector('.settings-panel.open')) {
    renderSettingsPanel(currentSettingsState);
  }
}

// ========== ПОИСК ==========
function applySearchFilter() {
  const query = searchQuery.trim().toLowerCase();

  if (!query) {
    document.querySelectorAll('.card').forEach(c => c.style.display = '');
    document.querySelectorAll('.list').forEach(l => l.style.display = '');
    const noResults = document.querySelector('.no-results');
    if (noResults) noResults.remove();
    return;
  }

  const cards = document.querySelectorAll('.card');
  let anyVisibleCard = false;

  cards.forEach(card => {
    const title = card.querySelector('.card-title')?.textContent?.toLowerCase() || '';
    const url = card.dataset.url?.toLowerCase() || '';
    const matches = title.includes(query) || url.includes(query);
    card.style.display = matches ? '' : 'none';
    if (matches) anyVisibleCard = true;
  });

  const lists = document.querySelectorAll('.list');
  lists.forEach(list => {
    const hasVisibleCard = Array.from(list.querySelectorAll('.card')).some(c => c.style.display !== 'none');
    list.style.display = hasVisibleCard ? '' : 'none';
  });

  const mainArea = document.querySelector('.main-area');
  if (mainArea) {
    let noResults = mainArea.querySelector('.no-results');
    if (!anyVisibleCard) {
      if (!noResults) {
        noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'Ничего не найдено';
        mainArea.appendChild(noResults);
      }
    } else if (noResults) {
      noResults.remove();
    }
  }
}

// ========== ОЧИСТКА ПРИ ПОТЕРЕ ФОКУСА ==========
window.addEventListener('blur', () => {
  if (dragState) cleanupDrag();
  if (cardDragState) cleanupCardDrag();
});