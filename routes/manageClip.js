import express from 'express';
const router = express.Router();
import { getClipCollection, getAuthCollection } from '../db/init.js';
import { ObjectId } from 'mongodb';
import {findLimits} from '../utils/findLimits.js';
import { checkLimit } from '../utils/checkLimit.js';
import { jwt } from '../middleware/jwt.js';
import { uploadToCloudinary } from '../utils/cloudinary/upload.js';
import {deleteFile, deleteMultipleFiles} from '../utils/cloudinary/deleteFile.js';
import upload from '../utils/multer.js';
import cloudinary from '../utils/cloudinary/config.js';
import dotenv from 'dotenv';
dotenv.config();

const ALLOWED_IMAGE_TYPES = process.env.ALLOWED_IMAGE_TYPES
const ALLOWED_FILE_TYPES = process.env.ALLOWED_FILE_TYPES

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

router.use(jwt);

router.post('/text', async (req, res) => {
    try {
        const { head, body, deviceInfo } = req.body;
        const userId = req.userId;
      
        const authCollection = getAuthCollection();
        const user = await authCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        const clipCollection = getClipCollection();

        if (!head || !body) {
            return res.status(400).json({
                error: 'Both head and body are required',
                code: 'INVALID_INPUT'
            });
        }

        try {
            if(!userId){
                return res.status(400).json({
                    error: 'Invalid user ID in token',
                    code: 'INVALID_USER_ID'
                });
            }
           
            let userClip = await getOrCreateUserClip(userId, user);

            if (userClip.text_limit <= 0) {
                return res.status(403).json({
                    error: 'Text clip limit reached. Upgrade your plan to add more clips.',
                    code: 'TEXT_CLIP_LIMIT_REACHED'
                });
            }

            if (body.length > userClip.text_size_limit) {
                return res.status(400).json({
                    error: `Text body exceeds character limit of ${userClip.text_size_limit}`,
                    code: 'TEXT_CHARACTER_LIMIT_EXCEEDED'
                });
            }

            const textId = new ObjectId().toString();
            userClip.text.push({
                id: textId,
                head,
                body,
                createdAt: Date.now()
            });

            userClip.lastUpdatedAt = Date.now();

            await clipCollection.updateOne(
                { id: userId },
                { $set: { ...userClip, text_limit: userClip.text_limit - 1 } },
                { upsert: true }
            );

            res.status(200).json({
                message: 'Text clip added successfully',
                lastUpdatedAt: userClip.lastUpdatedAt,
                code: 'TEXT_CLIP_ADDED_SUCCESSFULLY'
            });
        } 
        catch (dbError) {
            
            throw new Error('Failed to update clip data');
        }
    }
    catch(err) {
        console.error('Error in /text route:', err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

router.delete('/text/:textId', async (req, res) => {
    try {
        const { deviceInfo } = req.body;
        const textId = req.params.textId;
        const userId = req.userId;

        const clipCollection = getClipCollection();
        
        const userClip = await clipCollection.findOne({ id: userId });
        
        if (!userClip) {
            return res.status(404).json({
                error: 'No clips found for user',
                code: 'NO_CLIPS_FOUND'
            });
        }
        
        const textIndex = userClip.text.findIndex(item => item.id === textId);
        
        if (textIndex === -1) {
            return res.status(404).json({
                error: 'Text entry not found',
                code: 'TEXT_NOT_FOUND'
            });
        }
        
        userClip.text.splice(textIndex, 1);
        
        await clipCollection.updateOne(
            { id: userId },
            { 
                $set: { 
                    text: userClip.text,
                    lastUpdatedAt: Date.now()
                } 
            }
        );
        
        res.status(200).json({
            message: 'Text deleted successfully',
            code: 'TEXT_DELETED_SUCCESSFULLY'
        });
    } catch (err) {
        console.error('Error in delete text route:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/clips', async (req, res) => {
    try {
        const { deviceInfo } = req.body;
        const userId = req.userId;

        const authCollection = getAuthCollection();
        const user = await authCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        const clipCollection = getClipCollection();
        let userClip = await clipCollection.findOne({ id: userId });

        if (!userClip) {
            return res.status(404).json({
                error: 'No clips found for the user',
                code: 'NO_CLIPS_FOUND'
            });
        }

        const tokenRefresh = userClip.tokenRefresh;
        const accountPlan = user.accountPlan;
        const currentTime = Date.now();
        const oneMonthAgo = currentTime - (30 * 24 * 60 * 60 * 1000);
        const oneYearAgo = currentTime - (365 * 24 * 60 * 60 * 1000);
        
        if (!tokenRefresh) {
            return res.status(400).json({
                error: 'Token refresh date not found for user',
                code: 'TOKEN_REFRESH_NOT_FOUND'
            });
        }

        if (tokenRefresh < oneYearAgo) {
            const { text_limit, image_limit, file_limit, text_size_limit, image_size_limit, file_size_limit } = findLimits('FREE');
            await authCollection.updateOne(
                { _id: new ObjectId(userId) },
                { $set: { accountPlan: 1 } }
            );
        }

        if (tokenRefresh < oneMonthAgo) {
            const { text_limit, image_limit, file_limit, text_size_limit, image_size_limit, file_size_limit } = findLimits(accountPlan);
            await clipCollection.updateOne(
                { id: userId },
                {
                    $set: {
                        text_limit,
                        image_limit,
                        file_limit,
                        text_size_limit,
                        image_size_limit,
                        file_size_limit,
                        tokenRefresh: Date.now()
                    }
                }
            );
        }

        const userClips = await clipCollection.find({ id: userId }).toArray();
        if (!userClips) {
            return res.status(404).json({
                error: 'No clips found for the user',
                code: 'NO_CLIPS_FOUND'
            });
        }

        userClips.forEach(clip => {
            delete clip._id;
            delete clip.id;
        });

        res.status(200).json({ userClips });
    } 
    catch (error) {
        console.error('Error in /clips route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/upload-image', upload.single('image') , async (req, res) => {
    try {
        console.log("recieved")
        if (!req.file) {
            return res.status(400).json({
                error: 'No image file provided',
                code: 'NO_IMAGE_FILE'
            });
        }

        const heading = req.body.heading;
        if (!heading || !heading.trim()) {
            return res.status(400).json({
                error: 'Heading is required',
                code: 'HEADING_REQUIRED'
            });
        }

        if (heading.length > 20) {
            return res.status(400).json({
                error: 'Heading cannot exceed 20 characters',
                code: 'HEADING_TOO_LONG'
            });
        }

        const userId = req.userId;
        const user = await getAuthCollection().findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        const extension = req.file.originalname.substring(req.file.originalname.lastIndexOf('.')).toLowerCase();
        
        if (!ALLOWED_IMAGE_TYPES.includes(extension)) {
            return res.status(400).json({
                error: `Invalid image type. Allowed types are: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
                code: 'INVALID_IMAGE_TYPE'
            });
        }

        let userClip = await getOrCreateUserClip(userId, user);

        if (userClip.image_limit <= 0) {
            return res.status(403).json({
                error: 'Image clip limit reached. Upgrade your plan to add more clips.',
                code: 'IMAGE_CLIP_LIMIT_REACHED'
            });
        }

        // Check if file size exceeds plan limit (convert limit from MB to bytes)
        if (req.file.size > userClip.image_size_limit * 1024 * 1024) {
            return res.status(400).json({
                error: `Image size exceeds the maximum limit of ${userClip.image_size_limit}MB`,
                code: 'IMAGE_SIZE_EXCEEDED'
            });
        }

        // Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, 'images', 'image');

        // Store the URL and other details in database
        const imageId = new ObjectId().toString();
        const imageDetails = {
            id: imageId,
            heading: heading,
            url: cloudinaryResult.secure_url,
            publicId: cloudinaryResult.public_id,
            format: cloudinaryResult.format,
            size: cloudinaryResult.bytes,
            createdAt: Date.now()
        };

        userClip.image.push(imageDetails);
        userClip.lastUpdatedAt = Date.now();

        // Update the database
        const clipCollection = getClipCollection();
        await clipCollection.updateOne(
            { id: userId },
            { 
                $set: { 
                    ...userClip,
                    image_limit: userClip.image_limit - 1
                }
            },
            { upsert: true }
        );

        res.status(200).json({
            message: 'Image uploaded successfully',
            imageDetails,
            lastUpdatedAt: userClip.lastUpdatedAt,
            code: 'IMAGE_UPLOAD_SUCCESSFUL'
        });

    } catch(err) {
        console.error('Error in /upload-image route:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/upload-file' , upload.single('file'), async (req, res) => {
    try {
        console.log(69)
        if (!req.file) {
            return res.status(400).json({
                error: 'No file provided',
                code: 'NO_FILE'
            });
        }
        

        const userId = req.userId;
        const user = await getAuthCollection().findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        const extension = req.file.originalname.substring(req.file.originalname.lastIndexOf('.')).toLowerCase();
       console.log(extension)
        if (!ALLOWED_FILE_TYPES.includes(extension)) {
            return res.status(400).json({
                error: `Invalid file type. Allowed types are: ${ALLOWED_FILE_TYPES.join(', ')}`,
                code: 'INVALID_FILE_TYPE'
            });
        }

        
        let userClip = await getOrCreateUserClip(userId, user);

        if (userClip.file_limit <= 0) {
            return res.status(403).json({
                error: 'File clip limit reached. Upgrade your plan to add more clips.',
                code: 'FILE_CLIP_LIMIT_REACHED'
            });
        }

        // Check if file size exceeds plan limit (convert limit from MB to bytes)
        if (req.file.size > userClip.file_size_limit * 1024 * 1024) {
            return res.status(400).json({
                error: `File size exceeds the maximum limit of ${userClip.file_size_limit}MB`,
                code: 'FILE_SIZE_EXCEEDED'
            });
        }

        // Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, 'files', 'raw');
      
    
        const fileId = new ObjectId().toString();
        const heading = req.body.heading;
        if (!heading || !heading.trim()) {
            return res.status(400).json({
                error: 'Heading is required',
                code: 'HEADING_REQUIRED'
            });
        }
        const fileDetails = {
            id: fileId,
            heading: heading,
            url: cloudinaryResult.secure_url,
            publicId: cloudinaryResult.public_id,
            format: extension.replace('.', ''),
            size: cloudinaryResult.bytes,
            originalName: req.file.originalname,
            createdAt: Date.now()
        };

        userClip.file.push(fileDetails);
        userClip.lastUpdatedAt = Date.now();

        // Update the database
        const clipCollection = getClipCollection();
        await clipCollection.updateOne(
            { id: userId },
            { 
                $set: { 
                    ...userClip,
                    file_limit: userClip.file_limit - 1
                }
            },
            { upsert: true }
        );

        res.status(200).json({
            message: 'File uploaded successfully',
            fileDetails,
            lastUpdatedAt: userClip.lastUpdatedAt,
            code: 'FILE_UPLOAD_SUCCESSFUL'
        });

    } 
    catch(err) {
        console.error('Error in /upload-file route:', err);
        res.status(500).json({ error: 'Internal Server Error' , msg : err.message});
    }
});

router.post('/upload-profile-pic', upload.single('profilePic'), async (req, res) => {
    try{
        if (!req.file) {
            return res.status(400).json({
                error: 'No profile picture file provided',
                code: 'NO_PROFILE_PIC_FILE'
            });
        }

        const userId = req.userId;
        const user = await getAuthCollection().findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }
        const extension = req.file.originalname.substring(req.file.originalname.lastIndexOf('.')).toLowerCase();
        console.log(extension);
        if (!ALLOWED_IMAGE_TYPES.includes(extension)) {
            return res.status(400).json({
                error: `Invalid profile picture type. Allowed types are: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
                code: 'INVALID_IMAGE_TYPE'
            });
        }

        if (user.profile) {
            const urlParts = user.profile.split('/');
            const publicIdWithExtension = urlParts[urlParts.length - 1];
            const publicId = publicIdWithExtension.split('.')[0];
            const fullPublicId = `profile_pics/${publicId}`;
            await deleteFile(fullPublicId,'image');
        }
        

        // Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer, 'profile_pics', 'image');

        // Update user document with profile picture URL
        await getAuthCollection().updateOne(
            { _id: new ObjectId(userId) },
            { $set: { profile: cloudinaryResult.secure_url } }
        );

        res.status(200).json({
            message: 'Profile picture uploaded successfully',
            profilePicUrl: cloudinaryResult.secure_url,
            code: 'PROFILE_PIC_UPLOAD_SUCCESSFUL'
        });
    }
    catch(err){
        console.error('Error in /upload-profile-pic route:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/remove-profile-pic', async (req, res) => {
    try{
        const userId = req.userId;
        const authCollection = getAuthCollection();
        const user = await authCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        if(!user.profile){
            return res.status(400).json({
                error: 'No profile picture to remove',
                code: 'NO_PROFILE_PIC'
            });
        }
        const urlParts = user.profile.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        const fullPublicId = `profile_pics/${publicId}`;
        
        await deleteFile(fullPublicId,'image');
        await authCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { profile: null } }
        );

        res.status(200).json({
            message: 'Profile picture removed successfully',
            code: 'PROFILE_PIC_REMOVED_SUCCESSFULLY'
        });
    }
    catch(err){
        console.error('Error in /remove-profile-pic route:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.post('/clips/reset', async (req, res) => {
    try{
        const { deviceInfo } = req.body;
        const userId = req.userId;

        const clipCollection = getClipCollection();
        
        const userClip = await clipCollection.findOne({ id: userId });

        if (!userClip) {
            return res.status(404).json({
                error: 'No clips found for user',
                code: 'NO_CLIPS_FOUND'
            });
        }

        const imageIds = userClip.image?.map((img) => img.publicId) || [];
        const fileIds = userClip.file?.map((file) => file.publicId) || [];

        // // Delete from Cloudinary
        const [imageResults, fileResults] = await Promise.all([
            imageIds.length > 0 ? deleteMultipleFiles(imageIds,'image') : Promise.resolve(null),
            fileIds.length > 0 ? deleteMultipleFiles(fileIds,'raw') : Promise.resolve(null),
        ]);
        await clipCollection.updateOne(
            { id: userId },
            { 
                $set: { 
                    text: [],
                    image: [],
                    file: [],
                    lastUpdatedAt: Date.now()
                } 
            }
        );
        res.status(200).json({
            message: 'All clips have been reset successfully',
            code: 'CLIPS_RESET_SUCCESSFULLY'
        });
    }
    catch(err){
        console.error('Error in /reset/clips route:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/remove-media', async (req, res) => {
    try {
        const { id , type} = req.body; 
        const userId = req.userId;

        const clipCollection = getClipCollection();
        const userClip = await clipCollection.findOne({ id: userId });

        if (!userClip) {
            return res.status(404).json({
                error: 'No clips found for user',
                code: 'NO_CLIPS_FOUND'
            });
        }

        
        let mediaArray;
        if(type === 'image'){
            mediaArray = userClip.image;
        } else if(type === 'file'){
            mediaArray = userClip.file;
        } else {
            return res.status(400).json({
                error: 'Invalid media type',
                code: 'INVALID_MEDIA_TYPE'
            });
        }

        
        const mediaIndex = mediaArray.findIndex(item => item.publicId === id);
      

        if (mediaIndex === -1) {
            return res.status(404).json({
                error: `${type.charAt(0).toUpperCase() + type.slice(1)} not found`,
                code: `${type.toUpperCase()}_NOT_FOUND`
            });
        }
        
        // Delete from Cloudinary
        await deleteFile(id,type);

        // Remove from database
        mediaArray.splice(mediaIndex, 1);
        
        await clipCollection.updateOne(
            { id: userId },
            { 
                $set: { 
                    [type]: mediaArray,
                    lastUpdatedAt: Date.now()
                } 
            }   
        );

        res.status(200).json({
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} removed successfully`,
            code: `${type.toUpperCase()}_REMOVED_SUCCESSFULLY`
        });
    } catch (err) {
        console.error('Error in /remove-media route:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



export default router;

