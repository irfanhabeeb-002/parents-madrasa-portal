// Color contrast audit script
// This script checks WCAG AA compliance for color combinations used in the app

const colorCombinations = [
  // Primary text combinations
  {
    name: 'Primary text on white',
    foreground: '#111827',
    background: '#ffffff',
  }, // text-gray-900 on bg-white
  {
    name: 'Secondary text on white',
    foreground: '#6b7280',
    background: '#ffffff',
  }, // text-gray-500 on bg-white
  { name: 'Label text on white', foreground: '#374151', background: '#ffffff' }, // text-gray-700 on bg-white

  // Button combinations
  { name: 'Primary button', foreground: '#ffffff', background: '#2563eb' }, // white on blue-600
  { name: 'Danger button', foreground: '#ffffff', background: '#dc2626' }, // white on red-600
  { name: 'Secondary button', foreground: '#111827', background: '#e5e7eb' }, // gray-900 on gray-200

  // Navigation combinations
  { name: 'Active nav text', foreground: '#ffffff', background: '#2563eb' }, // white on blue-600
  { name: 'Inactive nav text', foreground: '#6b7280', background: '#ffffff' }, // gray-500 on white

  // Status combinations
  { name: 'Success text', foreground: '#065f46', background: '#d1fae5' }, // green-800 on green-100
  { name: 'Error text', foreground: '#991b1b', background: '#fee2e2' }, // red-800 on red-100
  { name: 'Warning text', foreground: '#92400e', background: '#fef3c7' }, // yellow-800 on yellow-100
];

// Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Calculate relative luminance
function getLuminance(rgb) {
  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio
function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(hexToRgb(color1));
  const lum2 = getLuminance(hexToRgb(color2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Check WCAG compliance
function checkWCAGCompliance(ratio) {
  return {
    AA_normal: ratio >= 4.5,
    AA_large: ratio >= 3.0,
    AAA_normal: ratio >= 7.0,
    AAA_large: ratio >= 4.5,
  };
}

// Run audit
console.warn('🎨 Color Contrast Accessibility Audit');
console.warn('=====================================\n');

const allPassed = true;

colorCombinations.forEach(combo => {
  const ratio = getContrastRatio(combo.foreground, combo.background);
  const compliance = checkWCAGCompliance(ratio);

  console.warn(`📋 ${combo.name}`);
  console.warn(`   Colors: ${combo.foreground} on ${combo.background}`);
  console.warn(`   Contrast Ratio: ${ratio.toFixed(2)}:1`);

  if (compliance.AA_normal) {
    console.warn('   ✅ WCAG AA Normal Text: PASS');
  } else {
    console.warn('   ❌ WCAG AA Normal Text: FAIL');
    allPassed = false;
  }

  if (compliance.AA_large) {
    console.warn('   ✅ WCAG AA Large Text: PASS');
  } else {
    console.warn('   ❌ WCAG AA Large Text: FAIL');
    allPassed = false;
  }

  console.warn('');
});

console.warn('📊 Summary');
console.warn('==========');
if (allPassed) {
  console.warn('✅ All color combinations meet WCAG AA standards!');
} else {
  console.warn(
    '❌ Some color combinations need improvement for WCAG AA compliance.'
  );
}

console.warn('\n🔍 Accessibility Recommendations:');
console.warn(
  '- Ensure all text meets WCAG AA contrast ratio of 4.5:1 for normal text'
);
console.warn('- Large text (18pt+ or 14pt+ bold) needs 3:1 contrast ratio');
console.warn(
  '- Consider AAA standards (7:1 for normal, 4.5:1 for large) for better accessibility'
);
console.warn('- Test with actual users who have visual impairments');
console.warn('- Use tools like axe-core for automated testing');
