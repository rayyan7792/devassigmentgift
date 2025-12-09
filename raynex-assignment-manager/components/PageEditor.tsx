import React, { useRef, useEffect, useState } from 'react';

interface PageEditorProps {
  html: string;
  onChange: (html: string) => void;
  onBlur: () => void;
  style?: React.CSSProperties;
  className?: string;
}

// Extended word list
const ACADEMIC_WORDS = [
  // Greetings / Common
  "Hello", "Hi", "Assalamualaikum", "Wa Alaikum Assalam", "Sir", "Mam", "Ma’am",
  "Attendance", "Roll Number", "Assignment", "Project", "Presentation", "Submit", "Deadline",
  "Class cancelled", "Lab", "Group", "Discussion", "Viva", "Pass", "Fail",
  
  // CS / IT
  "Computer", "Programming", "Algorithm", "Data Structure", "Database", "Software", "Hardware",
  "Operating System", "Compiler", "Code", "Coding", "Debug", "Loop", "Variable", "Function",
  "Output", "Input", "Error", "Network", "Internet", "AI", "Artificial Intelligence", "Machine Learning",
  "Cyber Security", "Cloud", "Python", "C++", "Java", "SQL", "HTML", "CSS", "API",
  
  // Engineering
  "Engineering", "Circuit", "Voltage", "Current", "Resistance", "Design", "Structure", "Material",
  "CAD", "Tools", "Workshop", "Measurement", "Analysis", "Mechanics", "Thermodynamics", "PLC",
  "Microcontroller", "Presentation Board", "Model", "Practical", "Experiment", "Blueprint", "Architecture",
  "Drafting", "Calibration", "Prototype", "Simulation", "Efficiency", "Force", "Torque", "Load", "Beam",
  "Stress", "Strain", "Controller", "Sensor", "Actuator", "Soldering", "PCB", "Renewable Energy",
  "Fluid Mechanics", "Heat Transfer", "CNC Machine", "3D Printing",

  // Academic Admin
  "Semester", "Credit Hour", "GPA", "Transcript", "Midterm", "Final", "Performa", "ID Card",
  "Admin Office", "Hostel", "Transport", "Library", "Wi-Fi", "Canteen", "Fees", "Challan",
  "Scholarship", "Attendance Short",
  
  // General Academic
  "abstract", "academic", "analysis", "analyze", "argument", "assessment", 
  "background", "bibliography", "business",
  "calculate", "category", "characterize", "chronological", "citation", "conclusion", "concept", "context", "correlation", "critical",
  "data", "definition", "demonstrate", "describe", "description", "development", "discussion", "distinction",
  "education", "effect", "element", "environment", "evaluation", "evidence", "experiment", "explanation", "explore",
  "factor", "feature", "finance", "foundation", "framework", "function",
  "generation", "global",
  "hypothesis",
  "identify", "illustration", "impact", "implication", "importance", "indication", "information", "interaction", "interpretation", "introduction", "investigation",
  "journalism", "justification",
  "knowledge",
  "literature", "logical",
  "maintenance", "management", "measurement", "mechanism", "methodology", "motivation",
  "narrative", "necessary",
  "objective", "observation", "occurrence", "opportunity", "organization", "outcome",
  "participation", "perspective", "phenomenon", "philosophy", "potential", "prediction", "preparation", "principle", "probability", "problem", "procedure", "process", "production", "professional", "proposal", "psychology",
  "qualitative", "quantitative", "questionnaire",
  "reaction", "recommendation", "reference", "regulation", "relationship", "relevance", "reliability", "requirement", "research", "resource", "response", "result", "review",
  "significance", "simulation", "solution", "source", "specific", "specification", "statistics", "strategy", "structure", "subjective", "summary", "survey", "systematic",
  "technique", "technology", "theoretical", "theory", "thesis", "traditional", "transmission",
  "understanding", "university",
  "validity", "variable", "variation",
  "writing"
];

