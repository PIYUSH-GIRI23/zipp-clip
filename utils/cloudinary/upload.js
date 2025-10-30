import cloudinary from './config.js';
import streamifier from 'streamifier';

export const uploadToCloudinary = (buffer, folder, fileType) => {
  return new Promise((resolve, reject) => {
    try {
      const uploadOptions = {
        folder,
        resource_type: fileType === 'image' ? 'image' : 'raw', // auto can cause issues
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // streamifier is much more stable for buffers than manual Readable
      streamifier.createReadStream(buffer).pipe(uploadStream);
    } catch (err) {
      console.error('Error in uploadToCloudinary:', err);
      reject(err);
    }
  });
};
