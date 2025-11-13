# nmask

`nmask` is a **universal number formatting solution** with three versions to fit any project:
- **jQuery** – Classic plugin for existing projects
- **Vanilla JS** – Zero dependencies, pure JavaScript
- **ES Module** – Modern bundlers (webpack, Vite, Next.js)

Format numbers with thousands separators, decimal formatting, and optional prefixes/suffixes (like currency symbols).

**✨ Latest (v1.5.0-beta.1)**: Zero-dependency vanilla JS & ES Module support! Perfect for **React**, **Vue**, **Next.js**, **Svelte**, and any modern framework.

**Key benefit**: While users see nicely formatted numbers, the real values remain clean numbers that backend systems can easily process.

**🎮 Try it out**: [Interactive Playground](https://riyansetiyadi.github.io/nmask/playground.html) - Test different configurations in real-time!

---

## 📦 Installation & Setup

### Option 1: jQuery (Classic)
For traditional jQuery projects or existing codebases:

#### 🔗 CDN
```html
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/nmask@1.5.0-beta.1/dist/nmask.js"></script>

<input type="text" id="price">
<script>
  $('#price').nmask({ prefix: '$', decimalDigits: 2 });
</script>
```

#### 📦 npm/CommonJS
```bash
npm install nmask
```
```javascript
const $ = require('jquery');
require('nmask');

$('#price').nmask({ prefix: '$', decimalDigits: 2 });
```

---

### Option 2: Vanilla JS (Zero Dependencies)
For modern frameworks, vanilla projects, or when jQuery is not desired:

#### 🔗 CDN
```html
<input type="text" id="price">
<script src="https://cdn.jsdelivr.net/npm/nmask@1.5.0-beta.1/dist/nmask.vanilla.js"></script>
<script>
  const input = document.getElementById('price');
  nmaskify(input, { prefix: '$', decimalDigits: 2 });
</script>
```

#### 📦 npm/CommonJS
```bash
npm install nmask
```
```javascript
const { nmaskify } = require('nmask/dist/nmask.vanilla.js');

const input = document.getElementById('price');
nmaskify(input, { prefix: '$', decimalDigits: 2 });
```

---

### Option 3: ES Module (Modern Bundlers)
For **React**, **Vue**, **Next.js**, **Svelte**, **Vite**, and any ES6 module-compatible project:

#### 📦 npm
```bash
npm install nmask
```

#### React Example
```jsx
import { Nmask } from 'nmask';
import { useEffect, useRef } from 'react';

export default function PriceInput() {
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (inputRef.current) {
      const nmask = new Nmask(inputRef.current, {
        prefix: '$',
        decimalDigits: 2,
        thousandsSeparator: ','
      });
      
      return () => nmask.destroy();
    }
  }, []);
  
  return <input ref={inputRef} type="text" />;
}
```

#### Vue 3 Example
```vue
<template>
  <input ref="inputRef" type="text" />
</template>

<script setup>
import { Nmask } from 'nmask';
import { onMounted, onBeforeUnmount, ref } from 'vue';

const inputRef = ref(null);
let nmask = null;

onMounted(() => {
  nmask = new Nmask(inputRef.value, {
    prefix: '$',
    decimalDigits: 2
  });
});

onBeforeUnmount(() => {
  nmask?.destroy();
});
</script>
```

#### Next.js App Router Example (Recommended)
```jsx
'use client';  // Required for browser APIs

import { useEffect, useRef } from 'react';
import { Nmask } from 'nmask';

export default function PriceInput() {
  const inputRef = useRef(null);
  const nmaskRef = useRef(null);
  
  useEffect(() => {
    if (inputRef.current && !nmaskRef.current) {
      nmaskRef.current = new Nmask(inputRef.current, {
        prefix: '$',
        decimalDigits: 2,
        thousandsSeparator: ','
      });
    }
    
    return () => {
      nmaskRef.current?.destroy();
      nmaskRef.current = null;
    };
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanValue = nmaskRef.current.val();
    console.log('Clean value:', cleanValue);
    
    // Send to API
    await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: cleanValue })
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} type="text" name="price" placeholder="$0.00" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

#### Next.js Pages Router Example
```jsx
import { useEffect, useRef } from 'react';
import { Nmask } from 'nmask';

export default function PriceInput() {
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server
    
    const nmask = new Nmask(inputRef.current, {
      prefix: '$',
      decimalDigits: 2
    });
    
    return () => nmask.destroy();
  }, []);
  
  return <input ref={inputRef} type="text" name="price" placeholder="$0.00" />;
}
```

#### Next.js with Custom Hook (Best Practice)
```jsx
'use client';

