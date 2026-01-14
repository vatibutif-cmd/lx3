import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { Zap } from 'lucide-react';

// Cable Component
const Cable = () => {
  const [path, setPath] = useState('');
  const [plugPosition, setPlugPosition] = useState({ x: 0, y: 0, angle: 0 });

  useEffect(() => {
    const updatePath = () => {
      const start = document.getElementById('cable-start');
      const end = document.getElementById('cable-plug-point'); // Updated target
      
      if (!start || !end) return;

      const startRect = start.getBoundingClientRect();
      const endRect = end.getBoundingClientRect();

      // Start: Left center of the "Participants" label
      const x1 = startRect.left;
      const y1 = startRect.top + startRect.height / 2;

      // End: Center of the new Plug Point (Bottom right of machine)
      const x2 = endRect.left + endRect.width / 2;
      const y2 = endRect.top + endRect.height / 2;

      // Control points for a natural hanging curve
      // Start goes slightly down and left
      const cp1x = x1 - 50;
      const cp1y = y1 + 200; // Increased drop for more natural slack
      
      // End approaches horizontally from right (adjusted for larger plug)
      const cp2x = x2 + 200;
      const cp2y = y2;

      setPath(`M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`);
      
      // Calculate angle for plug rotation at the end point
      // Simple approximation based on the last segment direction
      // Or just fixed horizontal insertion since it's the side of the machine
      setPlugPosition({ x: x2, y: y2, angle: 0 });
    };

    // Update initially and on resize
    updatePath();
    window.addEventListener('resize', updatePath);
    
    // Also update periodically in case of layout shifts
    const interval = setInterval(updatePath, 1000);

    return () => {
        window.removeEventListener('resize', updatePath);
        clearInterval(interval);
    };
  }, []);

  return (
    <svg className="fixed inset-0 pointer-events-none z-[60]" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="cableGradient" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00FF7F" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#00FF7F" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#00FF7F" stopOpacity="0.1" />
        </linearGradient>
        <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
        <filter id="plugGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
      </defs>
      
      {/* Physical Cable (Thicker, Darker Background) */}
      <path d={path} fill="none" stroke="#051008" strokeWidth="12" strokeLinecap="round" />
      <path d={path} fill="none" stroke="#1a3320" strokeWidth="10" strokeLinecap="round" />

      {/* Energy Flow (Inner Core) */}
      <path d={path} fill="none" stroke="#00FF7F" strokeWidth="3" strokeDasharray="20 100" strokeLinecap="round" filter="url(#glow)">
        <animate attributeName="stroke-dashoffset" from="120" to="0" dur="1.5s" repeatCount="indefinite" />
      </path>

      {/* Charging Plug Head at the End */}
      <g transform={`translate(${plugPosition.x}, ${plugPosition.y})`} >
          {/* Connector Body (Larger 2x) */}
          <rect x="-40" y="-24" width="48" height="48" rx="8" fill="#1a1a1a" stroke="#333" strokeWidth="2" />
          
          {/* Green Indicator Light on Plug */}
          <circle cx="-20" cy="0" r="6" fill="#00FF7F" filter="url(#plugGlow)">
             <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* Metal Contacts (Inserted part) */}
          <rect x="-4" y="-16" width="12" height="32" fill="#888" />
      </g>

    </svg>
  );
};

