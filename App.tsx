
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
import Events from './pages/Events'; 
import Loans from './pages/Loans'; // New Import
import AdminPanel from './pages/AdminPanel'; 
import Login from './pages/Login'; 
import { AppProvider, useStore } from './store';
import { Menu } from 'lucide-react';
import OrigenLogo from './components/OrigenLogo';

// Wrapper component to consume context safely
const AppContent: React.FC = () => {
  const { user, settings } = useStore();
  const [currentView, setCurrentView] = useState<ViewState>('PANEL');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // If not logged in, show Login Screen
  if (!user) {
    return <Login />;
  }

  const renderView = () => {
    // Security Check: If user is standard USER, force Dashboard view (unless they are already on it)
    if (user.role === 'USER') {
        if (currentView === 'ADMIN_PANEL') return <Dashboard />;
        if (currentView !== 'PANEL') return <Dashboard />;
    }

    // Security Check: If user is MODERATOR, prevent access to Inventory, New Product and Admin Panel
    if (user.role === 'MODERATOR') {
        if (currentView === 'INVENTORY' || currentView === 'NEW_PRODUCT' || currentView === 'ADMIN_PANEL') {
            return <Dashboard />;
        }
    }

    switch (currentView) {
      case 'PANEL': return <Dashboard />;
      case 'NEW_PRODUCT': return <NewProduct />;
      case 'INVENTORY': return <Inventory />;
      case 'MOVEMENTS': return <Movements />;
      case 'BAPTISMS': return <Baptisms />;
      case 'PRESENTATIONS': return <ChildPresentations />;
      case 'LOANS': return <Loans />; // New Route
      case 'EVENTS': return <Events />;
      case 'SEARCH': return <Search />;
      case 'ADMIN_PANEL': return <AdminPanel />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-inter overflow-hidden transition-colors duration-300">
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
            <header className="lg:hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-900 dark:border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-20 transition-colors duration-300">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none transition-colors border border-transparent hover:border-slate-900"
                        title="Abrir menú de navegación"
                        aria-label="Abrir menú de navegación"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    
                    {/* Dynamic Logo & Title for Mobile */}
                    <div className="flex items-center gap-2">
                         {settings.logoUrl ? (
                             <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                         ) : (
                             <div className="bg-indigo-600 p-1.5 rounded-lg border border-slate-900 shadow-sm">
                                <OrigenLogo className="w-5 h-5 text-white" />
                             </div>
                         )}
                         <span className="font-bold text-slate-800 dark:text-white text-lg tracking-tight truncate max-w-[200px]">
                             {settings.appName}
                         </span>
                    </div>
                </div>
            </header>

            {/* Scrollable Content Container */}
            <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 lg:p-4 scroll-smooth transition-colors duration-300">
                {/* 
                   Desktop: Frame effect with Black Border (Slate-900)
                */}
                <div className="h-full bg-white dark:bg-slate-800 lg:rounded-3xl lg:shadow-sm lg:border lg:border-slate-900 dark:lg:border-slate-700 overflow-hidden flex flex-col transition-all duration-300">
                  <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 custom-scrollbar">
                    <div className="max-w-7xl mx-auto pb-10">
                        {renderView()}
                    </div>
                  </div>
                </div>
            </main>
        </div>
      </div>
  );
}

const App: React.FC = () => {
  return (
    <AppProvider>
       <AppContent />
    </AppProvider>
  );
};

export default App;