import { useEffect, useRef } from 'react';
import { Nmask } from 'nmask';

// Reusable hook
export function useNmask(options = {}) {
  const ref = useRef(null);
  const nmaskRef = useRef(null);

  useEffect(() => {
    if (ref.current && !nmaskRef.current) {
      nmaskRef.current = new Nmask(ref.current, {
        thousandsSeparator: ',',
        decimalSeparator: '.',
        decimalDigits: 2,
        ...options
      });
    }

    return () => {
      nmaskRef.current?.destroy();
      nmaskRef.current = null;
    };
  }, [options]);

  return [ref, nmaskRef];
}

// Usage in any component
export function OrderForm() {
  const [priceRef, priceNmask] = useNmask({ prefix: '$' });
  const [taxRef, taxNmask] = useNmask({ prefix: '$' });

  return (
    <form>
      <input ref={priceRef} type="text" placeholder="$0.00" />
      <input ref={taxRef} type="text" placeholder="$0.00" />
    </form>
  );
}
```

#### Vanilla JavaScript Example
```html
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/nmask@1.5.0-beta.1/dist/nmask.esm.js" type="module"></script>
</head>
<body>
  <input type="text" id="price">
  
  <script type="module">
    import { Nmask } from 'https://cdn.jsdelivr.net/npm/nmask@1.5.0-beta.1/dist/nmask.esm.js';
    
    const input = document.getElementById('price');
    const nmask = new Nmask(input, {
      prefix: '$',
      decimalDigits: 2,
      thousandsSeparator: ','
    });
  </script>
</body>
</html>
```

---

## 📊 Version Comparison

| Feature | jQuery | Vanilla JS | ES Module |
|---------|--------|-----------|-----------|
| **Dependencies** | jQuery 3.0+ | None | None |
| **Bundle Size** | +24KB (jQuery) | ~7KB | ~6.5KB |
| **Best For** | Legacy projects | Vanilla JS, static sites | React, Vue, Next.js |
| **API** | `$().nmask()` | `nmaskify()` / class | `new Nmask()` class |
| **Installation** | CDN or npm | CDN or npm | npm + bundler |
| **SSR Support** | ❌ | ✅ | ✅ |
| **Tree-shakeable** | ❌ | ❌ | ✅ |

---

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `thousandsSeparator` | string | '.' | Character to use as thousands separator |
| `decimalSeparator` | string | ',' | Character to use as decimal separator |
| `decimalDigits` | number | 0 | Number of decimal places to show |
| `prefix` | string | '' | Text to add before the number (e.g., currency symbol) |
| `suffix` | string | '' | Text to add after the number (e.g., currency code) |
| `allowNegative` | boolean | false | Whether to allow negative numbers |

---

## 🎯 Usage Examples

### jQuery - Basic
```javascript
// Basic usage with defaults
$('#price').nmask();

// Currency with prefix
$('#price').nmask({
  prefix: '$',
  thousandsSeparator: ',',
  decimalSeparator: '.',
  decimalDigits: 2
});  // Output: $1,234.56

// Currency with prefix and suffix
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

// Indonesian Rupiah
$('#rupiah').nmask({
  prefix: 'Rp ',
  thousandsSeparator: '.',
  decimalDigits: 0
});  // Output: Rp 1.500.000
```

### Vanilla JS - Basic
```javascript
// Using the nmaskify helper function
const input = document.getElementById('price');
nmaskify(input, {
  prefix: '$',
  decimalDigits: 2,
  thousandsSeparator: ','
});

// Or using the Nmask class directly
const nmask = new Nmask(input, {
  prefix: '$',
  decimalDigits: 2
});

// Get or set values
nmask.val();        // Get clean numeric value
nmask.val(1500);    // Set and format
nmask.destroy();    // Clean up
```

### ES Module - React with Custom Hook
```jsx
import { useEffect, useRef } from 'react';
import { Nmask } from 'nmask';

// Custom hook for easier reuse
export function useNmask(options = {}) {
  const inputRef = useRef(null);
  const nmaskRef = useRef(null);
  
  useEffect(() => {
    if (inputRef.current && !nmaskRef.current) {
      nmaskRef.current = new Nmask(inputRef.current, options);
    }
    
    return () => {
      nmaskRef.current?.destroy();
      nmaskRef.current = null;
    };
  }, [options]);
  
  return inputRef;
}

