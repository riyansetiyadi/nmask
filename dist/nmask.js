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
      suffix: "",
      allowNegative: false,
    };

    const escapeRegExp = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };

    if (optionsOrMethod === "destroy") {
      return this.each(function () {
        const $original = $(this);
        const $visual = $original.data("nmask-visual");
        const $hiddenInput = $original.data("nmask-hidden");

        // Restore position & remove visual
        if ($visual && $visual.length) {
          // Kembalikan original ke posisi visual input
          $original.insertBefore($visual);
          // Hapus visual input
          $visual.off(".nmask").remove();
        }

        // Remove hidden input jika ada
        if ($hiddenInput && $hiddenInput.length) {
          $hiddenInput.off(".nmask").remove();
        }

        // Cleanup data & events
        $original
          .removeData([
            "nmask-active",
            "nmask-setValue",
            "nmask-getValue",
            "nmask-visual",
            "nmask-hidden",
            "nmask-original",
          ])
          .removeAttr("data-nmask-original")
          .off(".nmask");

        // Restore styles
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

    const formatNumber = (value, preserveDecimalSeparator = false) => {
      if (!value && value !== "0") return "";
      
      let num = value.toString().replace(/[^0-9\-\.]/g, "");
      let isNegative = value.toString().startsWith("-");
      if (isNegative) num = num.substring(1);
      
      // Special handling for decimal point
      const endsWithDecimal = preserveDecimalSeparator && value.toString().endsWith(".");

      let [intPart, decPart] = num.split(".");
      intPart = intPart || "0"; // Use "0" if intPart is empty
      intPart = intPart.replace(/^0+(?=\d)/, ""); // remove leading zeros
      if (intPart === "") intPart = "0"; // Ensure at least "0" is shown
      
      intPart = intPart.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        settings.thousandsSeparator
      );

      let result = (isNegative ? "-" : "") + settings.prefix + intPart;

      if (settings.decimalDigits > 0) {
        if (preserveDecimalSeparator && value.toString().endsWith(settings.decimalSeparator)) {
          result += settings.decimalSeparator;
        } else if (decPart !== undefined) {
          decPart = (decPart || "").slice(0, settings.decimalDigits);
          if (decPart.length > 0) {
            result += settings.decimalSeparator + decPart;
          }
        }
      }

      return result + settings.suffix;
    };

    const cleanNumber = (val) => {
      if (!val) return "";

      // Remove prefix and suffix first
      if (settings.prefix) {
        val = val.replace(new RegExp(escapeRegExp(settings.prefix), "g"), "");
      }
      if (settings.suffix) {
        val = val.replace(new RegExp(escapeRegExp(settings.suffix), "g"), "");
      }

      // Remove thousand separators (only if different from decimal separator)
      if (settings.thousandsSeparator && settings.thousandsSeparator !== settings.decimalSeparator) {
        val = val.replace(
          new RegExp(escapeRegExp(settings.thousandsSeparator), "g"),
          ""
        );
      }

      // First remove any prefix/suffix to avoid interfering with decimal validation
      if (settings.prefix) {
        val = val.replace(new RegExp("^" + escapeRegExp(settings.prefix)), "");
      }
      if (settings.suffix) {
        val = val.replace(new RegExp(escapeRegExp(settings.suffix) + "$"), "");
      }

      // Create a regex that allows decimal separator (whether it's . or ,)
      const decimalRegex = new RegExp(
        `[^0-9${settings.allowNegative ? "\\-" : ""}${escapeRegExp(
          settings.decimalSeparator
        )}]`,
        "g"
      );

      // Clean the value but preserve the decimal separator
      val = val.replace(decimalRegex, "");

      // Handle multiple decimal separators - keep only the first one
      const parts = val.split(settings.decimalSeparator);
      if (parts.length > 1) {
        val = parts[0] + settings.decimalSeparator + parts.slice(1).join("");
      }

      // Convert decimal separator to dot for internal processing
      if (settings.decimalSeparator !== ".") {
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

        const $visual = $('<input type="text" autocomplete="off">')
          .addClass($original.attr("class") || "")
          .attr({ inputmode: inputMode });

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

        // Add mouseup event to handle selection
        $visual.on("mouseup.nmask", function(e) {
          const selectionStart = this.selectionStart;
          const selectionEnd = this.selectionEnd;
          const val = $(this).val();
          const prefixLen = settings.prefix ? settings.prefix.length : 0;
          const suffixLen = settings.suffix ? settings.suffix.length : 0;
          const valueEndPos = val.length - suffixLen;

          // If selection includes prefix or suffix, adjust it
          if (selectionStart < prefixLen || selectionEnd > valueEndPos) {
            const newStart = Math.max(selectionStart, prefixLen);
            const newEnd = Math.min(selectionEnd, valueEndPos);
            this.setSelectionRange(newStart, newEnd);
          }
        });

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

        const restrictCursorPosition = function(input) {
          const val = input.value;
          const cursorPos = input.selectionStart;
          const prefixLen = settings.prefix ? settings.prefix.length : 0;
          const suffixLen = settings.suffix ? settings.suffix.length : 0;
          const valueEndPos = val.length - suffixLen;

          // If cursor is in prefix area
          if (cursorPos < prefixLen) {
            input.setSelectionRange(prefixLen, prefixLen);
          }
          // If cursor is in suffix area
          else if (cursorPos > valueEndPos) {
            input.setSelectionRange(valueEndPos, valueEndPos);
          }
        };

        // Add click and keyup handlers to restrict cursor
        $visual.on("click.nmask keyup.nmask", function() {
          restrictCursorPosition(this);
        });

        $visual.on("input.nmask", function (e) {
          let val = $(this).val();
          const cursorPos = this.selectionStart;

          // Detect decimal separator related conditions early
          const justTypedDecimal = val.charAt(cursorPos - 1) === settings.decimalSeparator;
          const isTypingAfterDecimal = val.charAt(cursorPos - 2) === settings.decimalSeparator;

          let cleanVal = cleanNumber(val);
          
          // Handle empty input
          if (!cleanVal && !val) {
            $original.val("");
            $(this).val("");
            return;
          }

          // Special handling for empty input with only prefix/suffix
          if (!cleanVal && (
            (settings.suffix && val === settings.prefix + settings.suffix) ||
            (settings.prefix && val === settings.prefix)
          )) {
            $(this).val("");
            $original.val("");
            return;
          }

          if (cleanVal || cleanVal === "0") {
            let parts = cleanVal.split(".");
            let intPart = parts[0].replace(/^(-)?0+(?=\d)/, "$1") || "0";
            let decPart = parts[1] || "";

            // Save cursor position relative to the number
            const beforeCursor = val.slice(0, cursorPos);
            const cleanBefore = cleanNumber(beforeCursor);
            const relativePos = cleanBefore.length;

            let originalVal, visualVal;

            if (settings.decimalDigits > 0) {
              decPart = decPart.slice(0, settings.decimalDigits);
              
              // Handle the case where we just typed a decimal separator
              if (val.charAt(cursorPos - 1) === settings.decimalSeparator) {
                originalVal = intPart + ".";
                visualVal = formatNumber(originalVal, true);
              } else {
                originalVal = decPart.length > 0 ? intPart + "." + decPart : intPart;
                
                // Preserve decimal separator if it exists in the input
                const hasDecimal = val.includes(settings.decimalSeparator);
                visualVal = formatNumber(originalVal, hasDecimal);
              }
            } else {
              originalVal = intPart;
              visualVal = formatNumber(intPart);
            }

            // Set values
            $original.val(originalVal);
            $(this).val(visualVal);

            // Calculate new cursor position
            const newVal = $(this).val();
            const numberEndPos =
              newVal.length - (settings.suffix ? settings.suffix.length : 0);
            const prefixLen = settings.prefix ? settings.prefix.length : 0;
            const decimalIndex = newVal.indexOf(settings.decimalSeparator);

            // Detect if we just typed or are right after decimal separator
            const justTypedDecimalSeparator = val.charAt(cursorPos - 1) === settings.decimalSeparator;
            const cursorAtDecimalPosition = decimalIndex !== -1 && cursorPos === decimalIndex + 1;
            
            // If we just typed decimal or are right after it, preserve that position
            if (justTypedDecimalSeparator || cursorAtDecimalPosition) {
              const newDecimalIndex = newVal.indexOf(settings.decimalSeparator);
              if (newDecimalIndex !== -1) {
                this.setSelectionRange(newDecimalIndex + 1, newDecimalIndex + 1);
                return;
              }
            }

            // For other cases, calculate cursor position
            const isAfterDecimal = decimalIndex !== -1 && cursorPos > decimalIndex;
            
            // Ensure cursor stays within the number part
            let newPos;
            if (isAfterDecimal) {
              // Keep cursor position for decimal part
              newPos = cursorPos;
            } else {
              // Adjust position for thousands separators
              newPos = Math.min(
                prefixLen + relativePos + Math.floor(relativePos / 3),
                numberEndPos
              );
            }

            // Set cursor position
            this.setSelectionRange(newPos, newPos);

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
