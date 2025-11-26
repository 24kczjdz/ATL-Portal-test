# ATL Dashboard Styling System

This document outlines the comprehensive dark mode background design system used throughout the Arts Technology Lab (ATL) Dashboard application.

## 🌙 Dark Mode Background Design System

### Background Gradients

#### Primary Page Backgrounds
```css
/* Main application background */
bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900

/* Alternative page backgrounds */
bg-gradient-to-b from-primary-50 to-white dark:from-gray-800 dark:to-gray-900
bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-900
bg-gradient-to-br from-primary-50 to-accent-100 dark:from-gray-700 dark:to-gray-800

/* Section backgrounds */
bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900
```

#### Component Backgrounds
```css
/* Main content areas and cards */
bg-white dark:bg-gray-800

/* Secondary content areas */
bg-white dark:bg-gray-900

/* Form inputs and interactive elements */
bg-white dark:bg-gray-700
bg-primary-50 dark:bg-gray-700

/* Translucent backgrounds */
bg-white/90 dark:bg-gray-800/90

/* Hover states */
hover:bg-primary-50 dark:hover:bg-gray-700
hover:bg-gray-50 dark:hover:bg-gray-700
```

## 🎨 Text Color System

### Primary Text Colors
```css
/* Main headings */
text-primary-900 dark:text-white
text-3xl font-elegant text-primary-900 dark:text-white

/* Secondary headings */
text-primary-700 dark:text-gray-300
text-xl font-serif text-primary-900 dark:text-white

/* Body text */
text-primary-600 dark:text-gray-300
font-literary text-primary-600 dark:text-gray-300

/* Muted text */
text-primary-500 dark:text-gray-400
text-sm font-literary text-primary-500 dark:text-gray-400
```

### Interactive Text Colors
```css
/* Links and buttons */
text-primary-600 dark:text-primary-400
hover:text-primary-800 dark:hover:text-primary-300

/* Form labels */
text-primary-700 dark:text-gray-300

/* Navigation links */
text-primary-600 dark:text-gray-300 hover:text-primary-900 dark:hover:text-white
```

## 🔲 Border System

### Border Colors
```css
/* Primary borders */
border-primary-200 dark:border-gray-600
border-primary-300 dark:border-gray-600

/* Divider borders */
border-primary-100 dark:border-gray-600
border-t border-primary-200 dark:border-gray-600

/* Form input borders */
border border-primary-300 dark:border-gray-600
border border-gray-200 dark:border-gray-600

/* Focus states */
focus:ring-2 focus:ring-primary-500 focus:border-transparent
focus:ring-2 focus:ring-primary-500 focus:border-primary-500
```

## 📦 Component-Specific Patterns

### Navigation Components
```tsx
<nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-primary-200 dark:border-gray-700 sticky top-0 z-50">
  <Link className={`px-3 py-2 text-sm font-serif transition-colors ${
    isActive 
      ? 'text-primary-900 dark:text-white border-b-2 border-primary-900 dark:border-white' 
      : 'text-primary-600 dark:text-gray-300 hover:text-primary-900 dark:hover:text-white'
  }`}>
    Navigation Item
  </Link>
</nav>
```

### Card Components
```tsx
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft hover:shadow-lg transition-all duration-300 border border-primary-200 dark:border-gray-700">
  <div className="p-6">
    <h3 className="text-xl font-serif text-primary-900 dark:text-white mb-3">
      Card Title
    </h3>
    <p className="font-literary text-primary-600 dark:text-gray-300 mb-4 leading-relaxed">
      Card description
    </p>
  </div>
</div>
```

### Form Components
```tsx
<div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-soft border border-primary-200 dark:border-gray-600">
  <form className="space-y-6">
    <div>
      <label className="block text-sm font-serif text-primary-700 dark:text-gray-300 mb-2">
        Label
      </label>
      <input className="w-full px-3 py-2 border border-primary-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" />
    </div>
    
    <button className="w-full bg-primary-900 dark:bg-primary-800 text-white py-3 rounded-lg font-serif hover:bg-primary-800 dark:hover:bg-primary-700 transition-colors">
      Submit
    </button>
  </form>
</div>
```

