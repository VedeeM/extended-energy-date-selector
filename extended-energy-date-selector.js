// extended-energy-date-selector.js
// A reliable energy date selector with datetime helper integration and localization

const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
const html = window.LitHtml?.html || LitElement.prototype.html;
const css = window.LitHtml?.css || LitElement.prototype.css;

// simple in-memory cache
const translationsCache = {};

async function loadTranslation(lang) {
  if (translationsCache[lang]) return translationsCache[lang];
  try {
    const url = `${import.meta.url.substring(0, import.meta.url.lastIndexOf("/"))}/translations/${lang}.json`;
    const res = await fetch(url);
    translationsCache[lang] = await res.json();
  } catch {
    translationsCache[lang] = {};
  }
  return translationsCache[lang];
}

async function initTranslations(hass) {
  const lang = hass?.language || (navigator.language || "en").split("-")[0];
  await loadTranslation("en");  // always load English fallback
  await loadTranslation(lang);  // and the active language
}

//---------------------------------------//
// UI Editor for extendedEnergyDateSelector //
//---------------------------------------//

class extendedEnergyDateSelectorEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object },
    };
  }

static get styles() {
  return css`
    .form {
      padding: 16px;
    }
    ha-formfield {
      display: block;
      padding: 8px 0;
    }
    ha-switch {
      margin: 0 8px;
    }
    ha-textfield {
      display: block;
      width:100%;
    }
    .period-options {
      margin: 16px 0;
      padding: 8px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
    }
    .sub-option {
      margin-left: 32px;
      margin-top: 8px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    ha-select {
      min-width: 140px;
      width: 140px;
      display: flex;
      align-items: center;
      margin: 8px 0;
    }
    ha-textfield, ha-icon-picker {
      min-width: 200px;  // Set consistent width for both
      display: flex;
      align-items: center;
      --mdc-text-field-filled-line-height: 48px;
      margin: 8px 0;
    }
    ha-icon-picker {
      --mdc-icon-button-size: 48px;  // Match height with textfield
      --mdc-icon-size: 24px;
    }
    h3 {
      margin: 16px 0 8px;
      font-size: 16px;
      font-weight: 500;
    }
  `;
}

async setConfig(config) {
  this._config = config;
  await initTranslations(this.hass);
}

_localize(key, fallback) {
  const lang = this.hass?.language || (navigator.language || "en").split("-")[0];
  const translations = translationsCache[lang] || {};
  const english = translationsCache["en"] || {};
  return translations[key] || english[key] || fallback || key;
}

