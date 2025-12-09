import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, X, Calculator, Globe, Battery, Signal, Wifi, MessageSquare, Camera, Clock, Image as ImageIcon, RotateCw, Upload, Layout, Image as ImgIcon, Phone, Music, Mail, Compass, StickyNote, Settings, Search, Play, Pause, SkipForward, SkipBack, Zap } from 'lucide-react';
import { GeniusCalc } from './GeniusCalc';

interface MobilePhoneProps {
  isOpen: boolean;
  onClose: () => void;
}

const SONGS = [
  { id: 1, title: "Lo-Fi Study Beat", artist: "Raynex Beats", duration: "2:30", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "Piano Concerto", artist: "Classical Vibes", duration: "3:45", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "Cyberpunk City", artist: "Neon Dreams", duration: "4:12", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: 4, title: "Deep Focus", artist: "Brainwaves", duration: "5:00", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { id: 5, title: "Night Walk", artist: "Chillstep", duration: "3:20", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
];

interface AppContainerProps {
  id: string;
  activeApp: string;
  children: React.ReactNode;
}

const AppContainer: React.FC<AppContainerProps> = ({ id, activeApp, children }) => (
  <div 
    className={`absolute inset-0 z-30 flex flex-col bg-black transition-opacity duration-300 ${activeApp === id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
  >
      {children}
  </div>
);

export const MobilePhone: React.FC<MobilePhoneProps> = ({ isOpen, onClose }) => {
  const [activeApp, setActiveApp] = useState<'home' | 'calc' | 'browser' | 'camera' | 'clock' | 'themes' | 'notes' | 'music'>('home');
  const [browserUrl, setBrowserUrl] = useState('https://www.google.com/webhp?igu=1');
  const [time, setTime] = useState(new Date());
  const [wallpaper, setWallpaper] = useState<string>('bg-[url("https://images.unsplash.com/photo-1605218427360-36390f855393?auto=format&fit=crop&w=400&q=80")] bg-cover bg-center');
  const [customWallpaper, setCustomWallpaper] = useState<string | null>(null);

  // Apps State
  const [notes, setNotes] = useState("");
  const [musicSearch, setMusicSearch] = useState("");
  const [currentSong, setCurrentSong] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Theme State
  const [themeTab, setThemeTab] = useState<'wallpapers' | 'themes'>('wallpapers');

  // Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Clock State
  const [isAlarmSet, setIsAlarmSet] = useState(false);
  const [alarmTime, setAlarmTime] = useState("");

  const PRESET_WALLPAPERS = [
      'bg-gray-900', 
      'bg-gradient-to-br from-blue-900 to-black',
      'bg-gradient-to-br from-green-900 to-black',
      'bg-[url("https://images.unsplash.com/photo-1605218427360-36390f855393?auto=format&fit=crop&w=400&q=80")] bg-cover bg-center',
      'bg-[url("https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80")] bg-cover',
      'bg-[url("https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=400&q=80")] bg-cover',
  ];

  useEffect(() => {
    const updateTime = () => {
        const now = new Date();
        setTime(now);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
      if (isAlarmSet && alarmTime) {
          const hours = time.getHours().toString().padStart(2, '0');
          const minutes = time.getMinutes().toString().padStart(2, '0');
          const currentTimeStr = `${hours}:${minutes}`;

          if (currentTimeStr === alarmTime && time.getSeconds() === 0) {
              alert("⏰ ALARM RINGING! ⏰");
              setIsAlarmSet(false);
          }
      }
  }, [time, isAlarmSet, alarmTime]);

  useEffect(() => {
      if (currentSong) {
          if (!audioRef.current) {
              audioRef.current = new Audio(currentSong.url);
          } else {
              if (audioRef.current.src !== currentSong.url) {
                  audioRef.current.src = currentSong.url;
              }
          }
          if (isPlaying) audioRef.current.play();
          else audioRef.current.pause();
      }
  }, [currentSong, isPlaying]);

  const togglePlay = (song: any) => {
      if (currentSong?.id === song.id) {
          setIsPlaying(!isPlaying);
      } else {
          setCurrentSong(song);
          setIsPlaying(true);
      }
  };

  const openBrowser = (url: string) => {
    setBrowserUrl(url);
    setActiveApp('browser');
  };

  const openExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  const startCamera = async () => {
      setActiveApp('camera');
      setIsCameraActive(true);
      setCapturedImage(null);
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
          }
      } catch (e) {
          console.error("Camera access denied", e);
      }
  };

  const takePhoto = () => {
      if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(video, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              setCapturedImage(dataUrl);
              const stream = video.srcObject as MediaStream;
              stream?.getTracks().forEach(track => track.stop());
              setIsCameraActive(false);
          }
      }
  };

  const closeCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      setIsCameraActive(false);
  };

  const copyImageToClipboard = async () => {
      if (capturedImage) {
          const img = new Image();
          img.src = capturedImage;
          const w = window.open("");
          w?.document.write(img.outerHTML);
      }
  };

  const handleCustomWallpaper = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              const res = ev.target?.result as string;
              setCustomWallpaper(res);
              setWallpaper('custom');
          };
          reader.readAsDataURL(file);
      }
  };

  const getBackgroundStyle = () => {
      if (wallpaper === 'custom' && customWallpaper) {
          return { backgroundImage: `url(${customWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' };
      }
      return {};
  };

  const AppIcon = ({ icon: Icon, bg, label, onClick }: any) => (
      <button onClick={onClick} className="flex flex-col items-center space-y-1 group z-10 hover:brightness-110 active:scale-95 transition-all">
          <div className={`w-[60px] h-[60px] rounded-[14px] flex items-center justify-center shadow-md ${bg}`}>
              <Icon className="w-8 h-8 text-white" />
          </div>
          <span className="text-white text-[11px] font-medium drop-shadow-md tracking-tight">{label}</span>
      </button>
  );

  const filteredSongs = SONGS.filter(s => s.title.toLowerCase().includes(musicSearch.toLowerCase()) || s.artist.toLowerCase().includes(musicSearch.toLowerCase()));

  return (
    <div 
        className={`fixed top-1/2 left-10 -translate-y-1/2 z-[200] transition-all duration-300 gpu-accelerated ${isOpen ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-95 -translate-x-full pointer-events-none'}`}
    >
       <div className="w-[390px] h-[844px] bg-black rounded-[50px] border-[12px] border-[#2a2a2a] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative ring-1 ring-gray-700">
           
           {/* Notch */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[160px] h-[30px] bg-black rounded-b-[20px] z-50 flex justify-center items-center pointer-events-none">
               <div className="w-16 h-1 bg-[#1a1a1a] rounded-full mt-1"></div>
           </div>

           {/* Status Bar */}
           <div className="absolute top-3 left-8 right-8 flex justify-between text-white text-[13px] font-semibold z-40 select-none pointer-events-none">
               <span className="pl-2">{time.getHours().toString().padStart(2,'0')}:{time.getMinutes().toString().padStart(2,'0')}</span>
               <div className="flex space-x-1.5 items-center pr-2">
                   <Signal className="w-3.5 h-3.5 fill-current" />
                   <Wifi className="w-3.5 h-3.5" />
                   <div className="flex items-center space-x-0.5">
                       <div className="relative">
                            <Battery className="w-5 h-5 fill-white" />
                            <Zap className="w-3 h-3 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fill-black" />
                       </div>
                   </div>
               </div>
           </div>

           {/* Close Button Side */}
           <button 
                onClick={onClose}
                className="absolute -right-[15px] top-28 w-[4px] h-20 bg-[#2a2a2a] rounded-r-md hover:bg-red-500 transition cursor-pointer z-50 shadow-lg"
                title="Hide Phone"
           ></button>

           {/* Screen Content Wrapper */}
           <div className="w-full h-full relative overflow-hidden bg-black">
               
               {/* Home Screen */}
               <div 
                className={`w-full h-full flex flex-col pt-12 transition-transform duration-300 ${activeApp === 'home' ? 'scale-100' : 'scale-90 opacity-50'} ${wallpaper !== 'custom' ? wallpaper : ''}`}
                style={getBackgroundStyle()}
               >
                   <div className="flex-1 px-6 grid grid-cols-4 gap-y-6 gap-x-4 content-start pt-6">
                       <AppIcon icon={Calculator} bg="bg-gray-800" label="Calc" onClick={() => setActiveApp('calc')} />
                       <AppIcon icon={Globe} bg="bg-blue-500" label="Chrome" onClick={() => openBrowser('https://www.google.com/webhp?igu=1')} />
                       <AppIcon icon={Camera} bg="bg-gray-300 !text-black" label="Camera" onClick={startCamera} />
                       <AppIcon icon={Clock} bg="bg-black border border-gray-700" label="Clock" onClick={() => setActiveApp('clock')} />
                       
                       <AppIcon icon={StickyNote} bg="bg-yellow-400" label="Notes" onClick={() => setActiveApp('notes')} />
                       <AppIcon icon={ImageIcon} bg="bg-gradient-to-tr from-pink-500 to-purple-600" label="Themes" onClick={() => setActiveApp('themes')} />
                       <AppIcon icon={MessageSquare} bg="bg-[#10a37f]" label="ChatGPT" onClick={() => openExternalLink('https://chatgpt.com')} />
                   </div>

                   {/* Dock */}
                   <div className="mx-4 mb-8 h-24 bg-white/20 backdrop-blur-xl rounded-[35px] flex justify-around items-center px-2 shadow-lg z-10 border border-white/10">
                       <AppIcon icon={Settings} bg="bg-gray-500" label="" onClick={() => setActiveApp('themes')} />
                       <AppIcon icon={Music} bg="bg-red-500" label="" onClick={() => setActiveApp('music')} />
                       <AppIcon icon={Compass} bg="bg-blue-400" label="" onClick={() => openBrowser('https://www.google.com/webhp?igu=1')} />
                       <AppIcon icon={MessageSquare} bg="bg-green-500" label="" onClick={() => {}} />
                   </div>
               </div>

               {/* -- APPS (Persistent) -- */}
               
               {/* App: Calculator */}
               <AppContainer id="calc" activeApp={activeApp}>
                   <div className="flex-1 flex flex-col bg-black h-full pt-8">
                       <GeniusCalc />
                   </div>
               </AppContainer>

               {/* App: Browser */}
               <AppContainer id="browser" activeApp={activeApp}>
                   <div className="flex-1 flex flex-col bg-white h-full">
                       <div className="bg-[#f0f0f0] px-4 py-2 flex space-x-2 border-b shrink-0 items-center pt-12 shadow-sm z-10">
                           <div className="flex-1 bg-[#e3e3e3] rounded-lg px-3 py-1.5 flex items-center space-x-2">
                                <span className="text-[10px] text-gray-500">🔒</span>
                                <input 
                                    className="flex-1 bg-transparent text-sm outline-none text-center text-black" 
                                    value={browserUrl}
                                    onChange={(e) => setBrowserUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && setBrowserUrl(e.currentTarget.value)}
                                />
                           </div>
                       </div>
                       <iframe 
                        src={browserUrl} 
                        className="flex-1 w-full border-none"
                        title="Browser"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                       />
                   </div>
               </AppContainer>

               {/* App: Notes */}
               <AppContainer id="notes" activeApp={activeApp}>
                   <div className="flex-1 flex flex-col bg-yellow-50 text-gray-800 h-full">
                       <div className="bg-yellow-400 p-4 pt-12 flex justify-between items-center shadow-sm">
                           <h2 className="font-bold text-xl">Notes</h2>
                           <button onClick={() => setNotes("")} className="text-xs font-bold uppercase hover:opacity-50">Clear</button>
                       </div>
                       <textarea 
                         className="flex-1 bg-transparent p-6 text-lg focus:outline-none resize-none leading-relaxed"
                         placeholder="Type your notes here..."
                         value={notes}
                         onChange={(e) => setNotes(e.target.value)}
                       />
                   </div>
               </AppContainer>

               {/* App: Camera */}
               <AppContainer id="camera" activeApp={activeApp}>
                   <div className="flex-1 flex flex-col bg-black h-full relative">
                        {isCameraActive ? (
                            <>
                                <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover bg-gray-900 transform scale-x-[-1]" />
                                <div className="h-32 bg-black/90 flex items-center justify-center pb-8 shrink-0">
                                    <button onClick={takePhoto} className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white transition"></button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-4">
                                {capturedImage ? (
                                    <>
                                        <img src={capturedImage} alt="Captured" className="max-h-[70%] rounded-lg border border-gray-700" />
                                        <div className="flex space-x-4">
                                            <button onClick={() => setIsCameraActive(true)} className="px-4 py-2 bg-gray-700 rounded-full text-white">Retake</button>
                                            <button onClick={copyImageToClipboard} className="px-4 py-2 bg-blue-600 rounded-full text-white">Copy</button>
                                        </div>
                                    </>
                                ) : (
                                    <button onClick={startCamera} className="text-white bg-gray-800 px-6 py-3 rounded-full hover:bg-gray-700 transition">Start Camera</button>
                                )}
                            </div>
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                   </div>
               </AppContainer>

               {/* App: Clock */}
               <AppContainer id="clock" activeApp={activeApp}>
                   <div className="flex-1 flex flex-col bg-black text-white items-center pt-24 p-8 h-full">
                        <div className="text-7xl font-thin mb-2 tracking-tighter">
                            {time.getHours().toString().padStart(2,'0')}:{time.getMinutes().toString().padStart(2,'0')}
                        </div>
                        <div className="text-gray-400 text-xl mb-12">{time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                        <div className="text-orange-500 uppercase tracking-widest text-xs font-bold mb-4">Current Time</div>
                        
                        <div className="w-full bg-[#1c1c1e] rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-bold">Alarm</span>
                                <div className={`w-12 h-7 rounded-full relative transition cursor-pointer ${isAlarmSet ? 'bg-green-500' : 'bg-gray-600'}`} onClick={() => setIsAlarmSet(!isAlarmSet)}>
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition absolute top-0.5 left-0.5 ${isAlarmSet ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                            </div>
                            <input 
                                type="time" 
                                className="w-full bg-black text-white p-3 rounded-lg text-2xl text-center font-mono"
                                value={alarmTime}
                                onChange={(e) => setAlarmTime(e.target.value)}
                            />
                        </div>
                   </div>
               </AppContainer>

               {/* App: Music */}
               <AppContainer id="music" activeApp={activeApp}>
                   <div className="flex-1 bg-gradient-to-b from-gray-900 to-black text-white flex flex-col h-full">
                       <div className="p-4 pt-12 border-b border-gray-800">
                           <h2 className="font-bold text-2xl mb-2 text-red-500">Music</h2>
                           <div className="relative">
                               <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                               <input 
                                 className="w-full bg-gray-800 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                                 placeholder="Search..."
                                 value={musicSearch}
                                 onChange={(e) => setMusicSearch(e.target.value)}
                               />
                           </div>
                       </div>
                       <div className="flex-1 overflow-y-auto p-4 space-y-2">
                           {filteredSongs.map(song => (
                               <div key={song.id} onClick={() => togglePlay(song)} className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-white/10 transition ${currentSong?.id === song.id ? 'bg-white/10' : ''}`}>
                                   <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center mr-3">
                                       <Music className="w-5 h-5 text-gray-400" />
                                   </div>
                                   <div className="flex-1">
                                       <div className={`font-bold text-sm ${currentSong?.id === song.id ? 'text-red-500' : 'text-white'}`}>{song.title}</div>
                                       <div className="text-xs text-gray-400">{song.artist}</div>
                                   </div>
                               </div>
                           ))}
                       </div>
                       {currentSong && (
                           <div className="bg-[#1c1c1e] p-4 pb-8 border-t border-gray-800 shrink-0">
                               <div className="flex items-center justify-between mb-4">
                                   <div>
                                       <div className="text-sm font-bold text-white">{currentSong.title}</div>
                                       <div className="text-xs text-gray-400">{currentSong.artist}</div>
                                   </div>
                               </div>
                               <div className="flex justify-center items-center space-x-6">
                                   <SkipBack className="w-6 h-6 text-gray-400" />
                                   <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black">
                                       {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                                   </button>
                                   <SkipForward className="w-6 h-6 text-gray-400" />
                               </div>
                           </div>
                       )}
                   </div>
               </AppContainer>

               {/* App: Themes */}
               <AppContainer id="themes" activeApp={activeApp}>
                   <div className="flex-1 bg-[#f2f2f7] text-gray-900 flex flex-col pt-12 h-full">
                       <div className="px-6 pb-4 border-b border-gray-300 bg-white">
                           <h2 className="text-3xl font-bold">Settings</h2>
                       </div>
                       
                       <div className="flex p-4 pb-0 space-x-4 bg-white border-b border-gray-300">
                           <button onClick={() => setThemeTab('wallpapers')} className={`pb-2 text-sm font-bold uppercase transition ${themeTab === 'wallpapers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400'}`}>Wallpapers</button>
                           <button onClick={() => setThemeTab('themes')} className={`pb-2 text-sm font-bold uppercase transition ${themeTab === 'themes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400'}`}>General</button>
                       </div>
    
                       <div className="flex-1 overflow-y-auto p-4 bg-[#f2f2f7]">
                           {themeTab === 'wallpapers' && (
                               <div className="space-y-4">
                                   <div className="bg-white rounded-xl p-4 shadow-sm">
                                       <label className="flex items-center space-x-3 w-full cursor-pointer">
                                           <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><Upload className="w-5 h-5" /></div>
                                           <div className="flex-1">
                                               <div className="font-semibold text-sm">Custom Wallpaper</div>
                                               <div className="text-xs text-gray-500">From Photos</div>
                                           </div>
                                           <input type="file" accept="image/*" className="hidden" onChange={handleCustomWallpaper} />
                                       </label>
                                   </div>
    
                                   <h3 className="text-xs font-bold text-gray-400 uppercase mt-4 ml-2">Presets</h3>
                                   <div className="grid grid-cols-2 gap-3">
                                       {PRESET_WALLPAPERS.map((bg, idx) => (
                                           <button 
                                             key={idx}
                                             className={`h-48 rounded-xl shadow-sm transition transform active:scale-95 ${bg} ${wallpaper === bg ? 'ring-2 ring-blue-500' : ''}`}
                                             onClick={() => { setWallpaper(bg); setCustomWallpaper(null); }}
                                           ></button>
                                       ))}
                                   </div>
                               </div>
                           )}
                           {themeTab === 'themes' && (
                               <div className="space-y-4">
                                   <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
                                        <span className="text-sm font-medium">Airplane Mode</span>
                                        <div className="w-10 h-6 bg-gray-300 rounded-full relative"><div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow"></div></div>
                                   </div>
                                   <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
                                        <span className="text-sm font-medium">Wi-Fi</span>
                                        <div className="flex items-center text-gray-500 text-sm">Connected <div className="ml-2 w-2 h-4 text-gray-300">&gt;</div></div>
                                   </div>
                               </div>
                           )}
                       </div>
                   </div>
               </AppContainer>

               {/* Home Indicator Bar */}
               <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[130px] h-[5px] bg-white rounded-full z-[60] cursor-pointer hover:bg-gray-200 transition shadow-lg" onClick={() => { if(activeApp !== 'home') { if(activeApp === 'camera') closeCamera(); setActiveApp('home'); } }}></div>
           </div>
       </div>
    </div>
  );
};