### Button System
```tsx
/* Primary buttons */
<button className="bg-primary-900 dark:bg-primary-800 text-white px-6 py-3 rounded-lg font-serif hover:bg-primary-800 dark:hover:bg-primary-700 transition-colors shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5">

/* Secondary buttons */
<button className="border-2 border-primary-900 dark:border-white text-primary-900 dark:text-white px-6 py-3 rounded-lg font-serif hover:bg-primary-900 dark:hover:bg-white hover:text-white dark:hover:text-primary-900 transition-colors hover:-translate-y-0.5">

/* Ghost buttons */
<button className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors">

/* Icon buttons */
<button className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
```

## 📱 Page Layout Patterns

### Full Page Backgrounds
```tsx
/* Standard page background */
<div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900">
  {/* Page content */}
</div>

/* Alternative page background */
<div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-800 dark:to-gray-900">
  {/* Page content */}
</div>
```

### Section Backgrounds
```tsx
<section className="bg-gradient-to-b from-primary-50 to-white dark:from-gray-800 dark:to-gray-900 py-20">
  {/* Section content */}
</section>

<section className="py-20 bg-gradient-to-br from-primary-50 to-accent-100 dark:from-gray-700 dark:to-gray-800">
  {/* Section content */}
</section>
```

## 🚦 Status and Feedback Colors

### Success States
```css
/* Success backgrounds */
bg-green-50 dark:bg-green-900/30
bg-green-100 dark:bg-green-900/30

/* Success text */
text-green-800 dark:text-green-200
text-green-600 dark:text-green-400

/* Success borders */
border-green-200 dark:border-green-700
```

### Error States
```css
/* Error backgrounds */
bg-red-50 dark:bg-red-900/30
bg-red-100 dark:bg-red-900/30

/* Error text */
text-red-800 dark:text-red-200
text-red-600 dark:text-red-400

/* Error borders */
border-red-200 dark:border-red-700
```

### Warning States
```css
/* Warning backgrounds */
bg-yellow-50 dark:bg-yellow-900/30
bg-yellow-100 dark:bg-yellow-900/30

/* Warning text */
text-yellow-800 dark:text-yellow-200
text-yellow-600 dark:text-yellow-400

/* Warning borders */
border-yellow-200 dark:border-yellow-700
```

## ⚡ Interactive States

### Hover Effects
```css
/* Card hover */
hover:bg-gray-50 dark:hover:bg-gray-700
hover:shadow-lg
hover:-translate-y-0.5

/* Button hover */
hover:bg-primary-800 dark:hover:bg-primary-700
hover:bg-gray-50 dark:hover:bg-gray-700

/* Link hover */
hover:text-primary-900 dark:hover:text-white
hover:text-primary-800 dark:hover:text-primary-300
```

### Focus States
```css
/* Input focus */
focus:ring-2 focus:ring-primary-500 focus:border-primary-500
focus:ring-2 focus:ring-primary-500 focus:border-transparent

/* Button focus */
focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
```

## 📊 Data Visualization

### Table Styling
```css
/* Table headers */
bg-primary-50 dark:bg-gray-700
text-primary-900 dark:text-gray-300

/* Table rows */
bg-white dark:bg-gray-800
border-b border-primary-100 dark:border-gray-600

/* Table row hover */
hover:bg-primary-50 dark:hover:bg-gray-700

/* Table cell text */
text-primary-900 dark:text-white
text-primary-600 dark:text-gray-300
```

### Chart and Graph Colors
```css
/* Chart backgrounds */
bg-white dark:bg-gray-800
bg-primary-50 dark:bg-gray-700

/* Chart text */
text-primary-900 dark:text-white
text-primary-600 dark:text-gray-300

/* Chart borders */
border-primary-200 dark:border-gray-600
```

