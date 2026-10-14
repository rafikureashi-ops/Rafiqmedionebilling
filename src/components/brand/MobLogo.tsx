import React, { useState, useEffect } from 'react';
import { BrandStore } from '../../lib/brandStore.js';

interface MobLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  showFullEmblem?: boolean;
}

export const MobLogo: React.FC<MobLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  className = '',
  showFullEmblem = false
}) => {
  const [logoSrc, setLogoSrc] = useState<string>(BrandStore.getLogo());

  useEffect(() => {
    return BrandStore.subscribe((assets) => {
      setLogoSrc(assets.logoUrl);
    });
  }, []);

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24'
  };

  const textSizes = {
    sm: 'text-base font-bold',
    md: 'text-lg font-bold',
    lg: 'text-2xl font-extrabold',
    xl: 'text-3xl font-extrabold'
  };

  // If full emblem requested (e.g. on Auth screens, Splash, About)
  if (showFullEmblem) {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="relative group">
          <img
            key={logoSrc}
            src={logoSrc}
            alt="MediOneBilling (MOB) Smart Pharmacy Management"
            referrerPolicy="no-referrer"
            className={`${size === 'xl' ? 'w-48 h-48' : size === 'lg' ? 'w-36 h-36' : 'w-24 h-24'} object-contain drop-shadow-md rounded-full transition-transform hover:scale-105 duration-300`}
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Official Circular 3D Emblem with fallback */}
      <div className={`${iconSizes[size]} shrink-0 relative flex items-center justify-center rounded-full overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 bg-white`}>
        <img
          key={logoSrc}
          src={logoSrc}
          alt="MediOneBilling (MOB) Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain"
          onError={(e) => {
            // Elegant SVG fallback if image is missing
            const parent = e.currentTarget.parentElement;
            if (parent) {
              e.currentTarget.style.display = 'none';
              parent.className = `${iconSizes[size]} shrink-0 relative flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-teal-500 to-rose-600 text-white font-black text-xs`;
              parent.innerText = 'MOB';
            }
          }}
        />
      </div>

      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`${textSizes[size]} tracking-tight font-extrabold`}>
            <span className="text-blue-600 dark:text-blue-400">Medi</span>
            <span className="text-emerald-600 dark:text-emerald-400">One</span>
            <span className="text-rose-600 dark:text-rose-400">Billing</span>
          </span>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            MOB
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-normal mt-0.5">
            Smart Pharmacy Management · Android · Laptop · Cloud Sync
          </span>
        )}
      </div>
    </div>
  );
};
