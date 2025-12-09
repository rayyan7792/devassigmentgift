import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Sparkles, Image as ImageIcon, Search, Loader2, BrainCircuit, X } from 'lucide-react';

interface GeminiAssistantProps {
  onClose: () => void;
  onInsertContent: (content: string) => void;
}

// NOTE: In a real app, process.env.API_KEY would be used. 
// For this demo, we assume it's available or the user has configured it.
// If not, we'll show a friendly error.

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ onClose, onInsertContent }) => {
  const [mode, setMode] = useState<'chat' | 'search' | 'image'>('chat');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string, type?: 'search' | 'thought' | 'image'}[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!input.trim() && !imageFile) return;

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setMessages(prev => [...prev, { role: 'model', text: "Error: API_KEY is not configured in the environment." }]);
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Add User Message
    const newUserMsg = { role: 'user' as const, text: input, type: mode === 'search' ? 'search' as const : undefined };
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setLoading(true);

    try {
      let responseText = '';

      if (mode === 'search') {
         // Search Grounding
         const response = await ai.models.generateContent({
           model: 'gemini-2.5-flash',
           contents: newUserMsg.text,
           config: {
             tools: [{ googleSearch: {} }],
           },
         });
         
         // Extract text and grounding metadata
         responseText = response.text || "No response generated.";
         
         if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            const chunks = response.candidates[0].groundingMetadata.groundingChunks;
            const links = chunks.map((c: any) => c.web?.uri).filter(Boolean).join('\n');
            if (links) {
                responseText += `\n\nSources:\n${links}`;
            }
         }

      } else if (mode === 'image' && imageFile && imagePreview) {
         // Image Analysis
         const base64Data = imagePreview.split(',')[1];
         const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: imageFile.type, data: base64Data } },
                    { text: newUserMsg.text || "Analyze this image." }
                ]
            }
         });
         responseText = response.text || "No analysis generated.";

      } else {
         // Thinking Mode (Default/Complex)
         // Use Thinking Budget for complex reasoning
         const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: newUserMsg.text,
            config: {
                thinkingConfig: { thinkingBudget: 32768 } // Max budget
            }
         });
         responseText = response.text || "No response generated.";
      }

      setMessages(prev => [...prev, { role: 'model', text: responseText, type: mode === 'search' ? 'search' : 'thought' }]);

    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${error.message}` }]);
    } finally {
      setLoading(false);
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => {
            setImagePreview(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
        setMode('image');
    }
  };

  return (
    <div className="fixed right-0 top-[60px] bottom-0 w-96 bg-[#1e1e1e] border-l border-gray-700 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-[#252525] flex justify-between items-center">
        <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white">Gemini Assistant</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="flex p-2 bg-[#1a1a1a] border-b border-gray-700 space-x-1">
         <button 
           onClick={() => setMode('chat')}
           className={`flex-1 flex items-center justify-center py-2 rounded text-xs font-medium transition ${mode === 'chat' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
         >
            <BrainCircuit className="w-3 h-3 mr-1" /> Thinking
         </button>
         <button 
           onClick={() => setMode('search')}
           className={`flex-1 flex items-center justify-center py-2 rounded text-xs font-medium transition ${mode === 'search' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
         >
            <Search className="w-3 h-3 mr-1" /> Search
         </button>
         <button 
           onClick={() => fileInputRef.current?.click()}
           className={`flex-1 flex items-center justify-center py-2 rounded text-xs font-medium transition ${mode === 'image' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
         >
            <ImageIcon className="w-3 h-3 mr-1" /> Image
         </button>
         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600">
         {messages.length === 0 && (
             <div className="text-center text-gray-500 mt-10 text-sm">
                 <p>Ask me anything!</p>
                 <p className="mt-2 text-xs">Use 'Thinking' for complex tasks.</p>
                 <p className="text-xs">Use 'Search' for real-time info.</p>
                 <p className="text-xs">Upload an image to analyze it.</p>
             </div>
         )}
         {messages.map((msg, idx) => (
             <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                 <div className={`max-w-[85%] rounded-xl p-3 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
                    {msg.text}
                 </div>
                 {msg.role === 'model' && (
                     <button 
                       onClick={() => onInsertContent(msg.text)} 
                       className="text-xs text-green-500 mt-1 hover:underline self-start"
                     >
                       Insert to Editor
                     </button>
                 )}
             </div>
         ))}
         {loading && (
             <div className="flex items-center text-gray-400 text-sm">
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gemini is thinking...
             </div>
         )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#252525] border-t border-gray-700">
         {imagePreview && (
             <div className="mb-2 relative w-16 h-16">
                 <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded border border-gray-600" />
                 <button onClick={() => { setImagePreview(null); setImageFile(null); setMode('chat'); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                    <X className="w-3 h-3" />
                 </button>
             </div>
         )}
         <div className="flex space-x-2">
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
               placeholder={mode === 'image' ? "Ask about the image..." : "Type a message..."}
               className="flex-1 bg-[#1a1a1a] border border-gray-600 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none h-10 min-h-[40px] max-h-24"
             />
             <button 
               onClick={handleSend}
               disabled={loading || (!input.trim() && !imageFile)}
               className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition"
             >
                 <Send className="w-5 h-5" />
             </button>
         </div>
      </div>
    </div>
  );
};