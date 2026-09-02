# Glassmorphism UI Transformation Design

## Overview

This design document outlines the comprehensive architecture for implementing glassmorphism UI design principles throughout the PKKMB 2026 attendance system. The transformation enhances visual appeal while maintaining all existing functionality through modern CSS techniques including backdrop-filter blur effects, translucent backgrounds, layered shadows, and smooth transitions.

## System Architecture

### Core Glassmorphism Design System

The glassmorphism implementation follows a systematic approach with three foundational layers:

1. **Background Layer**: Maintains existing gradient backgrounds and brand colors
2. **Glass Layer**: Implements translucent overlays with blur effects  
3. **Content Layer**: Preserves all functional elements with enhanced styling

### CSS Architecture Structure

```
glassmorphism-system/
├── core/
│   ├── variables.css       # Glass effect variables and fallbacks
│   ├── mixins.css         # Reusable glassmorphism mixins
│   └── utilities.css      # Utility classes for glass effects
├── components/
│   ├── glass-card.css     # Main glass card component
│   ├── glass-button.css   # Interactive element styling
│   ├── glass-modal.css    # Modal and dialog styling
│   ├── glass-nav.css      # Navigation component styling
│   └── glass-form.css     # Form element styling
├── layouts/
│   ├── landing.css        # Landing page glass layout
│   ├── dashboard.css      # Dashboard glass layout
│   └── scanner.css        # Scanner interface layout
└── responsive/
    ├── mobile.css         # Mobile glass optimizations
    ├── tablet.css         # Tablet glass adaptations
    └── desktop.css        # Desktop glass enhancements
```

## Component Design Specifications

### Glass Card Component

The Glass Card is the foundational component implementing core glassmorphism principles:

**Visual Properties:**
- Background: `rgba(255, 255, 255, 0.12)` (12% opacity base)
- Backdrop Filter: `blur(14px) saturate(180%)`
- Border: `1px solid rgba(255, 255, 255, 0.2)`
- Box Shadow: Multiple layered shadows for depth perception
- Border Radius: `16px` for modern curved aesthetics

