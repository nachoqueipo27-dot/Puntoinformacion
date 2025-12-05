
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { PendingStatus } from '../types';
import { Pencil, Trash2, X, RefreshCw, BarChart3, Users, CheckCircle2, Clock, Calendar, Phone, Mail, Filter, CalendarDays, Sparkles, AlertCircle, FileSpreadsheet, Printer } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import { 
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const ChildPresentations: React.FC = () => {
  const { presentations, addPresentation, editPresentation, removePresentation, updatePresentationStatus, theme, user } = useStore();
  
  // Form State
  const [formData, setFormData] = useState({
    childName: '',
    motherName: '',
    fatherName: '',
    email: '',
    phone: '',
    scheduledDate: '', // Nueva fecha programada
    pending: PendingStatus.SI
  });
  
  // Validation State
  const [dateError, setDateError] = useState<string | null>(null);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Stats Filter State
  const [statsStartDate, setStatsStartDate] = useState('');
  const [statsEndDate, setStatsEndDate] = useState('');

  // Helper: Set Next Sunday
  const setNextSunday = () => {
    const date = new Date();
    const dayOfWeek = date.getDay(); // 0 is Sunday
    
    // Calcular días hasta el próximo domingo
    // Si es domingo (0), queremos el siguiente (+7)
    // Si es lunes (1), queremos el siguiente (+6)
    // Fórmula: 7 - día actual
    const daysUntilNextSunday = 7 - dayOfWeek;
    
    date.setDate(date.getDate() + daysUntilNextSunday);
    
    // Formatear manualmente a YYYY-MM-DD usando hora local para evitar problemas de timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const formattedDate = `${year}-${month}-${day}`;
    
    setFormData(prev => ({ 
        ...prev, 
        scheduledDate: formattedDate 
    }));
    setDateError(null);
  };

  // Helper: Handle Date Change (Enforce Sundays)
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    if (!val) {
        setFormData(prev => ({ ...prev, scheduledDate: '' }));
        setDateError(null);
        return;
    }

    // Crear fecha forzando interpretación local para verificar día correctamente
    const date = new Date(`${val}T12:00:00`);
    const day = date.getDay(); // 0 = Domingo

    if (day !== 0) {
        setDateError('Solo se permiten presentaciones los días Domingo.');
        setFormData(prev => ({ ...prev, scheduledDate: '' })); // Limpiar selección inválida
    } else {
        setDateError(null);
        setFormData(prev => ({ ...prev, scheduledDate: val }));
    }
  };

  // --- ANALYSIS DATA LOGIC ---
  const stats = useMemo(() => {
    // 1. Filter data based on date range
    let filteredData = presentations;

    if (statsStartDate && statsEndDate) {
        const start = new Date(statsStartDate).getTime();
        const end = new Date(statsEndDate).setHours(23, 59, 59, 999); // End of day

        filteredData = presentations.filter(p => {
            if (!p.createdAt) return false;
            const pDate = new Date(p.createdAt).getTime();
            return pDate >= start && pDate <= end;
        });
    }

    // 2. Calculate Stats based on filtered data
    const total = filteredData.length;
    const pendingCount = filteredData.filter(p => p.pending === PendingStatus.SI).length;
    const completedCount = filteredData.filter(p => p.pending === PendingStatus.NO).length;

    // Data for Pie Chart (Status)
    const statusData = [
      { name: 'Pendientes', value: pendingCount, color: '#f59e0b' }, // Amber-500
      { name: 'Realizados', value: completedCount, color: '#10b981' }, // Emerald-500
    ].filter(d => d.value > 0);

    // Data for Area Chart (Timeline by Creation Date AND Completed Date)
    const timelineMap: Record<string, { registered: number; completed: number }> = {};
    
    filteredData.forEach(p => {
        // Count Registrations (createdAt)
        if (p.createdAt) {
            const date = new Date(p.createdAt);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!timelineMap[key]) timelineMap[key] = { registered: 0, completed: 0 };
            timelineMap[key].registered++;
        }

        // Count Completions (completedAt) - Only if status is NO (Realizado)
        if (p.pending === PendingStatus.NO && p.completedAt) {
             const date = new Date(p.completedAt);
             const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
             if (!timelineMap[key]) timelineMap[key] = { registered: 0, completed: 0 };
             timelineMap[key].completed++;
        }
    });

    const timelineData = Object.keys(timelineMap)
        .sort()
        .map(key => {
            const [year, month] = key.split('-');
            const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('es-ES', { month: 'short' });
            return {
                date: `${monthName} ${year}`,
                fullDate: key,
                registered: timelineMap[key].registered,
                completed: timelineMap[key].completed
            };
        });

    return { total, pendingCount, completedCount, statusData, timelineData, isFiltered: !!(statsStartDate && statsEndDate), filteredData };
  }, [presentations, statsStartDate, statsEndDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
        // Update Existing
        const existing = presentations.find(p => p.id === editingId);
        if (existing) {
             editPresentation({
                 ...existing,
                 ...formData,
                 completedAt: (formData.pending === PendingStatus.NO && existing.pending === PendingStatus.SI) 
                    ? new Date().toISOString() 
                    : (formData.pending === PendingStatus.SI ? undefined : existing.completedAt)
             });
        }
        setEditingId(null);
    } else {
        // Create New
        addPresentation({
            id: crypto.randomUUID(),
            ...formData,
            createdAt: new Date().toISOString()
        });
    }

    // Reset Form
    setFormData({ childName: '', motherName: '', fatherName: '', email: '', phone: '', scheduledDate: '', pending: PendingStatus.SI });
    setDateError(null);
  };

  const handleEditClick = (presentation: any) => {
      setFormData({
          childName: presentation.childName,
          motherName: presentation.motherName,
          fatherName: presentation.fatherName,
          email: presentation.email,
          phone: presentation.phone,
          scheduledDate: presentation.scheduledDate || '',
          pending: presentation.pending
      });
      setEditingId(presentation.id);
      setDateError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setFormData({ childName: '', motherName: '', fatherName: '', email: '', phone: '', scheduledDate: '', pending: PendingStatus.SI });
      setDateError(null);
  };

  const confirmDelete = async () => {
      if (deleteId) {
          await removePresentation(deleteId);
          setDeleteId(null);
      }
  };

  const formatDate = (dateString?: string) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const formatScheduledDate = (dateString?: string) => {
      if (!dateString) return null;
      // Ajustar zona horaria para mostrar correctamente la fecha elegida
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
      const BOM = "\uFEFF";
      const detailHeader = ['Fecha Registro', 'Niño/a', 'Fecha Programada', 'Madre', 'Padre', 'Email', 'Teléfono', 'Estado', 'Fecha Completado'];
      
      // 1. Generate Detail Rows
      const detailRows = stats.filteredData.map(p => {
          const createdAt = p.createdAt ? p.createdAt.split('T')[0] : '-';
          return [
              createdAt,
              `"${p.childName}"`,
              p.scheduledDate ? p.scheduledDate : '-',
              `"${p.motherName}"`,
              `"${p.fatherName}"`,
              `"${p.email}"`,
              `"${p.phone}"`,
              p.pending === PendingStatus.SI ? 'Pendiente' : 'Realizado',
              p.completedAt ? p.completedAt.split('T')[0] : '-'
          ].join(',');
      });

      // 2. Generate Summary Rows (Date | Count) for Charts
      const summaryMap: Record<string, number> = {};
      stats.filteredData.forEach(p => {
          if (p.createdAt) {
              const dateKey = p.createdAt.split('T')[0];
              summaryMap[dateKey] = (summaryMap[dateKey] || 0) + 1;
          }
      });
      const sortedDates = Object.keys(summaryMap).sort();
      const summaryRows = sortedDates.map(date => [date, summaryMap[date]].join(','));

      // 3. Assemble CSV
      const summaryHeader = ['Fecha (Resumen)', 'Total Personas'].join(',');
      
      const csvContent = BOM + [
          detailHeader.join(','),
          ...detailRows,
          '', '', 
          'RESUMEN PARA GRÁFICOS (DÍAS vs CANTIDAD)',
          summaryHeader,
          ...summaryRows
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `presentaciones_${statsStartDate || 'historico'}_${statsEndDate || 'actual'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 no-print">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Presentación de Niños</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Registra las familias y niños para su presentación en la iglesia.</p>
        </div>
        
        {/* Registration / Edit Form - Centered and 2 Columns */}
        <div className={`max-w-4xl mx-auto p-8 rounded-3xl shadow-sm border mb-8 transition-colors no-print ${editingId ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-300 dark:border-amber-800' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'}`}>
            <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-semibold ${editingId ? 'text-amber-700 dark:text-amber-500' : 'text-gray-700 dark:text-gray-200'}`}>
                    {editingId ? 'Editar Registro' : 'Nuevo Registro'}
                </h3>
                {editingId && (
                    <button onClick={handleCancelEdit} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 flex items-center">
                        <X className="w-4 h-4 mr-1" /> Cancelar
                    </button>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre del Niño/a</label>
                    <input required type="text" value={formData.childName} onChange={e => setFormData({...formData, childName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-shadow" placeholder="Nombre del niño/a" />
                </div>
                
                {/* Scheduled Date Input (Modernized & Restricted to Sunday) */}
                <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha Programada (Solo Domingos)</label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <CalendarDays className={`w-4 h-4 transition-colors ${formData.scheduledDate ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400'}`} />
                        </div>
                        <input 
                            type="date" 
                            value={formData.scheduledDate} 
                            onChange={handleDateChange} 
                            className={`w-full pl-9 pr-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all shadow-sm dark:[color-scheme:dark] cursor-pointer ${
                                dateError 
                                ? 'border-red-300 focus:ring-red-200' 
                                : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500 hover:border-blue-300 dark:hover:border-slate-500'
                            }`}
                            title="Selecciona un día Domingo"
                        />
                    </div>
                    {dateError && (
                        <div className="mt-1.5 flex items-center text-[10px] text-red-500 font-medium animate-pulse">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {dateError}
                        </div>
                    )}
                    {/* Quick Select Helper */}
                    <button 
                        type="button" 
                        onClick={setNextSunday}
                        className="mt-1.5 text-[10px] font-medium text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors ml-1"
                        title="Establecer fecha automáticamente al próximo domingo"
                    >
                        <Sparkles size={10} />
                        Próximo Domingo
                    </button>
                </div>

                <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Madre</label>
                    <input required type="text" value={formData.motherName} onChange={e => setFormData({...formData, motherName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-shadow" placeholder="Nombre completo" />
                </div>
                <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Padre</label>
                    <input required type="text" value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-shadow" placeholder="Nombre completo" />
                </div>
                <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mail</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-shadow" />
                </div>
                <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Teléfono</label>
                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-shadow" />
                </div>
                <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Pendiente</label>
                    <select value={formData.pending} onChange={e => setFormData({...formData, pending: e.target.value as PendingStatus})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white cursor-pointer transition-shadow">
                        <option value={PendingStatus.SI}>Sí</option>
                        <option value={PendingStatus.NO}>No</option>
                    </select>
                </div>
                <div className="col-span-1 flex items-end">
                    <button 
                        type="submit" 
                        className={`w-full text-white py-2.5 rounded-xl text-sm font-medium transition-all shadow-md flex items-center justify-center ${editingId ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200 dark:shadow-none'}`}
                    >
                        {editingId ? <RefreshCw className="w-4 h-4 mr-2" /> : null}
                        {editingId ? 'Actualizar' : 'Agregar Registro'}
                    </button>
                </div>
            </form>
        </div>

        {/* --- List Section (Mobile Card View + Desktop Table View) --- */}
        <div className="mb-12 no-print">
            
            {/* Mobile Cards (Visible only on < md) */}
            <div className="md:hidden space-y-4">
                 {presentations.length === 0 ? (
                    <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <Users className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-gray-400 dark:text-slate-500 text-sm">No hay registros.</p>
                    </div>
                 ) : (
                    presentations.map(p => (
                        <div key={p.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-700 relative">
                            {/* Header: Child Name and Date */}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-white text-lg">{p.childName || 'Sin Nombre'}</h4>
                                    <p className="text-xs text-gray-400 mt-0.5 flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Reg: {formatDate(p.createdAt)}
                                    </p>
                                    {p.scheduledDate && (
                                        <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1 flex items-center font-semibold">
                                            <CalendarDays className="w-3 h-3 mr-1" />
                                            Prog: {formatScheduledDate(p.scheduledDate)}
                                        </p>
                                    )}
                                </div>
                                <select 
                                    value={p.pending} 
                                    onChange={(e) => updatePresentationStatus(p.id, e.target.value as PendingStatus)}
                                    className={`text-xs rounded-full px-2 py-1 border-0 cursor-pointer outline-none font-bold uppercase tracking-wide ${p.pending === PendingStatus.SI ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}
                                >
                                    <option value={PendingStatus.SI}>Pendiente</option>
                                    <option value={PendingStatus.NO}>Realizado</option>
                                </select>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 mb-4">
                                <div className="text-sm">
                                    <p className="text-xs text-gray-400 mb-0.5 uppercase tracking-wider font-semibold">Padres</p>
                                    <p className="text-gray-700 dark:text-slate-200 font-medium">M: {p.motherName}</p>
                                    <p className="text-gray-700 dark:text-slate-200 font-medium">P: {p.fatherName}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 p-2 rounded-lg truncate">
                                        <Phone className="w-3.5 h-3.5 mr-2 shrink-0" />
                                        <span className="truncate">{p.phone}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 p-2 rounded-lg truncate">
                                        <Mail className="w-3.5 h-3.5 mr-2 shrink-0" />
                                        <span className="truncate">{p.email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer: Date Completed and Actions */}
                            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                                <div>
                                    {p.pending === PendingStatus.NO && p.completedAt && (
                                        <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center bg-green-50 dark:bg-green-900/10 px-2 py-1 rounded-md">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            {formatDate(p.completedAt)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleEditClick(p)}
                                        className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg"
                                    >
                                        <Pencil className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => setDeleteId(p.id)}
                                        className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                 )}
            </div>

            {/* Desktop Table (Visible only on >= md) */}
            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-300 dark:border-slate-700 overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Fecha Reg.</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Fecha Prog.</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Niño/a</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Padres</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Contacto</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {presentations.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400 dark:text-slate-500 text-sm">No hay registros.</td></tr>
                            ) : (
                                presentations.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-4 text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(p.createdAt)}
                                        </td>
                                        <td className="px-4 py-4 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                            {p.scheduledDate ? formatScheduledDate(p.scheduledDate) : '-'}
                                        </td>
                                        <td className="px-4 py-4 text-sm font-semibold text-gray-800 dark:text-white">{p.childName || '-'}</td>
                                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex flex-col">
                                                <span>M: {p.motherName}</span>
                                                <span className="text-xs text-gray-400">P: {p.fatherName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex flex-col">
                                                <span>{p.phone}</span>
                                                <span className="text-xs text-gray-400 truncate max-w-[120px]" title={p.email}>{p.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col items-start gap-1">
                                                <select 
                                                    value={p.pending} 
                                                    onChange={(e) => updatePresentationStatus(p.id, e.target.value as PendingStatus)}
                                                    className={`text-xs rounded-full px-3 py-1 border-0 cursor-pointer outline-none transition-colors font-semibold ${p.pending === PendingStatus.SI ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}
                                                >
                                                    <option value={PendingStatus.SI}>Pendiente</option>
                                                    <option value={PendingStatus.NO}>Realizado</option>
                                                </select>
                                                {p.pending === PendingStatus.NO && p.completedAt && (
                                                    <span className="text-[10px] text-green-600 dark:text-green-400 ml-1">
                                                        {formatDate(p.completedAt)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEditClick(p)}
                                                    className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-colors"
                                                    title="Editar registro"
                                                >
                                                    <Pencil className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => setDeleteId(p.id)}
                                                    className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                                    title="Eliminar registro"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* --- ANALYSIS & STATS SECTION (ONLY FOR ADMIN) --- */}
        {user?.role === 'ADMIN' && (
        <div className="space-y-6 animate-fade-in-up mt-12 pt-8 border-t border-slate-300 dark:border-slate-700">
            
            <div className="flex flex-col gap-6 no-print">
                <div className="flex items-center">
                    <BarChart3 className="w-6 h-6 mr-3 text-indigo-500" />
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Estadísticas y Análisis</h3>
                </div>
                
                {/* Date Filters - Large & Visible */}
                <div className="bg-indigo-50/50 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-indigo-200 dark:border-slate-700">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold min-w-fit">
                            <Filter className="w-5 h-5" />
                            <span className="text-sm uppercase tracking-wide">Intervalo de Fechas</span>
                        </div>

                        <div className="flex flex-col sm:flex-row flex-1 items-center gap-4 w-full">
                            <div className="relative w-full">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-400 uppercase tracking-wider pointer-events-none">Desde</span>
                                <input 
                                    type="date" 
                                    value={statsStartDate} 
                                    onChange={(e) => setStatsStartDate(e.target.value)}
                                    className="w-full pl-16 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white font-medium shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:[color-scheme:dark]"
                                    title="Fecha inicio para estadísticas"
                                />
                            </div>
                            
                            <div className="relative w-full">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-400 uppercase tracking-wider pointer-events-none">Hasta</span>
                                <input 
                                    type="date" 
                                    value={statsEndDate} 
                                    onChange={(e) => setStatsEndDate(e.target.value)}
                                    className="w-full pl-16 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white font-medium shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:[color-scheme:dark]"
                                    title="Fecha fin para estadísticas"
                                />
                            </div>

                            {(statsStartDate || statsEndDate) && (
                                <button 
                                    onClick={() => { setStatsStartDate(''); setStatsEndDate(''); }}
                                    className="w-full sm:w-auto px-4 py-3 bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 border border-slate-300 dark:border-slate-600 rounded-xl font-medium transition-colors shadow-sm flex items-center justify-center whitespace-nowrap"
                                    title="Limpiar filtros de fechas"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Limpiar Filtros
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {stats.isFiltered && (
                        <div className="mt-4 flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900/50 py-2 px-3 rounded-lg border border-indigo-200 dark:border-indigo-900/30 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                            Mostrando estadísticas filtradas por fecha seleccionada.
                        </div>
                    )}
                </div>
            </div>

            <div className="print-break-inside">
                {/* Print/Export Header */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-300 dark:border-slate-700 pb-6 mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                            Reporte de Presentaciones
                        </h3>
                        {stats.isFiltered ? (
                             <p className="text-sm text-gray-500 dark:text-gray-400">
                                Período: {new Date(statsStartDate).toLocaleDateString()} - {new Date(statsEndDate).toLocaleDateString()}
                            </p>
                        ) : (
                             <p className="text-sm text-gray-500 dark:text-gray-400">
                                Histórico Completo
                            </p>
                        )}
                    </div>
                    
                    <div className="flex gap-2 no-print">
                         <button 
                            onClick={handleExportCSV}
                            className="flex items-center px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors border border-green-200"
                            title="Descargar detalle y resumen para gráficos en Excel"
                         >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Exportar Datos (CSV)
                         </button>
                         <button 
                            onClick={handlePrint}
                            className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
                            title="Imprimir o Guardar como PDF"
                         >
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimir Reporte
                         </button>
                    </div>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6">
                    {/* Total Children */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-300 dark:border-slate-700 flex flex-col justify-between h-32 relative overflow-hidden group transition-all hover:-translate-y-1">
                            <div className="flex justify-between items-start z-10">
                            <div>
                                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Total Niños</p>
                                <h4 className="text-4xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</h4>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-2xl text-blue-500 dark:text-blue-400 transition-transform group-hover:scale-110">
                                <Users className="w-6 h-6" />
                            </div>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-blue-50 dark:bg-blue-900/10 rounded-full z-0"></div>
                    </div>

                    {/* Pending */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-300 dark:border-slate-700 flex flex-col justify-between h-32 relative overflow-hidden group transition-all hover:-translate-y-1">
                            <div className="flex justify-between items-start z-10">
                            <div>
                                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Pendientes</p>
                                <h4 className="text-4xl font-bold text-amber-500 dark:text-amber-400">{stats.pendingCount}</h4>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-2xl text-amber-500 dark:text-amber-400 transition-transform group-hover:scale-110">
                                <Clock className="w-6 h-6" />
                            </div>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-amber-50 dark:bg-amber-900/10 rounded-full z-0"></div>
                    </div>

                    {/* Completed */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-300 dark:border-slate-700 flex flex-col justify-between h-32 relative overflow-hidden group transition-all hover:-translate-y-1">
                            <div className="flex justify-between items-start z-10">
                            <div>
                                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Realizados</p>
                                <h4 className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completedCount}</h4>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-2xl text-emerald-500 dark:text-emerald-400 transition-transform group-hover:scale-110">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-emerald-50 dark:bg-emerald-900/10 rounded-full z-0"></div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Status Distribution Chart */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-300 dark:border-slate-700 break-inside-avoid">
                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">Estado de Registros</h4>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', color: theme === 'dark' ? '#fff' : '#000'}}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Timeline Chart */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-300 dark:border-slate-700 break-inside-avoid">
                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">Evolución: Registrados vs Realizados</h4>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.timelineData}>
                                    <defs>
                                        <linearGradient id="colorRegistered" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                                    <XAxis 
                                        dataKey="date" 
                                        tick={{fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} 
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis 
                                        tick={{fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} 
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', color: theme === 'dark' ? '#fff' : '#000'}}
                                    />
                                    <Area type="monotone" dataKey="registered" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRegistered)" name="Registrados" />
                                    <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" name="Realizados" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        )}

      </div>

      <ConfirmationModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Eliminar Registro"
        description="¿Estás seguro de que deseas eliminar este registro de presentación de niños? Esta acción no se puede deshacer."
        confirmText="Eliminar"
      />
    </div>
  );
};

export default ChildPresentations;
