import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';

interface MathSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSymbol: (symbol: string) => void;
}

const CATEGORIES = {
  "Basic Math": [
    { name: "Plus", symbol: "+" },
    { name: "Minus", symbol: "−" },
    { name: "Multiply", symbol: "×" },
    { name: "Divide", symbol: "÷" },
    { name: "Equals", symbol: "=" },
    { name: "Not Equal", symbol: "≠" },
    { name: "Greater Than", symbol: ">" },
    { name: "Less Than", symbol: "<" },
    { name: "Greater/Equal", symbol: "≥" },
    { name: "Less/Equal", symbol: "≤" },
  ],
  "Algebra": [
    { name: "x", symbol: "𝑥" },
    { name: "y", symbol: "𝑦" },
    { name: "z", symbol: "𝑧" },
    { name: "Squared", symbol: "²" },
    { name: "Cubed", symbol: "³" },
    { name: "Square Root", symbol: "√" },
    { name: "Cube Root", symbol: "∛" },
    { name: "Approx", symbol: "≈" },
    { name: "Proportional", symbol: "∝" },
    { name: "Plus-Minus", symbol: "±" },
  ],
  "Set Theory": [
    { name: "Element of", symbol: "∈" },
    { name: "Not Element", symbol: "∉" },
    { name: "Subset", symbol: "⊂" },
    { name: "Superset", symbol: "⊃" },
    { name: "Empty Set", symbol: "∅" },
    { name: "Union", symbol: "∪" },
    { name: "Intersection", symbol: "∩" },
    { name: "Subset Eq", symbol: "⊆" },
    { name: "Superset Eq", symbol: "⊇" },
  ],
  "Geometry": [
    { name: "Angle", symbol: "∠" },
    { name: "Degree", symbol: "°" },
    { name: "Pi", symbol: "π" },
    { name: "Diameter", symbol: "⌀" },
    { name: "Perpendicular", symbol: "⊥" },
    { name: "Parallel", symbol: "∥" },
    { name: "Triangle", symbol: "△" },
  ],
  "Trigonometry": [
    { name: "Sin", symbol: "sin" },
    { name: "Cos", symbol: "cos" },
    { name: "Tan", symbol: "tan" },
    { name: "Theta", symbol: "θ" },
    { name: "Alpha", symbol: "α" },
    { name: "Beta", symbol: "β" },
  ],
  "Calculus": [
    { name: "Integral", symbol: "∫" },
    { name: "Partial Diff", symbol: "∂" },
    { name: "Infinity", symbol: "∞" },
    { name: "Nabla", symbol: "∇" },
    { name: "Summation", symbol: "Σ" },
    { name: "Limit", symbol: "lim" },
  ],
  "Logic": [
    { name: "AND", symbol: "∧" },
    { name: "OR", symbol: "∨" },
    { name: "NOT", symbol: "¬" },
    { name: "Implies", symbol: "⇒" },
    { name: "Equivalent", symbol: "⇔" },
    { name: "For All", symbol: "∀" },
    { name: "Exists", symbol: "∃" },
  ],
  "Statistics": [
    { name: "Mean (mu)", symbol: "μ" },
    { name: "Sigma", symbol: "σ" },
    { name: "Sum", symbol: "Σ" },
  ],
   "Number System": [
    { name: "Integers", symbol: "ℤ" },
    { name: "Natural", symbol: "ℕ" },
    { name: "Rational", symbol: "ℚ" },
    { name: "Real", symbol: "ℝ" },
    { name: "Complex", symbol: "ℂ" },
  ]
};

export const MathSidebar: React.FC<MathSidebarProps> = ({ isOpen, onClose, onInsertSymbol }) => {
  const [openCategory, setOpenCategory] = useState<string | null>("Basic Math");

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-[120px] bottom-0 w-64 bg-[#262626] border-l border-gray-700 shadow-xl z-40 flex flex-col transition-transform animate-in slide-in-from-right duration-300">
      <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-[#1f1f1f]">
        <h3 className="font-bold text-gray-200">Math Symbols</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-600">
        {Object.entries(CATEGORIES).map(([category, symbols]) => (
          <div key={category} className="mb-2">
            <button 
              onClick={() => setOpenCategory(openCategory === category ? null : category)}
              className="w-full flex items-center justify-between p-2 text-left text-sm font-medium text-gray-300 hover:bg-gray-700 rounded transition"
            >
              {category}
              {openCategory === category ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {openCategory === category && (
              <div className="grid grid-cols-4 gap-1 mt-1 p-1 bg-[#1a1a1a] rounded">
                {symbols.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onInsertSymbol(item.symbol)}
                    className="aspect-square flex items-center justify-center text-lg text-white hover:bg-green-600 rounded hover:scale-110 transition"
                    title={item.name}
                  >
                    {item.symbol}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