// Usage
export function CurrencyInput() {
  const inputRef = useNmask({
    prefix: '$',
    decimalDigits: 2,
    thousandsSeparator: ','
  });
  
  return <input ref={inputRef} type="text" placeholder="$0.00" />;
}
```

### Display Elements (All Versions)

#### jQuery
```javascript
// Format display elements
$('.total-display').nmask({
  thousandsSeparator: '.',
  prefix: 'Rp '
});

// Update values
$('.total-display').val(3000000); // Updates display
```

#### Vanilla JS
```javascript
const display = document.querySelector('.total-display');
nmaskify(display, {
  thousandsSeparator: '.',
  prefix: 'Rp '
});

// Update value
const nmask = new Nmask(display, { prefix: 'Rp ' });
nmask.val(3000000);
```

---

## 🔄 Form Integration

### With Input Elements
```html
<form method="POST">
  <input type="text" name="price" id="price" value="1500000" />
  <button type="submit">Save</button>
</form>

<script>
  // jQuery
  $('#price').nmask({ prefix: '$', decimalDigits: 2 });
  // User sees: $1,500,000.00
  // Server receives: price=1500000
</script>
```

### With Display Elements
```html
<form method="POST">
  <div class="total-display" data-name="total_amount">1500000</div>
  <button type="submit">Save</button>
</form>

<script>
  // jQuery
  $('.total-display').nmask({ prefix: '$', decimalDigits: 2 });
  // Auto-creates: <input type="hidden" name="total_amount" value="1500000">
  // User sees: $1,500,000.00
  // Server receives: total_amount=1500000
</script>
```

---

## 🔄 Getting & Setting Values

### jQuery
```javascript
// Get value
const value = $('#price').val();  // Returns clean numeric value

// Set value
$('#price').val(2500.50);  // Updates and formats automatically
```

### Vanilla JS
```javascript
const input = document.getElementById('price');
const nmask = new Nmask(input, { prefix: '$', decimalDigits: 2 });

// Get value
const value = nmask.val();  // Returns clean numeric value

// Set value
nmask.val(2500.50);  // Updates and formats automatically
```

### ES Module (React)
```jsx
import { useRef } from 'react';
import { Nmask } from 'nmask';

export function PriceComponent() {
  const inputRef = useRef(null);
  const nmaskRef = useRef(null);
  
  const handleSetPrice = (newPrice) => {
    nmaskRef.current?.val(newPrice);
  };
  
  const handleGetPrice = () => {
    const price = nmaskRef.current?.val();
    console.log('Clean price:', price);
  };
  
  return (
    <>
      <input ref={inputRef} type="text" />
      <button onClick={() => handleSetPrice(1500)}>Set $1,500</button>
      <button onClick={handleGetPrice}>Get Value</button>
    </>
  );
}
```

---

## 🌍 Localization Examples

### US Dollar
```javascript
// jQuery
$('#price').nmask({
  prefix: '$',
  thousandsSeparator: ',',
  decimalSeparator: '.',
  decimalDigits: 2
});
// Output: $1,234.56
```

### European Format
```javascript
// jQuery
$('#price').nmask({
  prefix: '€ ',
  thousandsSeparator: '.',
  decimalSeparator: ',',
  decimalDigits: 2
});
// Output: € 1.234,56
```

### Indonesian Rupiah
```javascript
// jQuery
$('#price').nmask({
  prefix: 'Rp ',
  thousandsSeparator: '.',
  decimalDigits: 0
});
// Output: Rp 1.500.000
```

### Percentage
```javascript
// jQuery
$('#percentage').nmask({
  suffix: '%',
  decimalDigits: 1
});
// Output: 75.5%
```

### Percentage with Prefix
```javascript
// jQuery
$('#discount').nmask({
  prefix: 'Save ',
  suffix: '%',
  decimalDigits: 0
});
// Output: Save 25%
```

---

## 🚀 Advanced Features

### Allow Negative Numbers
```javascript
// jQuery
$('#amount').nmask({
  decimalDigits: 2,
  allowNegative: true
});
// Output can be: -1,234.56
```

### Multiple Elements
```javascript
// jQuery - Format all with one call
$('.currency-input, .price-display').nmask({
  prefix: '$',
  decimalDigits: 2
});
```

### Dynamic Options (jQuery)
```javascript
// Change configuration based on user selection
$('#currency-select').on('change', function() {
  const currency = $(this).val();
  const options = {
    USD: { prefix: '$', thousandsSeparator: ',', decimalSeparator: '.' },
    EUR: { prefix: '€ ', thousandsSeparator: '.', decimalSeparator: ',' },
    IDR: { prefix: 'Rp ', thousandsSeparator: '.', decimalDigits: 0 }
  };
  
  $('#price').nmask('destroy');
  $('#price').nmask(options[currency]);
});
```

---

## ❌ Cleanup & Destroy

### jQuery
```javascript
// Remove formatting and restore original behavior
$('#price').nmask('destroy');
$('.price-display').nmask('destroy');
```

### Vanilla JS
```javascript
const nmask = new Nmask(element, options);
nmask.destroy();  // Clean up all event listeners and DOM changes
```

### React
```jsx
useEffect(() => {
  const nmask = new Nmask(inputRef.current, options);
  return () => nmask.destroy();  // Cleanup on unmount
}, []);
```

---

## 🔄 Migration Guide

### From jQuery to Vanilla JS
```javascript
// Before (jQuery)
$('#price').nmask({ prefix: '$', decimalDigits: 2 });
const value = $('#price').val();

