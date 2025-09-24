# WhatsAppButton Component

A floating WhatsApp button component designed for the Parents Madrasa Portal that provides easy access to teacher communication with full accessibility support and Malayalam language integration.

## Features

### Core Functionality

- **Deep WhatsApp Integration**: Opens WhatsApp with pre-filled messages
- **Context-Aware Messages**: 5 predefined message templates for different scenarios
- **Custom Messages**: Support for custom message content
- **Phone Number Validation**: Automatically cleans and formats phone numbers

### Accessibility (WCAG AA Compliant)

- **44px Minimum Touch Target**: Ensures easy tapping on mobile devices
- **Thumb-Zone Positioning**: Positioned in comfortable reach areas (bottom-right/bottom-left)
- **Keyboard Navigation**: Full support for Enter and Space key activation
- **Screen Reader Support**: Comprehensive ARIA labels and screen reader text
- **Focus Management**: Visible focus indicators and proper focus handling
- **High Contrast Support**: Works with high contrast themes

### Internationalization

- **Malayalam Support**: Built-in Malayalam translations for all message templates
- **Bilingual Tooltips**: Shows both English and Malayalam text in hover labels
- **Cultural Context**: Messages designed for Islamic education context

### Visual Design

- **Mobile-First**: Responsive design optimized for mobile devices
- **Pulse Animation**: Subtle attention-grabbing animation
- **Hover Effects**: Scale and shadow effects for better interaction feedback
- **Customizable Positioning**: Support for different screen positions

## Usage

### Basic Usage

```tsx
import { WhatsAppButton } from '../components/ui/WhatsAppButton';

<WhatsAppButton teacherNumber="+919876543210" context="general" />;
```

### Advanced Usage

```tsx
<WhatsAppButton
  teacherNumber="+919876543210"
  context="class_help"
  position="bottom-right"
  showLabel={true}
  malayalamLabel="ക്ലാസ് സഹായം"
  ariaLabel="Get help with today's class from teacher"
  onClick={() => console.log('WhatsApp button clicked')}
/>
```

### Custom Message

```tsx
<WhatsAppButton
  teacherNumber="+919876543210"
  message="Assalamu Alaikum, I have a specific question about the homework."
  showLabel={true}
/>
```

## Props

| Prop             | Type                                                                                  | Default                   | Description                                    |
| ---------------- | ------------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------- |
| `teacherNumber`  | `string`                                                                              | **Required**              | Teacher's phone number in international format |
| `position`       | `'bottom-right' \| 'bottom-left'`                                                     | `'bottom-right'`          | Position of the floating button                |
| `message`        | `string`                                                                              | `undefined`               | Custom message (overrides context template)    |
| `context`        | `'general' \| 'class_help' \| 'technical_support' \| 'homework_help' \| 'exam_query'` | `'general'`               | Predefined message context                     |
| `ariaLabel`      | `string`                                                                              | Auto-generated            | Custom ARIA label for accessibility            |
| `malayalamLabel` | `string`                                                                              | `undefined`               | Malayalam text for tooltips                    |
| `className`      | `string`                                                                              | `''`                      | Additional CSS classes                         |
| `showLabel`      | `boolean`                                                                             | `false`                   | Show tooltip on hover/focus                    |
| `icon`           | `React.ReactNode`                                                                     | `ChatBubbleLeftRightIcon` | Custom icon component                          |
| `onClick`        | `() => void`                                                                          | `undefined`               | Callback when button is clicked                |

## Message Templates

The component includes 5 predefined message templates:

1. **General**: "Assalamu Alaikum, I need help with my studies."
2. **Class Help**: "Assalamu Alaikum, I have a question about today's class."
3. **Technical Support**: "Assalamu Alaikum, I'm having technical issues with the portal."
4. **Homework Help**: "Assalamu Alaikum, I need help with my homework assignment."
5. **Exam Query**: "Assalamu Alaikum, I have a question about the upcoming exam."

Each template also includes Malayalam translations for screen reader support.

## Accessibility Features

### Touch Targets

- Minimum 44px touch target size (56px on mobile, 64px on desktop)
- Adequate spacing from screen edges
- Positioned in thumb-zone for comfortable one-handed use

### Keyboard Support

- Tab navigation support
- Enter and Space key activation
- Visible focus indicators
- Focus trapping when appropriate

### Screen Readers

- Descriptive ARIA labels
- Screen reader text includes message content
- Malayalam translations for bilingual users
- Proper role and state information

### Visual Accessibility

- High contrast support
- Reduced motion support
- Clear visual feedback for interactions
- Consistent with design system

## Implementation Details

### Phone Number Handling

The component automatically cleans phone numbers by removing non-digit characters (except +) and formats them for WhatsApp deep linking.

### WhatsApp Deep Linking

Uses the `wa.me` URL scheme with properly encoded message parameters:

```
https://wa.me/+919876543210?text=Assalamu%20Alaikum%2C%20I%20need%20help%20with%20my%20studies.
```

### Security

- Opens WhatsApp in a new window with `noopener,noreferrer` for security
- No sensitive data stored in component state
- Safe URL encoding for message content

## Browser Support

- Modern browsers with ES2022 support
- Mobile browsers (iOS Safari, Chrome Mobile, etc.)
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- WhatsApp Web integration

## Requirements Compliance

This component fulfills the following task requirements:

✅ **Build floating WhatsAppButton component with "Ask Teacher" functionality**
✅ **Position button in thumb-zone (bottom-right) with 44px minimum size**
✅ **Implement deep linking to WhatsApp with pre-filled teacher contact**
✅ **Add accessibility support with proper ARIA labels and focus management**
✅ **Create customizable message templates for different contexts**

### Requirements Coverage:

- **8.2**: Provides floating WhatsApp button for teacher communication
- **7.1**: Full accessibility compliance with ARIA support and 44px touch targets
- **7.4**: Mobile-first design with thumb-zone positioning
