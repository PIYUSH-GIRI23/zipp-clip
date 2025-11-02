import findLimit from './findLimits.js'
import { ObjectId } from 'mongodb';
import { getClipCollection, getAuthCollection } from '../db/init.js';
async function getOrCreateUserClip(userId, user) {
    const clipCollection = getClipCollection();
    let userClip = await clipCollection.findOne({ id: userId });

    if (!userClip) {
        const accountPlan = user.accountPlan;
        const { text_limit, image_limit, file_limit, text_size_limit, image_size_limit, file_size_limit } = findLimits(accountPlan);
        userClip = {
            id: userId,
            email: user.email,
            text_limit,
            image_limit,
            file_limit,
            text_size_limit,
            image_size_limit,
            file_size_limit,
            text: [],
            image: [],
            file: [],
            lastUpdatedAt: Date.now(),
            tokenRefresh: Date.now()
        };
    }
    return userClip;
}
const Upgrade=async(accountPlan,id)=>{
    const authCollection = getAuthCollection();
    const clipCollection = getClipCollection();

    const user=await authCollection.findOne({_id : new ObjectId(id)});

    if(!user){
        throw new Error('User not found');
    }   

    const clipData=await clipCollection.findOne({id : id});

    const updatedClipData=await getOrCreateUserClip(id,user);

    await authCollection.updateOne({_id : new ObjectId(id)},{$set:{accountPlan:accountPlan}});

    const limits = findLimit(accountPlan);

    updatedClipData.text_limit = limits.text_limit;
    updatedClipData.image_limit = limits.image_limit;
    updatedClipData.file_limit = limits.file_limit;
    updatedClipData.text_size_limit = limits.text_size_limit;
    updatedClipData.image_size_limit = limits.image_size_limit;
    updatedClipData.file_size_limit = limits.file_size_limit;
    updatedClipData.lastUpdatedAt = Date.now();
    updatedClipData.tokenRefresh = Date.now();

    if(clipData){
        await clipCollection.updateOne({id : id},{$set:updatedClipData});
    }
    else{
        await clipCollection.insertOne(updatedClipData);
    }
}
export default Upgrade;