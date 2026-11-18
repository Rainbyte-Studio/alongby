import React, {createContext, useContext, useEffect, useState} from 'react';
export type ThemePreference = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';
const Context = createContext<{theme:ThemePreference;resolvedTheme:Resolved;setTheme:(t:ThemePreference)=>void}|null>(null);
const KEY='alongby-theme', QUERY='(prefers-color-scheme: dark)';
function read():ThemePreference {try {const v=localStorage.getItem(KEY);return v==='light'||v==='dark'||v==='system'?v:'system'}catch{return 'system'}}
export function ThemeProvider({children}:{children:React.ReactNode}){
 const [theme,setPreference]=useState<ThemePreference>(read);
 const [system,setSystem]=useState<Resolved>(()=>matchMedia(QUERY).matches?'dark':'light');
 const resolvedTheme=theme==='system'?system:theme;
 useEffect(()=>{const m=matchMedia(QUERY);const update=()=>setSystem(m.matches?'dark':'light');m.addEventListener('change',update);return()=>m.removeEventListener('change',update)},[]);
 useEffect(()=>{document.documentElement.dataset.theme=resolvedTheme;document.documentElement.style.colorScheme=resolvedTheme;const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',resolvedTheme==='dark'?'#141414':'#F8F7F5')},[resolvedTheme]);
 const setTheme=(value:ThemePreference)=>{setPreference(value);try{localStorage.setItem(KEY,value)}catch{}};
 return <Context.Provider value={{theme,resolvedTheme,setTheme}}>{children}</Context.Provider>
}
export function useTheme(){const v=useContext(Context);if(!v)throw new Error('ThemeProvider missing');return v}
