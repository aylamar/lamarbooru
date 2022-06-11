import Joi from 'joi';

export const tagSchema = Joi.object({
    tag: Joi.string().lowercase().required(),
});
