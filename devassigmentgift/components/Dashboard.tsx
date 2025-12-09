import React, { useState, useEffect } from 'react';
import { Plus, Trash2, LogOut, Download, FileText, Calendar, User as UserIcon, BookOpen, Palette, X, Check, AlertTriangle, Flower, Zap } from 'lucide-react';
import { AssignmentData, User } from '../types';
import { getAssignments, saveAssignment, deleteAssignment } from '../services/storage';
import { exportToDocx } from '../utils/docxExport';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onSelectAssignment: (id: string) => void;
}

type Theme = 'dark' | 'pink' | 'cyberpunk';

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onSelectAssignment }) => {
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>('dark');
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // Delete Modal State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    number: '01',
    name: '',
    courseName: '',
    courseCode: '',
    studentName: 'Nimra',
    studentID: '927336',
    semester: 'Spring 2025',
    teacherName: '',
    submissionDate: '',
    borderColor: '#16A34A',
    maxFileSizeMB: 5,
    pagesNeeded: 34,
  });

  useEffect(() => {
    setAssignments(getAssignments());
  }, []);

  // Theme Styles
  const getThemeClasses = () => {
      switch(currentTheme) {
          case 'pink':
              return 'bg-[#2a0a18] selection:bg-[#db2777]';
          case 'cyberpunk':
              return 'bg-[#050510] selection:bg-cyan-500';
          default:
              return 'bg-[#0a0a0a] selection:bg-green-900';
      }
  };

  const getCardClasses = () => {
      switch(currentTheme) {
          case 'pink':
              return 'bg-[#4a1028]/80 border-[#831843] hover:border-[#f472b6] text-[#fce7f3] backdrop-blur-md';
          case 'cyberpunk':
              return 'bg-[#0f0f20]/80 border-cyan-900 hover:border-cyan-400 text-cyan-50 backdrop-blur-md shadow-[0_0_15px_rgba(0,255,255,0.1)]';
          default:
              return 'bg-[#141414] border-gray-800 hover:border-green-600 text-gray-100';
      }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteTargetId(id);
    setDeletePassword("");
    setDeleteError("");
  };

  const confirmDelete = () => {
    if (deletePassword === "927336khan2") {
        if (deleteTargetId) {
            deleteAssignment(deleteTargetId);
            setAssignments(getAssignments());
            setDeleteTargetId(null);
        }
    } else {
        setDeleteError("Incorrect Password!");
    }
  };

  const handleDownload = async (e: React.MouseEvent, assignment: AssignmentData) => {
    e.stopPropagation();
    await exportToDocx(assignment);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newAssignment: AssignmentData = {
      id: Date.now().toString(),
      ...formData,
      universityName: "RAYNEX UNIVERSITY",
      contentPages: [""],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    saveAssignment(newAssignment);
    setAssignments(getAssignments());
    setShowModal(false);
  };

  const handleSizeChange = (mb: number) => {
    const kb = mb * 1024;
    setFormData({ ...formData, maxFileSizeMB: mb, pagesNeeded: Math.floor(kb / 150) });
  };

  return (
    <div className={`min-h-screen text-gray-100 p-8 font-sans selection:text-white transition-colors duration-500 relative overflow-x-hidden ${getThemeClasses()}`}>
      
      <style>{`
        @keyframes sway {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(15px); }
        }
        @keyframes float-up {
            0% { transform: translateY(110vh) rotate(0deg); opacity: 0; }
            10% { opacity: 0.6; }
            90% { opacity: 0.6; }
            100% { transform: translateY(-10vh) rotate(360deg); opacity: 0; }
        }
        @keyframes move-random {
            0% { transform: translate(0, 0); }
            25% { transform: translate(10px, -15px); }
            50% { transform: translate(-5px, 20px); }
            75% { transform: translate(-15px, -5px); }
            100% { transform: translate(0, 0); }
        }
        .animate-float-up {
            animation: float-up linear infinite;
        }
        .animate-sway {
            animation: sway 3s ease-in-out infinite;
        }
        .animate-move {
            animation: move-random 20s infinite alternate linear;
        }
      `}</style>

      {/* ANIMATED BACKGROUNDS */}
      {currentTheme === 'pink' && (
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
              {Array.from({length: 25}).map((_, i) => (
                  <div 
                    key={i}
                    className="absolute animate-float-up"
                    style={{
                        left: `${Math.random() * 100}%`,
                        animationDuration: `${15 + Math.random() * 20}s`,
                        animationDelay: `-${Math.random() * 20}s`,
                        width: 'fit-content'
                    }}
                  >
                      <div className="animate-sway" style={{ animationDuration: `${2 + Math.random() * 3}s` }}>
                        <Flower className="text-pink-400/30 w-8 h-8" />
                      </div>
                  </div>
              ))}
          </div>
      )}

      {currentTheme === 'cyberpunk' && (
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[120px] rounded-full animate-pulse"></div>
              {Array.from({length: 20}).map((_, i) => (
                  <div 
                    key={i}
                    className="absolute bg-cyan-400 rounded-full animate-move opacity-40 shadow-[0_0_10px_cyan]"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        width: `${Math.random() * 3 + 2}px`,
                        height: `${Math.random() * 3 + 2}px`,
                        animationDuration: `${10 + Math.random() * 20}s`,
                    }}
                  ></div>
              ))}
          </div>
      )}

      {/* Header */}
      <div className={`relative z-10 max-w-7xl mx-auto flex justify-between items-center mb-12 border-b pb-6 ${currentTheme === 'pink' ? 'border-[#831843]' : currentTheme === 'cyberpunk' ? 'border-cyan-900' : 'border-gray-800'}`}>
        <div className="flex items-center space-x-4">
           <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition hover:scale-105 ${currentTheme === 'pink' ? 'bg-[#db2777] shadow-[#831843]' : currentTheme === 'cyberpunk' ? 'bg-cyan-600 shadow-cyan-500/50' : 'bg-green-600 shadow-green-900/50'}`}>
                <span className="font-bold text-2xl text-white">R</span>
           </div>
           <div>
               <h1 className="text-3xl font-bold text-white tracking-tight">Raynex Manager</h1>
               <div className="flex items-center space-x-2 mt-0.5">
                   <div className={`h-2 w-2 rounded-full animate-pulse ${currentTheme === 'pink' ? 'bg-[#f472b6]' : currentTheme === 'cyberpunk' ? 'bg-cyan-400' : 'bg-green-500'}`}></div>
                   <p className="text-gray-500 text-xs font-mono tracking-widest uppercase">Dev by Rayyan</p>
               </div>
           </div>
        </div>
        <button onClick={onLogout} className="flex items-center text-gray-400 hover:text-white transition bg-black/20 hover:bg-black/40 px-4 py-2 rounded-lg border border-transparent hover:border-gray-600 backdrop-blur-md">
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </button>
      </div>

      {/* Grid */}
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Create Card */}
          <button 
            onClick={() => setShowModal(true)}
            className={`group h-80 border border-dashed rounded-2xl flex flex-col items-center justify-center transition duration-300 relative overflow-hidden backdrop-blur-sm ${currentTheme === 'pink' ? 'border-[#831843] hover:border-[#f472b6] hover:bg-[#4a1028]/50' : currentTheme === 'cyberpunk' ? 'border-cyan-900 hover:border-cyan-500 hover:bg-cyan-900/20' : 'border-gray-800 hover:border-green-500 hover:bg-gray-900/50'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition shadow-xl z-10 scale-100 group-hover:scale-110 duration-300 ${currentTheme === 'pink' ? 'bg-[#4a1028] group-hover:bg-[#db2777] group-hover:text-white text-[#f472b6]' : currentTheme === 'cyberpunk' ? 'bg-cyan-900/50 group-hover:bg-cyan-600 group-hover:text-white text-cyan-400' : 'bg-gray-800 group-hover:bg-green-600 group-hover:text-white text-green-500'}`}>
              <Plus className="w-8 h-8" />
            </div>
            <span className="font-semibold text-gray-400 group-hover:text-white z-10 tracking-wide">Create New Assignment</span>
          </button>

          {/* Assignment Cards */}
          {assignments.map((a, idx) => (
            <div 
              key={a.id}
              onClick={() => onSelectAssignment(a.id)}
              className={`rounded-2xl p-6 cursor-pointer transition-all hover:shadow-2xl group relative flex flex-col justify-between h-80 animate-in slide-in-from-bottom-5 border ${getCardClasses()}`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
               <div className="absolute top-4 right-4 z-20">
                 <button 
                    onClick={(e) => handleDeleteClick(e, a.id)} 
                    className="text-gray-500 hover:text-red-500 p-2 bg-black/20 hover:bg-red-950/80 rounded-full transition border border-transparent hover:border-red-500"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
               
               <div>
                   <div className="flex items-start justify-between mb-4">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold border shadow-inner ${currentTheme === 'pink' ? 'bg-[#4a1028] text-[#f472b6] border-[#831843]' : currentTheme === 'cyberpunk' ? 'bg-cyan-950 text-cyan-400 border-cyan-800' : 'bg-green-900/20 text-green-500 border-green-900/50'}`}>
                       {a.number}
                     </div>
                   </div>
                   
                   <h3 className={`font-bold text-xl mb-1 line-clamp-2 leading-tight transition ${currentTheme === 'pink' ? 'group-hover:text-[#f472b6]' : currentTheme === 'cyberpunk' ? 'group-hover:text-cyan-400 text-cyan-50' : 'group-hover:text-green-400'}`}>{a.name || "Untitled"}</h3>
                   <div className="flex items-center text-xs text-gray-500 mb-6">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(a.updatedAt).toLocaleDateString()}
                   </div>

                   <div className="space-y-3 text-sm text-gray-400">
                     <div className="flex items-center">
                       <BookOpen className="w-4 h-4 mr-2 opacity-70" />
                       <span className="truncate">{a.courseName}</span>
                     </div>
                     <div className="flex items-center">
                       <UserIcon className="w-4 h-4 mr-2 opacity-70" />
                       <span className="truncate">{a.teacherName || "Not assigned"}</span>
                     </div>
                   </div>
               </div>

               <div className="mt-4 pt-4 border-t border-white/10">
                 <button 
                    onClick={(e) => handleDownload(e, a)}
                    className="w-full flex items-center justify-center space-x-2 text-gray-400 hover:text-white hover:bg-white/10 py-2 rounded-lg transition text-sm font-medium"
                 >
                    <Download className="w-4 h-4" /> 
                    <span>Export DOCX</span>
                 </button>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Theme Button */}
      <div className="fixed bottom-8 right-8 z-40">
          <div className={`relative transition-all duration-300 ${showThemeMenu ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <div className="bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-700 p-2 mb-4 space-y-2 w-48">
                  <button onClick={() => setCurrentTheme('dark')} className={`w-full text-left px-3 py-2 rounded hover:bg-gray-800 text-sm flex items-center ${currentTheme === 'dark' ? 'text-green-500 font-bold' : 'text-gray-400'}`}>
                      <div className="w-3 h-3 rounded-full bg-gray-900 border border-gray-600 mr-2"></div> Dark Mode
                  </button>
                  <button onClick={() => setCurrentTheme('pink')} className={`w-full text-left px-3 py-2 rounded hover:bg-gray-800 text-sm flex items-center ${currentTheme === 'pink' ? 'text-[#f472b6] font-bold' : 'text-gray-400'}`}>
                      <div className="w-3 h-3 rounded-full bg-[#4a1028] border border-[#f472b6] mr-2"></div> Sakura Pink
                  </button>
                  <button onClick={() => setCurrentTheme('cyberpunk')} className={`w-full text-left px-3 py-2 rounded hover:bg-gray-800 text-sm flex items-center ${currentTheme === 'cyberpunk' ? 'text-cyan-400 font-bold' : 'text-gray-400'}`}>
                      <div className="w-3 h-3 rounded-full bg-cyan-900 border border-cyan-500 mr-2"></div> Cyberpunk Neon
                  </button>
              </div>
          </div>
          <button 
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition hover:scale-110 ${currentTheme === 'pink' ? 'bg-[#db2777]' : currentTheme === 'cyberpunk' ? 'bg-cyan-600' : 'bg-blue-600'}`}
          >
              <Palette className="w-6 h-6" />
          </button>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-2xl border border-gray-700 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
             <div className="bg-[#202020] p-6 border-b border-gray-800 flex justify-between items-center sticky top-0 z-10">
               <div>
                   <h2 className="text-xl font-bold text-white">Create New Assignment</h2>
                   <p className="text-gray-500 text-xs mt-1">Fill in the details below</p>
               </div>
               <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition">✕</button>
             </div>
             
             <form onSubmit={handleCreate} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Assignment No</label>
                    <input required className="w-full bg-[#121212] border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none transition" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Topic / Name</label>
                    <input required className="w-full bg-[#121212] border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none transition" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Course Name</label>
                    <input required className="w-full bg-[#121212] border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none transition" value={formData.courseName} onChange={e => setFormData({...formData, courseName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Course Code</label>
                    <input required className="w-full bg-[#121212] border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none transition" value={formData.courseCode} onChange={e => setFormData({...formData, courseCode: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Student Name</label>
                    <input required className="w-full bg-[#121212] border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none transition" value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Student ID</label>
                    <input required className="w-full bg-[#121212] border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none transition" value={formData.studentID} onChange={e => setFormData({...formData, studentID: e.target.value})} />
                  </div>
                </div>

                 <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Teacher Name</label>
                    <input className="w-full bg-[#121212] border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none transition" value={formData.teacherName} onChange={e => setFormData({...formData, teacherName: e.target.value})} placeholder="e.g. Dr. Smith" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Submission Date</label>
                    <input type="date" className="w-full bg-[#121212] border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none transition appearance-none" value={formData.submissionDate} onChange={e => setFormData({...formData, submissionDate: e.target.value})} />
                  </div>
                </div>

                <div className="flex space-x-6">
                    <div className="flex-1 bg-[#202020] p-4 rounded-xl border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">File Limit</label>
                            <span className="text-green-500 font-bold">{formData.maxFileSizeMB} MB</span>
                        </div>
                        <input type="range" min="1" max="20" value={formData.maxFileSizeMB} onChange={e => handleSizeChange(parseInt(e.target.value))} className="w-full accent-green-500 h-2 bg-gray-700 rounded-lg cursor-pointer" />
                        <div className="mt-2 text-right text-xs text-gray-500">Est. Pages: {formData.pagesNeeded}</div>
                    </div>
                    
                    <div className="flex-1 bg-[#202020] p-4 rounded-xl border border-gray-700">
                         <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Border Color</label>
                         <div className="flex items-center space-x-3">
                             <input type="color" value={formData.borderColor} onChange={e => setFormData({...formData, borderColor: e.target.value})} className="w-10 h-10 rounded border-none cursor-pointer" />
                             <span className="text-sm text-gray-300 font-mono">{formData.borderColor}</span>
                         </div>
                    </div>
                </div>

                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-green-900/50">
                  Create Assignment
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-200">
              <div className="bg-[#1e1e1e] border border-red-900/50 rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash2 className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white text-center mb-2">Delete Assignment?</h3>
                  <p className="text-gray-400 text-center text-sm mb-6">This action cannot be undone.</p>
                  
                  <div className="mb-4">
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Login Password</label>
                      <input 
                        type="password" 
                        value={deletePassword} 
                        onChange={(e) => setDeletePassword(e.target.value)} 
                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 focus:outline-none"
                        placeholder="Enter password to confirm"
                        autoFocus
                      />
                      {deleteError && <div className="text-red-500 text-xs mt-2 flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> {deleteError}</div>}
                  </div>

                  <div className="flex space-x-3">
                      <button 
                        onClick={() => setDeleteTargetId(null)}
                        className="flex-1 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={confirmDelete}
                        className="flex-1 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition shadow-lg shadow-red-900/20"
                      >
                          Confirm
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};