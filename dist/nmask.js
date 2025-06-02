(function ($) {
  $.fn.nmask = function (optionsOrMethod) {
    const defaultSettings = {
      thousandsSeparator: ".",
      decimalSeparator: ",",
      decimalDigits: 0,
      prefix: "",
      allowNegative: false,
    };

    const escapeRegExp = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };

    if (optionsOrMethod === "destroy") {
      return this.each(function () {
        const $original = $(this);
        const $visual = $("#" + $original.attr("id") + "_visual");
        if ($visual.length) {
          $visual.off(".nmask").remove();
          $original.off(".nmask").show();
        }
      });
    }

    const settings = $.extend({}, defaultSettings, optionsOrMethod);

    const formatNumber = (value) => {
      if (!value || isNaN(value)) return "";
      let num = value.toString().replace(/[^0-9\-\.]/g, "");
      let isNegative = value.toString().startsWith("-");
      if (isNegative) num = num.substring(1);

      let [intPart, decPart] = num.split(".");
      intPart = intPart.replace(/^0+(?=\d)/, ""); // remove leading zeros
      intPart = intPart.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        settings.thousandsSeparator
      );

      if (settings.decimalDigits > 0) {
        // hanya potong, tanpa padEnd
        decPart = (decPart || "").slice(0, settings.decimalDigits);

        // Hanya tampilkan decimalSeparator jika decPart tidak kosong
        let decimalString =
          decPart.length > 0 ? settings.decimalSeparator + decPart : "";

        return (
          (isNegative ? "-" : "") + settings.prefix + intPart + decimalString
        );
      } else {
        return (isNegative ? "-" : "") + settings.prefix + intPart;
      }
    };

    const cleanNumber = (val) => {
      if (settings.prefix) {
        val = val.replace(new RegExp(escapeRegExp(settings.prefix), "g"), "");
      }
      if (settings.thousandsSeparator) {
        val = val.replace(
          new RegExp(escapeRegExp(settings.thousandsSeparator), "g"),
          ""
        );
      }
      val = val.replace(
        new RegExp(
          `[^0-9${settings.allowNegative ? "\\-" : ""}${
            settings.decimalSeparator === "."
              ? ""
              : escapeRegExp(settings.decimalSeparator)
          }]`,
          "g"
        ),
        ""
      );
      if (settings.decimalSeparator && settings.decimalSeparator !== ".") {
        val = val.replace(settings.decimalSeparator, ".");
      }
      return val;
    };

    return this.each(function () {
      const $original = $(this);
      const originalId =
        $original.attr("id") || "nmask_" + Math.floor(Math.random() * 10000);
      const existing = $("#" + originalId + "_visual");

      if (existing.length) return; // prevent double init

      $original.attr("id", originalId);

      const $visual = $('<input type="text" autocomplete="off">')
        .addClass($original.attr("class") || "")
        .attr("id", originalId + "_visual")
        .attr("placeholder", $original.attr("placeholder") || "");

      // Clone essential props like readonly, disabled, required, style
      ["readonly", "disabled", "required", "style"].forEach((prop) => {
        if ($original.prop(prop)) $visual.prop(prop, $original.prop(prop));
      });

      //   Selalu set opacity 0 pada original input
      $original.css({
        opacity: 0,
        width: 0,
        height: 0,
        border: "none",
        padding: 0,
        margin: 0,
      });
      // Tambahkan tabindex -1 agar tidak bisa di-tab
      $original.attr("tabindex", -1);

      if ($original.parent().hasClass("input-group")) {
        // Letakkan visual
        $visual.insertAfter($original);

        // Pindahkan original input ke luar input-group
        $original.insertAfter($original.parent());
      } else {
        $original.after($visual);
      }
      $visual.val(formatNumber($original.val()));

      // Prepare inline oninput function if exists
      const inlineOnInput = $original.attr("oninput");
      let onInputFn = null;
      if (inlineOnInput) {
        onInputFn = new Function("event", inlineOnInput);
      }

      // Set step="any" pada original input
      $original.attr("step", "any");

      $visual.on("input.nmask", function (e) {
        let val = $(this).val();
        let cleanVal = cleanNumber(val);

        if (cleanVal) {
          let parts = cleanVal.split(".");
          let intPart = parts[0].replace(/^(-)?0+(?=\d)/, "$1");
          let decPart = parts[1] || "";

          if (settings.decimalDigits > 0) {
            decPart = decPart.slice(0, settings.decimalDigits);

            // Untuk simpan ke original input: jika decPart kosong, hilangkan titik
            let originalVal =
              decPart.length > 0 ? intPart + "." + decPart : intPart;

            $original.val(originalVal);

            // Untuk visual input: tetap tampilkan apa user ketik, tapi jangan buat error di formatNumber
            // Kita hanya format ulang jika ada angka desimal atau intPart saja
            // Jadi jika input user '1.' tetap tampil '1.' di visual
            // Format ulang hanya jika val sudah valid number atau ada decimal
            let visualVal;
            if (
              val.endsWith(settings.decimalSeparator) &&
              decPart.length === 0
            ) {
              // User baru ketik titik desimal, tampilkan apa adanya
              visualVal = val;
            } else {
              visualVal = formatNumber(originalVal);
            }

            $(this).val(visualVal);
          } else {
            // tanpa decimal digits
            $original.val(intPart);
            $(this).val(formatNumber(intPart));
          }

          if (onInputFn) {
            onInputFn.call($original[0], e.originalEvent);
          } else {
            $original.trigger("input");
          }
        } else {
          $original.val("");
          $visual.val("");
          if (onInputFn) {
            onInputFn.call($original[0], e.originalEvent);
          } else {
            $original.trigger("input");
          }
        }

        $original.trigger("change");
      });

      // Sync visual if original input changed programmatically
      const syncFromOriginal = () => {
        const originalVal = $original.val();
        const visualVal = $visual.val();

        // Cek apakah visual input diakhiri dengan separator desimal dan belum ada angka setelahnya
        const endsWithDecimalOnly =
          settings.decimalDigits > 0 &&
          visualVal &&
          visualVal.endsWith(settings.decimalSeparator);

        if (!endsWithDecimalOnly) {
          $visual.val(formatNumber(originalVal));
        }
      };

      $original.on("input.nmask change.nmask", syncFromOriginal);

      const observer = new MutationObserver(syncFromOriginal);
      observer.observe($original[0], {
        attributes: true,
        attributeFilter: ["value"],
      });

      // On form submit, set original val to clean number without formatting
      $original.closest("form").on("submit.nmask", function () {
        $original.val(cleanNumber($visual.val()));
      });
    });
  };
})(jQuery);
