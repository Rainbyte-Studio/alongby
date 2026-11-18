import {Sun,Moon,Monitor} from 'lucide-react';
import {useTheme,type ThemePreference} from '../../context/ThemeContext';
const options=[{value:'light',label:'Light',Icon:Sun},{value:'dark',label:'Dark',Icon:Moon},{value:'system',label:'System',Icon:Monitor}] as const;
export function ThemeSelector({compact=false}:{compact?:boolean}){
 const {theme,setTheme}=useTheme();
 return <div role="group" aria-label="Appearance" className="inline-flex max-w-full gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-1">
 {options.map(({value,label,Icon})=><button key={value} type="button" title={label} aria-pressed={theme===value} onClick={()=>setTheme(value as ThemePreference)}
 className={'inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] '+(theme===value?'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm':'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]')}>
 <Icon size={15} aria-hidden="true"/>{!compact&&<span>{label}</span>}</button>)}</div>
}