render() {
  if (!this.hass || !this._config) {
    return html``;
  }

  const periodOptions = {
    day: this._localize('day', 'Day'),
    week: this._localize('week', 'Week'),
    month: this._localize('month', 'Month'),
    year: this._localize('year', 'Year'),
    custom: this._localize('custom', 'Custom')
  };

  return html`
    <div class="form">
      <ha-textfield
        label="${this._localize('title_optional', 'Title (optional)')}"
        .value=${this._config.title || ""}
        .configValue=${"title"}
        @input=${this._valueChanged}
      ></ha-textfield>

      <ha-formfield label="${this._localize('show_card_theme', 'Show Card Theme')}">
        <ha-switch
          .checked=${this._config.card_theme ?? true}
          .configValue=${"card_theme"}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>

      <div class="period-options">
        <h3>${this._localize('period_buttons', 'Period Buttons')}</h3>
        ${Object.entries(periodOptions).map(([value, label]) => html`
          <ha-formfield label=${label}>
            <ha-switch
              .checked=${value === 'custom' 
                ? false 
                : this._config.period_buttons?.includes(value) ?? true}
              .configValue=${value}
              @change=${this._periodButtonChanged}
            ></ha-switch>
          </ha-formfield>
        `)}

      </div>

  <h3>${this._localize('today_button', 'Today Button')}</h3>
  <ha-formfield label="${this._localize('show_today_button', 'Show Today Button')}">
    <ha-switch
      .checked=${this._config.today_button?.show ?? true}
      .configValue=${"today_button.show"}
      @change=${this._valueChanged}
    ></ha-switch>
  </ha-formfield>

${this._config.today_button?.show !== false ? html`
  <div class="sub-option">
    <ha-select
      label="${this._localize('today_button_type', 'Today Button Type')}"
      .value=${this._config.today_button?.type ?? "icon"}
      .configValue=${"today_button.type"}
      @selected=${this._valueChanged}
      @closed=${(ev) => ev.stopPropagation()}
    >
      <ha-list-item value="text">${this._localize('text', 'Text')}</ha-list-item>
      <ha-list-item value="icon">${this._localize('icon', 'Icon')}</ha-list-item>
    </ha-select>

    ${this._config.today_button?.type === "icon" ? html`
      <ha-icon-picker
        label="${this._localize('today_button_icon', 'Today Button Icon')}"
        .value=${this._config.today_button?.icon || "mdi:calendar-today"}
        .configValue=${"today_button.icon"}
        @value-changed=${this._valueChanged}
      ></ha-icon-picker>
    ` : html`
      <ha-textfield
        label="${this._localize('today_button_text', 'Today Button Text')}"
        .value=${this._config.today_button?.text || this._localize('today', 'Today')}
        .configValue=${"today_button.text"}
        @input=${this._valueChanged}
      ></ha-textfield>
    `}
  </div>
` : ""}

      <h3>${this._localize('compare_button', 'Compare Button')}</h3>
      <ha-formfield label="${this._localize('show_compare_button', 'Show Compare Button')}">
        <ha-switch
          .checked=${this._config.compare_button?.show ?? false}
          .configValue=${"compare_button.show"}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>

${this._config.compare_button?.show === true ? html`
  <div class="sub-option">
    <ha-select
      label="${this._localize('compare_button_type', 'Compare Button Type')}"
      .value=${this._config.compare_button?.type || "text"}
      .configValue=${"compare_button.type"}
      @selected=${this._valueChanged}
      @closed=${(ev) => ev.stopPropagation()}
    >
      <ha-list-item value="text">${this._localize('text', 'Text')}</ha-list-item>
      <ha-list-item value="icon">${this._localize('icon', 'Icon')}</ha-list-item>
    </ha-select>

    ${this._config.compare_button?.type === "icon" ? html`
      <ha-icon-picker
        label="${this._localize('compare_button_icon', 'Compare Button Icon')}"
        .value=${this._config.compare_button?.icon || "mdi:compare"}
        .configValue=${"compare_button.icon"}
        @value-changed=${this._valueChanged}
      ></ha-icon-picker>
    ` : html`
      <ha-textfield
        label="${this._localize('compare_button_text', 'Compare Button Text')}"
        .value=${this._config.compare_button?.text || this._localize('compare', 'Compare')}
        .configValue=${"compare_button.text"}
        @input=${this._valueChanged}
      ></ha-textfield>
    `}
  </div>
` : ""}

      <ha-textfield
        label="${this._localize('start_date_helper', 'Start Date Helper')}"
        .value=${this._config.start_date_helper || "input_datetime.energy_start_date"}
        .configValue=${"start_date_helper"}
        @input=${this._valueChanged}
      ></ha-textfield>

      <ha-textfield
        label="${this._localize('end_date_helper', 'End Date Helper')}"
        .value=${this._config.end_date_helper || "input_datetime.energy_end_date"}
        .configValue=${"end_date_helper"}
        @input=${this._valueChanged}
      ></ha-textfield>

      <ha-formfield label="${this._localize('auto_sync_helpers', 'Auto Sync Helpers')}">
        <ha-switch
          .checked=${this._config.auto_sync_helpers ?? true}
          .configValue=${"auto_sync_helpers"}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>

      <ha-formfield label="${this._localize('prev_next_buttons', 'prev next buttons')}">
        <ha-switch
          .checked=${this._config.prev_next_buttons ?? true}
          .configValue=${"prev_next_buttons"}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>

      <ha-formfield label="${this._localize('debug_mode', 'Debug Mode')}">
        <ha-switch
          .checked=${this._config.debug ?? false}
          .configValue=${"debug"}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
    </div>
  `;
}

