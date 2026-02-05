import { VALIDATION_PATTERNS, FILE_LIMITS, CONFIDENCE_THRESHOLDS } from '../constants';

// Type guard for checking if value is defined
export const isDefined = <T>(value: T | undefined): value is T => {
  return value !== undefined;
};

// Type guard for checking if value is not null
export const isNotNull = <T>(value: T | null): value is T => {
  return value !== null;
};

// Type guard for checking if value is not null or undefined
export const isNotNil = <T>(value: T | null | undefined): value is T => {
  return value != null;
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  return VALIDATION_PATTERNS.EMAIL.test(email);
};

// Phone validation
export const isValidPhone = (phone: string): boolean => {
  return VALIDATION_PATTERNS.PHONE.test(phone);
};

// Fragment ID validation
export const isValidFragmentId = (id: string): boolean => {
  return VALIDATION_PATTERNS.FRAGMENT_ID.test(id);
};

// File size validation
export const isValidFileSize = (file: File, maxSize: number = FILE_LIMITS.IMAGE_MAX_SIZE): boolean => {
  return file.size <= maxSize;
};

// Image file type validation
export const isValidImageType = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
};

// Confidence level validation
export const getConfidenceLevel = (confidence: number): 'high' | 'medium' | 'low' => {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'high';
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Number range validation
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

// Array validation
export const isNonEmptyArray = <T>(arr: T[]): arr is [T, ...T[]] => {
  return Array.isArray(arr) && arr.length > 0;
};

// Object validation
export const hasRequiredKeys = <T extends Record<string, any>>(
  obj: T,
  requiredKeys: (keyof T)[]
): boolean => {
  return requiredKeys.every(key => key in obj && obj[key] != null);
};

// String validation
export const isNonEmptyString = (value: string | null | undefined): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

// Date validation
export const isValidDate = (date: Date | string | number): boolean => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

// Coordinate validation
export const isValidCoordinates = (lat: number, lng: number): boolean => {
  return isInRange(lat, -90, 90) && isInRange(lng, -180, 180);
};

// Color validation (hex)
export const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

// Validation result type
export type ValidationResult<T = any> = {
  isValid: boolean;
  error?: string;
  data?: T;
};

// Form validation helper
export const createValidator = <T>(
  rules: Array<(value: T) => string | null>
) => (value: T): ValidationResult<T> => {
  for (const rule of rules) {
    const error = rule(value);
    if (error) {
      return { isValid: false, error };
    }
  }
  return { isValid: true, data: value };
};

// Common validation rules
export const ValidationRules = {
  required: (value: any) => {
    if (value == null || value === '') {
      return 'This field is required';
    }
    return null;
  },
  
  email: (value: string) => {
    if (!isValidEmail(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },
  
  minLength: (min: number) => (value: string) => {
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  },
  
  maxLength: (max: number) => (value: string) => {
    if (value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  },
  
  range: (min: number, max: number) => (value: number) => {
    if (!isInRange(value, min, max)) {
      return `Must be between ${min} and ${max}`;
    }
    return null;
  },
  
  file: (maxSize: number = FILE_LIMITS.IMAGE_MAX_SIZE) => (file: File) => {
    if (!isValidImageType(file)) {
      return 'Please upload a valid image file';
    }
    if (!isValidFileSize(file, maxSize)) {
      return `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
    }
    return null;
  }
};

export default {
  isDefined,
  isNotNull,
  isNotNil,
  isValidEmail,
  isValidPhone,
  isValidFragmentId,
  isValidFileSize,
  isValidImageType,
  getConfidenceLevel,
  isValidUrl,
  isInRange,
  isNonEmptyArray,
  hasRequiredKeys,
  isNonEmptyString,
  isValidDate,
  isValidCoordinates,
  isValidHexColor,
  createValidator,
  ValidationRules
};
