import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, PlusCircle, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Type, Copy, Scissors, Clipboard, Undo, Redo, Strikethrough, Subscript, Superscript, Highlighter, PaintBucket, Minimize2, Maximize2, Search, X, Palette, Calculator, MousePointer2, Sparkles, ChevronDown, Check, Table as TableIcon, Volume2, MoveVertical, Minus, ListPlus } from 'lucide-react';
import { AssignmentData } from '../types';
import { saveAssignment, getAssignmentById } from '../services/storage';
import { MathSidebar } from './MathSidebar';
import { PaintTool } from './PaintTool';
import { PageEditor } from './PageEditor';
import { RaynexAI } from './RaynexAI';
import { GeniusCalc } from './GeniusCalc';

interface EditorProps {
  assignmentId: string;
  onBack: () => void;
}

const A4_HEIGHT_PX = 1050; // Reference height approx
const PAGE_CONTENT_HEIGHT_PX = 1000; // Approx writable area

export const Editor: React.FC<EditorProps> = ({ assignmentId, onBack }) => {
  const [data, setData] = useState<AssignmentData | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeStyles, setActiveStyles] = useState<string[]>([]);
  const [showFind, setShowFind] = useState(false);
  const [findText, setFindText] = useState("");
  const [currentColor, setCurrentColor] = useState("#000000");
  const [highlightColor, setHighlightColor] = useState("#ffff00");
  
  // Tool States
  const [showMathSidebar, setShowMathSidebar] = useState(false);
  const [showPaintTool, setShowPaintTool] = useState(false);
  const [showRaynexAI, setShowRaynexAI] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showTableGrid, setShowTableGrid] = useState(false);
  const [tableGridHover, setTableGridHover] = useState({ rows: 0, cols: 0 });

  // Selection Preservation
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [activeImage, setActiveImage] = useState<HTMLElement | null>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  
  useEffect(() => {
    const loaded = getAssignmentById(assignmentId);
    if (loaded) {
      if (loaded.contentPages.length === 0) {
        loaded.contentPages = [""];
      }
      if (!loaded.universityName) loaded.universityName = "RAYNEX UNIVERSITY";
      setData(loaded);
    }
  }, [assignmentId]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const styles: string[] = [];
      if (document.queryCommandState('bold')) styles.push('bold');
      if (document.queryCommandState('italic')) styles.push('italic');
      if (document.queryCommandState('underline')) styles.push('underline');
      setActiveStyles(styles);

      const color = document.queryCommandValue('foreColor');
      if (color) {
         const rgb = color.match(/\d+/g);
         if (rgb) {
             const hex = "#" + ((1 << 24) + (Number(rgb[0]) << 16) + (Number(rgb[1]) << 8) + Number(rgb[2])).toString(16).slice(1);
             setCurrentColor(hex);
         }
      }
    };

    const handleClick = (e: MouseEvent) => {
        // Detect Images, Tables, or movables
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG' || target.closest('table') || target.classList.contains('movable-element')) {
            const el = (target.tagName === 'IMG' || target.classList.contains('movable-element')) ? target : target.closest('table') as HTMLElement;
            setActiveImage(el);
            // Enable resizing via CSS if not already
            if (el) {
                el.style.resize = 'both';
                el.style.overflow = 'hidden'; 
                el.style.border = '1px dashed #4ADE80';
                el.style.position = 'relative'; 
                // Enable drag
                el.setAttribute('draggable', 'true');
                el.ondragstart = (ev) => {
                    if (ev.dataTransfer) {
                        ev.dataTransfer.effectAllowed = 'move';
                    }
                };
            }
        } else {
            // Deselect previous
            if (activeImage) {
                activeImage.style.border = activeImage.tagName === 'TABLE' ? '1px solid black' : 'none';
                activeImage.style.resize = 'none';
                if(activeImage.classList.contains('vertical-line')) activeImage.style.borderLeft = "2px solid black";
                if(activeImage.classList.contains('horizontal-line')) activeImage.style.borderTop = "2px solid black";
                setActiveImage(null);
            }
        }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('click', handleClick);
    return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
        document.removeEventListener('click', handleClick);
    };
  }, [activeImage]);

  const handleSave = () => {
    if (data) {
      setSaving(true);
      saveAssignment(data);
      setTimeout(() => setSaving(false), 500);
    }
  };

  const updatePageContent = (index: number, html: string) => {
    if (!data) return;
    const newPages = [...data.contentPages];
    newPages[index] = html;
    setData({ ...data, contentPages: newPages });
  };

  const addQuestion = () => {
    if (!data) return;
    const lastIdx = data.contentPages.length - 1;
    const currentContent = data.contentPages[lastIdx];
    const newContent = currentContent + `<div style="font-weight: bold; font-size: 18pt; margin-top: 10px; margin-bottom: 5px;">Q. [Type Here]</div>`;
    updatePageContent(lastIdx, newContent);
  };
  
  const addAnswer = () => {
    if (!data) return;
    const lastIdx = data.contentPages.length - 1;
    const currentContent = data.contentPages[lastIdx];
    const newContent = currentContent + `<div style="margin-bottom: 10px;"><strong>Ans:</strong> </div>`;
    updatePageContent(lastIdx, newContent);
  };

  const insertTable = (rows: number, cols: number) => {
      let rowsHtml = '';
      for(let i=0; i<rows; i++) {
          let colsHtml = '';
          for(let j=0; j<cols; j++) {
              colsHtml += `<td style="border: 1px solid #000; padding: 4px; min-width: 50px;">&nbsp;</td>`;
          }
          rowsHtml += `<tr>${colsHtml}</tr>`;
      }

      const tableHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1em; border: 1px solid #000; resize: both; overflow: auto;">
          <tbody>${rowsHtml}</tbody>
        </table>
        <p>&nbsp;</p>
      `;
      
      restoreSelection();
      document.execCommand('insertHTML', false, tableHtml);
      setShowTableGrid(false);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSavedRange(sel.getRangeAt(0).cloneRange());
    }
  };

  const restoreSelection = () => {
    if (savedRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
    }
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    restoreSelection();
    document.execCommand(command, false, value);
    saveSelection();
  };

  const insertSymbol = (symbol: string) => {
      document.execCommand('insertText', false, symbol);
  };

  const insertImage = (base64: string) => {
      if (!data) return;
      const activeContent = data.contentPages[activePageIndex] || "";
      const imgHtml = `<img src="${base64}" class="movable-element" style="max-width: 100%; border: none; cursor: pointer; display: block; margin: 0 auto; resize: both; overflow: hidden;" />`;
      
      if (savedRange && savedRange.commonAncestorContainer.parentElement?.closest(`[data-page="${activePageIndex}"]`)) {
          restoreSelection();
          document.execCommand('insertHTML', false, imgHtml);
      } else {
          updatePageContent(activePageIndex, activeContent + imgHtml);
      }
  };

  const insertSmartContent = (content: string) => {
    if (!data) return;
    restoreSelection();
    document.execCommand('insertHTML', false, content);
  };

  const findInPage = () => {
      if (!findText) return;
      (window as any).find(findText);
  };
  
  const readAloud = () => {
      const sel = window.getSelection()?.toString();
      const text = sel && sel.trim().length > 0 
        ? sel 
        : document.querySelector(`[data-page="${activePageIndex}"]`)?.textContent || "";
      
      if (text) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          window.speechSynthesis.speak(utterance);
      }
  };

  const handleImageResize = (size: 'S' | 'M' | 'L') => {
      if (activeImage) {
          const width = size === 'S' ? '200px' : size === 'M' ? '400px' : '100%';
          activeImage.style.width = width;
          activeImage.style.maxWidth = '100%';
      }
  };
  
  const handleImageAlign = (align: 'left' | 'center' | 'right') => {
      if (activeImage) {
          activeImage.style.display = 'block';
          activeImage.style.marginLeft = align === 'left' ? '0' : align === 'center' ? 'auto' : 'auto';
          activeImage.style.marginRight = align === 'right' ? '0' : align === 'center' ? 'auto' : 'auto';
      }
  };

  const handleColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const color = e.target.value;
      setCurrentColor(color);
      restoreSelection();
      document.execCommand('foreColor', false, color);
  };

  const applyHighlight = (color: string) => {
      restoreSelection();
      document.execCommand('hiliteColor', false, color);
      saveSelection();
      setHighlightColor(color);
  };

  const insertMCQ = () => {
      const sizeStr = prompt("Enter Size (1-12) for vertical line height:", "6");
      const size = sizeStr ? Math.min(Math.max(parseInt(sizeStr), 1), 12) : 6;
      const heightPx = Math.floor((size / 12) * PAGE_CONTENT_HEIGHT_PX);

      const countStr = prompt("How many numbered lines?", "5");
      const count = countStr ? parseInt(countStr) : 5;

      const side = prompt("Side? Type 'L' for Left, 'R' for Right", "R")?.toUpperCase() || "R";

      let linesHtml = `<div style="display: flex; flex-direction: column; justify-content: space-around; width: 100%; height: 100%; padding: 0 10px;">`;
      for (let i = 1; i <= count; i++) {
          linesHtml += `<div>${i}. ________________________</div>`;
      }
      linesHtml += `</div>`;

      const verticalLine = `<div style="width: 2px; background-color: black; height: 100%;"></div>`;

      let containerHtml = `<div class="movable-element" style="display: flex; height: ${heightPx}px; align-items: stretch; margin: 10px 0; border: 1px dashed transparent;">`;

      if (side === 'L') {
          // Lines then Bar
          containerHtml += linesHtml + verticalLine;
      } else {
          // Bar then Lines
          containerHtml += verticalLine + linesHtml;
      }
      containerHtml += `</div><p>&nbsp;</p>`;

      restoreSelection();
      document.execCommand('insertHTML', false, containerHtml);
  };

  const insertHorizontalLine = () => {
      restoreSelection();
      const html = '<hr class="movable-element horizontal-line" style="border-top: 2px solid black; margin: 10px 0; cursor: move;" />';
      document.execCommand('insertHTML', false, html);
  };

  const insertVerticalLine = () => {
      const sizeStr = prompt("Enter size (1-12) for line height (12 = Full Page):", "6");
      let height = "500px";
      if (sizeStr) {
          const size = Math.min(Math.max(parseInt(sizeStr), 1), 12);
          // Scale based on page height approx 1000px
          const px = Math.floor((size / 12) * PAGE_CONTENT_HEIGHT_PX);
          height = `${px}px`;
      }

      restoreSelection();
      const html = `<span class="movable-element vertical-line" style="display: inline-block; border-left: 2px solid black; height: ${height}; margin: 0 10px; vertical-align: middle; cursor: move;">&nbsp;</span>`;
      document.execCommand('insertHTML', false, html);
  };

  const ToolbarButton = ({ icon: Icon, cmd, arg, title, active, onClick }: any) => {
     const isActive = active || activeStyles.includes(cmd) || activeStyles.includes(arg || '');
     return (
        <button 
          onMouseDown={(e) => { 
              if (onClick) {
                  e.preventDefault();
                  onClick();
              } else {
                  e.preventDefault(); 
                  execCmd(cmd, arg); 
              }
          }}
          className={`p-2 rounded-lg transition flex items-center justify-center ${isActive ? 'bg-green-600/90 text-white shadow-sm' : 'hover:bg-gray-700/50 text-gray-400 hover:text-white'}`}
          title={title}
        >
          <Icon className="w-4 h-4" />
        </button>
     );
  };
  
  const ToolbarDivider = () => <div className="w-px h-8 bg-gray-700 mx-2"></div>;

  const EditableField = ({ value, onChange, className = "", style = {} }: any) => (
    <input 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-transparent w-full text-center focus:outline-none focus:bg-blue-100/50 rounded ${className}`}
      style={style}
    />
  );

  const addCoverRow = () => {
      if (!data) return;
      const rows = data.coverRows || [];
      const newRows = [...rows, { label: "New Label", value: "Value" }];
      setData({ ...data, coverRows: newRows });
  };

  const updateCoverRow = (idx: number, field: 'label' | 'value', text: string) => {
      if (!data) return;
      const rows = data.coverRows ? [...data.coverRows] : [];
      if (rows[idx]) {
          rows[idx] = { ...rows[idx], [field]: text };
          setData({ ...data, coverRows: rows });
      }
  };

  const deleteCoverRow = (idx: number) => {
      if (!data) return;
      const rows = data.coverRows ? [...data.coverRows] : [];
      rows.splice(idx, 1);
      setData({ ...data, coverRows: rows });
  };

  if (!data) return <div className="text-white text-center mt-20">Loading...</div>;

  return (
    <div className="h-screen bg-[#121212] flex flex-col items-center overflow-hidden font-sans">
      
      {/* PROFESSIONAL RIBBON TOOLBAR */}
      <div className="w-full bg-[#1e1e1e]/95 backdrop-blur-md border-b border-gray-800 flex flex-col shrink-0 z-50 print-hide">
         
         {/* Top Bar */}
         <div className="flex justify-between items-center px-4 py-2 border-b border-gray-800">
             <div className="flex items-center space-x-4">
                <button onClick={onBack} className="text-gray-400 hover:text-white transition flex items-center text-sm font-medium">
                   <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
                <div className="h-4 w-px bg-gray-700"></div>
                <span className="text-gray-200 font-semibold text-sm">{data.name}</span>
             </div>

             <div className="flex items-center space-x-3">
                <button 
                    onClick={() => setShowRaynexAI(!showRaynexAI)}
                    className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-transparent transition ${showRaynexAI ? 'bg-purple-600/20 text-purple-400 border-purple-500/50' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                >
                    <Sparkles className="w-3.5 h-3.5 mr-2" /> Raynex AI
                </button>
                <button 
                    onClick={() => setShowMathSidebar(!showMathSidebar)}
                    className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-transparent transition ${showMathSidebar ? 'bg-green-600/20 text-green-400 border-green-500/50' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                >
                    <Calculator className="w-3.5 h-3.5 mr-2" /> Math
                </button>
                <button 
                   onClick={handleSave}
                   className="flex items-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-bold transition shadow-lg shadow-blue-900/20"
                >
                   <Save className="w-3.5 h-3.5 mr-2" /> {saving ? "Saving..." : "Save"}
                </button>
             </div>
         </div>

         {/* Ribbon Controls */}
         <div className="flex items-center justify-center p-2 gap-4 overflow-x-auto">
            <div className="flex items-center space-x-1">
               <ToolbarButton icon={Undo} cmd="undo" title="Undo" />
               <ToolbarButton icon={Redo} cmd="redo" title="Redo" />
            </div>
            <ToolbarDivider />
            <div className="flex items-center space-x-1">
               <ToolbarButton icon={Clipboard} cmd="paste" title="Paste" />
               <ToolbarButton icon={Scissors} cmd="cut" title="Cut" />
               <ToolbarButton icon={Copy} cmd="copy" title="Copy" />
            </div>
            <ToolbarDivider />

            <div className="flex items-center space-x-2">
                <div className="flex flex-col space-y-1">
                    <div className="flex space-x-1">
                        <select 
                            className="bg-[#2a2a2a] text-white text-xs p-1 rounded border border-gray-700 outline-none w-32 focus:border-green-500"
                            onChange={(e) => execCmd('fontName', e.target.value)}
                        >
                            <option value="Inter">Inter</option>
                            <option value="Arial">Arial</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Calibri">Calibri</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Georgia">Georgia</option>
                        </select>
                        <select 
                            className="bg-[#2a2a2a] text-white text-xs p-1 rounded border border-gray-700 outline-none w-16 focus:border-green-500"
                            onChange={(e) => execCmd('fontSize', e.target.value)}
                        >
                            <option value="3">12pt</option>
                            <option value="4">14pt</option>
                            <option value="5">18pt</option>
                            <option value="6">24pt</option>
                            <option value="7">36pt</option>
                        </select>
                    </div>
                    <div className="flex items-center space-x-0.5">
                        <ToolbarButton icon={Bold} cmd="bold" title="Bold" />
                        <ToolbarButton icon={Italic} cmd="italic" title="Italic" />
                        <ToolbarButton icon={Underline} cmd="underline" title="Underline" />
                        <ToolbarButton icon={Strikethrough} cmd="strikeThrough" title="Strikethrough" />
                        <ToolbarButton icon={Subscript} cmd="subscript" title="Subscript" />
                        <ToolbarButton icon={Superscript} cmd="superscript" title="Superscript" />
                        
                        {/* Font Color */}
                        <div 
                            className="relative group ml-1 flex items-center justify-center p-1 rounded hover:bg-gray-700 cursor-pointer border border-transparent hover:border-gray-600" 
                            title="Text Color"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                saveSelection();
                            }}
                        >
                           <span className="font-bold text-lg select-none px-1 leading-none" style={{color: currentColor}}>A</span>
                           <div className="h-1 w-full bg-current absolute bottom-1 rounded-full" style={{backgroundColor: currentColor}}></div>
                           <input 
                              type="color" 
                              value={currentColor}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={handleColorInput}
                           />
                        </div>

                        {/* Text Highlight */}
                        <div 
                            className="relative group ml-1 flex items-center justify-center p-1 rounded hover:bg-gray-700 cursor-pointer border border-transparent hover:border-gray-600" 
                            title="Text Highlight"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                saveSelection();
                            }}
                        >
                           <Highlighter className="w-4 h-4 text-gray-300" />
                           <div className="h-1 w-full absolute bottom-1 rounded-full" style={{backgroundColor: highlightColor}}></div>
                           
                           <input 
                              type="color" 
                              value={highlightColor}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) => {
                                  const c = e.target.value;
                                  setHighlightColor(c);
                                  applyHighlight(c);
                              }}
                           />
                        </div>
                    </div>
                </div>
            </div>
            <ToolbarDivider />

            <div className="flex items-center space-x-1">
               <ToolbarButton icon={AlignLeft} cmd="justifyLeft" title="Align Left" />
               <ToolbarButton icon={AlignCenter} cmd="justifyCenter" title="Center" />
               <ToolbarButton icon={AlignRight} cmd="justifyRight" title="Align Right" />
               <ToolbarButton icon={AlignJustify} cmd="justifyFull" title="Justify" />
               <div className="w-2"></div>
               <ToolbarButton icon={List} cmd="insertUnorderedList" title="Bullet List" />
               <ToolbarButton icon={ListOrdered} cmd="insertOrderedList" title="Numbered List" />
            </div>
            <ToolbarDivider />

            <div className="flex items-center space-x-2">
               <button 
                 onClick={readAloud}
                 className="flex flex-col items-center justify-center w-12 h-12 rounded hover:bg-gray-700 transition text-gray-400 hover:text-white"
                 title="Read Aloud (Select text first)"
               >
                 <Volume2 className="w-5 h-5 mb-1" />
                 <span className="text-[10px]">Speak</span>
               </button>
               <button 
                 onClick={() => setShowFind(!showFind)}
                 className={`flex flex-col items-center justify-center w-12 h-12 rounded hover:bg-gray-700 transition ${showFind ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
               >
                 <Search className="w-5 h-5 mb-1" />
                 <span className="text-[10px]">Find</span>
               </button>
               <div className="relative">
                   <button 
                     onClick={() => setShowTableGrid(!showTableGrid)}
                     className="flex flex-col items-center justify-center w-12 h-12 rounded hover:bg-gray-700 transition text-gray-400 hover:text-white"
                   >
                     <TableIcon className="w-5 h-5 mb-1" />
                     <span className="text-[10px]">Table</span>
                   </button>
                   {showTableGrid && (
                       <div className="absolute top-full left-0 mt-2 bg-white p-2 rounded shadow-xl z-50 animate-in fade-in transform translate-x-2">
                           <div className="text-black text-xs mb-1 text-center font-bold">{tableGridHover.rows + 1} x {tableGridHover.cols + 1}</div>
                           <div className="grid grid-cols-10 gap-0.5">
                               {Array.from({length: 100}).map((_, i) => {
                                   const r = Math.floor(i / 10);
                                   const c = i % 10;
                                   const isSelected = r <= tableGridHover.rows && c <= tableGridHover.cols;
                                   return (
                                       <div 
                                         key={i} 
                                         className={`w-4 h-4 border ${isSelected ? 'bg-blue-500 border-blue-600' : 'bg-gray-100 border-gray-300'}`}
                                         onMouseEnter={() => setTableGridHover({rows: r, cols: c})}
                                         onClick={() => insertTable(r + 1, c + 1)}
                                       />
                                   );
                               })}
                           </div>
                       </div>
                   )}
               </div>
               
               <div className="flex items-center bg-gray-800 rounded-lg p-1 space-x-1">
                   <button onClick={addQuestion} className="flex flex-col items-center justify-center w-10 h-10 hover:bg-gray-700 rounded text-green-400"><PlusCircle className="w-4 h-4"/><span className="text-[8px]">Q</span></button>
                   <button onClick={addAnswer} className="flex flex-col items-center justify-center w-10 h-10 hover:bg-gray-700 rounded text-blue-400"><Check className="w-4 h-4"/><span className="text-[8px]">Ans</span></button>
                   <div className="w-px h-6 bg-gray-600"></div>
                   <button onClick={insertHorizontalLine} className="flex flex-col items-center justify-center w-8 h-10 hover:bg-gray-700 rounded text-gray-300" title="Horizontal Line"><Minus className="w-4 h-4"/><span className="text-[8px]">Hor</span></button>
                   <button onClick={insertVerticalLine} className="flex flex-col items-center justify-center w-8 h-10 hover:bg-gray-700 rounded text-gray-300" title="Vertical Line (Size 1-12)"><MoveVertical className="w-4 h-4"/><span className="text-[8px]">Ver</span></button>
                   <button onClick={insertMCQ} className="flex flex-col items-center justify-center w-8 h-10 hover:bg-gray-700 rounded text-gray-300" title="MCQ Advanced"><ListPlus className="w-4 h-4"/><span className="text-[8px]">MCQ</span></button>
               </div>
            </div>
         </div>

         {showFind && (
            <div className="absolute top-full left-0 right-0 bg-[#252525] border-b border-gray-700 p-2 flex justify-center items-center space-x-2 animate-in slide-in-from-top duration-200 shadow-lg z-40">
                <input 
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Find text in document..."
                className="bg-[#1a1a1a] text-white px-3 py-1.5 rounded border border-gray-600 w-80 focus:border-green-500 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && findInPage()}
                autoFocus
                />
                <button onClick={findInPage} className="text-white bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded text-sm">Find Next</button>
                <button onClick={() => setShowFind(false)} className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
            </div>
        )}
      </div>

      {activeImage && (
          <div className="absolute top-[140px] left-1/2 -translate-x-1/2 z-50 bg-[#252525] border border-gray-600 rounded-full shadow-2xl p-2 flex space-x-2 animate-in fade-in slide-in-from-top-2">
              <span className="text-xs font-bold text-gray-500 uppercase self-center px-2">
                  Object Tools
              </span>
              <div className="w-px h-4 bg-gray-600 self-center"></div>
              <button onClick={() => handleImageResize('S')} className="text-xs px-2 py-1 bg-gray-700 hover:bg-green-600 rounded text-white">Small</button>
              <button onClick={() => handleImageResize('M')} className="text-xs px-2 py-1 bg-gray-700 hover:bg-green-600 rounded text-white">Medium</button>
              <button onClick={() => handleImageResize('L')} className="text-xs px-2 py-1 bg-gray-700 hover:bg-green-600 rounded text-white">Full</button>
              <div className="w-px h-4 bg-gray-600 self-center"></div>
              <button onClick={() => handleImageAlign('left')} className="p-1 hover:text-white text-gray-400"><AlignLeft className="w-4 h-4"/></button>
              <button onClick={() => handleImageAlign('center')} className="p-1 hover:text-white text-gray-400"><AlignCenter className="w-4 h-4"/></button>
              <button onClick={() => handleImageAlign('right')} className="p-1 hover:text-white text-gray-400"><AlignRight className="w-4 h-4"/></button>
          </div>
      )}

      {/* LEFT SIDEBAR - TOOLS */}
      <div className="fixed left-0 top-40 z-30 flex flex-col space-y-4 print-hide">
         <button 
           onClick={() => setShowPaintTool(true)}
           className="bg-[#1e1e1e] border border-gray-700 border-l-0 p-3 rounded-r-xl shadow-xl hover:bg-green-600 hover:border-green-500 hover:text-white text-gray-400 transition-all group relative gpu-accelerated"
         >
            <Palette className="w-6 h-6" />
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                Open Paint
            </div>
         </button>
         
         <button 
           onClick={() => setShowCalculator(!showCalculator)}
           className={`bg-[#1e1e1e] border border-gray-700 border-l-0 p-3 rounded-r-xl shadow-xl hover:bg-orange-600 hover:border-orange-500 hover:text-white transition-all group relative gpu-accelerated ${showCalculator ? 'text-orange-500 border-orange-900' : 'text-gray-400'}`}
         >
            <Calculator className="w-6 h-6" />
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                Toggle Calculator
            </div>
         </button>
      </div>

      <MathSidebar isOpen={showMathSidebar} onClose={() => setShowMathSidebar(false)} onInsertSymbol={insertSymbol} />
      {showRaynexAI && <RaynexAI onClose={() => setShowRaynexAI(false)} onInsertContent={insertSmartContent} />}
      {showPaintTool && <PaintTool onClose={() => setShowPaintTool(false)} onInsertImage={insertImage} />}
      
      {/* Floating Calculator */}
      {showCalculator && (
          <div className="fixed top-20 right-20 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-black border border-gray-800 rounded-3xl overflow-hidden shadow-2xl w-[320px] h-[550px]">
                   <GeniusCalc onClose={() => setShowCalculator(false)} />
              </div>
          </div>
      )}
      
      {/* Workspace (Scrollable) */}
      <div className="flex-1 w-full overflow-y-auto bg-[#0a0a0a] p-8 flex flex-col items-center space-y-8 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        
        {/* Page 1: Cover Page */}
        <div className="print-page w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl relative overflow-hidden p-[15mm] shrink-0 transition-transform origin-top will-change-transform translate-z-0 gpu-accelerated">
          <div className="w-full h-full border-[6px] border-double p-8 flex flex-col relative"
               style={{borderColor: data.borderColor || '#16A34A'}}>
              
              {/* Logo */}
              <div className="w-full flex justify-center mb-6">
                 <div className="w-32 h-32 rounded-full border-4 border-green-500 flex items-center justify-center bg-white text-green-500 font-bold text-xs text-center p-2 shadow-lg">
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-4xl font-black">R</span>
                        <span className="text-[10px] tracking-[0.2em] mt-1">RAYNEX</span>
                    </div>
                 </div>
              </div>
              
              {/* University Name */}
              <div className="w-full flex justify-center mb-6">
                 <input 
                    className="text-3xl font-black uppercase tracking-wider text-center text-black bg-transparent border-none focus:outline-none focus:bg-gray-50 rounded w-full hover:bg-gray-50/50 transition placeholder-gray-300"
                    value={data.universityName || "RAYNEX UNIVERSITY"}
                    onChange={(e) => setData({...data, universityName: e.target.value})}
                    placeholder="UNIVERSITY NAME"
                 />
              </div>

              {/* Separator */}
              <div className="w-full flex justify-center mb-8">
                 <div className="w-24 h-1.5 bg-green-600 rounded-full"></div>
              </div>
              
              {/* Dynamic Details Table */}
              <div className="flex-1 w-full px-4 flex flex-col justify-center">
                 <div className="w-full border-2 border-yellow-600 rounded-lg overflow-hidden text-gray-900 shadow-sm bg-white text-lg">
                    {/* Standard Rows */}
                    {[
                        { l: "Submitted By:", v: data.studentName, set: (v:string)=>setData({...data, studentName:v}) },
                        { l: "Student I.D:", v: data.studentID, set: (v:string)=>setData({...data, studentID:v}) },
                        { l: "Course:", v: data.courseName, set: (v:string)=>setData({...data, courseName:v}) },
                        { l: "Submitted To:", v: data.teacherName, set: (v:string)=>setData({...data, teacherName:v}) },
                        { l: "Date:", v: data.submissionDate, set: (v:string)=>setData({...data, submissionDate:v}) },
                    ].map((row, idx) => (
                        <div key={idx} className="flex border-b border-yellow-600 last:border-b-0">
                            <div className="w-1/3 bg-blue-100/50 p-3 font-bold border-r border-yellow-600 flex items-center justify-center text-center">
                                {row.l}
                            </div>
                            <div className="w-2/3 bg-blue-50/30 p-3 flex items-center justify-center text-center">
                                <EditableField value={row.v || ""} onChange={row.set} className="font-medium" />
                            </div>
                        </div>
                    ))}

                    {/* Custom Rows */}
                    {data.coverRows && data.coverRows.map((row, idx) => (
                        <div key={`custom-${idx}`} className="flex border-t border-yellow-600 group relative">
                            <div className="w-1/3 bg-blue-100/50 p-3 font-bold border-r border-yellow-600 flex items-center justify-center text-center relative">
                                <EditableField value={row.label} onChange={(val: string) => updateCoverRow(idx, 'label', val)} className="font-bold" />
                            </div>
                            <div className="w-2/3 bg-blue-50/30 p-3 flex items-center justify-center text-center">
                                <EditableField value={row.value} onChange={(val: string) => updateCoverRow(idx, 'value', val)} />
                            </div>
                            <button 
                                onClick={() => deleteCoverRow(idx)}
                                className="absolute -right-8 top-3 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition print:hidden"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                 </div>
                 
                 <button 
                    onClick={addCoverRow}
                    className="mt-4 text-xs text-gray-400 hover:text-green-600 flex items-center justify-center w-full py-2 border border-dashed border-gray-300 rounded hover:border-green-500 transition print:hidden"
                 >
                    <PlusCircle className="w-3 h-3 mr-1" /> Add Extra Field
                 </button>
              </div>

              {/* Course Code */}
              <div className="mt-auto mb-4 text-center w-full pt-10">
                 <div className="text-xl font-bold text-black">
                    Course Code: <span className="underline decoration-green-500 decoration-4 underline-offset-4">{data.courseCode}</span>
                 </div>
              </div>
          </div>
        </div>

        {/* Content Pages */}
        {data.contentPages.map((html, idx) => (
          <div 
            key={idx}
            className="print-page w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl relative p-[15mm] shrink-0 will-change-transform translate-z-0 gpu-accelerated"
            data-page={idx}
            onFocus={() => setActivePageIndex(idx)}
            onClick={() => setActivePageIndex(idx)}
          >
             <div className="w-full h-full min-h-[267mm] border-[6px] border-double p-8 flex flex-col relative"
                  style={{borderColor: data.borderColor || '#16A34A'}}>
                
                <div className="text-center font-bold text-lg mb-6 flex justify-between items-center group">
                  <span className="w-full border-b pb-2 border-gray-200">Assignment: {data.number}</span>
                </div>

                <PageEditor 
                  html={html}
                  onChange={(newHtml) => updatePageContent(idx, newHtml)}
                  onBlur={saveSelection}
                  className="flex-grow text-justify font-sans text-lg leading-relaxed outline-none whitespace-pre-wrap overflow-hidden"
                />

                <div className="text-center text-sm text-gray-400 mt-8 pt-4 border-t border-gray-100">
                  Page {idx + 2} of {data.contentPages.length + 1}
                </div>
             </div>
          </div>
        ))}
        
        <div className="pb-20">
            <button 
            onClick={() => setData({ ...data, contentPages: [...data.contentPages, ""] })}
            className="print-hide flex items-center space-x-2 text-gray-500 hover:text-white transition py-4 px-8 border border-dashed border-gray-700 rounded-lg hover:border-gray-500 hover:bg-gray-800"
            >
            <PlusCircle className="w-6 h-6" />
            <span>Add New Page</span>
            </button>
        </div>

      </div>
    </div>
  );
};