## 🔧 Utility Classes

### Background Utilities
```css
/* Common background patterns */
.bg-card { @apply bg-white dark:bg-gray-800; }
.bg-input { @apply bg-white dark:bg-gray-700; }
.bg-hover { @apply hover:bg-gray-50 dark:hover:bg-gray-700; }
.bg-active { @apply bg-primary-50 dark:bg-gray-700; }
```

### Text Utilities
```css
/* Common text patterns */
.text-primary { @apply text-primary-900 dark:text-white; }
.text-secondary { @apply text-primary-600 dark:text-gray-300; }
.text-muted { @apply text-primary-500 dark:text-gray-400; }
.text-interactive { @apply text-primary-600 dark:text-primary-400; }
```

### Border Utilities
```css
/* Common border patterns */
.border-primary { @apply border-primary-200 dark:border-gray-600; }
.border-input { @apply border-primary-300 dark:border-gray-600; }
.border-divider { @apply border-primary-100 dark:border-gray-600; }
```

## ♿ Accessibility Considerations

### Contrast Ratios
- Ensure all text meets WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
- Test color combinations in both light and dark modes
- Use color contrast checkers to validate accessibility

### Focus Indicators
```css
/* High contrast focus rings */
.focus-ring:focus {
  outline: 2px solid #171717;
  outline-offset: 2px;
}

.dark .focus-ring:focus {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 🎨 Typography System

### Font Families
```css
font-sans: 'Inter', system-ui, sans-serif
font-serif: 'Playfair Display', serif
font-elegant: 'Cinzel', serif
font-literary: 'Cormorant Garamond', serif
font-script: 'Dancing Script', cursive
font-signature: 'Great Vibes', cursive
```

### Text Sizing and Hierarchy
```css
/* Page titles */
text-4xl font-elegant text-primary-900 dark:text-white

/* Section headings */
text-3xl font-serif text-primary-900 dark:text-white
text-2xl font-serif text-primary-900 dark:text-white

/* Card titles */
text-xl font-serif text-primary-900 dark:text-white

/* Body text */
font-literary text-primary-600 dark:text-gray-300

/* Small text */
text-sm font-literary text-primary-500 dark:text-gray-400
```

## 🌟 Animation and Effects

### Shadow System
```css
shadow-soft: '0 2px 15px 0 rgba(0, 0, 0, 0.08)'
shadow-soft-lg: '0 10px 40px 0 rgba(0, 0, 0, 0.1)'
shadow-inner-soft: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
```

### Transitions
```css
/* Standard transitions */
transition-colors duration-300
transition-all duration-300
transition-transform duration-200

/* Hover effects */
hover:shadow-soft-lg hover:-translate-y-0.5
hover:scale-105
```

### Custom Animations
```css
animate-fade-in: 'fadeIn 0.5s ease-in-out'
animate-slide-up: 'slideUp 0.3s ease-out'
animate-slide-down: 'slideDown 0.3s ease-out'
animate-float: 'float 6s ease-in-out infinite'
animate-pulse-slow: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
```

## 📋 Implementation Checklist

### For New Components
- [ ] Use proper background gradient patterns
- [ ] Implement dark mode text colors
- [ ] Add proper border colors with dark mode
- [ ] Include hover and focus states
- [ ] Test color contrast ratios
- [ ] Verify responsive behavior
- [ ] Add appropriate transitions and animations

### For Page Updates
- [ ] Update main page background to use gradient system
- [ ] Ensure all cards follow bg-white dark:bg-gray-800 pattern
- [ ] Update text colors to follow hierarchy
- [ ] Check border colors match system
- [ ] Test in both light and dark modes
- [ ] Validate accessibility compliance

This comprehensive styling system ensures consistent, accessible, and visually appealing dark mode experiences across all components and pages while maintaining the sophisticated aesthetic of the ATL Dashboard.