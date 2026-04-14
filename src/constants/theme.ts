// src/constants/theme.ts
import { TextStyle, ViewStyle } from 'react-native';

// ── Palette de thèmes ───────────────────────────────────────
export type ThemeKey = 'dark' | 'light' | 'midnight' | 'forest' | 'sunset';

interface ThemeColors {
  bg:string; surf:string; card:string; card2:string;
  border:string; borderA:string;
  accent:string; accentD:string; accentG:string;
  green:string; greenD:string;
  yellow:string; yellowD:string;
  red:string; redD:string;
  purple:string; purpleD:string;
  text1:string; text2:string; text3:string;
  gold:string; silver:string; bronze:string;
}

export const THEMES: Record<ThemeKey, ThemeColors> = {
  dark: {
    bg:'#0a0d14', surf:'#0f1420', card:'#141b26', card2:'#1a2235',
    border:'rgba(255,255,255,0.06)', borderA:'rgba(82,162,255,0.25)',
    accent:'#4fa3ff', accentD:'rgba(79,163,255,0.10)', accentG:'rgba(79,163,255,0.18)',
    green:'#34c77b', greenD:'rgba(52,199,123,0.12)',
    yellow:'#f5b731', yellowD:'rgba(245,183,49,0.12)',
    red:'#ff6b6b', redD:'rgba(255,107,107,0.12)',
    purple:'#a78bfa', purpleD:'rgba(167,139,250,0.12)',
    text1:'#f0f4ff', text2:'#7a93b3', text3:'#3d5068',
    gold:'#f6c90e', silver:'#94a3b8', bronze:'#cd7c2f',
  },
  light: {
    bg:'#f4f6fb', surf:'#ffffff', card:'#ffffff', card2:'#f0f3fa',
    border:'rgba(0,0,0,0.08)', borderA:'rgba(30,100,200,0.22)',
    accent:'#1a73e8', accentD:'rgba(26,115,232,0.10)', accentG:'rgba(26,115,232,0.16)',
    green:'#1a9e5c', greenD:'rgba(26,158,92,0.10)',
    yellow:'#d4860a', yellowD:'rgba(212,134,10,0.10)',
    red:'#d93025', redD:'rgba(217,48,37,0.09)',
    purple:'#7b4fc4', purpleD:'rgba(123,79,196,0.10)',
    text1:'#1a1f2e', text2:'#4a5568', text3:'#a0aec0',
    gold:'#c4920a', silver:'#718096', bronze:'#975a16',
  },
  midnight: {
    bg:'#05080f', surf:'#090e18', card:'#0e1522', card2:'#131d2e',
    border:'rgba(120,160,255,0.08)', borderA:'rgba(120,160,255,0.28)',
    accent:'#7eaaff', accentD:'rgba(126,170,255,0.12)', accentG:'rgba(126,170,255,0.20)',
    green:'#3dd68c', greenD:'rgba(61,214,140,0.12)',
    yellow:'#ffd060', yellowD:'rgba(255,208,96,0.12)',
    red:'#ff7b7b', redD:'rgba(255,123,123,0.12)',
    purple:'#c4a0ff', purpleD:'rgba(196,160,255,0.12)',
    text1:'#e8efff', text2:'#6688bb', text3:'#2e4066',
    gold:'#ffd700', silver:'#8899bb', bronze:'#cc8844',
  },
  forest: {
    bg:'#0b1208', surf:'#111a0e', card:'#172212', card2:'#1e2c18',
    border:'rgba(120,200,100,0.08)', borderA:'rgba(100,180,80,0.28)',
    accent:'#5cc840', accentD:'rgba(92,200,64,0.12)', accentG:'rgba(92,200,64,0.20)',
    green:'#3dd68c', greenD:'rgba(61,214,140,0.12)',
    yellow:'#d4c840', yellowD:'rgba(212,200,64,0.12)',
    red:'#e87878', redD:'rgba(232,120,120,0.12)',
    purple:'#b89af0', purpleD:'rgba(184,154,240,0.12)',
    text1:'#eaf6e2', text2:'#7aaa60', text3:'#3a5c30',
    gold:'#d4b800', silver:'#88aa80', bronze:'#aa7744',
  },
  sunset: {
    bg:'#120a08', surf:'#1c1008', card:'#241408', card2:'#2e1a0a',
    border:'rgba(255,160,80,0.08)', borderA:'rgba(255,140,60,0.28)',
    accent:'#ff8c42', accentD:'rgba(255,140,66,0.12)', accentG:'rgba(255,140,66,0.20)',
    green:'#44cc88', greenD:'rgba(68,204,136,0.12)',
    yellow:'#ffcc44', yellowD:'rgba(255,204,68,0.12)',
    red:'#ff6655', redD:'rgba(255,102,85,0.12)',
    purple:'#d488ff', purpleD:'rgba(212,136,255,0.12)',
    text1:'#fff0e8', text2:'#cc8855', text3:'#664422',
    gold:'#ffcc00', silver:'#aa8866', bronze:'#cc6622',
  },
};

