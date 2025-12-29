/**
 * Validation utilities for form inputs
 * Provides reusable validation functions with clear error messages
 */

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

/**
 * Validate product creation/update form data
 */
export function validateProductForm(data: {
    name?: string;
    short_description?: string;
    long_description?: string;
    category_id?: string;
    price?: string | number;
    logo?: File | null;
    demo_visual?: File | null;
}): ValidationResult {
    const errors: Record<string, string> = {};

    // Validate name
    if (!data.name || data.name.trim().length === 0) {
        errors.name = 'Product name is required';
    } else if (data.name.trim().length > 100) {
        errors.name = 'Product name must be 100 characters or less';
    } else if (data.name.trim().length < 3) {
        errors.name = 'Product name must be at least 3 characters';
    }

    // Validate short description
    if (!data.short_description || data.short_description.trim().length === 0) {
        errors.short_description = 'Short description is required';
    } else if (data.short_description.trim().length > 200) {
        errors.short_description = 'Short description must be 200 characters or less';
    } else if (data.short_description.trim().length < 10) {
        errors.short_description = 'Short description must be at least 10 characters';
    }

    // Validate long description
    if (!data.long_description || data.long_description.trim().length === 0) {
        errors.long_description = 'Long description is required';
    } else if (data.long_description.trim().length < 50) {
        errors.long_description = 'Long description must be at least 50 characters';
    }

    // Validate category
    if (!data.category_id) {
        errors.category_id = 'Category is required';
    }

    // Validate price
    if (!data.price && data.price !== 0) {
        errors.price = 'Price is required';
    } else {
        const price = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
        if (isNaN(price)) {
            errors.price = 'Price must be a valid number';
        } else if (price < 0) {
            errors.price = 'Price must be a positive number';
        } else if (price > 1000000) {
            errors.price = 'Price must be less than $1,000,000';
        }
    }

    // Validate logo file if provided
    if (data.logo && data.logo.size > 0) {
        const logoValidation = validateImageFile(data.logo, {
            maxSize: 2 * 1024 * 1024, // 2MB
            allowedTypes: ['image/png', 'image/jpeg', 'image/webp']
        });
        if (!logoValidation.isValid) {
            errors.logo = logoValidation.error!;
        }
    }

    // Validate demo visual file if provided
    if (data.demo_visual && data.demo_visual.size > 0) {
        const visualValidation = validateImageFile(data.demo_visual, {
            maxSize: 5 * 1024 * 1024, // 5MB
            allowedTypes: ['image/png', 'image/jpeg', 'image/webp']
        });
        if (!visualValidation.isValid) {
            errors.demo_visual = visualValidation.error!;
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Validate quote request form data
 */
export function validateQuoteRequestForm(data: {
    company_size?: number | string;
    requirements?: string;
    additional_notes?: string;
}): ValidationResult {
    const errors: Record<string, string> = {};

    // Validate company size
    if (!data.company_size && data.company_size !== 0) {
        errors.company_size = 'Company size is required';
    } else {
        const size =
            typeof data.company_size === 'string' ? parseInt(data.company_size) : data.company_size;
        if (isNaN(size)) {
            errors.company_size = 'Company size must be a valid number';
        } else if (size < 1) {
            errors.company_size = 'Company size must be at least 1';
        } else if (size > 1000000) {
            errors.company_size = 'Company size must be less than 1,000,000';
        }
    }

    // Validate requirements
    if (!data.requirements || data.requirements.trim().length === 0) {
        errors.requirements = 'Requirements description is required';
    } else if (data.requirements.trim().length < 20) {
        errors.requirements = 'Requirements must be at least 20 characters';
    } else if (data.requirements.trim().length > 1000) {
        errors.requirements = 'Requirements must be 1000 characters or less';
    }

    // Validate additional notes (optional)
    if (data.additional_notes && data.additional_notes.trim().length > 500) {
        errors.additional_notes = 'Additional notes must be 500 characters or less';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Validate review submission form data
 */
export function validateReviewForm(data: {
    rating?: number | string;
    title?: string;
    body?: string;
}): ValidationResult {
    const errors: Record<string, string> = {};

    // Validate rating
    if (!data.rating && data.rating !== 0) {
        errors.rating = 'Rating is required';
    } else {
        const rating = typeof data.rating === 'string' ? parseInt(data.rating) : data.rating;
        if (isNaN(rating)) {
            errors.rating = 'Rating must be a valid number';
        } else if (rating < 1 || rating > 5) {
            errors.rating = 'Rating must be between 1 and 5';
        }
    }

    // Validate title (optional but has constraints if provided)
    if (data.title && data.title.trim().length > 100) {
        errors.title = 'Review title must be 100 characters or less';
    }

    // Validate body (optional but has constraints if provided)
    if (data.body) {
        if (data.body.trim().length > 1000) {
            errors.body = 'Review must be 1000 characters or less';
        } else if (data.body.trim().length > 0 && data.body.trim().length < 10) {
            errors.body = 'Review must be at least 10 characters if provided';
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Validate image file upload
 */
export function validateImageFile(
    file: File,
    options: {
        maxSize: number;
        allowedTypes: string[];
    }
): { isValid: boolean; error?: string } {
    // Check file type
    if (!options.allowedTypes.includes(file.type)) {
        const allowedExtensions = options.allowedTypes
            .map((type) => type.split('/')[1].toUpperCase())
            .join(', ');
        return {
            isValid: false,
            error: `File must be ${allowedExtensions} format`
        };
    }

    // Check file size
    if (file.size > options.maxSize) {
        const maxSizeMB = (options.maxSize / (1024 * 1024)).toFixed(0);
        return {
            isValid: false,
            error: `File size must be less than ${maxSizeMB}MB`
        };
    }

    return { isValid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Sanitize string input (remove leading/trailing whitespace, normalize line breaks)
 */
export function sanitizeString(input: string): string {
    return input.trim().replace(/\r\n/g, '\n');
}

/**
 * Validate numeric range
 */
export function validateNumericRange(
    value: number | string,
    min: number,
    max: number
): { isValid: boolean; error?: string } {
    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(num)) {
        return { isValid: false, error: 'Must be a valid number' };
    }

    if (num < min) {
        return { isValid: false, error: `Must be at least ${min}` };
    }

    if (num > max) {
        return { isValid: false, error: `Must be at most ${max}` };
    }

    return { isValid: true };
}
