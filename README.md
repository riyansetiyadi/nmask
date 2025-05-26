# nmask

`nmask` is a lightweight jQuery plugin to format number inputs with thousands separators, decimal formatting, and optional prefixes (like currency symbols).  
**While users see a nicely formatted input, the real value stored remains a clean number, so backend systems like PHP can easily process it.**

---

## 📦 Installation

### 🔗 CDN (via jsDelivr)

```html
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/nmask"></script>
````

### 📦 npm

```bash
npm install nmask
```

---

## ✨ Usage

### HTML

```html
<form method="POST">
  <input type="number" id="price" name="price" value="1500000" />
  <button type="submit">Save</button>
</form>
```

### JavaScript

```html
<script>
  $('#price').nmask({
    thousandsSeparator: '.',
    decimalSeparator: ',',
    decimalDigits: 0,
    prefix: 'Rp '
  });
</script>
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

* The original `<input type="number">` is **hidden**, but keeps its `name` and raw numeric value
* A new visible `<input type="text">` is created for formatted interaction
* User input is masked visually while the numeric value is synced back to the hidden input
* On form submission, your backend (PHP, Node.js, etc.) receives the **clean numeric value**

---

## 🔍 Example Output

| Visual Input   | Real Value              |
| -------------- | ----------------------- |
| `Rp 1.500.000` | `1500000`               |
| `-1.234,50`    | `-1234.50` (if allowed) |

---

## ⚠️ Notes

* Only the original `number` input is submitted
* Plugin works with any existing or dynamically generated field
* Easy integration with frameworks that rely on pure numeric input (e.g. Laravel, Express, Django)

---

## 🔄 Customization

Need more control? You can call `.nmask()` on multiple inputs with different settings:

```js
$('.currency-input').nmask({
  prefix: '$ ',
  thousandsSeparator: ',',
  decimalSeparator: '.',
  decimalDigits: 2
});
```

---

## 🪪 License

**MIT License** © 2025 \ Riyan

This plugin is free to use, modify, and distribute — even for commercial projects — as long as the original license and credit remain intact. No warranties are provided; use at your own risk.

---

## 🌐 Repository

**GitHub:** [https://github.com/riyansetiyadi/nmask](https://github.com/riyansetiyadi/nmask)
**CDN:** [https://cdn.jsdelivr.net/npm/nmask](https://cdn.jsdelivr.net/npm/nmask)
**NPM:** [https://www.npmjs.com/package/nmask](https://www.npmjs.com/package/nmask)
