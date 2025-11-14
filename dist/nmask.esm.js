/**
 * Nmask - ES Module Version
 * Lightweight number input masking with zero dependencies
 * 
 * Supports both CommonJS and ES6 imports:
 *   import Nmask from 'nmask';
 *   const nmask = new Nmask(element, options);
 */

class Nmask {
  constructor(element, options = {}) {
    if (!(element instanceof HTMLElement)) {
      throw new Error('Nmask: First argument must be an HTMLElement');
    }

    this.original = element;
    this.isInput = element.tagName === 'INPUT';
    this.options = {
      thousandsSeparator: '.',
      decimalSeparator: ',',
      decimalDigits: 0,
      prefix: '',
      suffix: '',
      allowNegative: false,
      ...options
    };

    // Skip if already initialized
    if (this.original.dataset.nmaskActive) {
      return;
    }

    this.original.dataset.nmaskActive = 'true';
    this.init();
  }

  init() {
    if (this.isInput) {
      this.initInput();
    } else {
      this.initDisplay();
    }
  }

  initInput() {
    // Guard: if visual already exists, skip re-initialization
    if (this.visual) {
      console.log('DEBUG: Visual input already exists, skipping re-initialization');
      return;
    }

    const inputMode = this.options.decimalDigits > 0 ? 'decimal' : 'numeric';
    
    // Check if parent is input-group (Bootstrap) - CRITICAL: check BEFORE any DOM manipulation
    const parentElement = this.original.parentElement;
    const hasInputGroupParent = parentElement && parentElement.classList.contains('input-group');
    
    console.log('DEBUG initInput:');
    console.log('  - original:', this.original);
    console.log('  - parentElement:', parentElement);
    console.log('  - parentElement className:', parentElement?.className);
    console.log('  - hasInputGroupParent:', hasInputGroupParent);
    console.log('  - Storing for later use: this.isInputGroup =', hasInputGroupParent);
    
    this.isInputGroup = hasInputGroupParent;
    this.inputGroupParent = hasInputGroupParent ? parentElement : null;
    
    // Create visual input
    this.visual = document.createElement('input');
    this.visual.type = 'text';
    this.visual.autocomplete = 'off';
    this.visual.inputMode = inputMode;
    
    // Copy classes
    if (this.original.className) {
      this.visual.className = this.original.className;
    }

    // Auto-generate ID only if needed for input-group functionality
    let originalId = this.original.id;
    if (!originalId && this.isInputGroup) {
      originalId = 'nmask_' + Math.floor(Math.random() * 10000);
      this.original.id = originalId;
    }

    // Copy attributes
    if (this.original.placeholder) {
      this.visual.placeholder = this.original.placeholder;
    }
    if (originalId) {
      this.visual.id = originalId + '_visual';
    }

    // Copy properties
    ['readonly', 'disabled', 'required'].forEach(prop => {
      if (this.original[prop]) {
        this.visual[prop] = this.original[prop];
      }
    });

    // Copy style
    if (this.original.getAttribute('style')) {
      this.visual.setAttribute('style', this.original.getAttribute('style'));
    }

    // Store references
    this.original.dataset.nmaskVisual = 'true';
    this.original.dataset.nmaskOriginal = 'true';

    // Hide original input
    this.original.style.opacity = '0';
    this.original.style.width = '0';
    this.original.style.height = '0';
    this.original.style.border = 'none';
    this.original.style.padding = '0';
    this.original.style.margin = '0';
    this.original.style.minWidth = '0';
    this.original.style.minHeight = '0';
    this.original.tabIndex = -1;
    this.original.setAttribute('step', 'any');

    // Insert visual input - handle input-group differently
    if (this.isInputGroup && this.inputGroupParent) {
      console.log('DEBUG: Input-group detected - using saved reference');
      console.log('  - inputGroupParent:', this.inputGroupParent);
      console.log('  - inputGroupParent.parentNode:', this.inputGroupParent.parentNode);
      
      const inputGroupGrandparent = this.inputGroupParent.parentNode;
      
      // Step 1: Insert visual after original (dalam input-group)
      this.inputGroupParent.insertBefore(this.visual, this.original.nextSibling);
      console.log('After Step 1 - visual inserted in input-group');
      
      // Step 2: Move original to after input-group parent (keluar dari input-group)
      if (inputGroupGrandparent) {
        inputGroupGrandparent.insertBefore(this.original, this.inputGroupParent.nextSibling);
        console.log('After Step 2 - original moved outside input-group');
      }
    } else {
      // Standard insertion
      this.original.parentNode.insertBefore(this.visual, this.original.nextSibling);
    }

    // Initialize visual value
    this.visual.value = this.formatNumber(this.original.value);

    // Attach event handlers
    this.attachInputHandlers();
  }

