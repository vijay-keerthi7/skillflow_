import React, { useEffect } from 'react';

const ImageGallery = ({ images, activeIndex, setActiveIndex, onClose, onForward }) => {
  
  const showNextImg = (e) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const showPrevImg = (e) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  useEffect(() => {
    if (activeIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') showNextImg();
      if (e.key === 'ArrowLeft') showPrevImg();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, images.length]);

  if (activeIndex === null || !images || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[2001] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none" onClick={onClose}>
      
      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-white bg-black/40 backdrop-blur-md z-[10000]">
        <div className="flex items-center gap-4 ml-4">
          <span className="text-xs font-bold tracking-widest uppercase opacity-60">
            {activeIndex + 1} / {images.length}
          </span>
        </div>
        <button onClick={onClose} className="hover:text-cyan-400 text-4xl transition-colors mr-4">
          <i className='bx bx-x'></i>
        </button>
      </div>

      {/* NAVIGATION ARROWS */}
      {images.length > 1 && (
        <>
          <button onClick={showPrevImg} className="absolute left-4 md:left-8 z-[10001] p-3 rounded-full bg-black/20 hover:bg-white/10 text-white border border-white/10 transition-all">
            <i className='bx bx-chevron-left text-4xl'></i>
          </button>
          <button onClick={showNextImg} className="absolute right-4 md:right-8 z-[10001] p-3 rounded-full bg-black/20 hover:bg-white/10 text-white border border-white/10 transition-all">
            <i className='bx bx-chevron-right text-4xl'></i>
          </button>
        </>
      )}

      {/* IMAGE */}
      <div className="flex flex-col items-center justify-center w-full h-full max-h-[75vh]">
        <img 
          src={images[activeIndex]?.image} 
          alt="Gallery Content" 
          className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()} 
        />
      </div>

      {/* ACTIONS */}
      <div className="flex flex-row items-center gap-4 mt-8" onClick={(e) => e.stopPropagation()}>
        <a 
          href={images[activeIndex]?.image}
          download={`SkillFlow_Image.png`}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-full hover:bg-white/10 transition-all font-medium text-sm backdrop-blur-sm"
        >
          <i className='bx bx-download text-xl'></i> Download
        </a>

        <button 
          onClick={() => onForward(images[activeIndex])}
          className="flex items-center gap-2 px-8 py-3 bg-cyan-500 text-[#1D546D] rounded-full hover:bg-cyan-400 transition-all font-bold shadow-lg"
        >
          <i className='bx bx-share-alt text-xl'></i> Forward Image
        </button>
      </div>
    </div>
  );
};

export default ImageGallery;