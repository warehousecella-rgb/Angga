import React from 'react';

interface DSVLogoProps {
  className?: string;
  variant?: 'badge' | 'white' | 'dark';
  showTagline?: boolean;
}

export const DSVLogo: React.FC<DSVLogoProps> = ({
  className = '',
  variant = 'badge',
  showTagline = true,
}) => {
  if (variant === 'badge') {
    return (
      <div
        className={`flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-xl shadow-md border border-slate-200/90 select-none ${className}`}
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-[#00205B] font-black text-2xl tracking-tighter leading-none font-sans scale-y-95">
              DSV
            </span>
          </div>
          {showTagline && (
            <span className="text-[#00205B] text-[8px] font-normal tracking-tight whitespace-nowrap leading-none mt-0.5">
              Global Transport and Logistics
            </span>
          )}
        </div>
      </div>
    );
  }

  const textColor = variant === 'white' ? 'text-white' : 'text-[#00205B]';

  return (
    <div className={`flex flex-col ${textColor} select-none ${className}`}>
      <span className="font-black text-2xl tracking-tighter leading-none font-sans scale-y-95">
        DSV
      </span>
      {showTagline && (
        <span className="text-[8px] font-normal tracking-tight whitespace-nowrap opacity-90 leading-none mt-0.5">
          Global Transport and Logistics
        </span>
      )}
    </div>
  );
};
