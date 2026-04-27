import { useCallback, useState } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { optimizeImage, fileToDataURL } from '../utils/imageUtils';

export function useImageUpload() {
    const { addImage, slideHeight } = useCanvasStore();
    const [isProcessing, setIsProcessing] = useState(false);

    const processFiles = useCallback(async (files) => {
        setIsProcessing(true);
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            try {
                const { compressedFile, originalSize, compressedSize } = await optimizeImage(file);
                const dataUrl = await fileToDataURL(compressedFile);
                await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        const scale = slideHeight / img.height;
                        const scaledWidth = img.width * scale;
                        const left = useCanvasStore.getState().images.reduce(
                            (max, im) => Math.max(max, im.left + (im.scaledWidth || 0)), 0
                        );
                        addImage({
                            id: crypto.randomUUID(),
                            url: dataUrl,
                            name: file.name,
                            left,
                            top: 0,
                            scaleX: scale,
                            scaleY: scale,
                            scaledWidth,
                        });
                        resolve();
                    };
                    img.src = dataUrl;
                });
            } catch (err) {
                console.error('Image processing failed:', err);
            }
        }
        setIsProcessing(false);
    }, [addImage, slideHeight]);

    return { processFiles, isProcessing };
}
