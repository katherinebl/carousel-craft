import React, { useState, useEffect, useRef } from 'react';
import { useCanvasStore } from '../../store/canvasStore';

const CarouselPreview = () => {
    const { slideCount, images, canvasWidth, canvasHeight, slideWidth, slideHeight } = useCanvasStore();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slides, setSlides] = useState([]);
    const canvasRef = useRef(null);

    const previewRef = useRef(null);

    useEffect(() => {
        if (previewRef.current) {
            const previewWidth = 540;
            const previewHeight = (previewWidth * slideHeight) / slideWidth;
            previewRef.current.style.setProperty('--preview-width', `${previewWidth}px`);
            previewRef.current.style.setProperty('--preview-height', `${previewHeight}px`);
        }
    }, [slideWidth, slideHeight]);

    useEffect(() => {
        // Generate slice previews
        const generateSlides = async () => {
            const newSlides = [];
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvasWidth;
            tempCanvas.height = canvasHeight;
            const ctx = tempCanvas.getContext('2d');

            // 1. Draw background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // 2. Draw images in order
            for (const imgData of images) {
                await new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.src = imgData.url;
                    img.onload = () => {
                        ctx.save();
                        ctx.translate(imgData.left, imgData.top);
                        ctx.scale(imgData.scaleX, imgData.scaleY);
                        // Fabric stores position as top-left by default in our current setup
                        ctx.drawImage(img, 0, 0);
                        ctx.restore();
                        resolve();
                    };
                });
            }

            // 3. Slice the canvas
            for (let i = 0; i < slideCount; i++) {
                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = slideWidth;
                sliceCanvas.height = slideHeight;
                const sliceCtx = sliceCanvas.getContext('2d');
                sliceCtx.drawImage(tempCanvas, i * slideWidth, 0, slideWidth, slideHeight, 0, 0, slideWidth, slideHeight);
                newSlides.push(sliceCanvas.toDataURL('image/jpeg', 0.9));
            }

            setSlides(newSlides);
        };

        generateSlides();
    }, [images, slideCount, canvasWidth, canvasHeight]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slideCount);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount);

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 p-12 overflow-hidden">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Preview Mode</h2>
                <p className="text-slate-500 text-sm">Slide {currentSlide + 1} of {slideCount}</p>
            </div>

            <div className="relative group">
                <div
                    ref={previewRef}
                    className="preview-window-container bg-white shadow-2xl rounded-sm overflow-hidden border border-slate-200 max-h-[70vh]"
                >
                    {slides.length > 0 ? (
                        <img
                            src={slides[currentSlide]}
                            alt={`Slide ${currentSlide + 1}`}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 italic">
                            Generating preview...
                        </div>
                    )}
                </div>

                {/* Navigation Arrows */}
                <button
                    onClick={prevSlide}
                    className="absolute left-[-60px] top-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-lg text-slate-400 hover:text-blue-600 hover:scale-110 transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute right-[-60px] top-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-lg text-slate-400 hover:text-blue-600 hover:scale-110 transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            <div className="mt-8 flex gap-2">
                {Array.from({ length: slideCount }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`h-2 transition-all rounded-full ${i === currentSlide ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default CarouselPreview;