// Default export (will be overridden by ThemeContext)
export let Colors: ThemeColors = THEMES.dark;

export function setActiveTheme(key: ThemeKey) {
  Colors = THEMES[key];
  // Update StatusConfig and Shadow with new colors
  StatusConfig.free.color     = Colors.green;
  StatusConfig.free.bg        = Colors.greenD;
  StatusConfig.free.dot       = Colors.green;
  StatusConfig.occupied.color = Colors.red;
  StatusConfig.occupied.bg    = Colors.redD;
  StatusConfig.occupied.dot   = Colors.red;
  StatusConfig.soon.color     = Colors.yellow;
  StatusConfig.soon.bg        = Colors.yellowD;
  StatusConfig.soon.dot       = Colors.yellow;
  Shadow.glow.shadowColor     = Colors.accent;
}

export const Radius = {
  xs:6, sm:10, md:14, lg:20, xl:28, full:999,
};

export const Shadow = {
  sm:   { shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:.25, shadowRadius:6, elevation:3 },
  md:   { shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:.4, shadowRadius:14, elevation:8 },
  glow: { shadowColor:'#4fa3ff', shadowOffset:{width:0,height:0}, shadowOpacity:.3, shadowRadius:16, elevation:6 },
};

export const StatusConfig: Record<string,{label:string;color:string;bg:string;dot:string}> = {
  free:     { label:'Libre',         color:'#34c77b', bg:'rgba(52,199,123,0.12)',  dot:'#34c77b' },
  occupied: { label:'Occupée',       color:'#ff6b6b', bg:'rgba(255,107,107,0.12)', dot:'#ff6b6b' },
  soon:     { label:'Bientôt libre', color:'#f5b731', bg:'rgba(245,183,49,0.12)',  dot:'#f5b731' },
};

export const SpotTypeConfig: Record<string,{label:string;emoji:string}> = {
  standard:   { label:'Standard',   emoji:'🚗' },
  pmr:        { label:'PMR',        emoji:'♿' },
  two_wheels: { label:'2 roues',    emoji:'🛵' },
  delivery:   { label:'Livraison',  emoji:'📦' },
  electric:   { label:'Électrique', emoji:'⚡' },
};

export const THEME_META: Record<ThemeKey, {label:string; preview:string[]; isDark:boolean}> = {
  dark:     { label:'Sombre',    preview:['#0a0d14','#4fa3ff','#34c77b'], isDark:true  },
  light:    { label:'Clair',     preview:['#f4f6fb','#1a73e8','#1a9e5c'], isDark:false },
  midnight: { label:'Minuit',    preview:['#05080f','#7eaaff','#3dd68c'], isDark:true  },
  forest:   { label:'Forêt',     preview:['#0b1208','#5cc840','#3dd68c'], isDark:true  },
  sunset:   { label:'Coucher',   preview:['#120a08','#ff8c42','#44cc88'], isDark:true  },
};
