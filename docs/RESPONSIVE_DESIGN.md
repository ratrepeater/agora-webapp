# Responsive Design Implementation

This document outlines the responsive design implementation for the Startup Marketplace application.

## Breakpoints

The application uses Tailwind CSS breakpoints:

- **Mobile**: < 768px (sm: 640px, md: 768px)
- **Tablet**: 768px - 1024px (md: 768px, lg: 1024px)
- **Desktop**: ≥ 1024px (lg: 1024px, xl: 1280px, 2xl: 1536px)

## Responsive Components

### NavShell
- **Mobile**: Hamburger menu with drawer sidebar
- **Desktop**: Full navigation bar with inline links
- **Search**: Hidden on mobile (available in drawer), visible on desktop

### ProductCard
- **Grid variant**: Responsive width (full on mobile, constrained on desktop)
- **Carousel variant**: Fixed width (w-80) for horizontal scrolling
- **Images**: Lazy loaded with placeholders
- **Touch**: Optimized for touch interactions on mobile

### FilterPanel
- **Mobile**: Full width, collapsible
- **Desktop**: Fixed sidebar width (w-64)
- **Filters**: Stacked vertically for easy mobile access

### Marketplace Page
- **Layout**: 
  - Mobile: Single column (filters above products)
  - Desktop: Sidebar + main content (flex-row)
- **Product Grid**:
  - Mobile: 1 column
  - Tablet: 2 columns (md:grid-cols-2)
  - Desktop: 3 columns (xl:grid-cols-3)

### ComparisonTable
- **Mobile**: Horizontal scroll for 3 products
- **Desktop**: Side-by-side display
- **Touch**: Swipe gestures supported

## Touch Interactions

### Implemented Features
1. **Swipe Detection**: Utility function in `responsive.ts`
2. **Touch Handlers**: Passive event listeners for better performance
3. **Tap Targets**: Minimum 44x44px for all interactive elements
4. **Hover States**: Disabled on touch devices to prevent sticky hover

### Usage Example
```typescript
import { detectSwipe } from '$lib/helpers/responsive';

// Detect swipe gestures
const cleanup = detectSwipe(element, (direction) => {
  if (direction === 'left') {
    // Handle left swipe
  }
});
```

## Image Optimization

### LazyImage Component
- **Lazy Loading**: Uses native `loading="lazy"` attribute
- **Placeholders**: Animated skeleton while loading
- **Error Handling**: Fallback UI for failed images
- **Responsive Sizes**: Adapts to viewport size

### Usage
```svelte
<LazyImage
  src={product.demo_visual_url}
  alt="{product.name} demo"
  class="w-full h-48"
  height={192}
/>
```

## Performance Optimizations

### Mobile-Specific
1. **Reduced Animations**: Respects `prefers-reduced-motion`
2. **Smaller Images**: Serves appropriate sizes based on viewport
3. **Touch Optimization**: Passive event listeners
4. **Debounced Search**: 300ms delay to reduce API calls

### Desktop-Specific
1. **Prefetching**: SvelteKit prefetches on hover
2. **Larger Images**: Higher resolution for better quality
3. **More Columns**: Utilizes available screen space

## Testing Checklist

### Mobile (< 768px)
- [ ] Navigation drawer opens and closes smoothly
- [ ] All text is readable without zooming
- [ ] Buttons are at least 44x44px
- [ ] Forms are easy to fill out
- [ ] Images load properly with placeholders
- [ ] Horizontal scrolling works for carousels
- [ ] No horizontal overflow on any page

### Tablet (768px - 1024px)
- [ ] Layout adapts to 2-column grid
- [ ] Navigation is accessible
- [ ] Touch interactions work smoothly
- [ ] Images are appropriately sized

### Desktop (≥ 1024px)
- [ ] Full navigation bar is visible
- [ ] 3-column grid displays properly
- [ ] Hover states work correctly
- [ ] Keyboard navigation is smooth
- [ ] All features are accessible

## Accessibility Considerations

### Mobile
- **Touch Targets**: Minimum 44x44px
- **Contrast**: WCAG AA compliant (4.5:1)
- **Font Size**: Minimum 16px for body text
- **Spacing**: Adequate padding for touch

### Desktop
- **Keyboard Navigation**: Full support
- **Focus Indicators**: Visible on all interactive elements
- **Screen Readers**: ARIA labels on all controls
- **Zoom**: Supports up to 200% zoom

## Future Enhancements

1. **Progressive Web App**: Add service worker for offline support
2. **Adaptive Loading**: Serve different assets based on connection speed
3. **Responsive Images**: Use `srcset` for multiple image sizes
4. **Virtual Scrolling**: For long product lists on mobile
5. **Gesture Library**: Add pinch-to-zoom for product images

## Resources

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Web.dev Responsive Images](https://web.dev/responsive-images/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
