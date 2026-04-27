import React, { useRef, useState } from 'react';
import { useImageUpload } from '../../hooks/useImageUpload';
import { formatSize } from '../../utils/imageUtils';

const ImageUploader = () => {
    const fileInputRef = useRef(null);
    const { processFiles, isProcessing } = useImageUpload();
    const [optimizationLog, setOptimizationLog] = useState(null);

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setOptimizationLog(null);
        const totalBefore = files.reduce((sum, f) => sum + f.size, 0);
        await processFiles(files);

        setOptimizationLog(formatSize(totalBefore));
        setTimeout(() => setOptimizationLog(null), 3000);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-4">
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className={`w-full py-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-widest ${isProcessing
                    ? 'bg-brand-50 border-brand-200 text-brand-500 cursor-wait'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 shadow-sm'
                    }`}
            >
                {isProcessing ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Optimizing...</span>
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Add Photos</span>
                    </>
                )}
            </button>

            {optimizationLog && (
                <div className="text-center animate-fade-in">
                    <span className="text-[10px] font-bold text-green-500 uppercase bg-green-50 px-2 py-1 rounded-full">
                        ✨ Optimized: {optimizationLog}
                    </span>
                </div>
            )}

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