**CSS Implementation:**
```css
.glass-card {
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(14px) saturate(180%);
    -webkit-backdrop-filter: blur(14px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    box-shadow: 
        0 8px 32px rgba(31, 38, 135, 0.37),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Interactive Element Styling

Buttons and interactive elements implement glassmorphism with enhanced feedback states:

**Base State Properties:**
- Background: `rgba(255, 255, 255, 0.15)`
- Backdrop Filter: `blur(10px)`
- Transition Duration: `250ms`
- Transform: Subtle scale on hover

**Hover State Enhancements:**
- Background opacity increases to 25%
- Backdrop blur increases to 16px
- Scale transform: `scale(1.02)`
- Additional glow effect
### Navigation Bar Glass Implementation

The navigation bar implements glassmorphism while maintaining sticky positioning and responsive behavior:

**Technical Specifications:**
- Position: `sticky` with `top: 0` and `z-index: 1000`
- Background: `rgba(255, 255, 255, 0.2)` over existing gradient
- Backdrop Filter: `blur(12px) saturate(160%)`
- Height: Maintains existing responsive heights
- Support: Includes fallbacks for non-supporting browsers

**Responsive Adaptations:**
- Mobile: Reduced blur to `8px` for performance optimization
- Tablet: Standard blur with touch-optimized spacing
- Desktop: Enhanced blur with additional visual effects

### Modal and Dialog Glass Styling

Modals implement full glassmorphism with layered visual hierarchy:

**Modal Backdrop:**
- Background: `rgba(0, 0, 0, 0.4)` with blur backdrop
- Backdrop Filter: `blur(8px)`
- Supports click-outside-to-close with glass transition

**Modal Content:**
- Background: `rgba(255, 255, 255, 0.18)` (higher opacity for readability)
- Backdrop Filter: `blur(16px) saturate(200%)`
- Multiple shadow layers for floating effect
- Entrance animation with scale and opacity transitions

### Form Element Glass Integration

Form elements maintain functionality while adding glassmorphism aesthetics:

**Input Field Styling:**
- Background: `rgba(255, 255, 255, 0.1)`
- Border: `1px solid rgba(255, 255, 255, 0.3)`
- Backdrop Filter: `blur(6px)` (reduced for text clarity)
- Focus state: Enhanced border glow and backdrop saturation

**Form Container:**
- Implements Glass Card base styling
- Error states maintain glass effects with color overlays
- Success states use subtle green tint overlay
- Validation messages styled with matching glass effects

## Layout-Specific Implementations

### Landing Page Transformation

The landing page receives comprehensive glassmorphism treatment:

**Main Card Container:**
- Transform existing card to Glass Card component
- Background: `rgba(255, 255, 255, 0.15)` (15% opacity as specified)
- Backdrop Filter: `blur(15px)` exact specification
- Maintains center positioning with enhanced visual impact

**Logo Container Styling:**
- Background: `rgba(255, 255, 255, 0.08)`
- Backdrop Filter: `blur(5px)` subtle effect
- Preserves logo prominence with glass enhancement

**Authentication Buttons:**
- Primary button: Gradient background with glass overlay
- Secondary button: Full glassmorphism implementation
- Hover states: Enhanced opacity and blur effects
### Dashboard Interface Enhancement

Dashboard interfaces receive comprehensive glassmorphism upgrades:

**Card Component Transformation:**
- All cards convert to Glass Card base styling
- Background opacity: `rgba(255, 255, 255, 0.12)` (12% as specified)
- Backdrop Filter: `blur(14px)` for all content containers
- Maintains existing card functionality with enhanced aesthetics

**Profile Information Cards:**
- Enhanced glassmorphism with gradient border effects
- Background: `rgba(255, 255, 255, 0.16)` (higher opacity for importance)
- Additional shadow layers for prominence
- Animated hover effects with increased translucency

**Statistics and Data Containers:**
- Translucent backgrounds with subtle shadow layering
- Maintains data visualization clarity
- Glass effects complement rather than obscure data
- Responsive scaling preserves readability

### Scanner Interface Glass Integration

QR scanner interface implements glassmorphism while maintaining camera functionality:

**Scanner Overlay:**
- Semi-transparent glass overlay with `rgba(0, 0, 0, 0.3)`
- Backdrop Filter: `blur(4px)` (reduced to maintain camera clarity)
- Corner frame elements with glass styling
- Maintains scanner detection accuracy

**Control Elements:**
- Buttons and controls use standard glass button styling
- Scanner instructions in glass-styled text containers
- Result dialogs implement full modal glassmorphism
- Camera viewfinder preserves clarity with minimal glass effects

**Performance Considerations:**
- Optimized blur levels for mobile camera performance
- Fallback styling for devices with limited GPU capabilities
- Maintains 30fps minimum for camera feed

## Data Display Glass Enhancement

### Table and List Styling

Tables and data displays receive glassmorphism while preserving functionality:

**Table Container:**
- Transform to Glass Card component base
- Background: `rgba(255, 255, 255, 0.1)`
- Maintains existing responsive table behavior
- Scrollable areas preserve glass effects

**Table Header Styling:**
- Enhanced visual separation with subtle glassmorphism
- Background: `rgba(255, 255, 255, 0.15)`
- Border bottom with glass-tinted separator
- Sticky header maintains glass effects during scroll

**Row Interaction Effects:**
- Hover states: Increased translucency to `rgba(255, 255, 255, 0.2)`
- Selected states: Enhanced opacity and subtle blur increase
- Maintains existing sorting and filtering functionality
- Touch-friendly hover effects for mobile devices

### Filter and Control Styling

Data filters and controls implement consistent glassmorphism:

**Filter Containers:**
- Glass Card base styling with reduced opacity
- Background: `rgba(255, 255, 255, 0.08)`
- Maintains filter functionality with enhanced aesthetics
- Responsive collapse behavior preserves glass effects
## Responsive Design Implementation

### Mobile Optimizations

Mobile devices receive performance-optimized glassmorphism:

**Blur Optimization:**
- Reduced backdrop-filter values: `blur(8px)` maximum
- Hardware acceleration with `transform3d(0,0,0)`
- Conditional glass effects based on device capabilities
- Battery-conscious implementation with reduced animation complexity

**Touch Interface Enhancements:**
- Minimum touch target size: 44px with glass styling
- Enhanced feedback on touch with subtle scale animations
- Swipe gesture compatibility with glass overlay effects
- Maintains accessibility with proper focus indicators

**Viewport Adaptations:**
- Glass effect proportions scale with viewport size
- Text remains readable across all mobile screen sizes  
- Navigation elements maintain functionality with glass enhancement
- Orientation change preserves glass effect integrity

### Tablet Adaptations

Tablet interfaces balance desktop richness with mobile performance:

**Medium-Range Glass Effects:**
- Backdrop Filter: `blur(12px)` balanced for performance and aesthetics
- Enhanced interactive areas optimized for touch input
- Hybrid navigation supporting both touch and precision input
- Glass effect scaling adapts to tablet orientation changes

### Desktop Enhancements

Desktop interfaces implement full glassmorphism capabilities:

**Maximum Glass Effects:**
- Backdrop Filter: `blur(20px)` maximum for rich visual depth
- Complex shadow layering for enhanced depth perception
- Hover effects with smooth transitions and enhanced feedback
- Multi-layered glass effects for visual hierarchy

**Advanced Interactions:**
- Subtle parallax effects with glass layers
- Enhanced focus states for keyboard navigation
- Detailed hover animations with glass property changes
- Support for high-resolution displays with crisp glass effects

## Browser Compatibility and Fallbacks

### Modern Browser Support

Browsers with full backdrop-filter support receive complete glassmorphism:

**Supported Features:**
- Chrome 76+, Safari 9+, Firefox 103+, Edge 79+
- Full backdrop-filter blur and saturation effects
- Hardware-accelerated rendering for smooth performance
- Advanced CSS effects including multiple shadow layers

### Legacy Browser Fallbacks

Browsers without backdrop-filter support receive alternative styling:

**Fallback Strategy:**
- CSS feature detection using `@supports` queries
- Alternative opacity and shadow-based glass effects
- Gradient overlays to simulate frosted glass appearance
- Maintains visual hierarchy without backdrop-filter dependency

**Fallback Implementation:**
```css
@supports not (backdrop-filter: blur(1px)) {
    .glass-card {
        background: rgba(255, 255, 255, 0.25);
        box-shadow: 
            0 8px 32px rgba(31, 38, 135, 0.37),
            inset 0 1px 0 rgba(255, 255, 255, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.3);
    }
}
```
## Performance and Accessibility

### Performance Optimization

Glassmorphism implementation prioritizes smooth performance:

**GPU Acceleration:**
- All glass effects utilize hardware acceleration
- Transform3d optimization for blur effects
- Composite layers for smooth animations
- 60fps target maintained across all glass interactions

**Resource Management:**
- Conditional glass effects based on device capabilities
- Reduced complexity for lower-end devices
- Battery usage optimization through efficient CSS properties
- Memory-conscious shadow and blur implementations

### Accessibility Compliance

Glassmorphism maintains accessibility standards:

**Contrast Requirements:**
- Minimum 4.5:1 contrast ratio maintained across all text
- Glass overlay opacity adjusted to preserve readability
- Alternative color schemes for high contrast preferences
- Focus indicators enhanced rather than obscured by glass effects

**Motion Preferences:**
- Respects `prefers-reduced-motion` user preferences
- Disables glass transitions for motion-sensitive users
- Alternative static glass effects for reduced motion
- Maintains glassmorphism aesthetics without animation

**Keyboard Navigation:**
- Enhanced focus states with glass effect highlights
- Visible focus indicators on all interactive glass elements
- Logical tab order preserved with glass enhancements
- Screen reader compatibility maintained

## Brand Identity Integration

### Color Palette Preservation

Glassmorphism enhances rather than replaces existing brand identity:

**University Green Gradients:**
- Background gradients maintain original colors (#1a6b3c, #2d9e5f, #10b981)
- Glass overlays enhance color depth and saturation
- Brand colors remain prominent through translucent layers
- Gradient direction and stops preserved with glass enhancement

**Logo Integration:**
- University and PKKMB logos maintain prominence
- Glass effects complement logo presentation
- Background combinations optimize logo visibility
- Brand recognition preserved and enhanced through glass styling

### Institutional Branding

Glass effects reinforce rather than compete with institutional identity:

**Professional Appearance:**
- Glassmorphism adds sophistication to academic branding
- Modern aesthetic aligns with contemporary university presentation
- Professional polish enhances institutional credibility
- Visual hierarchy emphasizes important institutional elements

## Animation and Transition System

### Transition Specifications

All glassmorphism changes implement smooth, consistent transitions:

**Standard Transition Properties:**
- Duration: 200ms to 300ms as specified in requirements
- Timing Function: `cubic-bezier(0.4, 0, 0.2, 1)` for natural motion
- Properties: opacity, backdrop-filter, transform, box-shadow
- Performance: Hardware-accelerated transitions for smoothness

**State Change Animations:**
- Hover states: 250ms transition duration
- Focus states: 200ms for immediate feedback
- Modal entrance: 300ms with scale and opacity
- Page transitions: Subtle glass effect changes during navigation

### Interactive Feedback

Glass elements provide clear interactive feedback:

**Hover Effects:**
- Opacity increase: 5-10% additional transparency
- Blur enhancement: 2-4px additional backdrop blur
- Scale transform: `scale(1.02)` subtle enlargement
- Glow effects: Additional shadow layers for prominence

**Active States:**
- Temporary opacity reduction for press feedback
- Scale transform: `scale(0.98)` subtle depression
- Enhanced border visibility during active state
- Quick transition return to normal state
## Error Handling and Edge Cases

### Browser Support Detection

The system gracefully handles varying browser capabilities:

**Feature Detection:**
- CSS `@supports` queries detect backdrop-filter availability
- JavaScript detection for advanced glass features
- Progressive enhancement from basic to full glassmorphism
- Graceful degradation for unsupported browsers

**Fallback Chain:**
1. Full glassmorphism (modern browsers)
2. Opacity-based glass effects (limited backdrop-filter support)
3. Enhanced shadows and borders (no glass support)
4. Standard styling (minimal CSS support)

### Performance Edge Cases

System handles performance limitations gracefully:

**Low-Performance Devices:**
- Automatic detection of GPU capabilities
- Reduced glass effect complexity for weaker devices
- Alternative styling maintains visual hierarchy
- Battery usage optimization for mobile devices

**High-Load Scenarios:**
- Glass effects gracefully degrade under system stress
- Maintains functionality while reducing visual complexity
- Smooth fallback to simpler styling when needed
- Quick recovery when system performance improves

### Accessibility Edge Cases

Glass effects accommodate diverse user needs:

**Vision Impairments:**
- High contrast mode compatibility with glass effects
- Alternative color schemes for color-blind users
- Magnification compatibility with glass element scaling
- Screen reader navigation preserved through glass overlays

**Motor Impairments:**
- Large touch targets maintained with glass styling
- Enhanced focus indicators for keyboard navigation
- Reduced motion alternatives for motion-sensitive users
- Voice control compatibility with glass interface elements

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

**CSS Architecture Setup:**
- Implement CSS custom properties for glass effects
- Create base glass mixins and utility classes
- Set up responsive breakpoint system for glass effects
- Implement browser detection and fallback system

**Base Component Creation:**
- Glass Card component implementation
- Glass Button component with interactive states
- Basic glass form elements
- Navigation bar glass enhancement

### Phase 2: Layout Integration (Week 3-4)

**Page-Level Implementation:**
- Landing page glassmorphism transformation
- Dashboard interface glass enhancement
- Modal and dialog glass styling
- Table and data display glass effects

**Responsive Optimization:**
- Mobile performance optimization
- Tablet adaptation implementation
- Desktop enhancement features
- Cross-device testing and refinement

### Phase 3: Advanced Features (Week 5-6)

**Interactive Elements:**
- Advanced hover and focus effects
- Animation system implementation
- Transition timing optimization
- Complex glass effect combinations

**Accessibility and Performance:**
- Accessibility compliance verification
- Performance optimization across devices
- Browser compatibility testing
- Edge case handling implementation

## Testing Strategy

### Visual Regression Testing

Glassmorphism changes require comprehensive visual verification:

**Cross-Browser Testing:**
- Chrome, Safari, Firefox, Edge compatibility verification
- Mobile browser testing for glass effect performance
- Progressive enhancement validation
- Fallback styling verification

**Device Testing:**
- Mobile device performance validation
- Tablet interface functionality
- Desktop enhancement verification
- High-DPI display compatibility

### Performance Testing

Glass effects require performance validation:

**Rendering Performance:**
- 60fps animation verification
- GPU usage monitoring
- Battery impact assessment
- Memory usage optimization

**Load Testing:**
- Glass effect performance under system stress
- Graceful degradation validation
- Recovery performance testing
- Resource usage monitoring
## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After reviewing all properties identified in the prework analysis, several patterns emerged that allowed for consolidation. Properties testing similar aspects across different components were combined into comprehensive universal statements. For example, multiple properties testing opacity ranges, blur values, and styling consistency were consolidated into single properties that validate these aspects system-wide.

### Property 1: Backdrop Filter Blur Range Validation

For any primary interface element in the Glassmorphism_System, the applied backdrop-filter blur value SHALL be within the range of 10px to 20px inclusive.

**Validates: Requirements 1.1**

### Property 2: Translucent Background Opacity Compliance

For any glass element in the Glassmorphism_System, the background rgba color SHALL have an alpha value between 0.1 and 0.3 inclusive.

**Validates: Requirements 1.2**

### Property 3: Glass Border Styling Consistency

For any glass element with border styling, the border property SHALL be exactly "1px solid rgba(255, 255, 255, 0.2)".

**Validates: Requirements 1.3**

### Property 4: Multi-layered Shadow Implementation

For any Glass_Card component, the box-shadow property SHALL contain multiple shadow layers to create depth perception effects.

**Validates: Requirements 1.4**

### Property 5: Brand Color Palette Preservation

For any element displaying institutional colors, the underlying gradient SHALL maintain the exact color values #1a6b3c, #2d9e5f, and #10b981.

**Validates: Requirements 1.5, 11.2, 11.4**

### Property 6: Dashboard Card Opacity Specification

For any card component in the Dashboard_Interface, the background opacity SHALL be exactly 12% (rgba alpha value of 0.12).

**Validates: Requirements 4.1**

### Property 7: Content Container Blur Uniformity

For any content container in the Dashboard_Interface, the backdrop-filter blur value SHALL be exactly 14px.

**Validates: Requirements 4.2**

### Property 8: Form Element Glass Styling Consistency

For any form input element in a Form_Container, the element SHALL have both translucent background and glass-effect borders applied.

**Validates: Requirements 5.2**

### Property 9: Form State Glass Preservation

For any form element in any validation state (error, success, normal), the glassmorphism styling properties SHALL be maintained while displaying the appropriate state indicators.

**Validates: Requirements 5.4**

### Property 10: Interactive Element Glass Implementation

For any button or interactive element, the element SHALL have both translucent background and subtle glass borders applied consistently.

**Validates: Requirements 6.1**

### Property 11: Hover State Enhancement Behavior

For any interactive element, hovering SHALL increase the background opacity and enhance the blur effects beyond the base state values.

**Validates: Requirements 6.2**

### Property 12: Interactive Element Functional Preservation

For any button or interactive element with glassmorphism styling, the original functionality SHALL be preserved and operate correctly.

**Validates: Requirements 6.3**

### Property 13: Disabled State Glass Compliance

For any interactive element in disabled state, the opacity SHALL be exactly 50% while maintaining all glass effects.

**Validates: Requirements 6.4**

### Property 14: Link Element Glass Consistency

For any link element, subtle glassmorphism enhancements SHALL be applied for visual consistency with other interactive elements.

**Validates: Requirements 6.5**

### Property 15: Table Container Glass Transformation

For any table container, the element SHALL be transformed into a Glass_Card component with translucent background properties.

**Validates: Requirements 8.1**

### Property 16: Table Header Glass Enhancement

For any table header element, glassmorphism effects SHALL be applied with enhanced visual separation from table body content.

**Validates: Requirements 8.2**

### Property 17: Table Row Hover Glass Effects

For any table row, hovering SHALL increase translucency and add subtle blur effects while maintaining readability.

**Validates: Requirements 8.3**

### Property 18: Data Filter Glass Consistency

For any data filter or control element, glassmorphism styling SHALL be implemented consistently across all filter components.

**Validates: Requirements 8.4**

### Property 19: Table Functionality Preservation

For any table with glassmorphism enhancements, existing functionality including sorting and filtering SHALL continue to operate correctly.

**Validates: Requirements 8.5**

### Property 20: Cross-Device Glass Effect Maintenance

For any glassmorphism effect, the visual styling SHALL be maintained consistently across mobile, tablet, and desktop screen sizes.

**Validates: Requirements 9.1**

### Property 21: Mobile Blur Optimization

For any glassmorphism effect on mobile devices, the blur intensity SHALL be adjusted to ensure optimal performance while maintaining visual appeal.

**Validates: Requirements 9.2**

### Property 22: Screen Size Glass Hierarchy Preservation

For any screen size change, the glassmorphism visual hierarchy SHALL be preserved with appropriate proportional scaling.

**Validates: Requirements 9.3, 9.4**

### Property 23: Mobile Touch Element Glass Compatibility

For any interactive element on mobile devices, touch-friendly sizing SHALL be maintained while preserving glassmorphism styling.

**Validates: Requirements 9.5**

### Property 24: Browser Fallback Implementation

For any browser without backdrop-filter support, appropriate CSS fallbacks SHALL be provided to maintain visual hierarchy.

**Validates: Requirements 10.1, 10.3, 10.4**

### Property 25: Performance Optimization Compliance

For any modern device, glassmorphism effects SHALL maintain 60fps performance during all animations and interactions.

**Validates: Requirements 10.2**

### Property 26: Accessibility Standards Maintenance

For any glassmorphism element, accessibility standards including contrast ratios and focus indicators SHALL be maintained at required levels.

**Validates: Requirements 10.5**

### Property 27: Logo Visibility Optimization

For any logo display with glass effects and background combinations, optimal visibility SHALL be maintained through appropriate styling adjustments.

**Validates: Requirements 11.5**

### Property 28: CSS Transition Duration Compliance

For any glass effect change, the CSS transition duration SHALL be between 200ms and 300ms inclusive.

**Validates: Requirements 12.1**

### Property 29: State Change Animation Smoothness

For any element state change (hover, focus, active), opacity and blur changes SHALL animate smoothly without jarring visual effects.

**Validates: Requirements 12.2, 12.4**

### Property 30: Reduced Motion Accessibility Compliance

For any user with reduced motion preferences enabled, glassmorphism animations SHALL be disabled or reduced appropriately to respect accessibility requirements.

**Validates: Requirements 12.5**

## Dependencies and Integration Points

### External Dependencies

Glassmorphism implementation requires specific browser capabilities:

**CSS Features:**
- backdrop-filter property (primary implementation)
- CSS custom properties for maintainable glass variables
- CSS Grid and Flexbox for responsive glass layouts
- CSS transforms for smooth animations

**JavaScript Integration:**
- Feature detection for progressive enhancement
- Performance monitoring for glass effect optimization
- Responsive breakpoint management
- User preference detection for accessibility

### Integration with Existing Systems

Glass effects integrate with current system architecture:

**CSS Framework Integration:**
- Extends existing CSS custom property system
- Builds upon current responsive design patterns
- Maintains existing component structure
- Preserves current accessibility implementations

**Component Integration:**
- Glass effects layer over existing component functionality
- Maintains current event handling and state management
- Preserves existing form validation and submission logic
- Enhances rather than replaces current interactive behaviors

## Security and Privacy Considerations

### Performance Security

Glassmorphism effects require consideration of resource usage:

**GPU Resource Management:**
- Monitor for potential GPU exhaustion attacks
- Implement reasonable limits on simultaneous glass effects
- Provide fallback when GPU resources are limited
- Maintain system responsiveness under glass effect load

### Privacy Considerations

Glass effects maintain existing privacy standards:

**Data Handling:**
- No additional data collection for glass effect implementation
- Maintains existing user preference privacy
- Preserves current session management privacy
- No external service dependencies for glass effects

This comprehensive design provides a complete blueprint for implementing glassmorphism throughout the PKKMB 2026 attendance system while maintaining functionality, performance, accessibility, and brand identity.