import Joi from 'joi';

export const newSubscriptionSchema = Joi.object({
    site: Joi.string().lowercase().valid('danbooru').required(),
    tags: Joi.array().items(Joi.string().lowercase()).min(1).max(2).required(),
    tagBlacklist: Joi.array().items(Joi.string().lowercase().min(0).max(100)).optional(),
    interval: Joi.string().lowercase().valid('daily', 'weekly', 'monthly').required(),
    limit: Joi.number().integer().min(1).max(1000000).optional(),
});

export const subscriptionIdSchema = Joi.object({
    id: Joi.number().min(1).required(),
});

export const logSchema = Joi.object({
    site: Joi.string().lowercase().valid('danbooru').required(),
    tags: Joi.array().items(Joi.string().lowercase()).min(1).max(2).required(),
});

export const logIdSchema = Joi.object({
    id: Joi.number().min(1).required(),
});
