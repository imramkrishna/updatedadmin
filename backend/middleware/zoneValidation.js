const { body, param } = require('express-validator');

// Validation middleware for zone input
exports.validateZoneId = (field = 'zone') => [
    body(field)
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Zone is required')
];

// Validation middleware for array of zone inputs
exports.validateZoneIds = (field = 'zones') => [
    body(field)
        .isArray()
        .withMessage('Zones must be an array')
        .custom((values) => {
            if (!values.every(value => typeof value === 'string' && value.trim())) {
                throw new Error('All zones must be non-empty strings');
            }
            return true;
        })
];

// Validation middleware for zone in params
exports.validateZoneIdParam = [
    param('zoneId')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Zone is required')
]; 