const BatteryOverlay = ({ percent, particles = [], settledParticles = [] }) => {
  // --- 调节区域 START ---
  // 您可以手动修改以下数值来调整进度条位置
  const batteryStyle = {
    top: '19.3%',    // 垂直位置 (向上调小，向下调大)
    left: '21.8%',   // 水平位置 (向左调小，向右调大)
    width: '56.4%',  // 宽度
    height: '62%',   // 高度
    borderRadius: '4px',
  };
  // --- 调节区域 END ---

  return (
    <div className="absolute z-10 flex flex-col"
      style={{
        ...batteryStyle,
        background: 'rgba(10, 20, 15, 0.6)',
        border: '1px solid rgba(0, 255, 127, 0.3)',
        boxShadow: 'inset 0 0 30px rgba(0, 255, 127, 0.1)',
      }}
    >
      <div className="absolute inset-0 z-20 opacity-30 pointer-events-none" 
           style={{
             backgroundImage: 'linear-gradient(rgba(0, 255, 127, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 127, 0.2) 1px, transparent 1px)', 
             backgroundSize: '20px 20px'
           }} 
      />
      
      <div className="w-full h-full relative overflow-hidden p-1">
          <div className="absolute bottom-1 left-1 right-1 bg-brand-green/10 h-[calc(100%-8px)] rounded-[4px] overflow-hidden flex flex-col justify-end">
              
              {/* Settled/Retained Bubbles (Sediment at bottom) */}
              {settledParticles.map((p) => (
                <div
                  key={`settled-${p.id}`}
                  className="absolute z-10 px-3 py-1.5 bg-black/50 border border-white/20 rounded-full text-white/90 text-sm font-medium whitespace-nowrap shadow-sm backdrop-blur-sm animate-[fadeIn_0.5s_ease-out]"
                  style={{
                    left: `${p.x}%`,
                    bottom: `${p.y}%`, 
                    transform: `scale(${p.scale})`,
                  }}
                >
                  {p.name}
                </div>
              ))}

              {/* Rising Name Bubbles */}
              {particles.map(p => (
                <div
                  key={p.id}
                  className="absolute z-20 text-black font-black text-2xl whitespace-nowrap px-6 py-3 bg-gradient-to-r from-brand-green to-emerald-400 border-2 border-white rounded-full shadow-[0_0_20px_rgba(0,255,127,0.8)] animate-[bubbleUp_4s_ease-out_forwards]"
                  style={{
                    left: `${p.x}%`,
                    bottom: '0%', // Start from bottom
                    boxShadow: '0 0 15px rgba(0, 255, 127, 0.6)'
                  }}
                >
                  {p.name}
                </div>
              ))}

              <div 
                className="w-full bg-gradient-to-t from-brand-green via-[#00FF9D] to-brand-green shadow-[0_0_30px_rgba(0,255,127,0.6)] transition-all duration-700 ease-out relative"
                style={{ height: `${percent}%` }}
              >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-white shadow-[0_0_15px_#FFF] z-10" />
                <div className="absolute inset-0 animate-[chargeFlicker_2s_infinite] bg-white/10" />
              </div>
          </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="flex flex-col items-center">
            <div className="bg-black/40 backdrop-blur-sm px-6 py-2 rounded-xl border border-brand-green/20 shadow-2xl mb-2">
                <span className="text-5xl font-black tracking-tighter text-brand-green tabular-nums">
                    {Math.min(100, Math.round(percent * 100) / 100).toFixed(2)}<span className="text-2xl align-top ml-1">%</span>
                </span>
            </div>
            
            {/* Energy Loading Hint Removed */}
            
          </div>
      </div>
    </div>
  );
};

const LiveLogs = ({ logs }) => {
  // Take only the last 5 logs
  const displayLogs = logs.slice(0, 5);
  // Create fixed slots array to maintain layout stability
  const slots = Array(5).fill(null);
  
  return (
    <div className="flex flex-col gap-4 w-full mt-auto">
        <div id="cable-start" className="flex items-center gap-3 mb-2 relative">
            <div className="w-3 h-3 rounded-full bg-brand-green animate-pulse" />
            <span className="text-white/60 text-base font-bold tracking-wider">实时充电参与者</span>
            {/* Connection Point Halo */}
            <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-brand-green/20 animate-ping" />
        </div>
        <div className="flex flex-col space-y-2 w-full">
            {slots.map((_, index) => {
                const log = displayLogs[index];
                return (
                    <div key={index} className="flex items-center justify-between text-base px-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors shadow-md h-[40px] overflow-hidden">
                        {log ? (
                            <>
                                <div className="flex items-center gap-3 animate-[slideIn_0.5s_ease-out] whitespace-nowrap overflow-hidden text-ellipsis">
                                    <span className="text-brand-green font-bold">{log.message.split(' ')[0]}</span>
                                    <span className="text-white/60 truncate max-w-[200px]">{log.message.split(' ').slice(1).join(' ')}</span>
                             </div>
                             <span className="text-white/40 font-mono scale-90 whitespace-nowrap ml-2">{log.timestamp}</span>
                            </>
                        ) : (
                            <div className="w-full h-full opacity-0 border-b border-white/10" aria-hidden="true">Placeholder</div>
                        )}
                    </div>
                );
            })}
            {displayLogs.length === 0 && (
                <div className="absolute top-[50%] left-0 w-full text-center text-white/20 text-sm italic pointer-events-none">等待能量注入...</div>
            )}
        </div>
    </div>
  );
};

export default function BigScreen() {
  const [percent, setPercent] = useState(0);
  const [particles, setParticles] = useState([]);
  const [settledParticles, setSettledParticles] = useState([]); // New state for retained bubbles
  const [logs, setLogs] = useState([]);
  const [socket, setSocket] = useState(null);
  const [joinUrl, setJoinUrl] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [triggerName, setTriggerName] = useState('');

  useEffect(() => {
    // Connect to Socket.io server
    const socketUrl = window.location.port === '5173' 
      ? `http://${window.location.hostname}:3001`
      : '/';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    // Set Join URL for QR Code (Initial fallback)
    const currentPort = window.location.port || '80';
    setJoinUrl(`http://${window.location.hostname}:${currentPort}/join`);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('init', (state) => {
      setPercent(state.progress);
      setLogs(state.logs);
      
      // Prefer public URL if available
      if (state.publicUrl) {
          setJoinUrl(`${state.publicUrl}/join`);
      } else {
          // Improved logic: If we are on a public IP/domain, use it. 
          // Only fallback to serverIp (LAN IP) if we are on localhost.
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          
          if (isLocalhost && state.serverIp) {
              // Use Vite dev server port in development, server port in production
              const isDev = import.meta.env.DEV;
              const port = isDev ? window.location.port || 5173 : state.port || 3001;
              setJoinUrl(`http://${state.serverIp}:${port}/join`);
          } else {
              // Use current hostname (works for Public IPs, domains, etc.)
              const port = window.location.port ? `:${window.location.port}` : '';
              setJoinUrl(`${window.location.protocol}//${window.location.hostname}${port}/join`);
          }
      }
    });

    newSocket.on('progress_update', (p) => {
      setPercent(p);
    });

    newSocket.on('new_log', (log) => {
      setLogs(prev => [log, ...prev].slice(0, 50)); // Keep history but display limits in component
    });

    newSocket.on('spawn_particle', (data) => {
        const particleId = Date.now() + Math.random();
        // Generate random x position between 5% and 75% to stay within battery width
        const randomX = 5 + Math.random() * 70;
        const newParticle = { id: particleId, name: data.name, x: randomX };
        
        // Add to flying particles
        setParticles(prev => [...prev, newParticle]);
        
        // Add to settled particles (retained at bottom)
        // Give them a random position at the bottom (0-15%) and random scale
        setSettledParticles(prev => {
            let candidate = {};
            let isOverlapping = true;
            let attempts = 0;
            const maxAttempts = 50;
            
            // Keep fewer particles to avoid clutter (e.g. max 8)
            const currentParticles = prev.slice(-7);

            while (isOverlapping && attempts < maxAttempts) {
                candidate = {
                    ...newParticle,
                    // X: 10% - 75% (Centered horizontal range)
                    x: 10 + Math.random() * 65,
                    // Y: 2% - 15% (Bottom sediment layer)
                    y: 2 + Math.random() * 13,
                    // Scale: Uniform size for cleaner look
                    scale: 1.0
                };
                
                if (currentParticles.length === 0) {
                    isOverlapping = false;
                } else {
                    // Rectangular collision check for pill shape
                    // Assuming roughly 15% width and 6% height in coordinate space
                    isOverlapping = currentParticles.some(p => {
                        const dx = Math.abs(p.x - candidate.x);
                        const dy = Math.abs(p.y - candidate.y);
                        return dx < 14 && dy < 7; 
                    });
                }
                attempts++;
            }
            
            // If overlap persists, try to place it in a safe "upper" sediment layer
            if (isOverlapping) {
                 candidate.y = 15 + Math.random() * 5;
                 candidate.x = 10 + Math.random() * 65;
            }
            
            return [...currentParticles, candidate];
        });
        
        // Remove particle after animation (4s for bubbleUp)
        setTimeout(() => {
            setParticles(prev => prev.filter(p => p.id !== particleId));
        }, 4000);
    });

    newSocket.on('completion', (data) => {
        // Trigger massive effect
        setIsComplete(true);
        setTriggerName(data.name || 'Anonymous');
    });

    return () => newSocket.close();
  }, []);

  return (
    <div className="w-screen h-screen bg-[#050508] flex items-center justify-center overflow-hidden relative font-sans">
      {/* Cable Connection Overlay */}
      <Cable />



      {/* Particles */}
      {particles.map(p => (
          <div key={p.id} 
               className="fixed z-50 pointer-events-none flex flex-col items-center animate-[energyFly_1.5s_ease-in-out_forwards]" 
               style={{
                   top: '60%', 
                   left: '40%', // Start closer to the machine
               }}
          >
              <div className="w-4 h-4 rounded-full bg-brand-green shadow-[0_0_20px_#00FF7F,0_0_40px_#00FF7F]" />
          </div>
      ))}

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#050508] to-black opacity-50" />
      </div>

      <div className="w-full h-full max-w-[1700px] relative z-10 grid grid-cols-[1fr_520px] items-center gap-16 px-10 py-10">
         
         {/* Left Side: Machine (Prominent) */}
         <div className="relative flex items-center justify-center">
            <div className="relative h-[90vh] w-auto max-h-[980px] aspect-[450/800] -translate-y-[3vh]">
                 <img src="/charging-station.png" className="h-full w-full object-contain drop-shadow-[0_0_50px_rgba(0,0,0,0.8)]" alt="Energy Cabinet" />
                 
                 {/* Logo on Machine */}
                 <div className="absolute left-[8%] top-[15%] bottom-[15%] w-[0.5%] min-w-[3px] bg-brand-yellow/80 shadow-[0_0_15px_rgba(255,215,0,0.5)] flex flex-col justify-center items-center py-4 overflow-hidden">
                    <div className="whitespace-nowrap -rotate-90 text-brand-black font-bold tracking-[0.5em] text-xs absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 text-center">
                        ROCHEX ENERGY
                    </div>
                 </div>

                 {/* Status Lights */}
                 <div className="absolute top-[17%] left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    <div className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_10px_#00FF00]" />
                    <div className="w-2 h-2 rounded-full bg-[#FF0000] opacity-30" />
                    <div className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_10px_#00FF00]" />
                 </div>

                 {/* Center Energy Core */}
                 <div className="absolute top-[35%] left-1/2 -translate-x-1/2 z-20">
                     <div className="relative w-20 h-20 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-brand-green/30 shadow-[0_0_30px_rgba(0,255,127,0.3)]">
                        {/* Dynamic Background Pulse */}
                        <div className={`absolute inset-0 rounded-full bg-brand-green/20 ${particles.length > 0 ? 'animate-ping opacity-40 duration-75' : 'animate-pulse opacity-20 duration-1000'}`} />
                        
                        {/* Lightning Icon */}
                         <Zap 
                             className={`w-12 h-12 text-brand-green fill-brand-green drop-shadow-[0_0_15px_rgba(0,255,127,0.8)] ${particles.length > 0 ? 'animate-[boltFlicker_0.2s_ease-in-out_infinite]' : 'animate-[boltFlicker_2s_ease-in-out_infinite]'}`} 
                             strokeWidth={1.5}
                         />
                     </div>
                 </div>

                 <BatteryOverlay percent={percent} particles={particles} settledParticles={settledParticles} />

                 {/* New Plug Point Anchor */}
                 <div id="cable-plug-point" className="absolute right-[-1%] bottom-[12%] w-4 h-4 bg-transparent z-50" />
            </div>
         </div>

         {/* Right Side: Panel (Fixed Size Card) */}
          <div className="w-full flex flex-col justify-center relative">
             <div className="p-6 bg-gradient-to-br from-gray-900/80 to-gray-800/70 rounded-3xl shadow-2xl border border-brand-green/40 backdrop-blur-sm relative overflow-hidden min-h-[620px] flex flex-col">
                 
                 {/* QR Code Section */}
                <div className="flex flex-col items-center gap-6 mb-8">
                    <div className="w-56 h-56 bg-white p-3 rounded-lg relative">
                         <QRCodeSVG value={joinUrl} className="w-full h-full" />
                         <div className="absolute inset-0 border-2 border-brand-green/30 rounded-lg animate-pulse pointer-events-none" />
                    </div>
                    
                    <div className="text-center space-y-3">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-brand-green/10 border border-brand-green/20">
                            <span className="text-brand-green font-bold text-sm tracking-widest uppercase">扫码蓄力 | SCAN TO POWER UP</span>
                        </div>
                        <h2 className="text-white text-2xl font-bold mt-2">
                            使用微信扫码<br/>
                            <span className="text-brand-text-blue">为年会注入能量</span>
                        </h2>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-white/10 mb-6" />

                {/* Live Logs Section */}
                <LiveLogs logs={logs} />
                
            </div>
            {/* Celebration Overlay (Moved to cover only right panel) */}
            {isComplete && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-[fadeIn_0.5s_ease-out] rounded-3xl">
                    <div className="relative flex flex-col items-center justify-center w-full h-full p-4">
                        {/* Rays of Light */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] animate-[spin_10s_linear_infinite]">
                            <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(0,255,127,0.2)_20deg,transparent_40deg,rgba(255,215,0,0.2)_60deg,transparent_80deg)]" />
                        </div>
                        
                        <div className="relative z-10 text-center space-y-4 animate-[scaleUp_0.8s_cubic-bezier(0.175,0.885,0.32,1.275)] w-full">
                            <div className="text-brand-green text-5xl font-black tracking-tighter drop-shadow-[0_0_30px_rgba(0,255,127,0.8)]">
                                ENERGY FULL
                            </div>
                            <div className="text-white text-2xl font-bold tracking-widest">
                                充能完成
                            </div>
                            {triggerName && (
                                <div className="text-brand-gold text-lg font-mono mt-2 animate-pulse truncate max-w-full px-2">
                                    关键充能者: {triggerName}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3 mt-8 pointer-events-auto w-full max-w-[240px] mx-auto">
                                <button 
                                     onClick={() => setIsComplete(false)}
                                     className="w-full py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold backdrop-blur-sm transition-all active:scale-95 text-sm"
                                 >
                                     返回
                                 </button>
                                <button 
                                    onClick={() => window.open('/api/export', '_blank')}
                                    className="w-full py-2 rounded-full bg-brand-green/20 hover:bg-brand-green/30 border border-brand-green/40 text-brand-green font-bold backdrop-blur-sm transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                                >
                                    <span>导出名单</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
         </div>

      </div>
    </div>
  );
}
