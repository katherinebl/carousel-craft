import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, FabricImage, Line, FabricText, Rect } from 'fabric';
import { useCanvasStore } from '../../store/canvasStore';
import { optimizeImage, fileToDataURL } from '../../utils/imageUtils';

const CanvasEditor = () => {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const containerRef = useRef(null);
    const { slideCount, slideWidth, slideHeight, canvasWidth, canvasHeight, images, updateImage, setSelectedImageId, addImage, setSlideDimensions } = useCanvasStore();
    const [isResizing, setIsResizing] = useState(false);
    const [isProcessingDrop, setIsProcessingDrop] = useState(false);
    const startPosRef = useRef({ x: 0, y: 0, w: 0, h: 0, ratio: 1 });
    const currentSizeRef = useRef({ w: 0, h: 0 });
    const requestRef = useRef();

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new Canvas(canvasRef.current, {
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: '#ffffff',
            preserveObjectStacking: true,
        });

        fabricRef.current = canvas;

        // Handle object selection
        canvas.on('selection:created', (e) => setSelectedImageId(e.selected[0]?.id));
        canvas.on('selection:updated', (e) => setSelectedImageId(e.selected[0]?.id));
        canvas.on('selection:cleared', () => setSelectedImageId(null));

        // Handle object modification
        canvas.on('object:modified', (e) => {
            const obj = e.target;
            if (obj && obj.id) {
                updateImage(obj.id, {
                    left: obj.left,
                    top: obj.top,
                    scaleX: obj.scaleX,
                    scaleY: obj.scaleY,
                    angle: obj.angle,
                });
            }
        });

        drawTemplate(canvas);

        return () => {
            canvas.dispose();
        };
    }, []);

    // Sync dimensions
    useEffect(() => {
        if (fabricRef.current && containerRef.current) {
            const canvas = fabricRef.current;

            // Update CSS variables
            containerRef.current.style.setProperty('--canvas-width', `${canvasWidth}px`);
            containerRef.current.style.setProperty('--canvas-height', `${canvasHeight}px`);

            canvas.setDimensions({ width: canvasWidth, height: canvasHeight });
            drawTemplate(canvas);
        }
    }, [canvasWidth, canvasHeight, slideCount]);

    // Sync images
    useEffect(() => {
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;

        const syncImages = async () => {
            const imageObjects = canvas.getObjects().filter(obj => obj.id && !obj.name?.startsWith('template'));

            for (const imgData of images) {
                const exists = imageObjects.find((obj) => obj.id === imgData.id);
                if (!exists) {
                    try {
                        const img = await FabricImage.fromURL(imgData.url, {
                            crossOrigin: 'anonymous'
                        });

                        img.set({
                            id: imgData.id,
                            left: imgData.left || 0,
                            top: imgData.top || 0,
                            scaleX: imgData.scaleX || 0.5,
                            scaleY: imgData.scaleY || 0.5,
                        });

                        img.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });
                        canvas.add(img);
                    } catch (err) {
                        console.error(err);
                    }
                } else {
                    // Update existing image properties if they changed (e.g., during resize)
                    exists.set({
                        left: imgData.left,
                        top: imgData.top,
                        scaleX: imgData.scaleX,
                        scaleY: imgData.scaleY
                    });
                    exists.setCoords();
                }
            }

            imageObjects.forEach((obj) => {
                if (!images.find(img => img.id === obj.id)) {
                    canvas.remove(obj);
                }
            });

            canvas.renderAll();
        };

        syncImages();
    }, [images]);

    const drawTemplate = useCallback((canvas) => {
        // Remove existing template elements
        const templateObjs = canvas.getObjects().filter(obj => obj.name && obj.name.startsWith('template'));
        templateObjs.forEach(obj => canvas.remove(obj));

        for (let i = 0; i < slideCount; i++) {
            const x = i * slideWidth;

            // Slide border
            if (i > 0) {
                const line = new Line([x, 0, x, slideHeight], {
                    stroke: '#e2e8f0',
                    strokeWidth: 4,
                    strokeDashArray: [20, 20],
                    selectable: false,
                    evented: false,
                    name: 'template-line'
                });
                canvas.add(line);
                canvas.sendObjectToBack(line);
            }

            // Slide label
            const text = new FabricText(`SLIDE ${i + 1}`, {
                left: x + (slideWidth / 2),
                top: slideHeight / 2,
                fontSize: Math.max(20, slideHeight * 0.08),
                fontWeight: 'bold',
                fill: '#f1f5f9',
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
                name: 'template-text'
            });
            canvas.add(text);
            canvas.sendObjectToBack(text);
        }
        canvas.renderAll();
    }, [slideCount, slideWidth, slideHeight]);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleResizeStart = (e) => {
        e.preventDefault();
        setIsResizing(true);
        startPosRef.current = {
            x: e.clientX,
            y: e.clientY,
            w: slideWidth,
            h: slideHeight,
            ratio: slideWidth / slideHeight
        };
    };

    const handleResizeMove = useCallback((e) => {
        if (!isResizing || !containerRef.current || !fabricRef.current) return;

        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }

        requestRef.current = requestAnimationFrame(() => {
            const deltaX = (e.clientX - startPosRef.current.x) / 0.4;
            let newSlideWidth = Math.max(200, startPosRef.current.w + (deltaX / slideCount));
            let newSlideHeight = newSlideWidth / startPosRef.current.ratio;

            const newCanvasWidth = newSlideWidth * slideCount;
            const newCanvasHeight = newSlideHeight;

            currentSizeRef.current = { w: newSlideWidth, h: newSlideHeight };

            // 1. Update DOM via CSS variables (Ultra Fast)
            containerRef.current.style.setProperty('--canvas-width', `${newCanvasWidth}px`);
            containerRef.current.style.setProperty('--canvas-height', `${newCanvasHeight}px`);

            // 2. Update Fabric dimensions (Directly)
            const canvas = fabricRef.current;
            canvas.setDimensions({ width: newCanvasWidth, height: newCanvasHeight });

            // 3. Update images in Fabric directly during drag
            const ratio = newSlideWidth / slideWidth;
            const objects = canvas.getObjects().filter(obj => obj.id && !obj.name?.startsWith('template'));

            objects.forEach(obj => {
                const imgData = images.find(img => img.id === obj.id);
                if (imgData) {
                    obj.set({
                        left: imgData.left * ratio,
                        top: imgData.top * ratio,
                        scaleX: imgData.scaleX * ratio,
                        scaleY: imgData.scaleY * ratio
                    });
                    obj.setCoords();
                }
            });

            // 4. Update template
            drawTemplate(canvas);
        });
    }, [isResizing, slideCount, slideWidth, slideHeight, images, drawTemplate]);

    const handleResizeEnd = useCallback(() => {
        if (isResizing && currentSizeRef.current.w > 0) {
            setSlideDimensions(currentSizeRef.current.w, currentSizeRef.current.h);
        }
        setIsResizing(false);
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
    }, [isResizing, setSlideDimensions]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
        } else {
            window.removeEventListener('mousemove', handleResizeMove);
            window.removeEventListener('mouseup', handleResizeEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleResizeMove);
            window.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [isResizing, handleResizeMove, handleResizeEnd]);

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        setIsProcessingDrop(true);

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                try {
                    // 1. Optimize
                    const { compressedFile } = await optimizeImage(file);
                    const dataUrl = await fileToDataURL(compressedFile);

                    // 2. Process for Canvas
                    const img = new Image();
                    await new Promise((resolve) => {
                        img.onload = () => {
                            const scaleX = slideWidth / img.width;
                            const scaleY = slideHeight / img.height;
                            const scale = Math.max(scaleX, scaleY);

                            const scaledWidth = img.width * scale;
                            const scaledHeight = img.height * scale;

                            const rect = canvasRef.current.getBoundingClientRect();
                            const x = (e.clientX - rect.left) / 0.4;

                            const slideIndex = Math.max(0, Math.min(slideCount - 1, Math.floor(x / slideWidth)));
                            const slideStart = slideIndex * slideWidth;

                            const left = slideStart + (slideWidth - scaledWidth) / 2;
                            const top = (slideHeight - scaledHeight) / 2;

                            addImage({
                                id: Math.random().toString(36).substr(2, 9),
                                url: dataUrl,
                                name: file.name,
                                left: left,
                                top: top,
                                scaleX: scale,
                                scaleY: scale,
                            });
                            resolve();
                        };
                        img.src = dataUrl;
                    });
                } catch (error) {
                    console.error('Drop processing failed:', error);
                }
            }
        }
        setIsProcessingDrop(false);
    };

    return (
        <div
            className="relative shadow-inner bg-slate-100 p-8 rounded-3xl"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div
                ref={containerRef}
                className={`canvas-container relative shadow-2xl border-[20px] border-white rounded-xl bg-white transition-all transform origin-top-left scale-[0.4] ${isResizing ? 'cursor-grabbing transition-none' : ''}`}
            >
                <div className="overflow-hidden w-full h-full relative">
                    <canvas ref={canvasRef} />

                    {/* Drop Processing Overlay */}
                    {isProcessingDrop && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                            <p className="text-blue-600 font-bold text-2xl animate-pulse text-center">
                                OPTIMIZING FOR INSTAGRAM...
                            </p>
                        </div>
                    )}
                </div>

                {/* Resize Handle */}
                <div
                    onMouseDown={handleResizeStart}
                    className="absolute bottom-0 right-0 w-12 h-12 bg-blue-600 cursor-nwse-resize flex items-center justify-center rounded-tl-2xl shadow-lg z-50 hover:bg-blue-700 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default CanvasEditor;