const PageEditorComponent: React.FC<PageEditorProps> = ({ html, onChange, onBlur, style, className }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isLocked = useRef(false);
  
  // Autocomplete State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState<{top: number, left: number} | null>(null);
  const [currentWordRange, setCurrentWordRange] = useState<Range | null>(null);

  // Sync initial HTML only if significantly different
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html;
    }
  }, [html]);

  // --- AUTOCOMPLETE LOGIC ---

  const getCaretCoordinates = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0).cloneRange();
      range.collapse(true);
      const rect = range.getBoundingClientRect();
      if (rect) {
        return {
          left: rect.left + window.scrollX,
          top: rect.bottom + window.scrollY
        };
      }
    }
    return null;
  };

  const getCurrentWord = (): { word: string; start: number; end: number; node: Node } | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    
    // Only support text nodes
    if (node.nodeType !== Node.TEXT_NODE) return null;

    const text = node.textContent || "";
    const offset = range.startOffset;

    // Find start of word
    let start = offset;
    while (start > 0 && /[\w’'’]/.test(text[start - 1])) {
        start--;
    }

    // Find end of word (usually cursor)
    const end = offset;

    const word = text.slice(start, end);
    return { word, start, end, node };
  };

  const handleAutocomplete = () => {
    const current = getCurrentWord();
    if (!current || current.word.length < 2) {
        setSuggestions([]);
        return;
    }

    const { word } = current;
    const lowerWord = word.toLowerCase();

    // Combine static dictionary + simple extracted words from current text (history)
    const contentText = editorRef.current?.innerText || "";
    // Robust regex matching with fallback
    const matches = contentText.match(/\b\w+\b/g) || [];
    const historyWords = (Array.from(new Set(matches)) as string[])
                              .filter((w) => w.length > 3 && w.toLowerCase() !== lowerWord);

    const allSources = Array.from(new Set([...ACADEMIC_WORDS, ...historyWords]));
    
    const matchesList = allSources.filter(w => w.toLowerCase().startsWith(lowerWord)).slice(0, 5);

    if (matchesList.length > 0) {
        const coords = getCaretCoordinates();
        if (coords) {
            setPosition(coords);
            setSuggestions(matchesList);
            setSelectedIndex(0);
            
            // Store range for replacement
            const selection = window.getSelection();
            if (selection) {
                const range = selection.getRangeAt(0).cloneRange();
                range.setStart(current.node, current.start);
                range.setEnd(current.node, current.end);
                setCurrentWordRange(range);
            }
        }
    } else {
        setSuggestions([]);
    }
  };

  const applySuggestion = (word: string) => {
    if (currentWordRange) {
        currentWordRange.deleteContents();
        currentWordRange.insertNode(document.createTextNode(word));
        
        // Move cursor to end
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            const newRange = document.createRange();
            newRange.setStart(currentWordRange.endContainer, currentWordRange.endOffset);
            newRange.collapse(true);
            selection.addRange(newRange);
        }
        
        // Trigger save
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    }
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            applySuggestion(suggestions[selectedIndex]);
        } else if (e.key === 'Escape') {
            setSuggestions([]);
        }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    isLocked.current = true;
    const newContent = e.currentTarget.innerHTML;
    onChange(newContent);
    handleAutocomplete();
  };

  return (
    <>
        <div 
        ref={editorRef}
        className={className}
        style={style}
        contentEditable
        suppressContentEditableWarning
        spellCheck={true}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={() => {
            isLocked.current = false;
            setTimeout(() => setSuggestions([]), 200);
            onBlur();
        }}
        />
        
        {/* Suggestion Box */}
        {suggestions.length > 0 && position && (
            <div 
                className="fixed z-50 bg-[#1e1e1e] border border-gray-700 rounded shadow-2xl text-white overflow-hidden animate-in fade-in zoom-in-95 duration-75"
                style={{ 
                    top: position.top + 20, 
                    left: position.left,
                    minWidth: '150px'
                }}
            >
                <ul className="text-sm">
                    {suggestions.map((s, idx) => (
                        <li 
                            key={s} 
                            className={`px-3 py-2 cursor-pointer flex justify-between items-center ${idx === selectedIndex ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                applySuggestion(s);
                            }}
                        >
                            <span>{s}</span>
                            {idx < 9 && <span className="text-xs opacity-50 ml-2">Tab</span>}
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </>
  );
};

export const PageEditor = React.memo(PageEditorComponent);