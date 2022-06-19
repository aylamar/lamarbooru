import Joi from 'joi';

const strToNumberArray = function (value: any, helpers: Joi.CustomHelpers<any>) {
    let arr = value.split(' ');
    let parsedArr: number[] = []
    // try to convert every item in arr to number, if it fails, return error
    for (let i = 0; i < arr.length; i++) {
        if (isNaN(Number(arr[i]))) return helpers.error('any.custom', { value: arr[i], error: 'array values contained non-integer value' });
        if (Number(arr[i]) < 1) return helpers.error('any.custom', { value: arr[i], error: 'array values contained value < 1' });
        parsedArr.push(Number(arr[i]));
    }

    // if everything is fine, return converted array
    return parsedArr;
}

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
    status: Joi.string().lowercase().valid('archived', 'inbox').optional(),
    trash: Joi.boolean().optional(),
});

export const booruSchema = Joi.object({
    url: Joi.string().uri().lowercase().required(),
});

export const statusSchema = Joi.object({
    status: Joi.string().lowercase().valid('archived', 'inbox').required(),
});

export const bulkStatusSchema = Joi.object({
    archived: Joi.string().optional().custom(strToNumberArray),
    trash: Joi.string().optional().custom(strToNumberArray)
});