import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, FabricImage, Line, FabricText } from 'fabric';
import { useCanvasStore } from '../../store/canvasStore';
import { useImageUpload } from '../../hooks/useImageUpload';

const LONG_PRESS_MS = 500;
const MOVE_THRESHOLD_PX = 10;

const CanvasEditor = () => {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const containerRef = useRef(null);
    const { slideCount, slideWidth, slideHeight, canvasWidth, canvasHeight, images, updateImage, setSelectedImageId, addImage, setSlideDimensions } = useCanvasStore();
    const { processFiles, isProcessing } = useImageUpload();
    const [isResizing, setIsResizing] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const startPosRef = useRef({ x: 0, y: 0, w: 0, h: 0, ratio: 1 });
    const currentSizeRef = useRef({ w: 0, h: 0 });
    const requestRef = useRef();

    // pointer: coarse = touch screen (phone/tablet); pointer: fine = mouse (desktop)
    const isTouchDevice = useRef(
        typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
    );
    const longPressTimer = useRef(null);
    const longPressStartPos = useRef({ x: 0, y: 0 });

    // Convert touch client coords to Fabric canvas space
    const touchToCanvasPoint = useCallback((touch) => {
        if (!fabricRef.current) return { x: 0, y: 0 };
        const canvasEl = fabricRef.current.lowerCanvasEl;
        const rect = canvasEl.getBoundingClientRect();
        const scaleX = rect.width / fabricRef.current.width;
        const scaleY = rect.height / fabricRef.current.height;
        return {
            x: (touch.clientX - rect.left) / scaleX,
            y: (touch.clientY - rect.top) / scaleY,
        };
    }, []);

    // Find the top-most image object under a canvas-space point
    const findImageAtPoint = useCallback((point) => {
        if (!fabricRef.current) return null;
        const objects = fabricRef.current.getObjects()
            .filter(obj => obj.id && !obj.name?.startsWith('template'))
            .reverse();
        return objects.find(obj => {
            const b = obj.getBoundingRect();
            return point.x >= b.left && point.x <= b.left + b.width &&
                   point.y >= b.top  && point.y <= b.top  + b.height;
        }) || null;
    }, []);

    // Revert all images to non-interactive (touch default state)
    const disableAllImageInteraction = useCallback(() => {
        if (!fabricRef.current) return;
        fabricRef.current.getObjects()
            .filter(obj => obj.id && !obj.name?.startsWith('template'))
            .forEach(obj => obj.set({ evented: false, selectable: false }));
        fabricRef.current.renderAll();
    }, []);

    // Long-press touch handlers
    const handleCanvasTouchStart = useCallback((e) => {
        if (!isTouchDevice.current || !fabricRef.current) return;
        const touch = e.touches[0];
        longPressStartPos.current = { x: touch.clientX, y: touch.clientY };

        const point = touchToCanvasPoint(touch);
        const target = findImageAtPoint(point);
        if (!target) return;

        longPressTimer.current = setTimeout(() => {
            longPressTimer.current = null;
            target.set({ evented: true, selectable: true });
            fabricRef.current.setActiveObject(target);
            fabricRef.current.renderAll();
            setSelectedImageId(target.id);
            if (navigator.vibrate) navigator.vibrate(50);
        }, LONG_PRESS_MS);
    }, [touchToCanvasPoint, findImageAtPoint, setSelectedImageId]);

    const handleCanvasTouchMove = useCallback((e) => {
        if (!longPressTimer.current) return;
        const touch = e.touches[0];
        const dx = touch.clientX - longPressStartPos.current.x;
        const dy = touch.clientY - longPressStartPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > MOVE_THRESHOLD_PX) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleCanvasTouchEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    // Suppress context menu on long-press (iOS)
    const handleContextMenu = useCallback((e) => {
        if (isTouchDevice.current) e.preventDefault();
    }, []);

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new Canvas(canvasRef.current, {
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: '#ffffff',
            preserveObjectStacking: true,
            allowTouchScrolling: true,
        });

        fabricRef.current = canvas;

        canvas.on('selection:created', (e) => setSelectedImageId(e.selected[0]?.id));
        canvas.on('selection:updated', (e) => setSelectedImageId(e.selected[0]?.id));
        canvas.on('selection:cleared', () => {
            setSelectedImageId(null);
            if (isTouchDevice.current) disableAllImageInteraction();
        });

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

        return () => { canvas.dispose(); };
    }, []);

    // Sync dimensions
    useEffect(() => {
        if (fabricRef.current && containerRef.current) {
            const canvas = fabricRef.current;
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
                        const img = await FabricImage.fromURL(imgData.url, { crossOrigin: 'anonymous' });
                        img.set({
                            id: imgData.id,
                            left: imgData.left || 0,
                            top: imgData.top || 0,
                            scaleX: imgData.scaleX || 0.5,
                            scaleY: imgData.scaleY || 0.5,
                            evented: !isTouchDevice.current,
                            selectable: !isTouchDevice.current,
                        });
                        img.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });
                        canvas.add(img);
                    } catch (err) {
                        console.error(err);
                    }
                } else {
                    exists.set({
                        left: imgData.left,
                        top: imgData.top,
                        scaleX: imgData.scaleX,
                        scaleY: imgData.scaleY,
                    });
                    exists.setCoords();
                }
            }

            imageObjects.forEach((obj) => {
                if (!images.find(img => img.id === obj.id)) canvas.remove(obj);
            });

            canvas.renderAll();
        };

        syncImages();
    }, [images]);

    const drawTemplate = useCallback((canvas) => {
        const templateObjs = canvas.getObjects().filter(obj => obj.name && obj.name.startsWith('template'));
        templateObjs.forEach(obj => canvas.remove(obj));

        for (let i = 0; i < slideCount; i++) {
            const x = i * slideWidth;

            if (i > 0) {
                const line = new Line([x, 0, x, slideHeight], {
                    stroke: '#e2e8f0',
                    strokeWidth: 4,
                    strokeDashArray: [20, 20],
                    selectable: false,
                    evented: false,
                    name: 'template-line',
                });
                canvas.add(line);
                canvas.sendObjectToBack(line);
            }

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
                name: 'template-text',
            });
            canvas.add(text);
            canvas.sendObjectToBack(text);
        }
        canvas.renderAll();
    }, [slideCount, slideWidth, slideHeight]);

    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };
    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) await processFiles(files);
    };

    const handleResizeStart = (e) => {
        e.preventDefault();
        setIsResizing(true);
        const containerRect = containerRef.current.getBoundingClientRect();
        startPosRef.current = {
            x: e.clientX,
            y: e.clientY,
            w: slideWidth,
            h: slideHeight,
            ratio: slideWidth / slideHeight,
            cssScale: containerRect.width / containerRef.current.offsetWidth,
        };
    };

    const handleResizeMove = useCallback((e) => {
        if (!isResizing || !containerRef.current || !fabricRef.current) return;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);

        requestRef.current = requestAnimationFrame(() => {
            const deltaX = (e.clientX - startPosRef.current.x) / startPosRef.current.cssScale;
            let newSlideWidth = Math.max(200, startPosRef.current.w + (deltaX / slideCount));
            let newSlideHeight = newSlideWidth / startPosRef.current.ratio;
            const newCanvasWidth = newSlideWidth * slideCount;
            const newCanvasHeight = newSlideHeight;

            currentSizeRef.current = { w: newSlideWidth, h: newSlideHeight };

            containerRef.current.style.setProperty('--canvas-width', `${newCanvasWidth}px`);
            containerRef.current.style.setProperty('--canvas-height', `${newCanvasHeight}px`);

            const canvas = fabricRef.current;
            canvas.setDimensions({ width: newCanvasWidth, height: newCanvasHeight });

            const ratio = newSlideWidth / slideWidth;
            canvas.getObjects()
                .filter(obj => obj.id && !obj.name?.startsWith('template'))
                .forEach(obj => {
                    const imgData = images.find(img => img.id === obj.id);
                    if (imgData) {
                        obj.set({
                            left: imgData.left * ratio,
                            top: imgData.top * ratio,
                            scaleX: imgData.scaleX * ratio,
                            scaleY: imgData.scaleY * ratio,
                        });
                        obj.setCoords();
                    }
                });

            drawTemplate(canvas);
        });
    }, [isResizing, slideCount, slideWidth, slideHeight, images, drawTemplate]);

    const handleResizeEnd = useCallback(() => {
        if (isResizing && currentSizeRef.current.w > 0) {
            setSlideDimensions(currentSizeRef.current.w, currentSizeRef.current.h);
        }
        setIsResizing(false);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
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

    return (
        <div
            className={`relative shadow-inner p-8 rounded-3xl transition-colors duration-150 ${isDragOver ? 'bg-brand-50' : 'bg-slate-100'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div
                ref={containerRef}
                className={`canvas-container relative shadow-2xl border-[20px] border-white rounded-xl bg-white transition-all transform origin-top-left scale-[0.4] ${isResizing ? 'cursor-grabbing transition-none' : ''}`}
                onTouchStart={handleCanvasTouchStart}
                onTouchMove={handleCanvasTouchMove}
                onTouchEnd={handleCanvasTouchEnd}
                onContextMenu={handleContextMenu}
            >
                <div className="overflow-hidden w-full h-full relative">
                    <canvas ref={canvasRef} />

                    {isProcessing && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-600 mb-4" />
                            <p className="text-brand-600 font-bold text-2xl animate-pulse text-center">
                                OPTIMIZING FOR INSTAGRAM...
                            </p>
                        </div>
                    )}
                </div>

                <div
                    onMouseDown={handleResizeStart}
                    className="absolute bottom-0 right-0 w-12 h-12 bg-brand-600 cursor-nwse-resize flex items-center justify-center rounded-tl-2xl shadow-lg z-50 hover:bg-brand-700 transition-colors"
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
