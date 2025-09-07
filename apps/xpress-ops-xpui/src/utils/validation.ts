export interface ValidationError {
  field: string;
  message: string;
}

export interface LoginData {
  email: string;
  password: string;
  mfaCode?: string;
  remember?: boolean;
}

export function createLoginValidator() {
  return {
    validate: (data: LoginData): ValidationError[] => {
      const errors: ValidationError[] = [];

      // Email validation
      if (!data.email) {
        errors.push({
          field: 'email',
          message: 'Email is required'
        });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push({
          field: 'email',
          message: 'Please enter a valid email address'
        });
      }

      // Password validation
      if (!data.password) {
        errors.push({
          field: 'password',
          message: 'Password is required'
        });
      } else if (data.password.length < 6) {
        errors.push({
          field: 'password',
          message: 'Password must be at least 6 characters long'
        });
      }

      // MFA code validation (if provided)
      if (data.mfaCode && (!/^\d{6}$/.test(data.mfaCode))) {
        errors.push({
          field: 'mfaCode',
          message: 'MFA code must be 6 digits'
        });
      }

      return errors;
    }
  };
}

export { ValidationError };