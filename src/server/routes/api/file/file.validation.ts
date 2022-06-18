import Joi from 'joi';

export const fileSchema = Joi.object({
    tags: Joi.array().items(Joi.string().lowercase()).required(),
    rating: Joi.string().valid('explicit', 'questionable', 'safe').optional(),
    source: Joi.array().items(Joi.string().lowercase().min(1)).optional(),
});

export const idSchema = Joi.object({
    id: Joi.number().integer().min(1).required(),
});

export const searchSchema = Joi.object({
    tags: Joi.string().lowercase().optional(),
    status: Joi.string().lowercase().optional(),
    trash: Joi.boolean().optional(),
});

export const booruSchema = Joi.object({
    url: Joi.string().uri().lowercase().required(),
});

export const statusSchema = Joi.object({
    status: Joi.string().lowercase().valid('archived', 'inbox').required(),
});