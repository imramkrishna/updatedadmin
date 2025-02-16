const Joi = require('joi');

// Validation for creating a unit
exports.validateCreateUnit = (data) => {
    const schema = Joi.object({
        name: Joi.string()
            .required()
            .trim()
            .min(1)
            .max(50)
            .messages({
                'string.empty': 'Unit name is required',
                'string.min': 'Unit name must be at least 1 character long',
                'string.max': 'Unit name cannot exceed 50 characters'
            })
    });

    return schema.validate(data);
};
