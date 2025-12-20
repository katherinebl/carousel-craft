import imageCompression from 'browser-image-compression';

export const optimizeImage = async (file) => {
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 2160,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.8
    };

    try {
        const compressedFile = await imageCompression(file, options);
        return {
            compressedFile,
            originalSize: file.size,
            compressedSize: compressedFile.size
        };
    } catch (error) {
        console.error('Image compression failed:', error);
        throw error;
    }
};

export const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
};

export const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
