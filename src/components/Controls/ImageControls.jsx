import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';

const ImageControls = () => {
    const { selectedImageId, images, removeImage, clearImages } = useCanvasStore();

    const handleClearAll = () => {
        if (window.confirm('Clear all images? This cannot be undone.')) {
            clearImages();
        }
    };

    return (
        <div className="space-y-3">
            {selectedImageId ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-inner">
                    <span className="text-sm font-semibold text-slate-700 truncate mr-2" title={images.find(img => img.id === selectedImageId)?.name}>
                        {images.find(img => img.id === selectedImageId)?.name || 'Image'}
                    </span>
                    <button
                        onClick={() => removeImage(selectedImageId)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors shrink-0"
                        title="Delete selected image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-sm text-slate-400 italic">Select an image to delete it</p>
                </div>
            )}

            {images.length > 0 && (
                <button
                    onClick={handleClearAll}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-all"
                >
                    Clear all images
                </button>
            )}
        </div>
    );
};

export default ImageControls;
