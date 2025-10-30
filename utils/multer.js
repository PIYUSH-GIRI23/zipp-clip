import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

const MIME_TYPE_MAP = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.odt': 'application/vnd.oasis.opendocument.text',
};

// 🧠 parse arrays directly from env (handles both JSON or comma-separated)
function parseEnvArray(envVar) {
  try {
    const val = process.env[envVar];
    if (!val) return [];
    if (val.startsWith('[')) return JSON.parse(val); // if JSON-style array
    return val.split(',').map(v => v.trim()); // fallback for comma-separated
  } catch (err) {
    console.error(`Failed to parse ${envVar}:`, err.message);
    return [];
  }
}

// get allowed mime types dynamically
const getAllowedMimeTypes = () => {
  const extensions = [
    ...parseEnvArray('ALLOWED_IMAGE_TYPES'),
    ...parseEnvArray('ALLOWED_FILE_TYPES'),
  ];
  return extensions.map(ext => MIME_TYPE_MAP[ext]).filter(Boolean);
};

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = getAllowedMimeTypes();
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type. Allowed types: ${Object.keys(MIME_TYPE_MAP).join(', ')}`
        )
      );
    }
  },
});

export default upload;