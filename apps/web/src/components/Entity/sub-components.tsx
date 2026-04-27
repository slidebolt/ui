import { useEntityContext } from './EntityItem';

export function EntityIcon({ className = '' }: { className?: string }) {
  const { ui } = useEntityContext();
  const Icon = ui.icon;
  
  return (
    <Icon 
      className={`transition-all duration-300 ${ui.isActive ? ui.activeColorClass : ui.colorClass} ${className} ${
        ui.isActive ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]' : ''
      }`}
    />
  );
}

export function EntityName({ className = '', subtext }: { className?: string, subtext?: 'id' | 'plugin' | 'type' }) {
  const { entity } = useEntityContext();
  
  return (
    <div className="flex flex-col min-w-0">
      <span className={`truncate ${className}`}>{entity.data.name || 'Unnamed Entity'}</span>
      {subtext === 'id' && <span className="text-[10px] text-slate-500 font-mono truncate">{entity.key}</span>}
      {subtext === 'plugin' && <span className="text-[10px] text-slate-500 font-mono truncate">{entity.data.plugin?.replace('plugin-', '')}</span>}
      {subtext === 'type' && <span className="text-[10px] text-slate-500 font-mono truncate uppercase tracking-tighter font-bold">{entity.data.type}</span>}
    </div>
  );
}

export function EntityState({ className = '' }: { className?: string }) {
  const { ui } = useEntityContext();
  
  return (
    <div className={`flex items-baseline gap-1 ${className}`}>
      <span className={`font-mono font-medium transition-colors ${ui.isActive ? 'text-slate-200' : 'text-slate-500'}`}>
        {ui.value}
      </span>
      {ui.unit && <span className="text-[10px] text-slate-500 font-bold">{ui.unit}</span>}
    </div>
  );
}

export function EntityBadge() {
  const { entity } = useEntityContext();
  return (
    <span className="px-1.5 py-0.5 bg-slate-800/80 text-slate-400 rounded text-[9px] uppercase font-bold tracking-tight border border-slate-700/50">
      {entity.data.type}
    </span>
  );
}
