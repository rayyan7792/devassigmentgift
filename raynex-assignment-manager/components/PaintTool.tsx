import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, Pen, Palette, Undo, Trash2, Type as TypeIcon, MousePointer2, PaintBucket, Circle, Square, Triangle, Minus, Heart, Star, Cloud, Hexagon, ArrowRight, ArrowUp, Box, Umbrella, Highlighter, Sparkles, Loader2, Upload, Move } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface PaintToolProps {
  onClose: () => void;
  onInsertImage: (base64: string) => void;
}

type ToolType = 'select' | 'pen' | 'brush' | 'highlighter' | 'eraser' | 'fill' | 'text' | 'picker' | 
                'line' | 'rect' | 'circle' | 'triangle' | 'heart' | 'star' | 'cloud' | 'hexagon' | 'arrow' | 'cube' | 'umbrella';

export const PaintTool: React.FC<PaintToolProps> = ({ onClose, onInsertImage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState<ToolType>('pen');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);
  const [lastPos, setLastPos] = useState<{x: number, y: number} | null>(null);
  const [textInput, setTextInput] = useState<{x: number, y: number, text: string} | null>(null);
  
  // Selection / Move Tool State
  const [selection, setSelection] = useState<{x: number, y: number, w: number, h: number, data: ImageData} | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  
  // AI Gen State
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (canvas && overlay) {
      canvas.width = 1000;
      canvas.height = 800;
      overlay.width = 1000;
      overlay.height = 800;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        saveState();
      }
    }
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        setHistory(prev => {
            const newHist = [...prev.slice(-9), ctx.getImageData(0, 0, canvas.width, canvas.height)];
            return newHist;
        });
      }
    }
  };

  const undo = () => {
    const canvas = canvasRef.current;
    if (canvas && history.length > 1) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const newHistory = [...history];
        newHistory.pop();
        const prevState = newHistory[newHistory.length - 1];
        ctx.putImageData(prevState, 0, 0);
        setHistory(newHistory);
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveState();
      }
    }
  };

  const drawShape = (ctx: CanvasRenderingContext2D, type: ToolType, sx: number, sy: number, ex: number, ey: number) => {
      ctx.beginPath();
      
      const w = ex - sx;
      const h = ey - sy;
      
      // Calculate top-left and absolute dimensions for consistent drawing
      const tlx = Math.min(sx, ex);
      const tly = Math.min(sy, ey);
      const absW = Math.abs(w);
      const absH = Math.abs(h);
      const minDim = Math.min(absW, absH);

      if (type === 'rect') {
          ctx.rect(tlx, tly, absW, absH);
      } else if (type === 'circle') {
          // Center based circle
          const cx = tlx + absW / 2;
          const cy = tly + absH / 2;
          ctx.ellipse(cx, cy, absW/2, absH/2, 0, 0, 2 * Math.PI);
      } else if (type === 'triangle') {
          // Tip at top center, base at bottom
          ctx.moveTo(tlx + absW / 2, tly); 
          ctx.lineTo(tlx + absW, tly + absH);
          ctx.lineTo(tlx, tly + absH);
          ctx.closePath();
      } else if (type === 'line') {
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
      } else if (type === 'heart') {
          ctx.save();
          // Draw heart inside the bounding box
          ctx.translate(tlx + absW/2, tly + absH/2);
          const scale = minDim / 100;
          ctx.scale(scale, scale);
          ctx.translate(-50, -50); // Center the path
          ctx.moveTo(50, 30);
          ctx.bezierCurveTo(50, 0, 0, 0, 0, 30);
          ctx.bezierCurveTo(0, 55, 50, 80, 50, 100);
          ctx.bezierCurveTo(50, 80, 100, 55, 100, 30);
          ctx.bezierCurveTo(100, 0, 50, 0, 50, 30);
          ctx.restore();
      } else if (type === 'star') {
          const cx = tlx + absW / 2;
          const cy = tly + absH / 2;
          const outerRadius = minDim / 2;
          const innerRadius = outerRadius / 2.5;
          ctx.moveTo(cx, cy - outerRadius);
          // Manual star calculation to ensure centered
          let rot = Math.PI / 2 * 3;
          let x = cx;
          let y = cy;
          let step = Math.PI / 5;

          ctx.beginPath();
          ctx.moveTo(cx, cy - outerRadius);
          for (let i = 0; i < 5; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
          }
          ctx.lineTo(cx, cy - outerRadius);
          ctx.closePath();
      } else if (type === 'cloud') {
           const cx = tlx + absW/2;
           const cy = tly + absH/2;
           ctx.ellipse(cx, cy, absW/2, absH/2, 0, 0, 2 * Math.PI);
           // Simple visual approximation
      } else if (type === 'cube') {
          ctx.rect(tlx, tly + absH * 0.25, absW * 0.75, absH * 0.75);
          ctx.moveTo(tlx, tly + absH * 0.25); ctx.lineTo(tlx + absW * 0.25, tly);
          ctx.lineTo(tlx + absW, tly); ctx.lineTo(tlx + absW * 0.75, tly + absH * 0.25);
          ctx.moveTo(tlx + absW, tly); ctx.lineTo(tlx + absW, tly + absH * 0.75);
          ctx.lineTo(tlx + absW * 0.75, tly + absH);
      } else if (type === 'umbrella') {
          ctx.arc(tlx + absW/2, tly + absH/2, absW/2, Math.PI, 0);
          ctx.moveTo(tlx + absW/2, tly + absH/2);
          ctx.lineTo(tlx + absW/2, tly + absH);
          ctx.arc(tlx + absW/2 - absW*0.1, tly + absH, absW*0.1, 0, Math.PI);
      } else if (type === 'hexagon') {
          const cx = tlx + absW/2;
          const cy = tly + absH/2;
          const r = minDim/2;
          ctx.beginPath();
          for(let i=0; i<=6; i++) {
            ctx.lineTo(cx + r * Math.cos(i * 2 * Math.PI / 6), cy + r * Math.sin(i * 2 * Math.PI / 6));
          }
          ctx.closePath();
      }
      ctx.stroke();
  };

  const startDrawing = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'text') {
        setTextInput({ x, y, text: '' });
        return;
    }

    if (tool === 'select') {
        if (selection) {
            // Drop current selection
            ctx.putImageData(selection.data, selection.x, selection.y);
            setSelection(null);
            setIsMoving(false);
            saveState();
        } else {
             // Start selecting area
             setIsDrawing(true);
             setStartPos({ x, y });
        }
        return;
    }

    setIsDrawing(true);
    setStartPos({ x, y });
    setLastPos({ x, y });
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    if (tool === 'highlighter') {
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = primaryColor; 
        ctx.lineWidth = lineWidth * 3;
    } else {
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = tool === 'brush' ? lineWidth * 2 : lineWidth;
        ctx.strokeStyle = tool === 'eraser' ? 'white' : primaryColor;
    }
  };

  const draw = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    const ctx = canvas.getContext('2d');
    const oCtx = overlay.getContext('2d');
    if (!ctx || !oCtx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'select') {
        if (isMoving && selection) {
             // Moving selected area
             oCtx.clearRect(0, 0, overlay.width, overlay.height);
             oCtx.putImageData(selection.data, x - selection.w/2, y - selection.h/2);
             return;
        } else if (isDrawing && startPos) {
             // Drawing selection rect
             oCtx.clearRect(0, 0, overlay.width, overlay.height);
             oCtx.setLineDash([5, 5]);
             oCtx.strokeStyle = 'blue';
             oCtx.lineWidth = 1;
             oCtx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
             oCtx.setLineDash([]);
        }
        return;
    }

    if (!isDrawing || !startPos || !lastPos) return;

    const shapeTools = ['line', 'rect', 'circle', 'triangle', 'heart', 'star', 'cloud', 'hexagon', 'cube', 'umbrella'];

    if (shapeTools.includes(tool)) {
        requestAnimationFrame(() => {
            oCtx.clearRect(0, 0, overlay.width, overlay.height);
            oCtx.strokeStyle = primaryColor;
            oCtx.lineWidth = lineWidth;
            oCtx.lineCap = 'round';
            oCtx.lineJoin = 'round';
            drawShape(oCtx, tool, startPos.x, startPos.y, x, y);
        });
    } else {
        requestAnimationFrame(() => {
            ctx.beginPath();
            ctx.moveTo(lastPos.x, lastPos.y);
            ctx.lineTo(x, y);
            ctx.stroke();
            setLastPos({ x, y });
        });
    }
  };

  const stopDrawing = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    const ctx = canvas.getContext('2d');
    const oCtx = overlay.getContext('2d');
    if (!ctx || !oCtx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'select') {
        if (isMoving && selection) {
            // Place selection
            ctx.putImageData(selection.data, x - selection.w/2, y - selection.h/2);
            oCtx.clearRect(0, 0, overlay.width, overlay.height);
            setSelection(null);
            setIsMoving(false);
            saveState();
        } else if (isDrawing && startPos) {
            // Finalize selection rect and grab data
            const w = Math.abs(x - startPos.x);
            const h = Math.abs(y - startPos.y);
            if (w > 5 && h > 5) {
                const sx = Math.min(startPos.x, x);
                const sy = Math.min(startPos.y, y);
                const imageData = ctx.getImageData(sx, sy, w, h);
                
                // Clear from main
                ctx.fillStyle = "white";
                ctx.fillRect(sx, sy, w, h);
                
                setSelection({ x: sx, y: sy, w, h, data: imageData });
                setIsMoving(true);
                // Draw feedback on overlay
                oCtx.clearRect(0, 0, overlay.width, overlay.height);
                oCtx.putImageData(imageData, sx, sy);
                oCtx.strokeStyle = "blue";
                oCtx.setLineDash([5, 5]);
                oCtx.strokeRect(sx, sy, w, h);
                oCtx.setLineDash([]);
            }
            setIsDrawing(false);
            setStartPos(null);
        }
        return;
    }

    if (isDrawing && startPos) {
         const shapeTools = ['line', 'rect', 'circle', 'triangle', 'heart', 'star', 'cloud', 'hexagon', 'cube', 'umbrella'];

         if (shapeTools.includes(tool)) {
             ctx.strokeStyle = primaryColor;
             ctx.lineWidth = lineWidth;
             ctx.globalAlpha = 1.0; 
             drawShape(ctx, tool, startPos.x, startPos.y, x, y);
             oCtx.clearRect(0, 0, overlay.width, overlay.height);
         }
      
      setIsDrawing(false);
      setStartPos(null);
      setLastPos(null);
      saveState();
    }
  };

  const handleTextCommit = () => {
      if (textInput && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
              ctx.font = `${lineWidth * 5 + 10}px Arial`;
              ctx.fillStyle = primaryColor;
              ctx.fillText(textInput.text, textInput.x, textInput.y + 10);
              saveState();
          }
      }
      setTextInput(null);
  }
  
  const handleAiGenerate = async () => {
      if (!aiPrompt.trim()) return;
      setIsGenerating(true);
      
      try {
          const apiKey = process.env.API_KEY;
          if (!apiKey) {
              alert("Error: API_KEY missing.");
              setIsGenerating(false);
              return;
          }

          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateImages({
             model: 'imagen-4.0-generate-001',
             prompt: aiPrompt,
             config: {
                 numberOfImages: 1,
                 aspectRatio: '1:1',
                 outputMimeType: 'image/jpeg'
             }
          });
          
          if (response.generatedImages?.[0]?.image?.imageBytes) {
              const base64 = response.generatedImages[0].image.imageBytes;
              const img = new Image();
              img.src = `data:image/jpeg;base64,${base64}`;
              img.onload = () => {
                  const ctx = canvasRef.current?.getContext('2d');
                  if (ctx) {
                      const x = (canvasRef.current!.width - 512) / 2;
                      const y = (canvasRef.current!.height - 512) / 2;
                      ctx.drawImage(img, x > 0 ? x : 0, y > 0 ? y : 0, 512, 512);
                      saveState();
                  }
              }
          }
      } catch (e) {
          console.error(e);
          alert("AI Generation failed.");
      } finally {
          setIsGenerating(false);
          setShowAiInput(false);
          setAiPrompt("");
      }
  };

  const handleInsert = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onInsertImage(dataUrl);
      onClose();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                  const ctx = canvasRef.current?.getContext('2d');
                  if (ctx) {
                      const scale = Math.min(1000 / img.width, 800 / img.height, 1);
                      const w = img.width * scale;
                      const h = img.height * scale;
                      const x = (1000 - w) / 2;
                      const y = (800 - h) / 2;
                      ctx.drawImage(img, x, y, w, h);
                      saveState();
                  }
              };
              img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-md">
      <div className="bg-[#f0f0f0] border-4 border-[#2b579a] rounded shadow-2xl flex flex-col w-[1200px] h-[800px] overflow-hidden text-black animate-in fade-in zoom-in-95 relative">
        
        {/* Top Toolbar */}
        <div className="bg-[#f5f6f7] border-b border-gray-300 p-2 flex items-center justify-between shadow-sm z-20">
             <div className="flex items-center space-x-2">
                 <button onClick={onClose} className="p-2 hover:bg-red-100 rounded text-red-600"><X className="w-5 h-5"/></button>
                 <div className="h-6 w-px bg-gray-300"></div>
                 <button onClick={undo} className="flex flex-col items-center text-gray-700 hover:bg-[#cce8ff] p-1 rounded">
                     <Undo className="w-4 h-4" />
                     <span className="text-[9px]">Undo</span>
                 </button>
                 <button onClick={clearCanvas} className="flex flex-col items-center text-red-600 hover:bg-red-100 p-1 rounded">
                     <Trash2 className="w-4 h-4" />
                     <span className="text-[9px]">Clear</span>
                 </button>
                 <div className="h-6 w-px bg-gray-300"></div>
                 <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center text-gray-700 hover:bg-[#cce8ff] p-1 rounded">
                     <Upload className="w-4 h-4" />
                     <span className="text-[9px]">Import</span>
                 </button>
                 <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
             </div>

             <div className="flex items-center space-x-4">
                 <div className="flex items-center space-x-1">
                     <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-8 h-8 cursor-pointer border-2 border-white shadow-sm rounded" />
                     {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'].map(c => (
                         <button key={c} onClick={() => setPrimaryColor(c)} style={{backgroundColor: c}} className="w-6 h-6 rounded border border-gray-400 hover:scale-110 transition"/>
                     ))}
                 </div>

                 <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-500">SIZE</span>
                    <input type="range" min="1" max="50" value={lineWidth} onChange={e => setLineWidth(parseInt(e.target.value))} className="w-24 accent-blue-600" />
                 </div>
                 
                 <button 
                    onClick={() => setShowAiInput(!showAiInput)} 
                    className="flex items-center space-x-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1.5 rounded-full shadow hover:shadow-lg transition hover:scale-105"
                 >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold">AI Gen</span>
                 </button>
             </div>
             
             <button onClick={handleInsert} className="px-6 py-2 bg-[#2b579a] text-white hover:bg-[#1e3e70] rounded shadow font-bold">
                 Insert to Doc
             </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
             {/* Left Toolbar */}
             <div className="w-16 bg-[#e1e1e1] border-r border-gray-300 overflow-y-auto flex flex-col items-center py-2 space-y-1 z-10 shadow-inner">
                 {[
                    { id: 'select', icon: Move, label: 'Select' },
                    { id: 'pen', icon: Pen, label: 'Pen' },
                    { id: 'highlighter', icon: Highlighter, label: 'Highlighter' },
                    { id: 'eraser', icon: Eraser, label: 'Eraser' },
                    { id: 'fill', icon: PaintBucket, label: 'Fill' },
                    { id: 'text', icon: TypeIcon, label: 'Text' },
                    { id: 'line', icon: Minus, label: 'Line' },
                    { id: 'rect', icon: Square, label: 'Rect' },
                    { id: 'circle', icon: Circle, label: 'Circle' },
                    { id: 'triangle', icon: Triangle, label: 'Tri' },
                    { id: 'hexagon', icon: Hexagon, label: 'Hex' },
                    { id: 'star', icon: Star, label: 'Star' },
                    { id: 'heart', icon: Heart, label: 'Heart' },
                    { id: 'cloud', icon: Cloud, label: 'Cloud' },
                    { id: 'umbrella', icon: Umbrella, label: 'Umbrella' },
                    { id: 'cube', icon: Box, label: 'Cube' },
                 ].map((t, idx) => (
                    <button
                        key={`${t.id}-${idx}`}
                        onClick={() => setTool(t.id as ToolType)}
                        className={`p-2 rounded hover:bg-white transition flex flex-col items-center w-14 ${tool === t.id ? 'bg-white shadow text-blue-600 scale-105' : 'text-gray-600'}`}
                        title={t.label}
                    >
                        <t.icon className="w-5 h-5" />
                        <span className="text-[8px] mt-0.5">{t.label}</span>
                    </button>
                 ))}
             </div>

             {/* Canvas Area */}
             <div className="flex-1 bg-[#808080] p-8 overflow-auto flex items-center justify-center relative">
                <div className="relative shadow-2xl bg-white cursor-crosshair">
                    <canvas 
                        ref={canvasRef}
                        className="block"
                    />
                    <canvas 
                        ref={overlayRef}
                        className="absolute top-0 left-0"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                    />
                    {textInput && (
                        <input
                            autoFocus
                            value={textInput.text}
                            onChange={(e) => setTextInput({...textInput, text: e.target.value})}
                            onKeyDown={(e) => { if(e.key === 'Enter') handleTextCommit(); }}
                            onBlur={handleTextCommit}
                            style={{
                                position: 'absolute',
                                left: textInput.x,
                                top: textInput.y - 10,
                                font: `${lineWidth * 5 + 10}px Arial`,
                                color: primaryColor,
                                background: 'transparent',
                                border: '1px dashed blue',
                                outline: 'none',
                                minWidth: '50px',
                                zIndex: 10
                            }}
                        />
                    )}
                </div>
             </div>
        </div>

        {/* AI Input Floating Bottom Center */}
        {showAiInput && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[600px] bg-white rounded-full shadow-2xl border border-purple-200 p-2 pl-4 flex items-center space-x-2 animate-in slide-in-from-bottom-5 z-50">
                <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
                <input 
                    className="flex-1 bg-transparent focus:outline-none text-sm"
                    placeholder="Describe what to paint (e.g. A cyberpunk city)..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                    autoFocus
                />
                <button 
                    onClick={handleAiGenerate}
                    disabled={isGenerating}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full font-bold text-xs transition"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
                </button>
                <button onClick={() => setShowAiInput(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                    <X className="w-4 h-4" />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};