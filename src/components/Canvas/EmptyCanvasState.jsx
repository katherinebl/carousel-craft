import React, { useRef, useState } from 'react';
import { useImageUpload } from '../../hooks/useImageUpload';

const EmptyCanvasState = () => {
    const { processFiles, isProcessing } = useImageUpload();
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };
    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragOver(false);
        await processFiles(Array.from(e.dataTransfer.files));
    };
    const handleFileInput = async (e) => {
        await processFiles(Array.from(e.target.files));
        e.target.value = '';
    };

    return (
        <div
            className={`flex-1 h-full flex items-center justify-center transition-colors duration-150 ${isDragOver ? 'bg-brand-50' : 'bg-slate-200'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={`flex flex-col items-center gap-5 text-center px-8 py-8 md:px-16 md:py-12 mx-4 md:mx-0 border-2 border-dashed rounded-3xl cursor-pointer transition-colors duration-150 ${isDragOver ? 'border-brand-400 bg-white/80' : 'border-slate-300 bg-white/50 hover:border-brand-300 hover:bg-white/70'}`}
            >
                {isProcessing ? (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-brand-500" />
                        <p className="text-sm font-bold text-brand-500 uppercase tracking-widest animate-pulse">Optimizing…</p>
                    </>
                ) : (
                    <>
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-150 ${isDragOver ? 'bg-brand-100' : 'bg-white shadow-sm'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 transition-colors duration-150 ${isDragOver ? 'text-brand-500' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className={`text-base font-bold transition-colors duration-150 ${isDragOver ? 'text-brand-600' : 'text-slate-500'}`}>
                                {isDragOver ? 'Release to add photos' : 'Drop your photos here'}
                            </p>
                            {!isDragOver && (
                                <p className="text-sm text-slate-400 mt-1">
                                    or <span className="text-brand-500 font-semibold">click to browse</span>
                                </p>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">PNG · JPG · WebP</p>
                    </>
                )}
            </div>

            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileInput} />
        </div>
    );
};

export default EmptyCanvasState;
