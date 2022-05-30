import Joi from 'joi';

export const updateSchema = Joi.object({
    tags: Joi.array().items(Joi.string().lowercase()).required(),
    rating: Joi.string().valid('explicit', 'questionable', 'safe').optional(),
    source: Joi.array().items(Joi.string().lowercase().min(1)).optional(),
});
