import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';

const ImageControls = () => {
    const { selectedImageId, images, reorderImage, removeImage } = useCanvasStore();

    if (!selectedImageId) return (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
            <p className="text-sm text-slate-400 italic">Select an image on the canvas to see controls</p>
        </div>
    );

    const selectedImage = images.find(img => img.id === selectedImageId);

    return (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4 shadow-inner">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 truncate mr-2" title={selectedImage?.name}>
                    Selected: {selectedImage?.name || 'Image'}
                </h3>
                <button
                    onClick={() => removeImage(selectedImageId)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors"
                    title="Delete Image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => reorderImage(selectedImageId, 'front')}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Bring to Front
                </button>
                <button
                    onClick={() => reorderImage(selectedImageId, 'back')}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Send to Back
                </button>
            </div>
        </div>
    );
};

export default ImageControls;