  initDisplay() {
    // Create hidden input
    this.hidden = document.createElement('input');
    this.hidden.type = 'hidden';
    
    const nameAttr = this.original.getAttribute('data-name') ||
                     this.original.getAttribute('name') ||
                     'nmask_field_' + Math.floor(Math.random() * 10000);
    this.hidden.name = nameAttr;
    this.hidden.dataset.nmaskHidden = 'true';

    this.original.parentNode.insertBefore(this.hidden, this.original.nextSibling);

    // Initialize values
    const initialValue = this.original.textContent || this.original.getAttribute('data-value') || '';
    const cleanVal = this.cleanNumber(initialValue);
    this.hidden.value = cleanVal;
    this.original.textContent = this.formatNumber(cleanVal);

    // Attach form handler if parent is form
    const form = this.original.closest('form');
    if (form) {
      form.addEventListener('submit', () => {
        this.hidden.value = this.cleanNumber(this.original.textContent);
      });
    }
  }

  attachInputHandlers() {
    // Restrict cursor position
    this.visual.addEventListener('click', () => this.restrictCursor());
    this.visual.addEventListener('keyup', () => this.restrictCursor());
    
    // Handle selection
    this.visual.addEventListener('mouseup', (e) => this.handleSelection());

    // Main input handler
    this.visual.addEventListener('input', (e) => this.handleInput());

    // Sync from original
    this.original.addEventListener('input', () => this.syncFromOriginal());
    this.original.addEventListener('change', () => this.syncFromOriginal());
  }

  restrictCursor() {
    const cursorPos = this.visual.selectionStart;
    const prefixLen = this.options.prefix.length;
    const suffixLen = this.options.suffix.length;
    const valueEndPos = this.visual.value.length - suffixLen;

    if (cursorPos < prefixLen) {
      this.visual.setSelectionRange(prefixLen, prefixLen);
    } else if (cursorPos > valueEndPos) {
      this.visual.setSelectionRange(valueEndPos, valueEndPos);
    }
  }

  handleSelection() {
    const selStart = this.visual.selectionStart;
    const selEnd = this.visual.selectionEnd;
    const val = this.visual.value;
    const prefixLen = this.options.prefix.length;
    const suffixLen = this.options.suffix.length;
    const valueEndPos = val.length - suffixLen;

    if (selStart < prefixLen || selEnd > valueEndPos) {
      const newStart = Math.max(selStart, prefixLen);
      const newEnd = Math.min(selEnd, valueEndPos);
      this.visual.setSelectionRange(newStart, newEnd);
    }
  }

