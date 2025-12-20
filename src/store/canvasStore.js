import { create } from 'zustand';

export const useCanvasStore = create((set) => ({
    slideCount: 5,
    canvasWidth: 5 * 1080,
    canvasHeight: 1080,
    images: [],
    selectedImageId: null,
    mode: 'edit', // 'edit' or 'preview'

    setSlideCount: (count) => set((state) => ({
        slideCount: count,
        canvasWidth: count * 1080
    })),

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
