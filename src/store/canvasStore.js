import { create } from 'zustand';

export const useCanvasStore = create((set) => ({
    slideCount: 5,
    slideWidth: 1080,
    slideHeight: 1080,
    canvasWidth: 5 * 1080,
    canvasHeight: 1080,
    images: [],
    selectedImageId: null,
    mode: 'edit', // 'edit' or 'preview'

    setSlideCount: (count) => set((state) => ({
        slideCount: count,
        canvasWidth: count * state.slideWidth
    })),

    setSlideDimensions: (width, height) => set((state) => {
        const ratio = width / state.slideWidth;
        return {
            slideWidth: width,
            slideHeight: height,
            canvasWidth: state.slideCount * width,
            canvasHeight: height,
            images: state.images.map(img => ({
                ...img,
                left: img.left * ratio,
                top: img.top * ratio,
                scaleX: img.scaleX * ratio,
                scaleY: img.scaleY * ratio
            }))
        };
    }),

    addImage: (image) => set((state) => ({
        images: [...state.images, image],
        selectedImageId: image.id
    })),

    removeImage: (id) => set((state) => ({
        images: state.images.filter((img) => img.id !== id),
        selectedImageId: state.selectedImageId === id ? null : state.selectedImageId
    })),

    updateImage: (id, updates) => set((state) => ({
        images: state.images.map((img) => img.id === id ? { ...img, ...updates } : img)
    })),

    setSelectedImageId: (id) => set({ selectedImageId: id }),

    setMode: (mode) => set({ mode }),

    reorderImage: (id, direction) => set((state) => {
        const index = state.images.findIndex((img) => img.id === id);
        if (index === -1) return state;

        const newImages = [...state.images];
        const targetIndex = direction === 'front' ? newImages.length - 1 : 0;

        const [movedImage] = newImages.splice(index, 1);
        newImages.splice(targetIndex, 0, movedImage);

        return { images: newImages };
    })
}));
