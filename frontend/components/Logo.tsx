import React from 'react';

export const MainLogo = ({ className = "h-8 w-auto" }: { className?: string }) => (
    <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg shadow-lg">
            <span className="text-white font-bold text-xl tracking-tighter">AI</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        </div>
        <div className="flex flex-col leading-none">
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Main<span className="text-blue-600">TMS</span></span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Logistics Platform</span>
        </div>
    </div>
);

export const AiLogoStandalone = ({ className = "h-8 w-8" }: { className?: string }) => (
    <div className={`flex items-center justify-center bg-blue-600 rounded-lg shadow-md ${className}`}>
        <span className="text-white font-bold text-sm tracking-tighter">AI</span>
    </div>
);

export default MainLogo;
