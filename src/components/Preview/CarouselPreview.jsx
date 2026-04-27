import React, { useState, useEffect, useRef } from 'react';
import { useCanvasStore } from '../../store/canvasStore';

const CarouselPreview = () => {
    const { slideCount, images, canvasWidth, canvasHeight, slideWidth, slideHeight } = useCanvasStore();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slides, setSlides] = useState([]);

    const previewRef = useRef(null);

    useEffect(() => {
        if (previewRef.current) {
            const previewWidth = Math.min(540, window.innerWidth * 0.82);
            const previewHeight = (previewWidth * slideHeight) / slideWidth;
            previewRef.current.style.setProperty('--preview-width', `${previewWidth}px`);
            previewRef.current.style.setProperty('--preview-height', `${previewHeight}px`);
        }
    }, [slideWidth, slideHeight]);

    useEffect(() => {
        const generateSlides = async () => {
            const newSlides = [];
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvasWidth;
            tempCanvas.height = canvasHeight;
            const ctx = tempCanvas.getContext('2d');

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

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
    }, [images, slideCount, slideWidth, slideHeight, canvasWidth, canvasHeight]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slideCount);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount);

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 p-6 md:p-12 overflow-hidden">
            <div className="text-center mb-4 md:mb-8">
                <h2 className="text-lg md:text-2xl font-bold text-slate-800 tracking-tight">Preview Mode</h2>
                <p className="text-slate-500 text-xs md:text-sm">Slide {currentSlide + 1} of {slideCount}</p>
            </div>

            <div
                ref={previewRef}
                className="preview-window-container relative bg-white shadow-2xl rounded-sm overflow-hidden border border-slate-200 max-h-[70vh]"
            >
                {slides.length > 0 ? (
                    <img
                        src={slides[currentSlide]}
                        alt={`Slide ${currentSlide + 1}`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 italic text-sm">
                        Generating preview...
                    </div>
                )}

                {/* Navigation Arrows — overlaid inside the image */}
                <button
                    onClick={prevSlide}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md text-slate-500 hover:text-blue-600 hover:scale-110 transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md text-slate-500 hover:text-blue-600 hover:scale-110 transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            <div className="mt-4 md:mt-8 flex gap-2 flex-wrap justify-center max-w-xs md:max-w-none">
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
