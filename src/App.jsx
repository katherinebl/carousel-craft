import React from 'react';
import { useCanvasStore } from './store/canvasStore';
import CanvasEditor from './components/Canvas/CanvasEditor';
import ImageUploader from './components/Upload/ImageUploader';
import SlideCountSelector from './components/Controls/SlideCountSelector';
import ImageControls from './components/Controls/ImageControls';
import ExportButton from './components/Export/ExportButton';
import CarouselPreview from './components/Preview/CarouselPreview';

function App() {
  const { mode, setMode } = useCanvasStore();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Carousel<span className="text-blue-600">Craft</span>
        </h1>

        <div className="flex items-center gap-4">
          <div className="bg-slate-100 p-1 rounded-lg flex">
            <button
              onClick={() => setMode('edit')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'edit'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Edit
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'preview'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Preview
            </button>
          </div>

          {mode === 'edit' && <ExportButton />}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {mode === 'edit' ? (
          <>
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-100 flex flex-col shadow-sm">
              <div className="p-8 space-y-10">
                <section>
                  <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-6">Setup</h2>
                  <SlideCountSelector />
                </section>

                <section>
                  <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-6">Content</h2>
                  <ImageUploader />
                </section>

                <section>
                  <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-6">Arrange</h2>
                  <ImageControls />
                </section>
              </div>

              <div className="mt-auto p-8 border-t border-slate-50">
                <p className="text-[10px] text-slate-300 font-medium text-center">
                  CarouselCraft v1.0 • Seamless Edition
                </p>
              </div>
            </aside>


            {/* Canvas Area */}
            <section className="flex-1 bg-slate-200 overflow-auto canvas-scroll-container">
              <div className="min-h-full min-w-max p-20 flex items-start justify-center">
                <CanvasEditor />
              </div>
            </section>

          </>
        ) : (
          <CarouselPreview />
        )}
      </main>
    </div>
  );
}

export default App;
