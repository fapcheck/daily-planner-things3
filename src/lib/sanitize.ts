/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitize HTML content by escaping special characters
 * Prevents XSS attacks through user input
 */
export function sanitizeHtml(input: string): string {
    if (!input) return '';

    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

/**
 * Sanitize text input by removing potentially dangerous characters
 * while preserving common punctuation and unicode
 */
export function sanitizeText(input: string): string {
    if (!input) return '';

    // Remove control characters except newlines and tabs
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Sanitize and validate URLs
 * Only allows http, https, and mailto protocols
 */
export function sanitizeUrl(url: string): string | null {
    if (!url) return null;

    try {
        const parsed = new URL(url);

        // Only allow safe protocols
        const allowedProtocols = ['http:', 'https:', 'mailto:'];
        if (!allowedProtocols.includes(parsed.protocol)) {
            console.warn(`Blocked unsafe URL protocol: ${parsed.protocol}`);
            return null;
        }

        return parsed.href;
    } catch {
        // Invalid URL
        return null;
    }
}

/**
 * Sanitize task title
 * Removes HTML and dangerous characters while preserving emojis and unicode
 */
export function sanitizeTaskTitle(title: string): string {
    return sanitizeText(sanitizeHtml(title)).trim();
}

/**
 * Sanitize task notes
 * Allows newlines but escapes HTML
 */
export function sanitizeTaskNotes(notes: string): string {
    return sanitizeText(sanitizeHtml(notes));
}

/**
 * Sanitize project/area/tag names
 * More restrictive than task titles
 */
export function sanitizeName(name: string): string {
    return sanitizeText(sanitizeHtml(name)).trim().slice(0, 100); // Limit length
}

/**
 * Sanitize color values
 * Ensures only valid CSS color formats are accepted
 */
export function sanitizeColor(color: string): string {
    if (!color) return 'hsl(211, 100%, 50%)'; // Default blue

    // Allow hex colors
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return color;
    }

    // Allow rgb/rgba
    if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/.test(color)) {
        return color;
    }

    // Allow hsl/hsla
    if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+\s*)?\)$/.test(color)) {
        return color;
    }

    // Invalid color format, return default
    console.warn(`Invalid color format: ${color}`);
    return 'hsl(211, 100%, 50%)';
}

/**
 * Sanitize numeric input
 * Ensures valid numbers and prevents injection
 */
export function sanitizeNumber(value: any, defaultValue: number = 0): number {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? defaultValue : num;
}
