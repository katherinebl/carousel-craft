import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useCanvasStore } from '../../store/canvasStore';

const ExportButton = () => {
    const { images, slideCount, canvasWidth, canvasHeight, slideWidth, slideHeight } = useCanvasStore();
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (images.length === 0) {
            alert('Add some images first!');
            return;
        }

        setIsExporting(true);
        try {
            const zip = new JSZip();
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvasWidth;
            tempCanvas.height = canvasHeight;
            const ctx = tempCanvas.getContext('2d');

            // 1. Draw background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // 2. Draw images
            for (const imgData of images) {
                await new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.src = imgData.url;
                    img.onload = () => {
                        ctx.save();
                        ctx.translate(imgData.left, imgData.top);
                        ctx.scale(imgData.scaleX, imgData.scaleY);
                        ctx.drawImage(img, 0, 0);
                        ctx.restore();
                        resolve();
                    };
                });
            }

            // 3. Slice and Zip
            for (let i = 0; i < slideCount; i++) {
                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = slideWidth;
                sliceCanvas.height = slideHeight;
                const sliceCtx = sliceCanvas.getContext('2d');
                sliceCtx.drawImage(tempCanvas, i * slideWidth, 0, slideWidth, slideHeight, 0, 0, slideWidth, slideHeight);

                const blob = await new Promise(resolve => sliceCanvas.toBlob(resolve, 'image/jpeg', 0.95));
                zip.file(`slide-${String(i + 1).padStart(2, '0')}.jpg`, blob);
            }

            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, 'instagram-carousel.zip');
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className={`relative overflow-hidden bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-semibold text-sm transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
        >
            <span className={isExporting ? 'opacity-0' : 'opacity-100'}>
                <span className="hidden sm:inline">Export Carousel</span>
                <span className="sm:hidden">Export</span>
            </span>
            {isExporting && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            )}
        </button>
    );
};

export default ExportButton;