// handle period button changes
_periodButtonChanged(ev) {
  if (!this._config || !this.hass) return;

  const target = ev.target;
  const periodValue = target.configValue;
  const isChecked = target.checked;

  // Define the default order
  const defaultOrder = ['day', 'week', 'month', 'year', 'custom'];
  
  // Get current enabled periods or start with the preset array
  let periodButtons = [...(this._config.period_buttons || ['day','week','month','year'])];

  if (isChecked && !periodButtons.includes(periodValue)) {
    // Add the new period
    periodButtons.push(periodValue);
    // Sort according to default order
    periodButtons.sort((a, b) => defaultOrder.indexOf(a) - defaultOrder.indexOf(b));
  } else if (!isChecked) {
    periodButtons = periodButtons.filter(p => p !== periodValue);
  }

  const newConfig = {
    ...this._config,
    period_buttons: periodButtons
  };

  this.dispatchEvent(new CustomEvent("config-changed", {
    detail: { config: newConfig },
    bubbles: true,
    composed: true
  }));
}

_valueChanged(ev) {
  if (!this._config || !this.hass) return;

  const target = ev.target;
  const configPath = target.configValue;
  if (!configPath) return;

  let value;
  if (target.tagName === 'HA-SELECT') {
    value = target.value;
  } else if (target.type === 'checkbox' || target.tagName === 'HA-SWITCH') {
    value = target.checked;
  } else {
    value = target.value;
  }

  // Deep clone the config to avoid mutation
  const newConfig = structuredClone(this._config);

  // Apply the value to the nested path
  const keys = configPath.split('.');
  let ref = newConfig;
  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof ref[keys[i]] !== 'object' || ref[keys[i]] === null) {
      ref[keys[i]] = {};
    }
    ref = ref[keys[i]];
  }
  ref[keys[keys.length - 1]] = value;

  // Update and dispatch
  this._config = newConfig;
  this.requestUpdate();

  this.dispatchEvent(new CustomEvent("config-changed", {
    detail: { config: newConfig },
    bubbles: true,
    composed: true
  }));
}


}

// Register the editor
customElements.define("extended-energy-date-selector-editor", extendedEnergyDateSelectorEditor);

//-----------------------------------//
// Main extendedEnergyDateSelector code //
//-----------------------------------//

class extendedEnergyDateSelector extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = null;
    this._currentPeriod = 'day';
    this._startDate = null;
    this._endDate = null;
    this._isInitialized = false;
    this._retryCount = 0;
    this._maxRetries = 10;
    this._initTimeout = null;
  }

  static getConfigElement() {
    return document.createElement('extended-energy-date-selector-editor');
  }

static getStubConfig() {
  return {
    type: 'custom:extended-energy-date-selector',
    card_theme: true,
    today_button: {
      show: true,
      type: 'icon',
      text: 'Today',
      icon: 'mdi:calendar-today'
    },
    compare_button: {
      show: true,
      type: 'icon',
      text: 'Compare',
      icon: 'mdi:compare'
    },
    prev_next_buttons: true,
    period_buttons: ['day', 'week', 'month', 'year'],
    start_date_helper: 'input_datetime.energy_start_date',
    end_date_helper: 'input_datetime.energy_end_date',
    auto_sync_helpers: true
  };
}

