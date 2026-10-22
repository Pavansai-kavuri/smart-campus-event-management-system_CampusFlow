import React from 'react';

export interface ProfessionalAvatarOption {
  id: string;
  name: string;
  title: string;
  category: string;
  accentColor: string;
  svg: (props: { className?: string }) => React.ReactElement;
}

export const PROFESSIONAL_AVATARS: ProfessionalAvatarOption[] = [
  {
    id: 'avatar-scholar',
    name: 'Academic Scholar',
    title: 'Research & Academia',
    category: 'Academic',
    accentColor: '#3B82F6',
    svg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="sch_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1E293B" />
            <stop offset="1" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="sch_gold" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#F59E0B" />
            <stop offset="1" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="sch_suit" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#334155" />
            <stop offset="1" stopColor="#1E293B" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#sch_bg)" stroke="#475569" strokeWidth="2" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="#F59E0B" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
        {/* Shoulders / Suit */}
        <path d="M18 96C18 78 32 68 50 68C68 68 82 78 82 96" fill="url(#sch_suit)" />
        {/* Shirt Collar */}
        <path d="M42 68L50 82L58 68L50 72Z" fill="#F8FAFC" />
        {/* Gold Tie */}
        <path d="M48 72L52 72L53.5 86L50 90L46.5 86Z" fill="url(#sch_gold)" />
        {/* Lapels */}
        <path d="M30 74L42 86L40 96L24 88Z" fill="#1E293B" opacity="0.9" />
        <path d="M70 74L58 86L60 96L76 88Z" fill="#1E293B" opacity="0.9" />
        {/* Neck */}
        <rect x="44" y="52" width="12" height="18" rx="4" fill="#FBD5BD" />
        {/* Head */}
        <ellipse cx="50" cy="42" rx="16" ry="19" fill="#FBD5BD" />
        {/* Hair - Neat Professional Part */}
        <path d="M33 38C33 26 40 21 50 21C60 21 67 26 67 36C67 39 65 41 62 40C58 39 52 35 48 35C42 35 37 38 33 38Z" fill="#33241A" />
        <path d="M33 38C31 43 32 48 33 50C34 46 36 43 37 42C35 40 33 39 33 38Z" fill="#251912" />
        {/* Glasses */}
        <rect x="38" y="38" width="10" height="7" rx="2" fill="none" stroke="#F59E0B" strokeWidth="1.2" />
        <rect x="52" y="38" width="10" height="7" rx="2" fill="none" stroke="#F59E0B" strokeWidth="1.2" />
        <line x1="48" y1="41" x2="52" y2="41" stroke="#F59E0B" strokeWidth="1.2" />
        {/* Lapel Pin */}
        <circle cx="36" cy="82" r="2" fill="#F59E0B" />
      </svg>
    ),
  },
  {
    id: 'avatar-innovator',
    name: 'Tech & AI Innovator',
    title: 'Software & Engineering',
    category: 'Engineering',
    accentColor: '#178855',
    svg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="inn_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#064E3B" />
            <stop offset="1" stopColor="#022C22" />
          </linearGradient>
          <linearGradient id="inn_accent" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#4DAE8B" />
            <stop offset="1" stopColor="#178855" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#inn_bg)" stroke="#178855" strokeWidth="2" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="#4DAE8B" strokeWidth="0.8" opacity="0.4" />
        {/* Modern Turtleneck Jacket */}
        <path d="M16 96C16 77 31 66 50 66C69 66 84 77 84 96" fill="#0B1310" />
        <path d="M26 78L40 96H60L74 78C67 73 59 70 50 70C41 70 33 73 26 78Z" fill="#182721" />
        {/* Emerald Turtleneck Collar */}
        <rect x="42" y="58" width="16" height="12" rx="3" fill="#178855" />
        {/* Neck */}
        <rect x="44" y="50" width="12" height="12" rx="2" fill="#F0C7AB" />
        {/* Head */}
        <ellipse cx="50" cy="40" rx="16" ry="18" fill="#F0C7AB" />
        {/* Modern styled short hair */}
        <path d="M33 36C33 24 41 18 50 18C59 18 67 24 67 34C67 37 63 35 59 34C53 33 46 32 39 35C35 36 33 37 33 36Z" fill="#1C1917" />
        {/* Minimal Smart Frame Glasses */}
        <rect x="37" y="37" width="11" height="8" rx="2.5" fill="none" stroke="#4DAE8B" strokeWidth="1.4" />
        <rect x="52" y="37" width="11" height="8" rx="2.5" fill="none" stroke="#4DAE8B" strokeWidth="1.4" />
        <line x1="48" y1="41" x2="52" y2="41" stroke="#4DAE8B" strokeWidth="1.4" />
        {/* Glowing Tech Dot / Earbud */}
        <circle cx="67" cy="43" r="2" fill="#4DAE8B" />
        <circle cx="67" cy="43" r="3.5" fill="none" stroke="#4DAE8B" strokeWidth="0.6" opacity="0.6" />
      </svg>
    ),
  },
  {
    id: 'avatar-designer',
    name: 'Creative & UI/UX Director',
    title: 'Product & Design',
    category: 'Design',
    accentColor: '#D49E9E',
    svg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="des_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4A044E" />
            <stop offset="1" stopColor="#2E0827" />
          </linearGradient>
          <linearGradient id="des_rose" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#FCE5DB" />
            <stop offset="1" stopColor="#D49E9E" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#des_bg)" stroke="#9E5E78" strokeWidth="2" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="#D49E9E" strokeWidth="0.8" opacity="0.5" />
        {/* Tailored blazer */}
        <path d="M18 96C18 78 32 67 50 67C68 67 82 78 82 96" fill="#3B122D" />
        {/* Inner silk blouse */}
        <path d="M40 67L50 82L60 67Z" fill="url(#des_rose)" />
        {/* Lapel collar */}
        <path d="M30 75L44 88L41 96L23 88Z" fill="#4A1938" />
        <path d="M70 75L56 88L59 96L77 88Z" fill="#4A1938" />
        {/* Neck */}
        <rect x="44" y="51" width="12" height="17" rx="3" fill="#FBD5BD" />
        {/* Head */}
        <ellipse cx="50" cy="40" rx="15" ry="18" fill="#FBD5BD" />
        {/* Long elegant styled hair */}
        <path d="M32 38C32 23 41 19 50 19C59 19 68 23 68 38C68 49 67 62 65 68C63 58 63 46 61 41C56 38 44 38 39 41C37 46 37 58 35 68C33 62 32 49 32 38Z" fill="#2E1C14" />
        {/* Signature Round Fashion Glasses */}
        <circle cx="42" cy="40" r="5" fill="none" stroke="#C5A168" strokeWidth="1.3" />
        <circle cx="58" cy="40" r="5" fill="none" stroke="#C5A168" strokeWidth="1.3" />
        <line x1="47" y1="40" x2="53" y2="40" stroke="#C5A168" strokeWidth="1.3" />
        {/* Pearl / Gold Stud Earring */}
        <circle cx="33" cy="45" r="1.8" fill="#EBD6AB" />
        <circle cx="67" cy="45" r="1.8" fill="#EBD6AB" />
      </svg>
    ),
  },
  {
    id: 'avatar-leader',
    name: 'Campus Ambassador',
    title: 'Student Leadership',
    category: 'Leadership',
    accentColor: '#C5A168',
    svg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="ldr_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#451A03" />
            <stop offset="1" stopColor="#1E1714" />
          </linearGradient>
          <linearGradient id="ldr_gold" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#F1E7C5" />
            <stop offset="0.5" stopColor="#C5A168" />
            <stop offset="1" stopColor="#B08A01" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#ldr_bg)" stroke="#C5A168" strokeWidth="2" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="#EBD6AB" strokeWidth="0.8" opacity="0.5" />
        {/* Presidential Navy Suit */}
        <path d="M17 96C17 77 31 67 50 67C69 67 83 77 83 96" fill="#141E28" />
        {/* Crisp White Shirt & Champagne Tie */}
        <path d="M41 67L50 81L59 67Z" fill="#FFFFFF" />
        <path d="M48 71L52 71L53.5 86L50 89L46.5 86Z" fill="url(#ldr_gold)" />
        {/* Lapels */}
        <path d="M28 75L42 88L39 96L21 88Z" fill="#1C2B38" />
        <path d="M72 75L58 88L61 96L79 88Z" fill="#1C2B38" />
        {/* Gold University Lapel Badge */}
        <path d="M34 82L36 80L38 82L36 84Z" fill="url(#ldr_gold)" />
        {/* Neck */}
        <rect x="44" y="52" width="12" height="16" rx="3" fill="#E8BFA3" />
        {/* Head */}
        <ellipse cx="50" cy="41" rx="16" ry="18" fill="#E8BFA3" />
        {/* Professional Polished Hairstyle */}
        <path d="M33 36C33 22 41 19 50 19C59 19 67 23 67 35C67 39 63 37 58 36C52 35 44 34 38 36C35 37 33 38 33 36Z" fill="#261A13" />
        {/* Confident Smile */}
        <path d="M45 49C47 51 53 51 55 49" stroke="#9A5B3B" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'avatar-executive',
    name: 'Executive & Council Lead',
    title: 'Operations & Strategy',
    category: 'Executive',
    accentColor: '#D8B739',
    svg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="exe_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2B2118" />
            <stop offset="1" stopColor="#1E1714" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#exe_bg)" stroke="#B08A01" strokeWidth="2" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="#D8B739" strokeWidth="0.8" opacity="0.5" />
        {/* Rich Espresso Blazer */}
        <path d="M17 96C17 78 31 67 50 67C69 67 83 78 83 96" fill="#1A1512" />
        {/* Ivory Shirt */}
        <path d="M41 67L50 81L59 67Z" fill="#F7F6F3" />
        <path d="M48 70L52 70L53.5 86L50 90L46.5 86Z" fill="#8C2B2B" />
        {/* Lapels */}
        <path d="M28 75L42 88L40 96L22 88Z" fill="#2E231C" />
        <path d="M72 75L58 88L60 96L78 88Z" fill="#2E231C" />
        {/* Pocket square accent */}
        <line x1="68" y1="84" x2="74" y2="82" stroke="#D8B739" strokeWidth="1.5" strokeLinecap="round" />
        {/* Neck */}
        <rect x="44" y="52" width="12" height="16" rx="3" fill="#DEB192" />
        {/* Head */}
        <ellipse cx="50" cy="41" rx="15" ry="18" fill="#DEB192" />
        {/* Classic Executive Hair */}
        <path d="M34 37C34 24 41 20 50 20C59 20 66 24 66 36C66 40 62 38 56 37C50 36 43 35 38 37C35 38 34 39 34 37Z" fill="#1C140E" />
        {/* Minimal Wireframe Glasses */}
        <rect x="38" y="38" width="10" height="7" rx="2" fill="none" stroke="#D8B739" strokeWidth="1.2" />
        <rect x="52" y="38" width="10" height="7" rx="2" fill="none" stroke="#D8B739" strokeWidth="1.2" />
        <line x1="48" y1="41" x2="52" y2="41" stroke="#D8B739" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: 'avatar-researcher',
    name: 'Biotech & Science Fellow',
    title: 'Research & Sciences',
    category: 'Sciences',
    accentColor: '#0EA5E9',
    svg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="sci_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#083344" />
            <stop offset="1" stopColor="#021C24" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#sci_bg)" stroke="#0284C7" strokeWidth="2" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="#38BDF8" strokeWidth="0.8" opacity="0.4" />
        {/* Modern Research Coat */}
        <path d="M17 96C17 78 31 67 50 67C69 67 83 78 83 96" fill="#F1F5F9" />
        {/* Navy Inner Scrub / Shirt */}
        <path d="M41 67L50 82L59 67Z" fill="#0369A1" />
        {/* Lanyard with Badge */}
        <line x1="42" y1="70" x2="48" y2="88" stroke="#38BDF8" strokeWidth="1.2" />
        <line x1="58" y1="70" x2="52" y2="88" stroke="#38BDF8" strokeWidth="1.2" />
        <rect x="46" y="87" width="8" height="9" rx="1.5" fill="#FFFFFF" stroke="#0284C7" strokeWidth="0.8" />
        {/* Coat Lapels */}
        <path d="M28 75L42 88L40 96L22 88Z" fill="#E2E8F0" />
        <path d="M72 75L58 88L60 96L78 88Z" fill="#E2E8F0" />
        {/* Neck */}
        <rect x="44" y="52" width="12" height="16" rx="3" fill="#FBD5BD" />
        {/* Head */}
        <ellipse cx="50" cy="41" rx="15" ry="18" fill="#FBD5BD" />
        {/* Hair */}
        <path d="M34 36C34 24 41 20 50 20C59 20 66 24 66 35C66 39 62 38 56 37C50 36 43 35 38 37C35 38 34 39 34 36Z" fill="#382218" />
        {/* Clear Protective / Reading Glasses */}
        <rect x="38" y="38" width="10" height="7" rx="2" fill="none" stroke="#0284C7" strokeWidth="1.2" />
        <rect x="52" y="38" width="10" height="7" rx="2" fill="none" stroke="#0284C7" strokeWidth="1.2" />
        <line x1="48" y1="41" x2="52" y2="41" stroke="#0284C7" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: 'avatar-crest',
    name: 'CampusFlow Heritage Crest',
    title: 'University Crest Monogram',
    category: 'Heritage',
    accentColor: '#C5A168',
    svg: ({ className = 'w-full h-full' }) => (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="crest_bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#178855" />
            <stop offset="1" stopColor="#0B4B2E" />
          </linearGradient>
          <linearGradient id="crest_gold" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#F1E7C5" />
            <stop offset="0.5" stopColor="#C5A168" />
            <stop offset="1" stopColor="#B08A01" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#crest_bg)" stroke="url(#crest_gold)" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="43" fill="none" stroke="#EBD6AB" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
        {/* Laurel Wreath */}
        <path d="M28 64C24 54 26 40 34 32C35 37 34 44 32 49C30 55 31 60 34 65" stroke="url(#crest_gold)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M72 64C76 54 74 40 66 32C65 37 66 44 68 49C70 55 69 60 66 65" stroke="url(#crest_gold)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Central Geometric Emblem */}
        <path d="M50 24L65 50L50 76L35 50Z" stroke="url(#crest_gold)" strokeWidth="2" fill="#0B4B2E" fillOpacity="0.8" />
        <circle cx="50" cy="50" r="10" stroke="url(#crest_gold)" strokeWidth="1.5" fill="#178855" />
        <path d="M50 33L54 44L65 50L54 56L50 67L46 56L35 50L46 44Z" fill="url(#crest_gold)" opacity="0.9" />
        <circle cx="50" cy="50" r="3" fill="#F1E7C5" />
      </svg>
    ),
  },
];

