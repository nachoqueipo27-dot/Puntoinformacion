import React, { useState } from 'react';
import { ViewState } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NewProduct from './pages/NewProduct';
import Inventory from './pages/Inventory';
import Movements from './pages/Movements';
import Baptisms from './pages/Baptisms';
import ChildPresentations from './pages/ChildPresentations';
import Search from './pages/Search';
import { AppProvider } from './store';
import { Menu, Hexagon } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD': return <Dashboard />;
      case 'NEW_PRODUCT': return <NewProduct />;
      case 'INVENTORY': return <Inventory />;
      case 'MOVEMENTS': return <Movements />;
      case 'BAPTISMS': return <Baptisms />;
      case 'PRESENTATIONS': return <ChildPresentations />;
      case 'SEARCH': return <Search />;
      default: return <Dashboard />;
    }
  };

  return (
    <AppProvider>
      <div className="flex h-screen bg-slate-50 font-inter overflow-hidden">
        {/* Sidebar Component */}
        <Sidebar 
          currentView={currentView} 
          setView={setCurrentView} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen relative">
            
            {/* Mobile Header */}
            <header className="lg:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center">
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="ml-3 font-bold text-slate-800">Punto Info</span>
                </div>
                <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                   <Hexagon className="h-5 w-5 fill-current" />
                </div>
            </header>

            {/* Scrollable Content Container */}
            <main className="flex-1 overflow-y-auto bg-slate-50 lg:p-4 scroll-smooth">
                {/* 
                   Desktop: Agregamos un contenedor blanco con bordes redondeados grande
                   para dar el efecto de "aplicación enmarcada" separada del menú.
                */}
                <div className="h-full bg-white lg:rounded-3xl lg:shadow-sm lg:border lg:border-slate-100 overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 custom-scrollbar">
                    <div className="max-w-7xl mx-auto pb-10">
                        {renderView()}
                    </div>
                  </div>
                </div>
            </main>
        </div>
      </div>
    </AppProvider>
  );
};

export default App;