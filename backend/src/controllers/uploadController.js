const { admin, firebaseConfig } = require('../config/firebaseconfig');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

/**
 * Upload Controller
 * Handles file uploads to Firebase Storage with local directory fallback
 */

class UploadController {
    /**
     * Upload Profile Picture
     * POST /api/upload/profile-picture
     */
    static async uploadProfilePicture(req, res, next) {
        try {
            if (!req.file) {
                // Check if file is missing
                logger.warn('Upload attempt with no file');
                return ApiResponse.badRequest(res, 'No file uploaded');
            }

            const file = req.file;
            const uid = req.user.uid;
            let publicUrl;

            // Create unique filename
            const fileExtension = path.extname(file.originalname);
            const fileName = `users/${uid}/profile-${Date.now()}${fileExtension}`;

            // Check if we should fallback to local filesystem storage
            let useLocal = false;
            let bucketName;
            try {
                bucketName = firebaseConfig.storageBucket;
                if (!bucketName || !admin.apps.length) {
                    useLocal = true;
                } else {
                    // Try referencing storage; if it fails, trigger catch block
                    admin.storage();
                }
            } catch (err) {
                useLocal = true;
            }

            if (useLocal) {
                const uploadsDir = path.join(__dirname, '../../uploads');
                if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }

                const localFileName = `profile-${uid}-${Date.now()}${fileExtension}`;
                const localFilePath = path.join(uploadsDir, localFileName);

                fs.writeFileSync(localFilePath, file.buffer);
                publicUrl = `http://localhost:3000/uploads/${localFileName}`;
                logger.info(`Profile picture saved locally: ${publicUrl}`);

                // Update local auth record photoURL
                try {
                    await admin.auth().updateUser(uid, {
                        photoURL: publicUrl
                    });
                } catch (e) {
                    // Ignore auth record update errors in mock
                }
            } else {
                logger.info(`Using storage bucket: ${bucketName}`);
                const bucket = admin.storage().bucket(bucketName);
                const fileRef = bucket.file(fileName);

                // Upload the file with a download token
                const downloadToken = crypto.randomUUID();

                await fileRef.save(file.buffer, {
                    metadata: {
                        contentType: file.mimetype,
                        metadata: {
                            firebaseStorageDownloadTokens: downloadToken
                        }
                    },
                });

                // Construct download URL
                publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(fileName)}?alt=media&token=${downloadToken}`;
                logger.info(`Uploaded to Firebase: ${publicUrl}`);

                await admin.auth().updateUser(uid, {
                    photoURL: publicUrl
                });
            }

            return ApiResponse.success(res, { url: publicUrl }, 'File uploaded successfully');
        } catch (error) {
            logger.error('Error in uploadProfilePicture:', error);
            next(error);
        }
    }
}

module.exports = UploadController;