  handleInput() {
    const val = this.visual.value;
    const cursorPos = this.visual.selectionStart;

    // DEBUG: Log decimal separator detection
    console.log('DEBUG handleInput:');
    console.log('  - visual.value:', val);
    console.log('  - cursorPos:', cursorPos);
    console.log('  - decimalSeparator:', this.options.decimalSeparator);
    console.log('  - char at cursorPos-1:', val.charAt(cursorPos - 1));
    console.log('  - justTypedDecimal check:', val.charAt(cursorPos - 1) === this.options.decimalSeparator);

    // Detect decimal separator conditions
    const justTypedDecimal = val.charAt(cursorPos - 1) === this.options.decimalSeparator;
    const isTypingAfterDecimal = val.charAt(cursorPos - 2) === this.options.decimalSeparator;

    let cleanVal = this.cleanNumber(val);

    // Handle empty input
    if (!cleanVal && !val) {
      this.original.value = '';
      this.visual.value = '';
      return;
    }

    // Special handling for prefix/suffix only
    if (!cleanVal && (
      (this.options.suffix && val === this.options.prefix + this.options.suffix) ||
      (this.options.prefix && val === this.options.prefix)
    )) {
      this.visual.value = '';
      this.original.value = '';
      return;
    }

    if (cleanVal || cleanVal === '0') {
      const parts = cleanVal.split('.');
      let intPart = parts[0].replace(/^(-)?0+(?=\d)/, '$1') || '0';
      let decPart = parts[1] || '';

      // Calculate cursor position
      const beforeCursor = val.slice(0, cursorPos);
      const cleanBefore = this.cleanNumber(beforeCursor);
      const relativePos = cleanBefore.length;

      let originalVal, visualVal;

      if (this.options.decimalDigits > 0) {
        decPart = decPart.slice(0, this.options.decimalDigits);

        if (val.charAt(cursorPos - 1) === this.options.decimalSeparator) {
          originalVal = intPart + '.';
          visualVal = this.formatNumber(originalVal, true);
        } else {
          originalVal = decPart.length > 0 ? intPart + '.' + decPart : intPart;
          const hasDecimal = val.includes(this.options.decimalSeparator);
          visualVal = this.formatNumber(originalVal, hasDecimal);
        }
      } else {
        originalVal = intPart;
        visualVal = this.formatNumber(intPart);
      }

      // Set values
      this.original.value = originalVal;
      this.visual.value = visualVal;

      // Calculate new cursor position
      const newVal = this.visual.value;
      const numberEndPos = newVal.length - this.options.suffix.length;
      const prefixLen = this.options.prefix.length;
      const decimalIndex = newVal.indexOf(this.options.decimalSeparator);

      const justTypedDecimalSeparator = val.charAt(cursorPos - 1) === this.options.decimalSeparator;
      const cursorAtDecimalPosition = decimalIndex !== -1 && cursorPos === decimalIndex + 1;

      if (justTypedDecimalSeparator || cursorAtDecimalPosition) {
        const newDecimalIndex = newVal.indexOf(this.options.decimalSeparator);
        if (newDecimalIndex !== -1) {
          this.visual.setSelectionRange(newDecimalIndex + 1, newDecimalIndex + 1);
          this.original.dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }
      }

      const isAfterDecimal = decimalIndex !== -1 && cursorPos > decimalIndex;
      let newPos;

      if (isAfterDecimal) {
        newPos = cursorPos;
      } else {
        newPos = Math.min(
          prefixLen + relativePos + Math.floor(relativePos / 3),
          numberEndPos
        );
      }

      this.visual.setSelectionRange(newPos, newPos);
      this.original.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      this.original.value = '';
      this.visual.value = '';
      this.original.dispatchEvent(new Event('input', { bubbles: true }));
    }

    this.original.dispatchEvent(new Event('change', { bubbles: true }));
  }

  syncFromOriginal() {
    const originalVal = this.original.value;
    const visualVal = this.visual.value;
    const endsWithDecimalOnly =
      this.options.decimalDigits > 0 &&
      visualVal &&
      visualVal.endsWith(this.options.decimalSeparator);

    if (!endsWithDecimalOnly) {
      this.visual.value = this.formatNumber(originalVal);
    }
  }

  formatNumber(value, preserveDecimalSeparator = false) {
    if (!value && value !== '0') return '';

    let num = value.toString().replace(/[^0-9\-\.]/g, '');
    let isNegative = value.toString().startsWith('-');
    if (isNegative) num = num.substring(1);

    const endsWithDecimal = preserveDecimalSeparator && value.toString().endsWith('.');

    let [intPart, decPart] = num.split('.');
    intPart = intPart || '0';
    intPart = intPart.replace(/^0+(?=\d)/, '');
    if (intPart === '') intPart = '0';

    intPart = intPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      this.options.thousandsSeparator
    );

