import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Move,
  Check,
  X,
  RefreshCw,
  Sliders,
  Crop as CropIcon,
  Sparkles,
} from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
  role?: 'student' | 'teacher';
  userName?: string;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  onCrop,
  onCancel,
  role = 'student',
  userName = '',
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');

  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });

  const VIEWPORT_SIZE = 300; // Display canvas dimension
  const CROP_DIAMETER = 240; // Diameter of the circle crop guide inside viewport

  // Preload the image object
  useEffect(() => {
    setImageLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      setPan({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Compute base scaling so image covers the circular crop diameter
  const getScale = useCallback(
    (currentZoom: number, currentRotation: number) => {
      const img = imageRef.current;
      if (!img) return 1;

      const isRotatedSideways = currentRotation % 180 !== 0;
      const effectiveWidth = isRotatedSideways ? img.naturalHeight : img.naturalWidth;
      const effectiveHeight = isRotatedSideways ? img.naturalWidth : img.naturalHeight;

      if (!effectiveWidth || !effectiveHeight) return 1;

      // Ensure the image at zoom=1 completely covers the crop circle
      const baseScale = Math.max(
        CROP_DIAMETER / effectiveWidth,
        CROP_DIAMETER / effectiveHeight
      );

      return baseScale * currentZoom;
    },
    [CROP_DIAMETER]
  );

  // Draw interactive crop viewport canvas
  const drawViewport = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = VIEWPORT_SIZE;
    canvas.height = VIEWPORT_SIZE;

    // Clear background
    ctx.clearRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);
    ctx.fillStyle = '#0f172a'; // Deep slate dark backdrop
    ctx.fillRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);

    const totalScale = getScale(zoom, rotation);

    ctx.save();
    // Move to center of viewport + user pan offset
    ctx.translate(VIEWPORT_SIZE / 2 + pan.x, VIEWPORT_SIZE / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);

    const drawW = img.naturalWidth * totalScale;
    const drawH = img.naturalHeight * totalScale;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, [VIEWPORT_SIZE, imageLoaded, getScale, zoom, rotation, pan]);

  useEffect(() => {
    drawViewport();
  }, [drawViewport]);

  // Generate cropped output image (HD 400x400 JPEG)
  const generateCroppedImage = useCallback((): string => {
    const img = imageRef.current;
    if (!img) return '';

    const OUTPUT_SIZE = 400; // Crisp high-definition DP
    const outCanvas = document.createElement('canvas');
    outCanvas.width = OUTPUT_SIZE;
    outCanvas.height = OUTPUT_SIZE;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) return '';

    // Ratio between output size and viewport crop circle
    const ratio = OUTPUT_SIZE / CROP_DIAMETER;
    const totalScale = getScale(zoom, rotation) * ratio;

    outCtx.save();
    // Fill white background just in case
    outCtx.fillStyle = '#ffffff';
    outCtx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    // Apply crop translation & rotation centered in output
    outCtx.translate(OUTPUT_SIZE / 2 + pan.x * ratio, OUTPUT_SIZE / 2 + pan.y * ratio);
    outCtx.rotate((rotation * Math.PI) / 180);

    const drawW = img.naturalWidth * totalScale;
    const drawH = img.naturalHeight * totalScale;

    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';
    outCtx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    outCtx.restore();

    return outCanvas.toDataURL('image/jpeg', 0.92);
  }, [CROP_DIAMETER, getScale, zoom, rotation, pan]);

  // Update mini live preview
  useEffect(() => {
    if (!imageLoaded) return;
    const timeout = setTimeout(() => {
      const preview = generateCroppedImage();
      if (preview) setPreviewDataUrl(preview);
    }, 100);
    return () => clearTimeout(timeout);
  }, [imageLoaded, zoom, rotation, pan, generateCroppedImage]);

  // Mouse / Touch Drag Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(3.5, Math.max(1, parseFloat((prev + delta).toFixed(2)))));
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleApplyCrop = () => {
    const cropped = generateCroppedImage();
    if (cropped) {
      onCrop(cropped);
    }
  };

  return (
    <div className="space-y-4">
      {/* Crop Instructions Banner */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
          <CropIcon className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Crop & Position Your Photo</span>
        </div>
        <span className="text-[11px] font-semibold text-blue-700 bg-white/90 px-2 py-0.5 rounded-md border border-blue-200">
          Drag to center • Scroll to zoom
        </span>
      </div>

      {/* Main Crop Viewport Container */}
      <div className="flex flex-col items-center justify-center">
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}
          className={`relative rounded-3xl overflow-hidden shadow-xl border-2 select-none touch-none cursor-grab ${
            isDragging ? 'cursor-grabbing border-blue-500' : 'border-slate-800'
          }`}
          title="Click and drag to position photo. Use mouse scroll to zoom."
        >
          {/* Canvas Rendering Image */}
          <canvas
            ref={canvasRef}
            width={VIEWPORT_SIZE}
            height={VIEWPORT_SIZE}
            className="w-full h-full block"
          />

          {/* SVG Overlay: Dark outside circle, clear inside circle + dashed border + rule-of-thirds grid */}
          <svg
            className="absolute inset-0 pointer-events-none w-full h-full"
            viewBox={`0 0 ${VIEWPORT_SIZE} ${VIEWPORT_SIZE}`}
          >
            <defs>
              <mask id="circle-crop-mask">
                {/* White reveals entire area */}
                <rect x="0" y="0" width={VIEWPORT_SIZE} height={VIEWPORT_SIZE} fill="#ffffff" />
                {/* Black cuts out the circular transparent hole */}
                <circle
                  cx={VIEWPORT_SIZE / 2}
                  cy={VIEWPORT_SIZE / 2}
                  r={CROP_DIAMETER / 2}
                  fill="#000000"
                />
              </mask>
            </defs>

            {/* Darkened overlay outside circle */}
            <rect
              x="0"
              y="0"
              width={VIEWPORT_SIZE}
              height={VIEWPORT_SIZE}
              fill="rgba(15, 23, 42, 0.72)"
              mask="url(#circle-crop-mask)"
            />

            {/* Circular Crop Guide Outline */}
            <circle
              cx={VIEWPORT_SIZE / 2}
              cy={VIEWPORT_SIZE / 2}
              r={CROP_DIAMETER / 2}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              opacity="0.95"
            />

            {/* Subtle Alignment Grid inside crop area */}
            <g opacity="0.3" stroke="#ffffff" strokeWidth="1">
              {/* Vertical lines */}
              <line
                x1={VIEWPORT_SIZE / 2 - CROP_DIAMETER / 6}
                y1={VIEWPORT_SIZE / 2 - CROP_DIAMETER / 2}
                x2={VIEWPORT_SIZE / 2 - CROP_DIAMETER / 6}
                y2={VIEWPORT_SIZE / 2 + CROP_DIAMETER / 2}
              />
              <line
                x1={VIEWPORT_SIZE / 2 + CROP_DIAMETER / 6}
                y1={VIEWPORT_SIZE / 2 - CROP_DIAMETER / 2}
                x2={VIEWPORT_SIZE / 2 + CROP_DIAMETER / 6}
                y2={VIEWPORT_SIZE / 2 + CROP_DIAMETER / 2}
              />
              {/* Horizontal lines */}
              <line
                x1={VIEWPORT_SIZE / 2 - CROP_DIAMETER / 2}
                y1={VIEWPORT_SIZE / 2 - CROP_DIAMETER / 6}
                x2={VIEWPORT_SIZE / 2 + CROP_DIAMETER / 2}
                y2={VIEWPORT_SIZE / 2 - CROP_DIAMETER / 6}
              />
              <line
                x1={VIEWPORT_SIZE / 2 - CROP_DIAMETER / 2}
                y1={VIEWPORT_SIZE / 2 + CROP_DIAMETER / 6}
                x2={VIEWPORT_SIZE / 2 + CROP_DIAMETER / 2}
                y2={VIEWPORT_SIZE / 2 + CROP_DIAMETER / 6}
              />
            </g>
          </svg>

          {/* Floating Drag Indicator badge */}
          <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/20 pointer-events-none">
            <Move className="w-3 h-3 text-blue-400" />
            <span>Pan & Zoom</span>
          </div>

          {/* Floating Rotation angle badge */}
          {rotation !== 0 && (
            <div className="absolute top-2.5 right-2.5 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/20 pointer-events-none">
              {rotation}°
            </div>
          )}
        </div>
      </div>

      {/* Control Panel: Zoom Slider, Rotate, Reset, Live Mini-Preview */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
        {/* Zoom Slider Row */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.max(1, parseFloat((prev - 0.2).toFixed(2))))}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="flex-1 flex items-center gap-2">
            <input
              id="cropper-zoom-slider"
              type="range"
              min="1"
              max="3.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-[11px] font-mono font-bold text-slate-700 w-9 text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>

          <button
            type="button"
            onClick={() => setZoom((prev) => Math.min(3.5, parseFloat((prev + 0.2).toFixed(2))))}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Rotate & Reset Action Buttons + Mini Live Preview */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/80">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRotateLeft}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1 transition-all cursor-pointer"
              title="Rotate 90 degrees counter-clockwise"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>-90°</span>
            </button>
            <button
              type="button"
              onClick={handleRotateRight}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1 transition-all cursor-pointer"
              title="Rotate 90 degrees clockwise"
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-500" />
              <span>+90°</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1 transition-all cursor-pointer"
              title="Reset zoom, pan, and rotation"
            >
              <RefreshCw className="w-3 h-3 text-slate-400" />
              <span>Center</span>
            </button>
          </div>

          {/* Mini Live Preview Badge */}
          {previewDataUrl && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                Preview
              </span>
              <img
                src={previewDataUrl}
                alt="Crop preview"
                className="w-8 h-8 rounded-full border-2 border-blue-500 shadow-sm object-cover bg-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions: Cancel or Apply Crop */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
        >
          Choose Different Photo
        </button>

        <button
          id="apply-crop-btn"
          type="button"
          onClick={handleApplyCrop}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-black py-2.5 px-5 rounded-xl shadow-md shadow-emerald-600/25 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Apply Crop & Preview</span>
        </button>
      </div>
    </div>
  );
};
