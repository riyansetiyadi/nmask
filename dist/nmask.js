/*!
 * nmask v1.0.0
 * Lightweight jQuery plugin for numeric input formatting
 * https://github.com/riyansetiyadi/nmask
 * Licensed under MIT
 */
(function($) {
  $.fn.nmask = function(options) {
    const settings = $.extend({
      thousandsSeparator: '.',
      decimalSeparator: ',',
      decimalDigits: 0,
      prefix: '',
      allowNegative: false
    }, options);

    function formatNumber(raw) {
      if (!raw) return '';
      let negative = false;
      if (raw[0] === '-') {
        negative = true;
        raw = raw.slice(1);
      }

      let [intPart, decPart] = raw.split('.');
      intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, settings.thousandsSeparator);

      let result = intPart;
      if (settings.decimalDigits > 0) {
        decPart = (decPart || '').padEnd(settings.decimalDigits, '0').slice(0, settings.decimalDigits);
        result += settings.decimalSeparator + decPart;
      }

      if (negative) result = '-' + result;
      return settings.prefix + result;
    }

    function cleanNumber(val) {
      const regex = new RegExp(`[^0-9${settings.decimalSeparator}${settings.allowNegative ? '-' : ''}]`, 'g');
      let cleaned = val.replace(regex, '')
                       .replace(settings.decimalSeparator, '.');
      return cleaned;
    }

    return this.each(function() {
      const $original = $(this);
      const originalId = $original.attr('id') || 'input_' + Math.floor(Math.random() * 100000);
      $original.attr('id', originalId);

      const $visual = $('<input>', {
        type: 'text',
        id: originalId + '_visual',
        class: 'nmask-visual',
        placeholder: $original.attr('placeholder') || '',
      });

      $original.after($visual).hide();

      const rawInitial = $original.val();
      if (rawInitial) {
        $visual.val(formatNumber(rawInitial));
      }

      $visual.on('input', function () {
        const raw = cleanNumber($(this).val());

        if (raw) {
          const parts = raw.split('.');
          const intPart = parts[0].replace(/^(-)?0+(?=\d)/, '$1');
          let decPart = parts[1] || '';
          if (settings.decimalDigits > 0) {
            decPart = decPart.slice(0, settings.decimalDigits);
            $original.val(intPart + '.' + decPart);
          } else {
            $original.val(intPart);
          }

          $(this).val(formatNumber($original.val()));
        } else {
          $original.val('');
          $(this).val('');
        }
      });

      $original.closest('form').on('submit', function () {
        const raw = cleanNumber($visual.val());
        $original.val(raw || '');
      });
    });
  };
})(jQuery);
