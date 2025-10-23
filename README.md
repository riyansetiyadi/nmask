# nmask

`nmask` is a lightweight jQuery plugin for **universal number formatting** that works with both input elements and display elements. Format numbers with thousands separators, decimal formatting, and optional prefixes (like currency symbols).  

**✨ Latest**: Now supports formatting numbers in **any HTML element** (`<div>`, `<span>`, etc.) while maintaining full backward compatibility!

**Key benefit**: While users see nicely formatted numbers, the real values remain clean numbers that backend systems can easily process.

---

## 📦 Installation

### 🔗 CDN (via jsDelivr)

```html
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/nmask/dist/nmask.js"></script>
````

### 📦 npm

```bash
npm install nmask
```

---

## ✨ Usage

### 🎯 Input Elements (Original Functionality)

```html
<form method="POST">
  <input type="number" id="price" name="price" value="1500000" />
  <button type="submit">Save</button>
</form>

<script>
  $('#price').nmask({
    thousandsSeparator: '.',
    decimalSeparator: ',',
    decimalDigits: 0,
    prefix: 'Rp ',
    suffix: ' IDR'  // New suffix option!
  });
</script>
```

## 🛠️ Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `thousandsSeparator` | string | '.' | Character to use as thousands separator |
| `decimalSeparator` | string | ',' | Character to use as decimal separator |
| `decimalDigits` | number | 0 | Number of decimal places to show |
| `prefix` | string | '' | Text to add before the number (e.g., currency symbol) |
| `suffix` | string | '' | Text to add after the number (e.g., currency code) |
| `allowNegative` | boolean | false | Whether to allow negative numbers |

### � Examples

```javascript
// Basic usage
$('#price').nmask();  // Uses default options

// Currency with prefix only
$('#price').nmask({
  prefix: '$',
  thousandsSeparator: ',',
  decimalSeparator: '.',
  decimalDigits: 2
});  // Output: $1,234.56

// Currency with both prefix and suffix
$('#amount').nmask({
  prefix: '€',
  suffix: ' EUR',
  thousandsSeparator: '.',
  decimalSeparator: ',',
  decimalDigits: 2
});  // Output: €1.234,56 EUR

// Percentage with suffix
$('#percentage').nmask({
  suffix: '%',
  decimalDigits: 1
});  // Output: 75.5%
```

### 🎨 Display Elements

```html
<!-- Format numbers in display elements -->
<div class="total-display" data-name="formatted_total">1500000</div>
<span class="price-tag">2500.50</span>

<script>
  // Format display elements
  $('.total-display').nmask({
    thousandsSeparator: '.',
    prefix: 'Rp '
  });
  
  $('.price-tag').nmask({
    thousandsSeparator: ',',
    decimalSeparator: '.',
    decimalDigits: 2,
    prefix: '$'
  });
  
  // Use .val() on any masked element!
  $('.total-display').val(3000000); // Updates display AND hidden form field
  $('.price-tag').val(1299.99);
</script>
```

### Multiple Elements with Same Setup

```javascript
// Apply same formatting to multiple elements
$('.total-display, .credit, .debit').nmask({
  prefix: 'Rp ',
  thousandsSeparator: '.',
  decimalSeparator: ',',
  decimalDigits: 0
});
```

---

## ⚙️ Configuration Options

| Option               | Type      | Default | Description                           |
| -------------------- | --------- | ------- | ------------------------------------- |
| `thousandsSeparator` | `string`  | `.`     | Character used as thousands separator |
| `decimalSeparator`   | `string`  | `,`     | Character used as decimal separator   |
| `decimalDigits`      | `number`  | `0`     | Number of decimal places to show      |
| `prefix`             | `string`  | `''`    | Text prefix (e.g. `'Rp '` or `'$'`)   |
| `allowNegative`      | `boolean` | `false` | Allow negative values                 |

---

## 🧠 How It Works

### For Input Elements:
* The original `<input type="number">` is **hidden**, but keeps its `name` and raw numeric value
* A new visible `<input type="text">` is created for formatted interaction
* User input is masked visually while the numeric value is synced back to the hidden input
* On form submission, your backend receives the **clean numeric value**

### For Display Elements:
* The element displays the **formatted number** (e.g., "Rp 1.500.000")
* A **hidden input** is automatically created for form submission
* Use `data-name` attribute to specify the field name, or one will be auto-generated
* Use `.val()` to get/set the raw numeric value programmatically

---

## 🔍 Example Output

### Input Elements
| Visual Input   | Real Value              | Submitted Value |
| -------------- | ----------------------- | --------------- |
| `Rp 1.500.000` | `1500000`               | `1500000`       |
| `-1.234,50`    | `-1234.50` (if allowed) | `-1234.50`      |

### Display Elements
| Display Text   | `.val()` Returns | Hidden Input Value |
| -------------- | ---------------- | ------------------ |
| `Rp 1.500.000` | `1500000`        | `1500000`          |
| `$1,234.50`    | `1234.50`        | `1234.50`          |

---

## Universal .val() Support

nmask overrides jQuery's `.val()` method to work seamlessly with both input and display elements:

```javascript
// Works on inputs (existing behavior)
$('#price-input').val(15000);
console.log($('#price-input').val()); // "15000"

