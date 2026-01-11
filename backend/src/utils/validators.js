const Joi = require('joi');

// User registration validation schema
const userRegistrationSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^(0|\+84)(3[2-9]|5[2689]|7[0|6-9]|8[1-9]|9[0-9])\d{7}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid Vietnamese phone number format',
      'any.required': 'Phone number is required'
    }),
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Must be a valid email address'
    }),
  fullName: Joi.string()
    .max(100)
    .required()
    .messages({
      'string.max': 'Full name must be less than 100 characters',
      'any.required': 'Full name is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    })
});

// User login validation schema
const userLoginSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^(0|\+84)(3[2-9]|5[2689]|7[0|6-9]|8[1-9]|9[0-9])\d{7}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid Vietnamese phone number format',
      'any.required': 'Phone number is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// MFA verification schema
const mfaVerificationSchema = Joi.object({
  userId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Valid user ID is required',
      'any.required': 'User ID is required'
    }),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'OTP must be 6 digits',
      'string.pattern.base': 'OTP must contain only digits',
      'any.required': 'OTP is required'
    })
});

// Product validation schema
const productSchema = Joi.object({
  name: Joi.string()
    .max(255)
    .required()
    .messages({
      'string.max': 'Product name must be less than 255 characters',
      'any.required': 'Product name is required'
    }),
  description: Joi.string()
    .max(1000)
    .required()
    .messages({
      'string.max': 'Product description must be less than 1000 characters',
      'any.required': 'Product description is required'
    }),
  price: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Price must be a positive number',
      'any.required': 'Price is required'
    }),
  stockQuantity: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.integer': 'Stock quantity must be an integer',
      'number.min': 'Stock quantity cannot be negative',
      'any.required': 'Stock quantity is required'
    })
});

// Order validation schema
const orderSchema = Joi.object({
  items: Joi.array()
    .items(Joi.object({
      productId: Joi.string()
        .uuid()
        .required(),
      quantity: Joi.number()
        .integer()
        .min(1)
        .required()
    }))
    .min(1)
    .required()
    .messages({
      'array.min': 'Order must contain at least one item',
      'any.required': 'Order items are required'
    }),
  shippingAddress: Joi.object({
    recipient: Joi.string().required(),
    phone: Joi.string()
      .pattern(/^(0|\+84)(3[2-9]|5[2689]|7[0|6-9]|8[1-9]|9[0-9])\d{7}$/)
      .required(),
    street: Joi.string().required(),
    ward: Joi.string().required(),
    district: Joi.string().required(),
    city: Joi.string().required()
  }).required()
});

// Voucher validation schema
const voucherSchema = Joi.object({
  code: Joi.string()
    .uppercase()
    .max(50)
    .required()
    .messages({
      'string.uppercase': 'Voucher code must be in uppercase',
      'string.max': 'Voucher code must be less than 50 characters',
      'any.required': 'Voucher code is required'
    }),
  name: Joi.string()
    .max(255)
    .required()
    .messages({
      'string.max': 'Voucher name must be less than 255 characters',
      'any.required': 'Voucher name is required'
    }),
  type: Joi.string()
    .valid('PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y')
    .required()
    .messages({
      'any.valid': 'Voucher type must be PERCENTAGE, FIXED_AMOUNT, or BUY_X_GET_Y',
      'any.required': 'Voucher type is required'
    }),
  value: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Voucher value must be a positive number',
      'any.required': 'Voucher value is required'
    })
});

// QR/Barcode validation schema
const qrScanSchema = Joi.object({
  qrData: Joi.string()
    .max(500)
    .required()
    .messages({
      'string.max': 'QR code data exceeds maximum length',
      'any.required': 'QR code data is required'
    })
});

// Validate function wrapper
const validate = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return {
      isValid: false,
      errors: errors
    };
  }
  
  return {
    isValid: true,
    value: value
  };
};

module.exports = {
  userRegistrationSchema,
  userLoginSchema,
  mfaVerificationSchema,
  productSchema,
  orderSchema,
  voucherSchema,
  qrScanSchema,
  validate
};