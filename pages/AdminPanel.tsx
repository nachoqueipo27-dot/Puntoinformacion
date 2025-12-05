
import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { Settings as SettingsIcon, Type, Layout, AlertCircle, CheckCircle2, Upload, X, Package, Layers, Calendar, Users, Grid, RefreshCw, Palette, Shirt } from 'lucide-react';

type AdminTab = 'GENERAL' | 'MODULES' | 'INVENTORY';

const COLORS = [
  { name: 'blue', hex: 'bg-blue-500' },
  { name: 'indigo', hex: 'bg-indigo-500' },
  { name: 'emerald', hex: 'bg-emerald-500' },
  { name: 'amber', hex: 'bg-amber-500' },
  { name: 'red', hex: 'bg-red-500' },
  { name: 'cyan', hex: 'bg-cyan-500' },
  { name: 'violet', hex: 'bg-violet-500' },
  { name: 'pink', hex: 'bg-pink-500' },
  { name: 'orange', hex: 'bg-orange-500' },
];

const AdminPanel: React.FC = () => {
  const { settings, updateSettings, user, settingsSaveStatus } = useStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('GENERAL');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (user?.role !== 'ADMIN') {
    return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <AlertCircle className="w-16 h-16 mb-4" />
            <h2 className="text-xl font-bold">Acceso Restringido</h2>
            <p>Solo los administradores pueden ver esta página.</p>
        </div>
    );
  }

  // --- Real-time Update Handlers ---
  const handleTextChange = (field: keyof typeof settings, value: string) => {
    updateSettings({ ...settings, [field]: value });
  };

  const handleNumberChange = (field: keyof typeof settings, value: number) => {
    updateSettings({ ...settings, [field]: value });
  };

  // Update specific field inside a specific module
  const handleModuleConfigChange = (moduleKey: keyof typeof settings.enabledModules, field: 'label' | 'subLabel' | 'color', value: string) => {
      updateSettings({
          ...settings,
          enabledModules: {
              ...settings.enabledModules,
              [moduleKey]: {
                  ...settings.enabledModules[moduleKey],
                  [field]: value
              }
          }
      });
  };

  const handleModuleToggle = (moduleKey: keyof typeof settings.enabledModules) => {
    updateSettings({
      ...settings,
      enabledModules: {
        ...settings.enabledModules,
        [moduleKey]: {
            ...settings.enabledModules[moduleKey],
            enabled: !settings.enabledModules[moduleKey].enabled
        }
      }
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 1024 * 1024) { // 1MB Limit
            alert('La imagen es demasiado pesada (Máx 1MB).');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            updateSettings({ ...settings, logoUrl: base64String });
        };
        reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
      updateSettings({ ...settings, logoUrl: '' });
      if(fileInputRef.current) fileInputRef.current.value = '';
  };

  // Helper to render Status
  const renderStatus = () => {
      switch(settingsSaveStatus) {
          case 'saving':
              return (
                  <div className="flex items-center gap-2 text-blue-500 text-sm font-medium animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Guardando...
                  </div>
              );
          case 'saved':
              return (
                  <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Guardado
                  </div>
              );
          case 'error':
              return (
                <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
                    <AlertCircle className="w-4 h-4" />
                    Error al guardar
                </div>
              );
          default:
              return null; // Idle
      }
  };

  const renderTabContent = () => {
      switch (activeTab) {
          case 'GENERAL':
              return (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-300 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                            <Type className="w-5 h-5 mr-2 text-blue-500" />
                            Identidad de la Aplicación
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre de la Aplicación</label>
                                <input 
                                    type="text" 
                                    value={settings.appName}
                                    onChange={e => handleTextChange('appName', e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                                    placeholder="Ej: Origen Iglesia"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Subtítulo / Slogan</label>
                                <input 
                                    type="text" 
                                    value={settings.appSubtitle}
                                    onChange={e => handleTextChange('appSubtitle', e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                                    placeholder="Ej: Punto de Información"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-300 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                            <Layout className="w-5 h-5 mr-2 text-indigo-500" />
                            Logo Personalizado
                        </h3>
                        
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Preview Area */}
                            <div className="w-32 h-32 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 overflow-hidden relative group">
                                {settings.logoUrl ? (
                                    <img src={settings.logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <span className="text-xs text-slate-400 text-center px-2">Sin Logo (Usar Default)</span>
                                )}
                                {settings.logoUrl && (
                                    <button 
                                        type="button"
                                        onClick={removeLogo}
                                        className="absolute inset-0 bg-red-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="text-white w-8 h-8" />
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 space-y-4">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Sube una imagen (PNG, JPG, SVG) para reemplazar el logo por defecto. Se recomienda una imagen cuadrada o circular con fondo transparente. Máximo 1MB.
                                </p>
                                <div className="flex gap-4">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        ref={fileInputRef}
                                        onChange={handleLogoUpload}
                                        className="hidden" 
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Subir Imagen
                                    </button>
                                    {settings.logoUrl && (
                                        <button 
                                            type="button"
                                            onClick={removeLogo}
                                            className="px-4 py-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                                        >
                                            Eliminar Logo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              );
        
          case 'MODULES':
              return (
                <div className="animate-fade-in bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-300 dark:border-slate-700">
                     <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                        <Grid className="w-5 h-5 mr-2 text-emerald-500" />
                        Gestión de Módulos
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                        Personaliza los módulos de la aplicación. Puedes cambiar el nombre visible, el slogan y el color de cada sección, o desactivarlos por completo.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[
                            { key: 'inventory', icon: Package },
                            { key: 'movements', icon: Layers },
                            { key: 'loans', icon: Shirt },
                            { key: 'search', icon: Grid },
                            { key: 'events', icon: Calendar },
                            { key: 'baptisms', icon: Users },
                            { key: 'presentations', icon: Users },
                        ].map((mod) => {
                            const config = settings.enabledModules[mod.key as keyof typeof settings.enabledModules];
                            
                            return (
                                <div key={mod.key} className={`rounded-2xl border transition-all overflow-hidden ${
                                    config.enabled 
                                    ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm' 
                                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-60'
                                }`}>
                                    {/* Header with Toggle */}
                                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${config.enabled ? `bg-${config.color}-100 dark:bg-${config.color}-900/20 text-${config.color}-600 dark:text-${config.color}-400` : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                                <mod.icon className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wide">{mod.key}</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={config.enabled}
                                                onChange={() => handleModuleToggle(mod.key as keyof typeof settings.enabledModules)}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </label>
                                    </div>
                                    
                                    {/* Config Body */}
                                    {config.enabled && (
                                        <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Título Visible</label>
                                                <input 
                                                    type="text" 
                                                    value={config.label}
                                                    onChange={e => handleModuleConfigChange(mod.key as keyof typeof settings.enabledModules, 'label', e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Slogan / Subtítulo</label>
                                                <input 
                                                    type="text" 
                                                    value={config.subLabel}
                                                    onChange={e => handleModuleConfigChange(mod.key as keyof typeof settings.enabledModules, 'subLabel', e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 block">Color de Tema</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {COLORS.map(color => (
                                                        <button
                                                            key={color.name}
                                                            onClick={() => handleModuleConfigChange(mod.key as keyof typeof settings.enabledModules, 'color', color.name)}
                                                            className={`w-6 h-6 rounded-full ${color.hex} border-2 transition-all ${
                                                                config.color === color.name 
                                                                ? 'border-white dark:border-slate-800 ring-2 ring-slate-400 scale-110' 
                                                                : 'border-transparent opacity-40 hover:opacity-100'
                                                            }`}
                                                            title={color.name}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
              );

          case 'INVENTORY':
              return (
                <div className="animate-fade-in bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-300 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                        <Package className="w-5 h-5 mr-2 text-orange-500" />
                        Configuración de Inventario
                    </h3>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Alerta de Stock Bajo (Por Defecto)</label>
                        <input 
                            type="number" 
                            min="1"
                            value={settings.inventoryAlertThreshold}
                            onChange={e => handleNumberChange('inventoryAlertThreshold', Number(e.target.value))}
                            className="w-full md:w-1/3 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                        />
                        <p className="mt-2 text-xs text-gray-400">Este valor se usará como sugerencia al crear nuevos productos.</p>
                    </div>
                </div>
              );
          default:
              return null;
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="mb-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="bg-slate-800 text-white p-3 rounded-2xl shadow-lg shadow-slate-200 dark:shadow-none">
                <SettingsIcon className="w-8 h-8" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Panel de Administrador</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Centro de control global de la aplicación.</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1 space-y-2">
              <button 
                onClick={() => setActiveTab('GENERAL')}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === 'GENERAL' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}
              >
                  <Type className="w-4 h-4" /> General
              </button>
              <button 
                onClick={() => setActiveTab('MODULES')}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === 'MODULES' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}
              >
                  <Grid className="w-4 h-4" /> Módulos
              </button>
              <button 
                onClick={() => setActiveTab('INVENTORY')}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === 'INVENTORY' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'}`}
              >
                  <Package className="w-4 h-4" /> Inventario
              </button>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 relative">
                {renderTabContent()}

                {/* Status Indicator (Bottom Right) */}
                <div className="fixed bottom-6 right-6 lg:absolute lg:bottom-auto lg:top-[-4rem] lg:right-0 z-20">
                     <div className="bg-white dark:bg-slate-900 p-3 px-5 rounded-full shadow-lg border border-slate-300 dark:border-slate-700 flex items-center gap-3">
                        {renderStatus()}
                     </div>
                </div>
          </div>
      </div>
    </div>
  );
};

export default AdminPanel;
