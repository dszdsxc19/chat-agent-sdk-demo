import React, { useState } from 'react';
import { type FabModalOptions, type OpenOptions, type SidebarOptions } from 'my-agent-sdk';

interface ShellProps {
  children: React.ReactNode;
  displayMode: OpenOptions;
  onClose: () => void;
}

// Icons
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);

export const FabModalShell = ({ children, displayMode }: ShellProps) => {
  const [isExpanded, setExpanded] = useState(true);
  const options = displayMode as FabModalOptions;
  const position = options.position ?? 'bottom-right';
  const offsetX = options.offset?.x ?? 0;
  const offsetY = options.offset?.y ?? 0;
  const sideProp = position === 'bottom-left' ? 'left' : 'right';
  const buttonOffset = 16;
  const modalOffset = 80;

  const toggle = () => setExpanded(prev => !prev);

  // Note: Parent Host has pointer-events: none. We enable them on children.

  return (
    <div className="relative w-full h-full pointer-events-none font-sans">
        {/* Modal / Chat Window */}
        {isExpanded && (
            <div
              className="absolute w-[400px] h-[600px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-100px)] bg-white rounded-lg shadow-xl overflow-hidden pointer-events-auto flex flex-col border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-200"
              style={{
                backgroundColor: 'white',
                bottom: `${modalOffset + offsetY}px`,
                [sideProp]: `${buttonOffset + offsetX}px`,
              }}
            >
                <div className="flex justify-between items-center p-3 border-b border-gray-100 bg-gray-50">
                    <span className="font-medium text-gray-700">Chat</span>
                    <button onClick={() => setExpanded(false)} className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors">
                        <CloseIcon />
                    </button>
                </div>
                <div className="flex-1 overflow-hidden relative flex flex-col">
                    {children}
                </div>
            </div>
        )}

        {/* FAB Button */}
        <button
            onClick={toggle}
            className="absolute w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-transform hover:scale-105 pointer-events-auto z-50"
            style={{
              bottom: `${buttonOffset + offsetY}px`,
              [sideProp]: `${buttonOffset + offsetX}px`,
            }}
        >
            {isExpanded ? <CloseIcon /> : <ChatIcon />}
        </button>
    </div>
  );
};

export const SidebarShell = ({ children, displayMode, onClose }: ShellProps) => {
    // Cast to SidebarOptions to access specific props safely
    const options = displayMode as SidebarOptions;
    const { side = 'right', width = '400px', overlayMask = true, layout = 'overlay' } = options;

    // Show mask only in overlay mode if requested
    const showMask = layout === 'overlay' && overlayMask;

    const sideClass = side === 'left' ? 'left-0 border-r' : 'right-0 border-l';

    return (
        <div className="relative w-full h-full pointer-events-none font-sans">
             {showMask && (
                 <div
                    className="absolute inset-0 bg-black/20 pointer-events-auto transition-opacity"
                    onClick={onClose}
                 />
             )}

             <div
                className={`absolute top-0 bottom-0 ${sideClass} bg-white shadow-xl pointer-events-auto flex flex-col transition-transform duration-300`}
                style={{ width, backgroundColor: 'white' }}
             >
                 <div className="flex justify-between items-center p-3 border-b border-gray-100 bg-gray-50">
                    <span className="font-medium text-gray-700">Assistant</span>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors">
                        <CloseIcon />
                    </button>
                </div>
                <div className="flex-1 overflow-hidden relative flex flex-col">
                    {children}
                </div>
             </div>
        </div>
    );
};

export const EmbeddedShell = ({ children }: ShellProps) => {
    return (
        <div
          className="w-full h-full bg-white overflow-hidden flex flex-col pointer-events-auto font-sans"
          style={{ backgroundColor: 'white', minHeight: '100%' }}
        >
            {children}
        </div>
    );
};