    let result = (isNegative ? '-' : '') + this.options.prefix + intPart;

      if (this.options.decimalDigits > 0) {
        if (preserveDecimalSeparator && value.toString().endsWith('.')) {
          result += this.options.decimalSeparator;
      } else if (decPart !== undefined) {
        decPart = (decPart || '').slice(0, this.options.decimalDigits);
        if (decPart.length > 0) {
          result += this.options.decimalSeparator + decPart;
        }
      }
    }

    return result + this.options.suffix;
  }

  cleanNumber(val) {
    if (!val) return '';

    console.log('DEBUG cleanNumber - INPUT:', val);

    // Remove prefix and suffix
    if (this.options.prefix) {
      val = val.replace(new RegExp('^' + this.escapeRegExp(this.options.prefix)), '');
    }
    if (this.options.suffix) {
      val = val.replace(new RegExp(this.escapeRegExp(this.options.suffix) + '$'), '');
    }

    console.log('DEBUG cleanNumber - after prefix/suffix removal:', val);

    // IMPORTANT: Create decimal regex BEFORE removing thousand separators
    // This way we can preserve decimal separator while removing other non-numeric chars
    const decimalRegex = new RegExp(
      `[^0-9${this.options.allowNegative ? '\\-' : ''}${this.escapeRegExp(
        this.options.decimalSeparator
      )}]`,
      'g'
    );

    console.log('DEBUG cleanNumber - decimalRegex:', decimalRegex);
    
    // Apply decimal regex to remove unwanted chars BEFORE removing thousand separator
    val = val.replace(decimalRegex, '');
    console.log('DEBUG cleanNumber - after decimalRegex:', val);

    // Now remove thousand separators (only if it's different from decimal separator)
    if (this.options.thousandsSeparator && this.options.thousandsSeparator !== this.options.decimalSeparator) {
      val = val.replace(
        new RegExp(this.escapeRegExp(this.options.thousandsSeparator), 'g'),
        ''
      );
      console.log('DEBUG cleanNumber - after removing thousands separator:', val);
    }

    // Handle multiple decimal separators
    const parts = val.split(this.options.decimalSeparator);
    if (parts.length > 1) {
      val = parts[0] + this.options.decimalSeparator + parts.slice(1).join('');
    }

    // Convert to internal format
    if (this.options.decimalSeparator !== '.') {
      val = val.replace(this.options.decimalSeparator, '.');
    }

    console.log('DEBUG cleanNumber - FINAL OUTPUT:', val);
    return val;
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Get/Set value (similar to jQuery .val())
  val(value) {
    if (value !== undefined) {
      if (this.isInput) {
        this.original.value = value;
        this.visual.value = this.formatNumber(value);
      } else {
        const cleanVal = this.cleanNumber(value.toString());
        this.hidden.value = cleanVal;
        this.original.textContent = this.formatNumber(cleanVal);
      }
      return this;
    }

    if (this.isInput) {
      return this.original.value;
    } else {
      return this.hidden.value;
    }
  }

  destroy() {
    if (this.isInput && this.visual) {
      this.visual.remove();
      this.original.style.opacity = '';
      this.original.style.width = '';
      this.original.style.height = '';
      this.original.style.border = '';
      this.original.style.padding = '';
      this.original.style.margin = '';
      this.original.style.minWidth = '';
      this.original.style.minHeight = '';
      this.original.removeAttribute('tabindex');
    } else if (this.hidden) {
      this.hidden.remove();
    }

    delete this.original.dataset.nmaskActive;
    delete this.original.dataset.nmaskOriginal;
    delete this.original.dataset.nmaskVisual;
  }
}

export default Nmask;
export { Nmask };
