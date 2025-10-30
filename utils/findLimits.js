export const findLimits = (accountPlan) => {
    const planMap = {
        1: 'BASIC',
        2: 'PRO',
        3: 'PREMIUM'
    };

    const plan = planMap[accountPlan] || 'BASIC';

    const text_limit = parseInt(process.env[`${plan}_TEXT_LIMIT`]);
    const image_limit = parseInt(process.env[`${plan}_IMAGE_LIMIT`]);
    const file_limit = parseInt(process.env[`${plan}_FILE_LIMIT`]);

    const text_size_limit = parseInt(process.env[`${plan}_TEXT_CHARACTER_LIMIT`]);
    const image_size_limit = parseInt(process.env[`${plan}_IMAGE_SIZE_LIMIT`]);
    const file_size_limit = parseInt(process.env[`${plan}_FILE_SIZE_LIMIT`]);

    return {
        text_limit,
        image_limit,
        file_limit,
        text_size_limit,
        image_size_limit,
        file_size_limit
    };
};
export default findLimits;