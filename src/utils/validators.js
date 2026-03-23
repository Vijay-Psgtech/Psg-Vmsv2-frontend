// src/utils/validators.js - PRODUCTION READY
import { logger } from "./logger";

/**
 * Validators Utility - Input validation functions
 * All validators return { isValid: boolean, error?: string }
 */
export const validators = {
  /**
   * Validate email format
   */
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      return { isValid: false, error: "Email is required" };
    }

    if (email.length > 255) {
      return { isValid: false, error: "Email is too long" };
    }

    if (!emailRegex.test(email)) {
      return { isValid: false, error: "Invalid email format" };
    }

    return { isValid: true };
  },

  /**
   * Validate password strength
   */
  password: (password) => {
    const errors = [];

    if (!password) {
      return { isValid: false, error: "Password is required" };
    }

    if (password.length < 8) {
      errors.push("At least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("One uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("One lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("One number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("One special character");
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        error: `Password must contain: ${errors.join(", ")}`,
      };
    }

    return { isValid: true };
  },

  /**
   * Validate phone number
   */
  phone: (phone) => {
    const phoneRegex = /^[0-9\s\-\+\(\)]{10,}$/;

    if (!phone) {
      return { isValid: false, error: "Phone is required" };
    }

    const cleanPhone = phone.replace(/\s/g, "");

    if (!/^\d{10,}$/.test(cleanPhone)) {
      return {
        isValid: false,
        error: "Phone must contain at least 10 digits",
      };
    }

    return { isValid: true };
  },

  /**
   * Validate name
   */
  name: (name) => {
    const nameRegex = /^[a-zA-Z\s\-']{3,50}$/;

    if (!name) {
      return { isValid: false, error: "Name is required" };
    }

    if (name.length < 3) {
      return { isValid: false, error: "Name must be at least 3 characters" };
    }

    if (name.length > 50) {
      return { isValid: false, error: "Name cannot exceed 50 characters" };
    }

    if (!nameRegex.test(name)) {
      return {
        isValid: false,
        error: "Name can only contain letters, spaces, hyphens, and apostrophes",
      };
    }

    return { isValid: true };
  },

  /**
   * Validate OTP
   */
  otp: (otp) => {
    const otpRegex = /^\d{6}$/;

    if (!otp) {
      return { isValid: false, error: "OTP is required" };
    }

    if (!otpRegex.test(otp)) {
      return { isValid: false, error: "OTP must be 6 digits" };
    }

    return { isValid: true };
  },

  /**
   * Validate URL
   */
  url: (url) => {
    try {
      new URL(url);
      return { isValid: true };
    } catch {
      return { isValid: false, error: "Invalid URL format" };
    }
  },

  /**
   * Validate date
   */
  date: (date) => {
    if (!date) {
      return { isValid: false, error: "Date is required" };
    }

    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
      return { isValid: false, error: "Invalid date format" };
    }

    return { isValid: true, value: dateObj };
  },

  /**
   * Validate future date
   */
  futureDate: (date) => {
    const dateValidation = validators.date(date);

    if (!dateValidation.isValid) {
      return dateValidation;
    }

    const dateObj = new Date(date);
    const now = new Date();

    if (dateObj <= now) {
      return { isValid: false, error: "Date must be in the future" };
    }

    return { isValid: true, value: dateObj };
  },

  /**
   * Validate number
   */
  number: (value, min = null, max = null) => {
    const num = Number(value);

    if (isNaN(num)) {
      return { isValid: false, error: "Invalid number format" };
    }

    if (min !== null && num < min) {
      return { isValid: false, error: `Number must be at least ${min}` };
    }

    if (max !== null && num > max) {
      return { isValid: false, error: `Number cannot exceed ${max}` };
    }

    return { isValid: true, value: num };
  },

  /**
   * Validate required field
   */
  required: (value, fieldName = "This field") => {
    if (!value || (typeof value === "string" && !value.trim())) {
      return { isValid: false, error: `${fieldName} is required` };
    }

    return { isValid: true };
  },

  /**
   * Validate minimum length
   */
  minLength: (value, length, fieldName = "This field") => {
    if (!value || value.length < length) {
      return {
        isValid: false,
        error: `${fieldName} must be at least ${length} characters`,
      };
    }

    return { isValid: true };
  },

  /**
   * Validate maximum length
   */
  maxLength: (value, length, fieldName = "This field") => {
    if (value && value.length > length) {
      return {
        isValid: false,
        error: `${fieldName} cannot exceed ${length} characters`,
      };
    }

    return { isValid: true };
  },

  /**
   * Validate against pattern
   */
  pattern: (value, pattern, fieldName = "This field") => {
    if (!pattern.test(value)) {
      return {
        isValid: false,
        error: `${fieldName} format is invalid`,
      };
    }

    return { isValid: true };
  },

  /**
   * Validate passwords match
   */
  passwordMatch: (password, confirmPassword) => {
    if (password !== confirmPassword) {
      return { isValid: false, error: "Passwords do not match" };
    }

    return { isValid: true };
  },

  /**
   * Validate credit card
   */
  creditCard: (cardNumber) => {
    // Remove spaces
    const cleaned = cardNumber.replace(/\s/g, "");

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    if (sum % 10 !== 0) {
      return { isValid: false, error: "Invalid credit card number" };
    }

    return { isValid: true };
  },

  /**
   * Validate object against schema
   */
  validateObject: (obj, schema) => {
    const errors = {};

    for (const [field, rule] of Object.entries(schema)) {
      const value = obj[field];

      if (rule.required) {
        const validation = validators.required(value, rule.label || field);
        if (!validation.isValid) {
          errors[field] = validation.error;
          continue;
        }
      }

      if (rule.type === "email") {
        const validation = validators.email(value);
        if (!validation.isValid) {
          errors[field] = validation.error;
        }
      }

      if (rule.type === "phone") {
        const validation = validators.phone(value);
        if (!validation.isValid) {
          errors[field] = validation.error;
        }
      }

      if (rule.minLength) {
        const validation = validators.minLength(value, rule.minLength, rule.label || field);
        if (!validation.isValid) {
          errors[field] = validation.error;
        }
      }

      if (rule.maxLength) {
        const validation = validators.maxLength(value, rule.maxLength, rule.label || field);
        if (!validation.isValid) {
          errors[field] = validation.error;
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : null,
    };
  },

  /**
   * Sanitize string to prevent XSS
   */
  sanitize: (str) => {
    if (typeof str !== "string") {
      return str;
    }

    // ✅ Create a temporary element to use browser's HTML escaping
    const tempDiv = document.createElement("div");
    tempDiv.textContent = str;
    return tempDiv.innerHTML;
  },

  /**
   * Sanitize object values
   */
  sanitizeObject: (obj) => {
    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        sanitized[key] = validators.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  },
};

export default validators;