async setConfig(config) {
  if (!config) {
    throw new Error('Invalid configuration');
  }

  this._config = {
    card_theme: config.card_theme !== false,
    title: config.title || '',
    today_button: {
      show: config.today_button?.show !== false,
      type: config.today_button?.type ?? 'icon',
      text: config.today_button?.text || 'Today',
      icon: config.today_button?.icon || 'mdi:calendar-today'
    },
    compare_button: {
      show: config.compare_button?.show === true,
      type: config.compare_button?.type ?? 'text',
      text: config.compare_button?.text || 'Compare',
      icon: config.compare_button?.icon || 'mdi:compare'
    },
    prev_next_buttons: config.prev_next_buttons !== false,
    period_buttons: config.period_buttons || ['day', 'week', 'month', 'year'],
    custom_period_label: config.custom_period_label,
    start_date_helper: config.start_date_helper || 'input_datetime.energy_start_date',
    end_date_helper: config.end_date_helper || 'input_datetime.energy_end_date',
    auto_sync_helpers: config.auto_sync_helpers !== false,
    debug: config.debug === true
  };

  // Force a re-render when config changes
  if (this._isInitialized) {
    this._render();
    this._setupEventListeners();
  };

  // Initialize translations
  await initTranslations(this.hass);
}

  set hass(hass) {
    const oldHass = this._hass;
    this._hass = hass;
    
    if (!oldHass || !this._isInitialized) {
      this._initializeCard();
    }
    
    this._updateCard();
  }

  get hass() {
    return this._hass;
  }

  _localize(key, fallback) {
    const lang = this.hass?.language || (navigator.language || "en").split("-")[0];
    const translations = translationsCache[lang] || {};
    const english = translationsCache["en"] || {};
    return translations[key] || english[key] || fallback || key;
  }

  _initializeCard() {
    if (!this._hass || !this._config) {
      if (this._retryCount < this._maxRetries) {
        this._retryCount++;
        setTimeout(() => this._initializeCard(), 1000);
      }
      return;
    }

    this._retryCount = 0;
    this._isInitialized = true;
    this._render();
    this._setupEventListeners();
    this._initializeDateState();
  }

  _render() {
    const showCard = this._config.card_theme;
    const title = this._config.title;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          --energy-period-selector-color: var(--primary-color);
          --energy-period-selector-text-color: var(--primary-text-color);
          --energy-period-selector-background: var(--card-background-color);
          --mdc-theme-primary: var(--energy-period-selector-color);
        }

        ha-card {
            background: ${showCard ? 'var(--card-background-color)' : 'transparent'};
            box-shadow: ${showCard ? 'var(--card-box-shadow)' : 'none'};
            border-radius: ${showCard ? 'var(--card-border-radius, 8px)' : '0'};
            padding: ${showCard ? '16px' : '0'};
            border: ${showCard ? '1px solid var(--divider-color, rgba(0,0,0,0.12))' : 'none'};
            transition: ${showCard ? 'background 0.3s, box-shadow 0.3s, border-radius 0.3s, padding 0.3s' : 'none'};
        }
        .card-content {
            /* Optional internal spacing */
        }

        .title {
          font-size: 1.2em;
          font-weight: 500;
          margin-bottom: 16px;
          color: var(--energy-period-selector-text-color);
          text-align: center;
        }

        .period-selector {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .period-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          align-items: center;
        }

        .period-button {
          background: transparent;
          border: 2px solid var(--divider-color);
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          color: var(--energy-period-selector-text-color);
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 60px;
          text-align: center;
        }

        .period-button:hover {
          border-color: var(--energy-period-selector-color);
          background: var(--energy-period-selector-color);
          color: var(--text-primary-color);
        }

        .period-button.active {
          background: var(--energy-period-selector-color);
          border-color: var(--energy-period-selector-color);
          color: var(--text-primary-color);
        }

        .action-buttons {
            display: flex;
            gap: 8px;
            justify-content: center;
            align-items: center;
        }

        .controls {
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            gap: 12px;
        }

        .nav-buttons {
          display: flex;
          gap: 8px;
        }

        .nav-button, .today-button, .compare-button {
          background: transparent;
          border: 1px solid var(--divider-color);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--energy-period-selector-text-color);
          transition: all 0.2s ease;
        }

        .today-button, .compare-button {
          border-radius: 20px;
          min-width: 60px;
          width: auto;
          padding: 0 12px;
        }

        .nav-button:hover, .today-button:hover, .compare-button:hover {
          border-color: var(--energy-period-selector-color);
          background: var(--energy-period-selector-color);
          color: var(--text-primary-color);
        }

        .date-range {
          font-size: 14px;
          color: var(--secondary-text-color);
          text-align: center;
          font-weight: 500;
        }

        .custom-picker {
          display: flex;
          gap: 8px;
          justify-content: center;
          align-items: center;
          margin-top: 8px;
        }

        .custom-picker input {
          background: var(--card-background-color);
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          padding: 8px;
          color: var(--primary-text-color);
          font-size: 14px;
        }

        .hidden {
          display: none;
        }

        .debug-info {
          margin-top: 12px;
          padding: 8px;
          background: var(--divider-color);
          border-radius: 4px;
          font-size: 12px;
          color: var(--secondary-text-color);
        }

        @media (max-width: 600px) {
            .controls {
                gap: 8px;
            }
            
            .action-buttons {
                justify-content: center;
            }
            
            .period-buttons {
                width: 100%;
            }
            
            .period-button {
                flex: 1;
                min-width: unset;
            }
        }
      </style>

  <ha-card>
    <div class="card-content">
        ${title ? `<div class="title">${title}</div>` : ''}
        
        <div class="period-selector">
          <div class="period-buttons" id="periodButtons">
            <!-- Period buttons will be populated here -->
          </div>
          
          <div class="controls">
            <div class="nav-buttons ${this._config.prev_next_buttons ? '' : 'hidden'}" id="navButtons">
            <button class="nav-button" id="prevButton" title="${this._localize('previous', 'Previous')}">
                <ha-icon icon="mdi:chevron-left"></ha-icon>
            </button>
            <button class="nav-button" id="nextButton" title="${this._localize('next', 'Next')}">
                <ha-icon icon="mdi:chevron-right"></ha-icon>
            </button>
            </div>
            
            <div class="date-range" id="dateRange">${this._localize('loading', 'Loading...')}</div>
            
            <div class="action-buttons">
            ${this._config.today_button?.show ? `
                <button class="today-button" id="todayButton">
                ${this._config.today_button?.type === 'icon' ? `
                    <ha-icon icon="${this._config.today_button?.icon}"></ha-icon>
                ` : (this._config.today_button?.text || this._localize('today', 'Today'))}
                </button>
            ` : ''}
            ${this._config.compare_button?.show ? `
                <button class="compare-button" id="compareButton">
                ${this._config.compare_button?.type === 'icon' ? `
                    <ha-icon icon="${this._config.compare_button?.icon}"></ha-icon>
                ` : (this._config.compare_button?.text || this._localize('compare', 'Compare'))}
                </button>
            ` : ''}
            </div>
          </div>
          
          <div class="custom-picker hidden" id="customPicker">
            <input type="date" id="startDatePicker" />
            <span>${this._localize('to', 'to')}</span>
            <input type="date" id="endDatePicker" />
            <button class="period-button" id="applyCustom">${this._localize('apply', 'Apply')}</button>
          </div>
        </div>

        ${this._config.debug ? '<div class="debug-info" id="debugInfo">Debug info will appear here</div>' : ''}
    </div>
  </ha-card>
    `;

    this._populatePeriodButtons();
  }

  _populatePeriodButtons() {
    const container = this.shadowRoot.getElementById('periodButtons');
    if (!container) return;

    const periodLabels = {
      day: this._localize('day', 'Day'),
      week: this._localize('week', 'Week'), 
      month: this._localize('month', 'Month'),
      year: this._localize('year', 'Year'),
      custom: this._config.custom_period_label || this._localize('custom', 'Custom')
    };

    container.innerHTML = '';
    
    this._config.period_buttons.forEach(period => {
      const button = document.createElement('button');
      button.className = 'period-button';
      button.textContent = periodLabels[period] || period;
      button.dataset.period = period;
      
      if (period === this._currentPeriod) {
        button.classList.add('active');
      }
      
      container.appendChild(button);
    });
  }

  _setupEventListeners() {
    const shadowRoot = this.shadowRoot;
    
    // Period button clicks
    shadowRoot.addEventListener('click', (e) => {
      if (e.target.classList.contains('period-button') && e.target.dataset.period) {
        this._selectPeriod(e.target.dataset.period);
      }
    });

    // Navigation buttons
    const prevButton = shadowRoot.getElementById('prevButton');
    const nextButton = shadowRoot.getElementById('nextButton');
    const todayButton = shadowRoot.getElementById('todayButton');
    const compareButton = shadowRoot.getElementById('compareButton');
    const applyCustomButton = shadowRoot.getElementById('applyCustom');

    if (prevButton) {
      prevButton.addEventListener('click', () => this._navigatePeriod(-1));
    }
    
    if (nextButton) {
      nextButton.addEventListener('click', () => this._navigatePeriod(1));
    }
    
    if (todayButton) {
      todayButton.addEventListener('click', () => this._selectToday());
    }
    
    if (compareButton) {
      compareButton.addEventListener('click', () => this._toggleCompare());
    }

    if (applyCustomButton) {
      applyCustomButton.addEventListener('click', () => this._applyCustomRange());
    }

    // Custom date picker changes
    const startPicker = shadowRoot.getElementById('startDatePicker');
    const endPicker = shadowRoot.getElementById('endDatePicker');
    
    if (startPicker && endPicker) {
      [startPicker, endPicker].forEach(picker => {
        picker.addEventListener('change', () => this._updateCustomRange());
      });
    }
  }

  _initializeDateState() {
    // Initialize with today's date
    const today = new Date();
    this._selectPeriod(this._currentPeriod);
  }

  _selectPeriod(period) {
    this._currentPeriod = period;
    
    // Update button states
    this.shadowRoot.querySelectorAll('.period-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.period === period);
    });

    // Show/hide custom picker
    const customPicker = this.shadowRoot.getElementById('customPicker');
    if (customPicker) {
      customPicker.classList.toggle('hidden', period !== 'custom');
    }

    if (period === 'custom') {
      this._showCustomPicker();
    } else {
      this._calculatePeriodDates(period);
    }

    this._updateDateDisplay();
    this._syncToHelpers();
    this._fireEnergyPeriodChanged();
  }

  _calculatePeriodDates(period) {
    const now = new Date();
    let start, end;

    switch (period) {
      case 'day':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
        end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear() + 1, 0, 1);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }

    this._startDate = start;
    this._endDate = new Date(end.getTime() - 1); // End of previous day
  }

  _navigatePeriod(direction) {
    if (this._currentPeriod === 'custom') return;

    const start = new Date(this._startDate);
    const end = new Date(this._endDate);
    
    let offset;
    switch (this._currentPeriod) {
      case 'day':
        offset = direction;
        start.setDate(start.getDate() + offset);
        end.setDate(end.getDate() + offset);
        break;
      case 'week':
        offset = direction * 7;
        start.setDate(start.getDate() + offset);
        end.setDate(end.getDate() + offset);
        break;
      case 'month':
        start.setMonth(start.getMonth() + direction);
        end.setMonth(end.getMonth() + direction);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() + direction);
        end.setFullYear(end.getFullYear() + direction);
        break;
    }

    this._startDate = start;
    this._endDate = end;
    this._updateDateDisplay();
    this._syncToHelpers();
    this._fireEnergyPeriodChanged();
  }

  _selectToday() {
    const now = new Date();
    this._currentPeriod = 'day';
    this._calculatePeriodDates('day');
    
    // Update active button
    this.shadowRoot.querySelectorAll('.period-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.period === 'day');
    });
    
    this._updateDateDisplay();
    this._syncToHelpers();
    this._fireEnergyPeriodChanged();
  }

  _showCustomPicker() {
    const startPicker = this.shadowRoot.getElementById('startDatePicker');
    const endPicker = this.shadowRoot.getElementById('endDatePicker');
    
    if (startPicker && endPicker) {
      if (this._startDate) {
        startPicker.value = this._formatDateForInput(this._startDate);
      }
      if (this._endDate) {
        endPicker.value = this._formatDateForInput(this._endDate);
      }
    }
  }

  _updateCustomRange() {
    const startPicker = this.shadowRoot.getElementById('startDatePicker');
    const endPicker = this.shadowRoot.getElementById('endDatePicker');
    
    if (startPicker?.value && endPicker?.value) {
      this._startDate = new Date(startPicker.value);
      this._endDate = new Date(endPicker.value);
      this._updateDateDisplay();
    }
  }

  _applyCustomRange() {
    this._updateCustomRange();
    this._syncToHelpers();
    this._fireEnergyPeriodChanged();
  }

  _updateDateDisplay() {
    const dateRange = this.shadowRoot.getElementById('dateRange');
    if (!dateRange || !this._startDate || !this._endDate) return;

    const formatOptions = { 
      month: 'short', 
      day: 'numeric',
      year: this._startDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    };

    const startStr = this._startDate.toLocaleDateString(undefined, formatOptions);
    const endStr = this._endDate.toLocaleDateString(undefined, formatOptions);

    if (this._startDate.toDateString() === this._endDate.toDateString()) {
      dateRange.textContent = startStr;
    } else {
      dateRange.textContent = `${startStr} - ${endStr}`;
    }

    if (this._config.debug) {
      this._updateDebugInfo();
    }
  }

  _updateDebugInfo() {
    const debugInfo = this.shadowRoot.getElementById('debugInfo');
    if (!debugInfo) return;

    debugInfo.innerHTML = `
      Period: ${this._currentPeriod}<br>
      Start: ${this._startDate?.toISOString().split('T')[0]}<br>
      End: ${this._endDate?.toISOString().split('T')[0]}<br>
      Start Helper: ${this._config.start_date_helper}<br>
      End Helper: ${this._config.end_date_helper}<br>
      Auto Sync: ${this._config.auto_sync_helpers}
    `;
  }

    // Modify the _syncToHelpers function to also update energy collection
    async _syncToHelpers() {
    if (!this._config.auto_sync_helpers || !this._hass || !this._startDate || !this._endDate) {
        return;
    }

    try {
        const startDate = this._formatDateForHelper(this._startDate);
        const endDate = this._formatDateForHelper(this._endDate);

        // Update helpers
        await Promise.all([
        this._hass.callService('input_datetime', 'set_datetime', {
            entity_id: this._config.start_date_helper,
            date: startDate
        }),
        this._hass.callService('input_datetime', 'set_datetime', {
            entity_id: this._config.end_date_helper,
            date: endDate
        })
        ]);

        // Update energy collection
        await this._updateEnergyCollection();

        if (this._config.debug) {
        console.log(`extended-energy-date-selector: Updated helpers and energy collection - ${startDate} to ${endDate}`);
        }
    } catch (error) {
        console.error('extended-energy-date-selector: Error updating:', error);
    }
    }

    // Add this function after _syncToHelpers()
    async _updateEnergyCollection() {
    if (!this._hass || !this._startDate || !this._endDate) return;

    try {
        // Get the energy collection
        const energyCollection = await this._getEnergyCollection();
        if (!energyCollection) {
        console.error('extended-energy-date-selector: Could not get energy collection');
        return;
        }

        // Set the period in the energy collection
        energyCollection.setPeriod(this._startDate, this._endDate);
        
        // Force a refresh of the energy data
        energyCollection.refresh();

        if (this._config.debug) {
        console.log('extended-energy-date-selector: Updated energy collection period', {
            start: this._startDate,
            end: this._endDate
        });
        }
    } catch (error) {
        console.error('extended-energy-date-selector: Error updating energy collection:', error);
    }
    }

    // Add this helper function
    async _getEnergyCollection() {
    if (!this._hass.connection) return null;

    // Get the energy collection from Home Assistant
    const getCollection = (conn) => {
        if (conn._energy) return conn._energy;
        
        // Use the built-in getCollection function
        return conn.subscribeCollection({
        key: '_energy',
        subscribe: async (conn) => {
            return conn.subscribeMessage({
            type: 'energy/subscribe'
            });
        },
        async start(conn) {
            return await conn.sendMessagePromise({
            type: 'energy/get_prefs'
            });
        },
        });
    };

    return getCollection(this._hass.connection);
    }

  _fireEnergyPeriodChanged() {
    if (!this._startDate || !this._endDate) return;

    const event = new CustomEvent('energy-period-changed', {
      detail: {
        start: this._startDate.toISOString().split('T')[0],
        end: this._endDate.toISOString().split('T')[0],
        period: this._currentPeriod
      },
      bubbles: true,
      composed: true
    });

    this.dispatchEvent(event);
  }

  _formatDateForInput(date) {
    return date.toISOString().split('T')[0];
  }

  _formatDateForHelper(date) {
    return date.toISOString().split('T')[0];
  }

  _toggleCompare() {
    // Placeholder for compare functionality
    console.log('Compare mode toggled');
  }

  _updateCard() {
    if (!this._isInitialized) return;
    
    // Update date display and any dynamic content
    this._updateDateDisplay();
  }

  connectedCallback() {
    // Ensure proper initialization when element is added to DOM
    if (this._hass && this._config && !this._isInitialized) {
      this._initializeCard();
    }
  }

  disconnectedCallback() {
    // Cleanup when element is removed
    if (this._initTimeout) {
      clearTimeout(this._initTimeout);
    }
  }
}

// Register the custom element
customElements.define('extended-energy-date-selector', extendedEnergyDateSelector);

// Add to window for Home Assistant to find it
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'extended-energy-date-selector',
  name: 'extended Energy Date Selector',
  description: 'A reliable energy date selector with datetime helper integration and localization'
});

// Console info
console.info(
  '%c extended-energy-date-selector %c v1.1.0 ',
  'color: white; background: green; font-weight: 700;',
  'color: green; background: white; font-weight: 700;'
);