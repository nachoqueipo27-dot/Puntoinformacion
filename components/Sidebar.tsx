
import React, { useEffect, useRef } from 'react';
import { ViewState } from '../types';
import { useStore } from '../store';
import { 
  LayoutDashboard, 
  PackagePlus, 
  Search, 
  Package, 
  ArrowRightLeft, 
  Droplets, 
  Baby,
  X,
  UserCircle,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  Calendar,
  Settings,
  Shirt
} from 'lucide-react';
import OrigenLogo from './OrigenLogo';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, onClose }) => {
  const { theme, toggleTheme, user, logout, settings } = useStore();
  const sidebarRef = useRef<HTMLElement>(null);

  // Bloquear scroll del body cuando el menú móvil está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Hook para detectar clicks fuera del sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Color Mapping for Dynamic Settings
  const colorMap: Record<string, string> = {
    blue: 'text-blue-500',
    indigo: 'text-indigo-500',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    red: 'text-red-500',
    cyan: 'text-cyan-500',
    violet: 'text-violet-500',
    pink: 'text-pink-500',
    orange: 'text-orange-500',
  };

  const activeBgMap: Record<string, string> = {
    blue: 'bg-blue-600 shadow-blue-200',
    indigo: 'bg-indigo-600 shadow-indigo-200',
    emerald: 'bg-emerald-600 shadow-emerald-200',
    amber: 'bg-amber-600 shadow-amber-200',
    red: 'bg-red-600 shadow-red-200',
    cyan: 'bg-cyan-600 shadow-cyan-200',
    violet: 'bg-violet-600 shadow-violet-200',
    pink: 'bg-pink-600 shadow-pink-200',
    orange: 'bg-orange-600 shadow-orange-200',
  };

  // Define All possible Items mapped to Settings
  const allMenuItems: { id: ViewState; icon: React.ElementType; moduleKey?: keyof typeof settings.enabledModules }[] = [
    { id: 'PANEL', icon: LayoutDashboard }, // Dashboard is static
    { id: 'NEW_PRODUCT', icon: PackagePlus, moduleKey: 'inventory' }, // Shares module with Inventory in this case
    { id: 'INVENTORY', icon: Package, moduleKey: 'inventory' },
    { id: 'MOVEMENTS', icon: ArrowRightLeft, moduleKey: 'movements' },
    { id: 'LOANS', icon: Shirt, moduleKey: 'loans' },
    { id: 'SEARCH', icon: Search, moduleKey: 'search' },
    { id: 'EVENTS', icon: Calendar, moduleKey: 'events' },
    { id: 'BAPTISMS', icon: Droplets, moduleKey: 'baptisms' },
    { id: 'PRESENTATIONS', icon: Baby, moduleKey: 'presentations' },
  ];

  // Filter based on 1. User Role and 2. Enabled Modules
  const visibleMenuItems = allMenuItems.map(item => {
    if (item.id === 'PANEL') return { ...item, label: 'Panel', subLabel: 'Resumen', color: 'blue' };

    // If it has a module key, get config from settings
    if (item.moduleKey) {
        const config = settings.enabledModules[item.moduleKey];
        
        let label = config.label;
        let subLabel = config.subLabel;

        if (item.id === 'NEW_PRODUCT') {
            label = `Nuevo en ${config.label}`;
            subLabel = 'Alta de Productos';
        }

        return { ...item, label, subLabel, color: config.color, enabled: config.enabled };
    }
    return { ...item, label: 'Unknown', subLabel: '', color: 'gray' };
  }).filter(item => {
    // Role Check: USER
    if (user?.role === 'USER' && item.id !== 'PANEL') return false; 

    // Role Check: MODERATOR (Cant see Inventory or New Product)
    if (user?.role === 'MODERATOR' && (item.id === 'INVENTORY' || item.id === 'NEW_PRODUCT')) return false;
    
    // Module Enabled Check
    if ((item as any).enabled === false) return false;

    return true;
  });

  const handleNavigation = (id: ViewState) => {
    setView(id);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      <div 
        className={`fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <aside 
        ref={sidebarRef}
        className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-800 flex flex-col
        transition-all duration-300 ease-in-out border-r border-slate-900 dark:border-slate-700
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        lg:translate-x-0 lg:shadow-none lg:static h-[100dvh]
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-slate-900 dark:border-slate-700">
           {settings.logoUrl ? (
               <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
           ) : (
               <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none border border-slate-900">
                 <OrigenLogo className="w-6 h-6 text-white" />
               </div>
           )}
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-800 dark:text-white leading-tight truncate">{settings.appName}</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{settings.appSubtitle}</p>
          </div>
          {/* Close Button Mobile */}
          <button 
            onClick={onClose} 
            className="lg:hidden ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          {visibleMenuItems.map((item) => {
            const isActive = currentView === item.id;
            const itemColor = (item as any).color || 'gray';
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center p-3 rounded-2xl transition-all duration-200 group relative overflow-hidden border ${
                  isActive 
                    ? `text-white shadow-lg ${activeBgMap[itemColor] || 'bg-slate-600'} border-slate-900` 
                    : 'text-gray-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-transparent hover:border-slate-900 dark:hover:border-slate-600'
                }`}
              >
                <div className={`mr-4 ${isActive ? 'text-white' : colorMap[itemColor] || 'text-slate-400'}`}>
                   <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <div className="text-left">
                  <span className={`block text-sm font-bold ${isActive ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                    {(item as any).label}
                  </span>
                  <span className={`block text-[10px] font-medium ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                    {(item as any).subLabel}
                  </span>
                </div>
                {isActive && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / User Profile */}
        <div className="p-4 pb-12 lg:pb-4 border-t border-slate-900 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
           
           {/* Admin Link (Only for ADMIN) */}
           {user?.role === 'ADMIN' && (
                <button
                    onClick={() => handleNavigation('ADMIN_PANEL')}
                    className={`w-full flex items-center p-3 rounded-xl mb-4 transition-colors border ${
                        currentView === 'ADMIN_PANEL' 
                        ? 'bg-slate-800 text-white shadow-lg dark:bg-slate-600 border-slate-900' 
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-900 dark:border-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <Settings className="w-5 h-5 mr-3" />
                    <span className="text-sm font-bold">Configuración</span>
                </button>
           )}

           <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 border border-slate-900">
                   {user?.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{user?.username}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded inline-block border border-slate-400 dark:border-slate-600">
                    {user?.role}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-slate-400 hover:bg-white dark:hover:bg-slate-600 hover:text-yellow-500 transition-colors border border-transparent hover:border-slate-900 dark:hover:border-slate-500"
                  title="Cambiar tema"
                >
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <button 
                  onClick={logout}
                  className="p-2 rounded-lg text-slate-400 hover:bg-white dark:hover:bg-slate-600 hover:text-red-500 transition-colors border border-transparent hover:border-slate-900 dark:hover:border-slate-500"
                  title="Cerrar Sesión"
                >
                  <LogOut size={18} />
                </button>
              </div>
           </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;