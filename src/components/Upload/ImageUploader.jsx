import React, { useRef } from 'react';
import { useCanvasStore } from '../../store/canvasStore';

const ImageUploader = () => {
    const fileInputRef = useRef(null);
    const { addImage, slideWidth, slideHeight } = useCanvasStore();

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const scaleX = slideWidth / img.width;
                    const scaleY = slideHeight / img.height;
                    const scale = Math.max(scaleX, scaleY);

                    const scaledWidth = img.width * scale;
                    const scaledHeight = img.height * scale;

                    // Center in the first slide
                    const left = (slideWidth - scaledWidth) / 2;
                    const top = (slideHeight - scaledHeight) / 2;

                    addImage({
                        id: Math.random().toString(36).substr(2, 9),
                        url: event.target.result,
                        name: file.name,
                        left: left,
                        top: top,
                        scaleX: scale,
                        scaleY: scale,
                    });
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-6">
            <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-400 hover:text-blue-600 font-bold text-xs uppercase tracking-widest"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Photos
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/*"
                className="hidden"
            />
        </div>
    );
};

export default ImageUploader;