// Now works on display elements too!
$('.price-display').val(25000);
console.log($('.price-display').val()); // "25000"
console.log($('.price-display').text()); // "Rp 25.000" (formatted display)
```

---

## 🔄 Form Integration

### Input Elements
```html
<form method="POST">
  <input type="number" name="price" id="price" />
</form>
<!-- Submits: price=1500000 -->
```

### Display Elements
```html
<form method="POST">
  <div class="total" data-name="total_amount">1500000</div>
</form>
<!-- Auto-creates: <input type="hidden" name="total_amount" value="1500000"> -->
```

---

## 🔄 Dynamic Updates & Synchronization

### Recommended Approach
```javascript
// Universal - works for both input and display elements
$('#myInput').val(15000);        // Automatically syncs
$('.myDisplay').val(25000);      // Automatically syncs
```

### Legacy Approach
```javascript
// Still works, but .val() method above is preferred
$('#myInput').val(15000).trigger('change');
```

---

## 🔄 Multiple Element Formatting

```javascript
// Format all currency inputs
$('.currency-input').nmask({
  prefix: '$ ',
  thousandsSeparator: ',',
  decimalSeparator: '.',
  decimalDigits: 2
});

// Format display elements
$('.price-display').nmask({
  prefix: 'Rp ',
  thousandsSeparator: '.',
  decimalDigits: 0
});

// Mix and match
$('.financial-number').nmask({
  thousandsSeparator: ',',
  decimalDigits: 2,
  allowNegative: true
});
```

---

## 🎯 Use Cases

### Traditional (Input Elements)
- ✅ Form inputs for prices, quantities, amounts
- ✅ User data entry with validation
- ✅ E-commerce checkout forms

### Display Elements (New Feature)
- ✅ Dashboard number displays
- ✅ Report summaries and totals  
- ✅ Real-time calculated values
- ✅ Read-only formatted numbers that still submit to forms
- ✅ Interactive displays that can be updated via JavaScript

---

## ❌ Destroy

Remove the plugin behavior and restore original state:

```javascript
// For input elements
$('input[name="price"]').nmask('destroy');

// For display elements  
$('.price-display').nmask('destroy');
```

This will:
* Remove visual/hidden input elements
* Restore original element visibility and styling
* Clean up all event listeners and data attributes
* Stop internal observers

---

## Migration & Compatibility

**✅ Fully backward compatible!** All existing code continues to work unchanged.

### Latest Features:
- ✨ Support for non-input elements (`<div>`, `<span>`, etc.)
- ✨ Universal `.val()` method override
- ✨ Automatic hidden input creation for forms
- ✨ `data-name` attribute support
- 🔧 Improved element tracking and cleanup
- 🔧 Enhanced destroy method

### Breaking Changes:
**None!** Complete backward compatibility maintained.

---

## ⚠️ Notes

* For input elements: Only the original numeric input is submitted
* For display elements: Hidden input with clean numeric value is submitted  
* Plugin works with existing and dynamically generated elements
* Easy integration with any backend framework (Laravel, Express, Django, etc.)
* Supports Bootstrap input-group components

---

## 🪪 License

**MIT License** © 2025 Riyan Setiyadi

This plugin is free to use, modify, and distribute — even for commercial projects — as long as the original license and credit remain intact. No warranties are provided; use at your own risk.

---

## 🌐 Repository

**GitHub:** [https://github.com/riyansetiyadi/nmask](https://github.com/riyansetiyadi/nmask)  
**CDN:** [https://cdn.jsdelivr.net/npm/nmask](https://cdn.jsdelivr.net/npm/nmask)  
**NPM:** [https://www.npmjs.com/package/nmask](https://www.npmjs.com/package/nmask)