interface UserAvatarProps {
  user?: {
    name?: string;
    avatar?: string;
  } | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBorder?: boolean;
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  className = '',
  showBorder = true,
}) => {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const initial = (user?.name || 'H').charAt(0).toUpperCase();

  // Check if avatar is one of our curated professional presets
  const preset = PROFESSIONAL_AVATARS.find((a) => a.id === user?.avatar);

  const borderClass = showBorder
    ? 'border border-champagne/60 shadow-xs'
    : '';

  if (preset) {
    const SvgComponent = preset.svg;
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden ${sizeClass} ${borderClass} ${className}`}
        title={`${user?.name || 'User'} (${preset.name})`}
      >
        <SvgComponent className="w-full h-full object-cover" />
      </div>
    );
  }

  // If avatar is a custom image URL / data URI
  if (user?.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:'))) {
    return (
      <img
        src={user.avatar}
        alt={user.name || 'User avatar'}
        className={`rounded-full object-cover shrink-0 ${sizeClass} ${borderClass} ${className}`}
      />
    );
  }

  // Default elegant university monogram fallback
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full shrink-0 bg-gradient-to-br from-emerald to-[#0F5A38] text-white font-serif font-bold ${sizeClass} ${borderClass} ${className}`}
      title={user?.name || 'User Profile'}
    >
      {initial}
    </div>
  );
};
