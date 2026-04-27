import imageCompression from 'browser-image-compression';

// MozJPEG state — lazily initialised on first upload, cached for subsequent ones
let _mozjpegEncode = null;
let _mozjpegAvailable = null; // null = untested | true = ok | false = failed

async function getMozjpegEncoder() {
    if (_mozjpegAvailable === false) return null;
    if (_mozjpegAvailable === true) return _mozjpegEncode;

    try {
        const { default: encode } = await import('@jsquash/jpeg/encode');

        // Canary: encode a 2×2 test image — proves WASM loaded and runs
        const testPixels = new Uint8ClampedArray([
            255, 0, 0, 255,   0, 255, 0, 255,
            0, 0, 255, 255,   255, 255, 0, 255,
        ]);
        await encode(new ImageData(testPixels, 2, 2), { quality: 75 });

        _mozjpegEncode = encode;
        _mozjpegAvailable = true;
        console.info('[ImageOptimizer] MozJPEG ready ✓');
        return encode;
    } catch (e) {
        _mozjpegAvailable = false;
        console.warn('[ImageOptimizer] MozJPEG unavailable, using fallback:', e.message);
        return null;
    }
}

// Phase 4: smart sizing — resize to maxDimension before encoding
function getImageData(file, maxDimension) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(url);
            resolve(ctx.getImageData(0, 0, w, h));
        };
        img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
        img.src = url;
    });
}

// Phase 2: MozJPEG primary, browser-image-compression fallback
// Phase 4: maxDimension defaults to 3840 (4K — sufficient for any Instagram use case)
export const optimizeImage = async (file, maxDimension = 3840) => {
    const originalSize = file.size;

    const encode = await getMozjpegEncoder();

    if (encode) {
        try {
            const imageData = await getImageData(file, maxDimension);
            // quality 82 = TinyPNG's typical range for photos: perceptually lossless
            const buffer = await encode(imageData, { quality: 82 });
            const compressedFile = new Blob([buffer], { type: 'image/jpeg' });
            return { compressedFile, originalSize, compressedSize: compressedFile.size };
        } catch (e) {
            console.warn('[ImageOptimizer] MozJPEG encode failed, falling back:', e.message);
        }
    }

    // Fallback: browser-image-compression with best available settings
    const compressedFile = await imageCompression(file, {
        maxSizeMB: 5,
        maxWidthOrHeight: maxDimension,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.92,
    });
    return { compressedFile, originalSize, compressedSize: compressedFile.size };
};

export const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
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
