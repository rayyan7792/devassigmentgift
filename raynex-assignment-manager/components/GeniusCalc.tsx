import React, { useState } from 'react';
import { Delete, Equal, Divide, X, Minus, Plus, FunctionSquare, X as CloseIcon, History } from 'lucide-react';

interface GeniusCalcProps {
  onClose?: () => void;
}

export const GeniusCalc: React.FC<GeniusCalcProps> = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSymbols, setShowSymbols] = useState(false);

  const insert = (val: string) => setInput(prev => prev + val);

  const handlePress = (val: string) => {
    if (val === 'AC') {
      setInput('');
      setResult('');
    } else if (val === 'DEL') {
      setInput(prev => prev.slice(0, -1));
    } else if (val === 'SYM') {
      setShowSymbols(!showSymbols);
    } else if (val === '=') {
      if (!input) return;
      try {
        let evalString = input
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/\^/g, '**')
            .replace(/π/g, 'Math.PI')
            .replace(/e/g, 'Math.E')
            .replace(/√\(/g, 'Math.sqrt(')
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/ln\(/g, 'Math.log(');

        // Auto-Correct parentheses
        const openParens = (evalString.match(/\(/g) || []).length;
        const closeParens = (evalString.match(/\)/g) || []).length;
        if (openParens > closeParens) {
            evalString += ')'.repeat(openParens - closeParens);
        }

        // eslint-disable-next-line no-eval
        const res = eval(evalString);
        const formattedRes = Number.isInteger(res) ? res.toString() : res.toFixed(6).replace(/\.?0+$/, '');
        
        setResult(formattedRes);
        setHistory(prev => [`${input} = ${formattedRes}`, ...prev].slice(0, 10));
      } catch (e) {
        setResult('Error');
      }
    } else {
      insert(val);
    }
  };

  const symbols = [
      { disp: 'sin', val: 'sin(' }, { disp: 'cos', val: 'cos(' }, { disp: 'tan', val: 'tan(' },
      { disp: 'π', val: 'π' }, { disp: 'e', val: 'e' }, { disp: '√', val: '√(' },
      { disp: 'ln', val: 'ln(' }, { disp: 'log', val: 'log(' }, { disp: '^', val: '^' },
      { disp: '(', val: '(' }, { disp: ')', val: ')' }, { disp: '!', val: '!' }, 
  ];

  return (
    <div className="flex flex-col h-full bg-black text-white p-4 relative font-sans">
       
       {/* Optional Header for Standalone Mode */}
       {onClose && (
           <div className="absolute top-2 right-2 z-30">
               <button onClick={onClose} className="p-1 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition">
                   <CloseIcon className="w-4 h-4" />
               </button>
           </div>
       )}

       {/* Symbol Overlay */}
       <div className={`absolute inset-x-0 bottom-0 bg-[#1c1c1c] rounded-t-3xl p-4 z-20 transition-transform duration-300 ease-in-out shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-gray-800 ${showSymbols ? 'translate-y-0' : 'translate-y-full'}`}>
           <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
               <h3 className="font-bold text-gray-400 text-sm">Advanced Math</h3>
               <button onClick={() => setShowSymbols(false)} className="bg-gray-800 p-1 rounded-full text-gray-400 hover:text-white"><CloseIcon className="w-4 h-4" /></button>
           </div>
           <div className="grid grid-cols-4 gap-3">
               {symbols.map(s => (
                   <button 
                    key={s.disp}
                    onClick={() => { insert(s.val); setShowSymbols(false); }}
                    className="bg-gray-800 h-10 rounded-lg font-medium text-lg hover:bg-orange-600 transition flex items-center justify-center text-cyan-400 shadow-sm"
                   >
                       {s.disp}
                   </button>
               ))}
           </div>
       </div>

       {/* Display */}
       <div className="flex-1 flex flex-col justify-end items-end mb-4 space-y-1 relative pt-6">
           
           {/* History Overlay */}
           {showHistory && (
               <div className="absolute top-0 left-0 right-0 bottom-0 bg-gray-900/95 p-4 z-10 rounded-xl backdrop-blur-md overflow-y-auto animate-in fade-in slide-in-from-top-2 border border-gray-800">
                   <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                        <h4 className="text-xs text-orange-500 font-bold uppercase tracking-wider">Calculations</h4>
                        <button onClick={() => setHistory([])} className="text-xs text-red-500 hover:text-red-400 font-bold px-2 py-1 bg-red-900/20 rounded">CLEAR</button>
                   </div>
                   <div className="space-y-2">
                    {history.map((h, i) => (
                        <div key={i} className="text-right text-gray-300 text-sm py-2 border-b border-gray-800 font-mono break-all">{h}</div>
                    ))}
                   </div>
                   {history.length === 0 && <div className="text-center text-gray-600 text-xs mt-10">No history yet</div>}
               </div>
           )}
           
           <div className="absolute top-0 left-0 flex space-x-2 mt-2">
               <button onClick={() => setShowHistory(!showHistory)} className={`p-2 rounded-full transition ${showHistory ? 'bg-orange-500 text-white' : 'hover:bg-gray-800 text-gray-400'}`}>
                   <History className="w-5 h-5"/>
               </button>
           </div>

           <div className="text-gray-400 text-2xl font-light h-8 overflow-hidden w-full text-right px-2">{result}</div>
           <div className="text-5xl font-light tracking-wider break-all text-right leading-tight w-full px-2 text-white">{input || '0'}</div>
       </div>

       {/* Main Grid - Optimized for mobile width */}
       <div className="grid grid-cols-4 gap-3 pb-2 flex-shrink-0">
           <button onClick={() => handlePress('AC')} className="bg-[#a5a5a5] text-black h-16 w-16 rounded-full font-medium text-xl flex items-center justify-center hover:bg-white transition active:scale-90">AC</button>
           <button onClick={() => handlePress('DEL')} className="bg-[#a5a5a5] text-black h-16 w-16 rounded-full font-medium text-lg flex items-center justify-center hover:bg-white transition active:scale-90"><Delete className="w-6 h-6"/></button>
           <button onClick={() => handlePress('SYM')} className="bg-[#a5a5a5] text-black h-16 w-16 rounded-full font-medium text-lg flex items-center justify-center hover:bg-white transition active:scale-90 shadow-[0_0_10px_rgba(255,255,255,0.2)]"><FunctionSquare className="w-6 h-6"/></button>
           <button onClick={() => handlePress('÷')} className="bg-[#ff9f0a] text-white h-16 w-16 rounded-full font-medium text-2xl flex items-center justify-center hover:bg-orange-400 transition active:scale-90 shadow-lg shadow-orange-900/50"><Divide className="w-7 h-7"/></button>

           <button onClick={() => handlePress('7')} className="bg-[#333333] text-white h-16 w-16 rounded-full text-2xl hover:bg-[#444] active:scale-90 transition">7</button>
           <button onClick={() => handlePress('8')} className="bg-[#333333] text-white h-16 w-16 rounded-full text-2xl hover:bg-[#444] active:scale-90 transition">8</button>
           <button onClick={() => handlePress('9')} className="bg-[#333333] text-white h-16 w-16 rounded-full text-2xl hover:bg-[#444] active:scale-90 transition">9</button>
           <button onClick={() => handlePress('×')} className="bg-[#ff9f0a] text-white h-16 w-16 rounded-full font-medium text-2xl flex items-center justify-center hover:bg-orange-400 transition active:scale-90 shadow-lg shadow-orange-900/50"><X className="w-7 h-7"/></button>

           <button onClick={() => handlePress('4')} className="bg-[#333333] text-white h-16 w-16 rounded-full text-2xl hover:bg-[#444] active:scale-90 transition">4</button>
           <button onClick={() => handlePress('5')} className="bg-[#333333] text-white h-16 w-16 rounded-full text-2xl hover:bg-[#444] active:scale-90 transition">5</button>
           <button onClick={() => handlePress('6')} className="bg-[#333333] text-white h-16 w-16 rounded-full text-2xl hover:bg-[#444] active:scale-90 transition">6</button>
           <button onClick={() => handlePress('-')} className="bg-[#ff9f0a] text-white h-16 w-16 rounded-full font-medium text-2xl flex items-center justify-center hover:bg-orange-400 transition active:scale-90 shadow-lg shadow-orange-900/50"><Minus className="w-7 h-7"/></button>

           <button onClick={() => handlePress('1')} className="bg-[#333333] text-white h-16 w-16 rounded-full text-2xl hover:bg-[#444] active:scale-90 transition">1</button>
           <button onClick={() => handlePress('2')} className="bg-[#333333] text-white h-16 w-16 rounded-full text-2xl hover:bg-[#444] active:scale-90 transition">2</button>
           <button onClick={() => handlePress('3')} className="bg-[#333333] text-white h-16 w-16 rounded-full text-2xl hover:bg-[#444] active:scale-90 transition">3</button>
           <button onClick={() => handlePress('+')} className="bg-[#ff9f0a] text-white h-16 w-16 rounded-full font-medium text-2xl flex items-center justify-center hover:bg-orange-400 transition active:scale-90 shadow-lg shadow-orange-900/50"><Plus className="w-7 h-7"/></button>

           <button onClick={() => handlePress('0')} className="col-span-2 bg-[#333333] text-white h-16 rounded-full text-2xl pl-8 text-left hover:bg-[#444] active:scale-90 transition">0</button>
           <button onClick={() => handlePress('.')} className="bg-[#333333] text-white h-16 w-16 rounded-full text-2xl hover:bg-[#444] active:scale-90 transition">.</button>
           <button onClick={() => handlePress('=')} className="bg-[#ff9f0a] text-white h-16 w-16 rounded-full font-medium text-2xl flex items-center justify-center hover:bg-orange-400 transition active:scale-90 shadow-lg shadow-orange-900/50"><Equal className="w-7 h-7"/></button>
       </div>
    </div>
  );
};