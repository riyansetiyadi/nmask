(function ($) {
  // Store original jQuery val method
  const originalVal = $.fn.val;

  // Override jQuery .val() method
  $.fn.val = function (value) {
    // If setting value
    if (arguments.length > 0) {
      return this.each(function () {
        const $this = $(this);

        // Check if element has nmask data
        if ($this.data("nmask-active")) {
          if ($this.is("input")) {
            // For input elements, use original behavior
            originalVal.call($this, value);
          } else {
            // For non-input elements, use custom setValue method
            const setValue = $this.data("nmask-setValue");
            if (setValue) {
              setValue(value);
            }
          }
        } else {
          // Use original jQuery val method
          originalVal.call($this, value);
        }
      });
    }
    // If getting value
    else {
      // Prefer the original element that has nmask active when a selection
      // contains both the visual and the original input. This prevents
      // returning the formatted visual value (with thousands separators).
      let $first = $(this.first());

      // If first element is not the nmask-bound original and the set
      // contains more than one element, try to find the original or
      // the hidden input that stores the clean value. Prefer elements
      // with data('nmask-active') first, then elements marked with
      // data('nmask-hidden') (the hidden input wrapper for non-inputs).
      if (this.length > 1) {
        // Prefer explicit original marker first
        const $originalMarked = this.filter(function () {
          return $(this).data && $(this).data("nmask-original");
        }).first();
        if ($originalMarked && $originalMarked.length) {
          $first = $originalMarked;
        } else {
          const $active = this.filter(function () {
            return $(this).data && $(this).data("nmask-active");
          }).first();
          if ($active && $active.length) {
            $first = $active;
          } else {
            const $hidden = this.filter(function () {
              return $(this).data && $(this).data("nmask-hidden");
            }).first();
            if ($hidden && $hidden.length) {
              $first = $hidden;
            }
          }
        }
      }

      const $this = $first;

      // Check if element has nmask data
      if ($this.data("nmask-active")) {
        if ($this.is("input")) {
          // For input elements, return the underlying/original input value
          // (which the plugin keeps as the clean numeric value) instead of
          // the visual formatted input.
          return originalVal.call($this);
        } else {
          // For non-input elements, use custom getValue method
          const getValue = $this.data("nmask-getValue");
          return getValue ? getValue() : "";
        }
      } else {
        // Use original jQuery val method
        return originalVal.call($this);
      }
    }
  };

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

        // Find visual input by data attribute instead of ID
        const $visual = $original.data("nmask-visual");
        const $hiddenInput = $original.data("nmask-hidden");

        // Remove nmask data
        $original.removeData("nmask-active");
        $original.removeData("nmask-setValue");
        $original.removeData("nmask-getValue");
        $original.removeData("nmask-visual");
        $original.removeData("nmask-hidden");
        // Remove marker we added for original/source
        $original.removeData("nmask-original");
        try {
          $original.removeAttr && $original.removeAttr("data-nmask-original");
        } catch (e) {}

        if ($visual && $visual.length) {
          $visual.off(".nmask").remove();
        }
        if ($hiddenInput && $hiddenInput.length) {
          $hiddenInput.off(".nmask").remove();
        }

        $original.off(".nmask");

        if ($original.is("input")) {
          $original.show().css({
            opacity: "",
            width: "",
            height: "",
            border: "",
            padding: "",
            margin: "",
            minWidth: "",
            minHeight: "",
          });
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
        decPart = (decPart || "").slice(0, settings.decimalDigits);
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
      if (!val) return "";
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
      const isInput = $original.is("input");

      // Check if already initialized by looking for nmask-active data
      if ($original.data("nmask-active")) {
        return; // Skip if already initialized
      }

      // Mark element as having nmask active
      $original.data("nmask-active", true);

      // For input elements (original behavior with visual input)
      if (isInput) {
        // Auto-generate ID only if needed for input-group functionality
        let originalId = $original.attr("id");
        if (!originalId && $original.parent().hasClass("input-group")) {
          originalId = "nmask_" + Math.floor(Math.random() * 10000);
          $original.attr("id", originalId);
        }

        const inputMode = settings.decimalDigits > 0 ? "decimal" : "numeric";
        const pattern =
          settings.decimalDigits > 0 ? "[0-9]*[\\.,]?[0-9]*" : "[0-9]*";

        const $visual = $('<input type="text" autocomplete="off">')
          .addClass($original.attr("class") || "")
          .attr({ inputmode: inputMode, pattern: pattern });

        // Set ID for visual input only if original has ID
        if (originalId) {
          $visual.attr("id", originalId + "_visual");
        }

        if ($original.attr("placeholder")) {
          $visual.attr("placeholder", $original.attr("placeholder"));
        }

        ["readonly", "disabled", "required", "style"].forEach((prop) => {
          if ($original.prop(prop)) $visual.prop(prop, $original.prop(prop));
        });

        // Copy all data from original to visual (including custom data-*).
        // We'll remove internal nmask keys from the visual afterwards so
        // visual doesn't accidentally appear as the nmask source.
        $.each($original.data(), function (key, value) {
          $visual.data(key, value);
        });

        // After copying, explicitly remove internal nmask keys from the visual
        // so it won't be treated as the primary source later.
        try {
          $visual.removeData("nmask-active");
          $visual.removeData("nmask-visual");
          $visual.removeData("nmask-hidden");
          $visual.removeData("nmask-setValue");
          $visual.removeData("nmask-getValue");
        } catch (e) {
          // ignore
        }

        // Mark the original as the original/source so selection logic can
        // prefer it. Also set a dataset attribute for easier DOM inspection.
        $original.data("nmask-original", true);
        try {
          $original.attr("data-nmask-original", "true");
        } catch (e) {}

        $original.each(function () {
          const el = this;
          el.style.setProperty("opacity", "0", "important");
          el.style.setProperty("width", "0", "important");
          el.style.setProperty("height", "0", "important");
          el.style.setProperty("border", "none", "important");
          el.style.setProperty("padding", "0", "important");
          el.style.setProperty("margin", "0", "important");
          el.style.setProperty("min-width", "0", "important");
          el.style.setProperty("min-height", "0", "important");
        });
        $original.attr("tabindex", -1);

        if ($original.parent().hasClass("input-group")) {
          $visual.insertAfter($original);
          $original.insertAfter($original.parent());
        } else {
          $original.after($visual);
        }

        // Store reference to visual input in data
        $original.data("nmask-visual", $visual);

        $visual.val(formatNumber($original.val()));
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
              let originalVal =
                decPart.length > 0 ? intPart + "." + decPart : intPart;
              $original.val(originalVal);

              let visualVal;
              if (
                val.endsWith(settings.decimalSeparator) &&
                decPart.length === 0
              ) {
                visualVal = val;
              } else {
                visualVal = formatNumber(originalVal);
              }
              $(this).val(visualVal);
            } else {
              $original.val(intPart);
              $(this).val(formatNumber(intPart));
            }

            $original.trigger("input");
          } else {
            $original.val("");
            $visual.val("");
            $original.trigger("input");
          }
          $original.trigger("change");
        });

        const syncFromOriginal = () => {
          const originalVal = $original.val();
          const visualVal = $visual.val();
          const endsWithDecimalOnly =
            settings.decimalDigits > 0 &&
            visualVal &&
            visualVal.endsWith(settings.decimalSeparator);

          if (!endsWithDecimalOnly) {
            $visual.val(formatNumber(originalVal));
          }
        };

        $original.on("input.nmask change.nmask", syncFromOriginal);
      }
      // For non-input elements (display only - no ID required)
      else {
        // Create hidden input WITHOUT requiring ID
        const $hiddenInput = $('<input type="hidden">');

        // Set name attribute from data-name or generate unique name
        const nameAttr =
          $original.attr("data-name") ||
          $original.attr("name") ||
          "nmask_field_" + Math.floor(Math.random() * 10000);
        $hiddenInput.attr("name", nameAttr);

        $original.after($hiddenInput);

        // Store reference to hidden input in data
        $original.data("nmask-hidden", $hiddenInput);
        // Mark the hidden input itself so selection logic can find it if needed
        $hiddenInput.data("nmask-hidden", true);

        // Set initial value from element's text, data-value, or empty
        const initialValue =
          $original.text() || $original.attr("data-value") || "";
        const cleanInitial = cleanNumber(initialValue);
        $hiddenInput.val(cleanInitial);
        $original.text(formatNumber(cleanInitial));

        // Create setValue and getValue methods for .val() override
        const setValue = function (value) {
          const cleanVal = cleanNumber(value.toString());
          $hiddenInput.val(cleanVal);
          $original.text(formatNumber(cleanVal));
          $original.trigger("change");
          $original.trigger("nmask:change", [cleanVal]);
        };

        const getValue = function () {
          return $hiddenInput.val();
        };

        // Store methods in jQuery data for .val() override
        $original.data("nmask-setValue", setValue);
        $original.data("nmask-getValue", getValue);
      }

      // Form submit handler
      const form = $original.closest("form");
      if (form.length) {
        form.off("submit.nmask").on("submit.nmask", function () {
          if (isInput) {
            const $visual = $original.data("nmask-visual");
            if ($visual && $visual.length) {
              $original.val(cleanNumber($visual.val()));
            }
          }
          // For non-input elements, hidden input already contains clean value
        });
      }
    });
  };
})(jQuery);
