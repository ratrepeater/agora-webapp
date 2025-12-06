/**
 * Accessibility utilities and helpers
 * Provides functions for improving keyboard navigation, screen reader support, and ARIA attributes
 */

/**
 * Trap focus within a container element
 * Useful for modals, dialogs, and dropdown menus
 * @param container - The container element to trap focus within
 */
export function trapFocus(container: HTMLElement): () => void {
	const focusableElements = container.querySelectorAll<HTMLElement>(
		'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
	);

	const firstFocusable = focusableElements[0];
	const lastFocusable = focusableElements[focusableElements.length - 1];

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;

		if (e.shiftKey) {
			// Shift + Tab
			if (document.activeElement === firstFocusable) {
				e.preventDefault();
				lastFocusable?.focus();
			}
		} else {
			// Tab
			if (document.activeElement === lastFocusable) {
				e.preventDefault();
				firstFocusable?.focus();
			}
		}
	}

	container.addEventListener('keydown', handleKeyDown);

	// Return cleanup function
	return () => {
		container.removeEventListener('keydown', handleKeyDown);
	};
}

/**
 * Announce a message to screen readers
 * Creates a live region and announces the message
 * @param message - The message to announce
 * @param priority - The priority level ('polite' or 'assertive')
 */
export function announceToScreenReader(
	message: string,
	priority: 'polite' | 'assertive' = 'polite'
): void {
	const announcement = document.createElement('div');
	announcement.setAttribute('role', 'status');
	announcement.setAttribute('aria-live', priority);
	announcement.setAttribute('aria-atomic', 'true');
	announcement.className = 'sr-only';
	announcement.textContent = message;

	document.body.appendChild(announcement);

	// Remove after announcement
	setTimeout(() => {
		document.body.removeChild(announcement);
	}, 1000);
}

/**
 * Check if an element is visible to screen readers
 * @param element - The element to check
 * @returns true if the element is visible to screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
	const style = window.getComputedStyle(element);
	return (
		style.display !== 'none' &&
		style.visibility !== 'hidden' &&
		element.getAttribute('aria-hidden') !== 'true'
	);
}

/**
 * Get a unique ID for an element
 * Useful for associating labels with inputs
 * @param prefix - Optional prefix for the ID
 * @returns A unique ID string
 */
let idCounter = 0;
export function getUniqueId(prefix: string = 'element'): string {
	return `${prefix}-${++idCounter}`;
}

/**
 * Check if the current device prefers reduced motion
 * @returns true if the user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get the contrast ratio between two colors
 * @param color1 - First color in hex format
 * @param color2 - Second color in hex format
 * @returns The contrast ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
	const getLuminance = (hex: string): number => {
		const rgb = parseInt(hex.slice(1), 16);
		const r = ((rgb >> 16) & 0xff) / 255;
		const g = ((rgb >> 8) & 0xff) / 255;
		const b = (rgb & 0xff) / 255;

		const [rs, gs, bs] = [r, g, b].map((c) => {
			return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
		});

		return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
	};

	const l1 = getLuminance(color1);
	const l2 = getLuminance(color2);

	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);

	return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color combination meets WCAG AA standards
 * @param foreground - Foreground color in hex format
 * @param background - Background color in hex format
 * @param isLargeText - Whether the text is large (18pt+ or 14pt+ bold)
 * @returns true if the combination meets WCAG AA standards
 */
export function meetsWCAGAA(
	foreground: string,
	background: string,
	isLargeText: boolean = false
): boolean {
	const ratio = getContrastRatio(foreground, background);
	return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if a color combination meets WCAG AAA standards
 * @param foreground - Foreground color in hex format
 * @param background - Background color in hex format
 * @param isLargeText - Whether the text is large (18pt+ or 14pt+ bold)
 * @returns true if the combination meets WCAG AAA standards
 */
export function meetsWCAGAAA(
	foreground: string,
	background: string,
	isLargeText: boolean = false
): boolean {
	const ratio = getContrastRatio(foreground, background);
	return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Handle keyboard navigation for a list of items
 * Supports arrow keys, Home, End, and Enter
 * @param event - The keyboard event
 * @param items - Array of focusable elements
 * @param currentIndex - Current focused index
 * @param onSelect - Callback when an item is selected (Enter key)
 * @returns The new focused index
 */
export function handleListKeyboardNavigation(
	event: KeyboardEvent,
	items: HTMLElement[],
	currentIndex: number,
	onSelect?: (index: number) => void
): number {
	let newIndex = currentIndex;

	switch (event.key) {
		case 'ArrowDown':
			event.preventDefault();
			newIndex = Math.min(currentIndex + 1, items.length - 1);
			break;
		case 'ArrowUp':
			event.preventDefault();
			newIndex = Math.max(currentIndex - 1, 0);
			break;
		case 'Home':
			event.preventDefault();
			newIndex = 0;
			break;
		case 'End':
			event.preventDefault();
			newIndex = items.length - 1;
			break;
		case 'Enter':
		case ' ':
			event.preventDefault();
			onSelect?.(currentIndex);
			return currentIndex;
	}

	if (newIndex !== currentIndex) {
		items[newIndex]?.focus();
	}

	return newIndex;
}
