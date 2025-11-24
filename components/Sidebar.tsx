import React from 'react';
import { ViewState } from '../types';
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
  Hexagon,
  LogOut,
  Wifi
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, onClose }) => {
  const menuItems: { id: ViewState; label: string; icon: React.ElementType }[] = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'NEW_PRODUCT', label: 'Nuevos productos', icon: PackagePlus },
    { id: 'SEARCH', label: 'Buscar / Análisis', icon: Search },
    { id: 'INVENTORY', label: 'Inventario', icon: Package },
    { id: 'MOVEMENTS', label: 'Movimientos', icon: ArrowRightLeft },
    { id: 'BAPTISMS', label: 'Bautismos', icon: Droplets },
    { id: 'PRESENTATIONS', label: 'Niños', icon: Baby },
  ];

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
      />

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white flex flex-col
        transition-transform duration-300 ease-in-out border-r border-slate-100
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:shadow-none lg:border-none
      `}>
        {/* Header con Logo */}
        <div className="h-28 flex items-center px-8">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200 text-white">
               <Hexagon className="h-6 w-6 fill-current" />
             </div>
             <div className="flex flex-col">
                <span className="text-xl font-bold text-slate-800 tracking-tight">Punto Info</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestión Integral</span>
             </div>
          </div>
           {/* Close Button for Mobile */}
           <button 
            onClick={onClose} 
            className="lg:hidden ml-auto p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
          <div className="mb-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Menú Principal
          </div>
          
          <div className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`
                    w-full flex items-center px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 group
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200 translate-x-1' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'
                    }
                  `}
                >
                  <item.icon 
                    className={`w-5 h-5 mr-3 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                    }`} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* User Profile Footer */}
        <div className="p-6 mt-auto">
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100 relative overflow-hidden">
             {/* Sync Indicator */}
             <div className="absolute top-2 right-2 flex items-center gap-1" title="Sincronización activa">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
             </div>

             <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-sm">
                <UserCircle className="w-6 h-6" />
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-slate-700 truncate">Administrador</p>
                <div className="flex items-center text-[10px] text-emerald-600 font-medium">
                  <Wifi className="w-3 h-3 mr-1" />
                  Conectado
                </div>
             </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;