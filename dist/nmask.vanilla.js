/**
 * Nmask - Vanilla JS Version
 * Lightweight number input masking without jQuery dependency
 * 
 * Usage:
 *   const nmask = new Nmask(element, options);
 *   nmask.destroy();
 * 
 * Or use the global helper:
 *   nmaskify(document.getElementById('input'), options);
 *   nmaskDestroy(document.getElementById('input'));
 */

(function (global) {
  'use strict';

  const instanceMap = new WeakMap();

  /**
   * Main Nmask class for vanilla JS
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
      instanceMap.set(this.original, this);
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
        return;
      }

      const inputMode = this.options.decimalDigits > 0 ? 'decimal' : 'numeric';
      
      // Check if parent is input-group (Bootstrap) - CRITICAL: check BEFORE any DOM manipulation
      const parentElement = this.original.parentElement;
      const hasInputGroupParent = parentElement && parentElement.classList.contains('input-group');
      
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
      ['readOnly', 'disabled', 'required'].forEach(prop => {
        if (this.original[prop]) {
          this.visual[prop] = this.original[prop];
        }
      });

      // Copy style
      if (this.original.getAttribute('style')) {
        this.visual.setAttribute('style', this.original.getAttribute('style'));
      }

      // Copy data-* attributes (excluding internal nmask-* attributes)
      if (this.original.attributes) {
        const attrs = this.original.attributes;
        for (let i = 0; i < attrs.length; i++) {
          const attrName = attrs[i].name;
          const lowerName = attrName.toLowerCase();
          if (lowerName.startsWith('data-') && !lowerName.startsWith('data-nmask-')) {
            this.visual.setAttribute(attrName, attrs[i].value);
          }
        }
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
        this._form = form;
        this._submitHandler = () => {
          this.hidden.value = this.cleanNumber(this.original.textContent);
        };
        form.addEventListener('submit', this._submitHandler);
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
      this._syncHandler = () => this.syncFromOriginal();
      this.original.addEventListener('input', this._syncHandler);
      this.original.addEventListener('change', this._syncHandler);
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

      // Detect decimal separator conditions
      const justTypedDecimal = val.charAt(cursorPos - 1) === this.options.decimalSeparator;
      const isTypingAfterDecimal = val.charAt(cursorPos - 2) === this.options.decimalSeparator;

      let cleanVal = this.cleanNumber(val);

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

      // Remove prefix and suffix
      if (this.options.prefix) {
        val = val.replace(new RegExp('^' + this.escapeRegExp(this.options.prefix)), '');
      }
      if (this.options.suffix) {
        val = val.replace(new RegExp(this.escapeRegExp(this.options.suffix) + '$'), '');
      }

      // IMPORTANT: Create decimal regex BEFORE removing thousand separators
      // This way we can preserve decimal separator while removing other non-numeric chars
      const decimalRegex = new RegExp(
        `[^0-9${this.options.allowNegative ? '\\-' : ''}${this.escapeRegExp(
          this.options.decimalSeparator
        )}]`,
        'g'
      );
      
      // Apply decimal regex to remove unwanted chars BEFORE removing thousand separator
      val = val.replace(decimalRegex, '');

      // Now remove thousand separators (only if it's different from decimal separator)
      if (this.options.thousandsSeparator && this.options.thousandsSeparator !== this.options.decimalSeparator) {
        val = val.replace(
          new RegExp(this.escapeRegExp(this.options.thousandsSeparator), 'g'),
          ''
        );
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
        if (this.isInputGroup && this.visual.parentNode) {
          this.visual.parentNode.insertBefore(this.original, this.visual);
        }
        this.visual.remove();
        this.visual = null;
        if (this._syncHandler) {
          this.original.removeEventListener('input', this._syncHandler);
          this.original.removeEventListener('change', this._syncHandler);
          this._syncHandler = null;
        }
        this.original.style.opacity = '';
        this.original.style.width = '';
        this.original.style.height = '';
        this.original.style.border = '';
        this.original.style.padding = '';
        this.original.style.margin = '';
        this.original.style.minWidth = '';
        this.original.style.minHeight = '';
        this.original.removeAttribute('tabindex');
        this.original.removeAttribute('step');
      } else if (this.hidden) {
        this.hidden.remove();
        this.hidden = null;
      }

      if (this._form && this._submitHandler) {
        this._form.removeEventListener('submit', this._submitHandler);
        this._form = null;
        this._submitHandler = null;
      }

      instanceMap.delete(this.original);
      delete this.original.dataset.nmaskActive;
      delete this.original.dataset.nmaskOriginal;
      delete this.original.dataset.nmaskVisual;
    }
  }

  /**
   * Global helper functions for vanilla JS
   */
  function nmaskify(element, options) {
    return new Nmask(element, options);
  }

  function nmaskDestroy(element) {
    if (!element) return;
    const instance = instanceMap.get(element);
    if (instance) {
      instance.destroy();
    } else if (element.dataset && element.dataset.nmaskActive) {
      delete element.dataset.nmaskActive;
      delete element.dataset.nmaskOriginal;
      delete element.dataset.nmaskVisual;
    }
  }

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Nmask;
    module.exports.nmaskify = nmaskify;
    module.exports.nmaskDestroy = nmaskDestroy;
  } else if (typeof define === 'function' && define.amd) {
    define([], () => Nmask);
  } else {
    global.Nmask = Nmask;
    global.nmaskify = nmaskify;
    global.nmaskDestroy = nmaskDestroy;
  }
})(typeof window !== 'undefined' ? window : global);
