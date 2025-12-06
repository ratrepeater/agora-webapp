/**
 * Responsive design utilities
 * Provides helpers for responsive layouts and touch interactions
 */

/**
 * Tailwind CSS breakpoints
 */
export const BREAKPOINTS = {
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	'2xl': 1536
} as const;

/**
 * Check if the current viewport matches a breakpoint
 * @param breakpoint - The breakpoint to check
 * @returns true if the viewport is at or above the breakpoint
 */
export function isBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
	if (typeof window === 'undefined') return false;
	return window.innerWidth >= BREAKPOINTS[breakpoint];
}

/**
 * Check if the device is mobile (below md breakpoint)
 * @returns true if the device is mobile
 */
export function isMobile(): boolean {
	if (typeof window === 'undefined') return false;
	return window.innerWidth < BREAKPOINTS.md;
}

/**
 * Check if the device is tablet (between md and lg breakpoints)
 * @returns true if the device is tablet
 */
export function isTablet(): boolean {
	if (typeof window === 'undefined') return false;
	return window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg;
}

/**
 * Check if the device is desktop (lg breakpoint and above)
 * @returns true if the device is desktop
 */
export function isDesktop(): boolean {
	if (typeof window === 'undefined') return false;
	return window.innerWidth >= BREAKPOINTS.lg;
}

/**
 * Check if the device supports touch
 * @returns true if the device supports touch
 */
export function isTouchDevice(): boolean {
	if (typeof window === 'undefined') return false;
	return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get the current viewport size category
 * @returns The viewport size category
 */
export function getViewportSize(): 'mobile' | 'tablet' | 'desktop' {
	if (isMobile()) return 'mobile';
	if (isTablet()) return 'tablet';
	return 'desktop';
}

/**
 * Add touch event handlers with proper passive event listeners
 * @param element - The element to add touch handlers to
 * @param handlers - Object containing touch event handlers
 * @returns Cleanup function to remove event listeners
 */
export function addTouchHandlers(
	element: HTMLElement,
	handlers: {
		onTouchStart?: (e: TouchEvent) => void;
		onTouchMove?: (e: TouchEvent) => void;
		onTouchEnd?: (e: TouchEvent) => void;
		onTouchCancel?: (e: TouchEvent) => void;
	}
): () => void {
	const options = { passive: true };

	if (handlers.onTouchStart) {
		element.addEventListener('touchstart', handlers.onTouchStart, options);
	}
	if (handlers.onTouchMove) {
		element.addEventListener('touchmove', handlers.onTouchMove, options);
	}
	if (handlers.onTouchEnd) {
		element.addEventListener('touchend', handlers.onTouchEnd, options);
	}
	if (handlers.onTouchCancel) {
		element.addEventListener('touchcancel', handlers.onTouchCancel, options);
	}

	// Return cleanup function
	return () => {
		if (handlers.onTouchStart) {
			element.removeEventListener('touchstart', handlers.onTouchStart);
		}
		if (handlers.onTouchMove) {
			element.removeEventListener('touchmove', handlers.onTouchMove);
		}
		if (handlers.onTouchEnd) {
			element.removeEventListener('touchend', handlers.onTouchEnd);
		}
		if (handlers.onTouchCancel) {
			element.removeEventListener('touchcancel', handlers.onTouchCancel);
		}
	};
}

/**
 * Detect swipe gestures
 * @param element - The element to detect swipes on
 * @param onSwipe - Callback when a swipe is detected
 * @param threshold - Minimum distance for a swipe (default: 50px)
 * @returns Cleanup function
 */
export function detectSwipe(
	element: HTMLElement,
	onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void,
	threshold: number = 50
): () => void {
	let touchStartX = 0;
	let touchStartY = 0;
	let touchEndX = 0;
	let touchEndY = 0;

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.changedTouches[0].screenX;
		touchStartY = e.changedTouches[0].screenY;
	}

	function handleTouchEnd(e: TouchEvent) {
		touchEndX = e.changedTouches[0].screenX;
		touchEndY = e.changedTouches[0].screenY;
		handleSwipe();
	}

	function handleSwipe() {
		const deltaX = touchEndX - touchStartX;
		const deltaY = touchEndY - touchStartY;

		// Check if the swipe distance exceeds the threshold
		if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
			// Determine swipe direction
			if (Math.abs(deltaX) > Math.abs(deltaY)) {
				// Horizontal swipe
				if (deltaX > 0) {
					onSwipe('right');
				} else {
					onSwipe('left');
				}
			} else {
				// Vertical swipe
				if (deltaY > 0) {
					onSwipe('down');
				} else {
					onSwipe('up');
				}
			}
		}
	}

	element.addEventListener('touchstart', handleTouchStart, { passive: true });
	element.addEventListener('touchend', handleTouchEnd, { passive: true });

	return () => {
		element.removeEventListener('touchstart', handleTouchStart);
		element.removeEventListener('touchend', handleTouchEnd);
	};
}

/**
 * Create a responsive observer that calls a callback when the viewport size changes
 * @param callback - Function to call when viewport size changes
 * @returns Cleanup function
 */
export function observeViewportSize(
	callback: (size: 'mobile' | 'tablet' | 'desktop') => void
): () => void {
	if (typeof window === 'undefined') return () => {};

	let currentSize = getViewportSize();

	function handleResize() {
		const newSize = getViewportSize();
		if (newSize !== currentSize) {
			currentSize = newSize;
			callback(newSize);
		}
	}

	window.addEventListener('resize', handleResize);

	// Call immediately with current size
	callback(currentSize);

	return () => {
		window.removeEventListener('resize', handleResize);
	};
}

/**
 * Get optimal image size based on viewport
 * @param sizes - Object with image sizes for different viewports
 * @returns The optimal image size
 */
export function getOptimalImageSize(sizes: {
	mobile?: number;
	tablet?: number;
	desktop?: number;
}): number {
	const viewportSize = getViewportSize();

	switch (viewportSize) {
		case 'mobile':
			return sizes.mobile || sizes.tablet || sizes.desktop || 400;
		case 'tablet':
			return sizes.tablet || sizes.desktop || sizes.mobile || 800;
		case 'desktop':
			return sizes.desktop || sizes.tablet || sizes.mobile || 1200;
	}
}

/**
 * Calculate the number of columns for a grid based on viewport
 * @param config - Configuration for different viewports
 * @returns Number of columns
 */
export function getGridColumns(config: {
	mobile?: number;
	tablet?: number;
	desktop?: number;
}): number {
	const viewportSize = getViewportSize();

	switch (viewportSize) {
		case 'mobile':
			return config.mobile || 1;
		case 'tablet':
			return config.tablet || 2;
		case 'desktop':
			return config.desktop || 3;
	}
}
