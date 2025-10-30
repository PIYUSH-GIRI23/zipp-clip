import { findLimits } from './findLimits.js';
export const checkLimit = (size, accountPlan, type) => {
    const limits = findLimits(accountPlan);
    if(type === 'image'){
        if(size > limits.image_size_limit){
            return { status: false , size: limits.image_size_limit };
        } else {
            return { status: true };
        }
    }
    if(type === 'file'){
        if(size > limits.file_size_limit){
            return { status: false , size: limits.file_size_limit };
        } else {
            return { status: true };
        }
    }
    return { status: true };
}

export default checkLimit;