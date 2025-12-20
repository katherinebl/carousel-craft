import React, { useEffect, useRef } from 'react';
import { Canvas, FabricImage, Line, FabricText, Rect } from 'fabric';
import { useCanvasStore } from '../../store/canvasStore';

const CanvasEditor = () => {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const { slideCount, canvasWidth, canvasHeight, images, updateImage, setSelectedImageId, addImage } = useCanvasStore();

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
        if (fabricRef.current) {
            const canvas = fabricRef.current;
            canvas.setDimensions({ width: canvasHeight, height: canvasHeight }); // Start with one, will sync
            canvas.setDimensions({ width: canvasWidth, height: canvasHeight });
            drawTemplate(canvas);
        }
    }, [canvasWidth, canvasHeight, slideCount]);

    // Sync images
    useEffect(() => {
        if (!fabricRef.current) return;
        const canvas = fabricRef.current;
        const currentObjects = canvas.getObjects('fabric.Image'); // In Fabric 6 it might be different, let's use type filter

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

    const drawTemplate = (canvas) => {
        // Remove existing template elements
        const templateObjs = canvas.getObjects().filter(obj => obj.name && obj.name.startsWith('template'));
        templateObjs.forEach(obj => canvas.remove(obj));

        for (let i = 0; i < slideCount; i++) {
            const x = i * 1080;

            // Slide border
            if (i > 0) {
                const line = new Line([x, 0, x, canvasHeight], {
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
                left: x + 540,
                top: 540,
                fontSize: 80,
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
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const files = Array.from(e.dataTransfer.files);
        files.forEach((file) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const targetSize = 1080;
                        const scaleX = targetSize / img.width;
                        const scaleY = targetSize / img.height;
                        const scale = Math.max(scaleX, scaleY);

                        const scaledWidth = img.width * scale;
                        const scaledHeight = img.height * scale;

                        // Calculate drop position relative to canvas
                        const rect = canvasRef.current.getBoundingClientRect();
                        const x = (e.clientX - rect.left) / 0.4;

                        // Snap to the nearest slide start
                        const slideIndex = Math.max(0, Math.min(slideCount - 1, Math.floor(x / 1080)));
                        const slideStart = slideIndex * 1080;

                        // Center in the slide (both horizontally and vertically)
                        const left = slideStart + (1080 - scaledWidth) / 2;
                        const top = (1080 - scaledHeight) / 2;

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
            }
        });
    };

    return (
        <div
            className="relative shadow-inner bg-slate-100 p-8 rounded-3xl"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div className="relative shadow-2xl border-[20px] border-white rounded-xl overflow-hidden bg-white transition-all transform origin-top-left scale-[0.4]">
                <canvas ref={canvasRef} />
            </div>
        </div>
    );
};

export default CanvasEditor;