// After (Vanilla JS)
const input = document.getElementById('price');
const nmask = new Nmask(input, { prefix: '$', decimalDigits: 2 });
const value = nmask.val();

// Cleanup
// Before: $('#price').nmask('destroy');
// After: nmask.destroy();
```

### From jQuery to React (ES Module)
```jsx
// Before (jQuery)
$(document).ready(() => {
  $('#price').nmask({ prefix: '$', decimalDigits: 2 });
});

// After (React)
import { useEffect, useRef } from 'react';
import { Nmask } from 'nmask';

export default function PriceInput() {
  const inputRef = useRef(null);
  
  useEffect(() => {
    const nmask = new Nmask(inputRef.current, {
      prefix: '$',
      decimalDigits: 2
    });
    
    return () => nmask.destroy();
  }, []);
  
  return <input ref={inputRef} type="text" />;
}
```

---

## 📚 How It Works

### Input Elements:
1. Hidden original `<input type="number">` keeps raw numeric value
2. New visible `<input type="text">` displays formatted number
3. User input is masked visually, synced to hidden input
4. Form submission sends clean numeric value to backend

### Display Elements:
1. Element displays formatted number
2. Hidden input created automatically for form submission
3. Use `data-name` attribute to specify field name
4. `.val()` gets/sets the raw numeric value

---

## 🎮 Interactive Playground

Test all features in real-time: [nmask Playground](https://riyansetiyadi.github.io/nmask/playground.html)

- ✅ Multiple presets (currency, percentage, European format)
- ✅ Configurable separators and decimal digits
- ✅ Custom prefix/suffix
- ✅ Allow negative numbers toggle
- ✅ Real-time formatting preview
- ✅ Live clean value display

---

## 🤝 Compatibility

### Browsers
- ✅ Chrome 50+
- ✅ Firefox 45+
- ✅ Safari 10+
- ✅ Edge 15+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Frameworks
- ✅ React 16.0+
- ✅ Vue 2.0+ & Vue 3.0+
- ✅ Angular 2+
- ✅ Svelte
- ✅ Next.js 12+
- ✅ Vite
- ✅ Plain vanilla JavaScript
- ✅ jQuery projects (backward compatible)

### Build Tools
- ✅ webpack
- ✅ Vite
- ✅ Rollup
- ✅ TypeScript
- ✅ CommonJS
- ✅ ES Modules

---

## ⚠️ Important Notes

- **Form Submission**: Only clean numeric values are sent to the backend
- **Display Elements**: Automatically creates hidden inputs for form integration
- **Backward Compatible**: All existing jQuery code continues to work
- **No jQuery Required**: Vanilla JS and ES Module versions are completely independent
- **Multiple Instances**: Each element can have independent formatting options
- **Dynamic Updates**: Use `.val()` to update formatted values in real-time

---

## 🪪 License

**MIT License** © 2025 Riyan Setiyadi

This plugin is free to use, modify, and distribute — even for commercial projects — as long as the original license and credit remain intact. No warranties are provided; use at your own risk.

---

## 🔗 Links

| Link | URL |
|------|-----|
| **GitHub** | [github.com/riyansetiyadi/nmask](https://github.com/riyansetiyadi/nmask) |
| **Playground** | [playground.html](https://riyansetiyadi.github.io/nmask/playground.html) |
| **NPM Package** | [npmjs.com/package/nmask](https://www.npmjs.com/package/nmask) |
| **CDN** | [cdn.jsdelivr.net/npm/nmask](https://cdn.jsdelivr.net/npm/nmask) |

---

## 📖 Support & Contributing

Found a bug? Have a feature request? Visit the [GitHub Issues](https://github.com/riyansetiyadi/nmask/issues) page.

Contributions are welcome! Please feel free to submit a Pull Request.
