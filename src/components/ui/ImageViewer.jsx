'use client';
import { useEffect, useCallback } from 'react';
import { X, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageViewer({
  images = [],
  initialIndex = 0,
  onClose,
}) {
  const currentIndex = initialIndex;

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  if (!images.length) return null;

  const current = images[currentIndex];
  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[100] image-viewer-overlay flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <p className="text-sm text-white/70 truncate max-w-xs">
          {current.name || 'Image'}{' '}
          {images.length > 1 && (
            <span className="text-white/40">
              ({currentIndex + 1}/{images.length})
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {current.url && (
            <>
              <a
                href={current.url}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink size={18} />
              </a>
              <a
                href={current.url}
                download={current.name || 'image'}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                title="Download"
              >
                <Download size={18} />
              </a>
            </>
          )}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.name || 'Shared image'}
          className="max-w-full max-h-full object-contain rounded-lg select-none"
          draggable={false}
        />
      </div>
    </div>
  );
}
