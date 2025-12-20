import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';

const SlideCountSelector = () => {
    const { slideCount, setSlideCount, slideWidth, slideHeight } = useCanvasStore();

    const handleChange = (e) => {
        const value = parseInt(e.target.value, 10);
        if (value >= 1 && value <= 15) {
            setSlideCount(value);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Slides
                    </label>
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                        {slideCount}
                    </span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={slideCount}
                    onChange={handleChange}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-2"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                    <span>1</span>
                    <span>15</span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                    <span>Slide Size</span>
                    <span className="text-slate-600 font-mono tracking-tighter">
                        {Math.round(slideWidth)} × {Math.round(slideHeight)} px
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SlideCountSelector;
