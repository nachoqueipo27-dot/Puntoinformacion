
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { PendingStatus } from '../types';
import { Pencil, Trash2, X, RefreshCw, CheckCircle2, BarChart3, Filter, Users, Clock, Calendar, Phone, Mail, FileSpreadsheet, Printer } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import { 
  PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const Baptisms: React.FC = () => {
  const { baptisms, addBaptism, editBaptism, removeBaptism, updateBaptismStatus, theme, user } = useStore();
  
  // State for split name fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    pending: PendingStatus.SI
  });

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Stats Filter State
  const [statsStartDate, setStatsStartDate] = useState('');
  const [statsEndDate, setStatsEndDate] = useState('');

  // --- ANALYSIS DATA LOGIC ---
  const stats = useMemo(() => {
    // 1. Filter data based on date range
    let filteredData = baptisms;

    if (statsStartDate && statsEndDate) {
        const start = new Date(statsStartDate).getTime();
        const end = new Date(statsEndDate).setHours(23, 59, 59, 999); // End of day

        filteredData = baptisms.filter(b => {
            if (!b.createdAt) return false;
            const bDate = new Date(b.createdAt).getTime();
            return bDate >= start && bDate <= end;
        });
    }

    // 2. Calculate Stats based on filtered data
    const total = filteredData.length;
    const pendingCount = filteredData.filter(b => b.pending === PendingStatus.SI).length;
    const completedCount = filteredData.filter(b => b.pending === PendingStatus.NO).length;

    // Data for Pie Chart (Status)
    const statusData = [
      { name: 'Pendientes', value: pendingCount, color: '#f59e0b' }, // Amber-500
      { name: 'Realizados', value: completedCount, color: '#06b6d4' }, // Cyan-500
    ].filter(d => d.value > 0);

    // Data for Area Chart (Timeline by Creation Date AND Completed Date)
    const timelineMap: Record<string, { registered: number; completed: number }> = {};
    
    filteredData.forEach(b => {
        // Count Registrations (createdAt)
        if (b.createdAt) {
            const date = new Date(b.createdAt);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!timelineMap[key]) timelineMap[key] = { registered: 0, completed: 0 };
            timelineMap[key].registered++;
        }

        // Count Completions (completedAt) - Only if status is NO (Realizado)
        if (b.pending === PendingStatus.NO && b.completedAt) {
             const date = new Date(b.completedAt);
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
  }, [baptisms, statsStartDate, statsEndDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct full name for legacy compatibility and DB storage
    const constructedFullName = `${formData.firstName} ${formData.lastName}`.trim();

    if (editingId) {
        // Update Existing
        const existing = baptisms.find(b => b.id === editingId);
        if (existing) {
             editBaptism({
                 ...existing,
                 ...formData,
                 fullName: constructedFullName, // Ensure fullName is updated
                 // If changing from Pending to Realizado manually in form
                 completedAt: (formData.pending === PendingStatus.NO && existing.pending === PendingStatus.SI) 
                    ? new Date().toISOString() 
                    : (formData.pending === PendingStatus.SI ? null : existing.completedAt)
             });
        }
        setEditingId(null);
    } else {
        // Create New
        addBaptism({
            id: crypto.randomUUID(),
            ...formData,
            fullName: constructedFullName, // Create full name
            createdAt: new Date().toISOString()
        });
    }

    setFormData({ firstName: '', lastName: '', email: '', phone: '', pending: PendingStatus.SI });
  };

  const handleEditClick = (baptism: any) => {
      // Try to use stored firstName/lastName, otherwise fallback to splitting fullName
      let first = baptism.firstName || '';
      let last = baptism.lastName || '';
      
      if (!first && !last && baptism.fullName) {
          const parts = baptism.fullName.split(' ');
          if (parts.length > 0) {
              first = parts[0];
              last = parts.slice(1).join(' ');
          }
      }

      setFormData({
          firstName: first,
          lastName: last,
          email: baptism.email,
          phone: baptism.phone,
          pending: baptism.pending
      });
      setEditingId(baptism.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', pending: PendingStatus.SI });
  };

  const confirmDelete = async () => {
      if (deleteId) {
          await removeBaptism(deleteId);
          setDeleteId(null);
      }
  };

  const formatDate = (dateString?: string | null) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const handlePrint = () => {
      window.print();
  };

  const handleExportCSV = () => {
      const BOM = "\uFEFF";
      const detailHeader = ['Fecha Registro', 'Nombre', 'Apellido', 'Nombre Completo', 'Email', 'Teléfono', 'Estado', 'Fecha Completado'];
      
      // 1. Generate Detail Rows
      const detailRows = stats.filteredData.map(b => {
          const createdAt = b.createdAt ? b.createdAt.split('T')[0] : '-'; // YYYY-MM-DD for Excel
          return [
              createdAt,
              `"${b.firstName || ''}"`,
              `"${b.lastName || ''}"`,
              `"${b.fullName || ''}"`,
              `"${b.email}"`,
              `"${b.phone}"`,
              b.pending === PendingStatus.SI ? 'Pendiente' : 'Realizado',
              b.completedAt ? b.completedAt.split('T')[0] : '-'
          ].join(',');
      });

      // 2. Generate Summary Rows (Date | Count) for Charts
      const summaryMap: Record<string, number> = {};
      stats.filteredData.forEach(b => {
          if (b.createdAt) {
              const dateKey = b.createdAt.split('T')[0];
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
      link.setAttribute('download', `bautismos_${statsStartDate || 'historico'}_${statsEndDate || 'actual'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 no-print">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Bautismos</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona el registro de personas interesadas en bautizarse.</p>
        </div>
        
        {/* Registration Form */}
        <div className={`no-print p-6 rounded-2xl shadow-sm border mb-8 transition-colors ${editingId ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-300 dark:border-amber-800' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-semibold ${editingId ? 'text-amber-700 dark:text-amber-500' : 'text-gray-700 dark:text-gray-200'}`}>
                    {editingId ? 'Editar Registro' : 'Nuevo Registro'}
                </h3>
                {editingId && (
                    <button onClick={handleCancelEdit} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 flex items-center">
                        <X className="w-4 h-4 mr-1" /> Cancelar
                    </button>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                {/* Nombre */}
                <div className="lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre</label>
                    <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-shadow" placeholder="Ej: Juan" />
                </div>
                {/* Apellido */}
                <div className="lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Apellido</label>
                    <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-shadow" placeholder="Ej: Pérez" />
                </div>
                <div className="lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mail</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-shadow" />
                </div>
                <div className="lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Teléfono</label>
                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-shadow" />
                </div>
                <div className="lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Pendiente</label>
                    <select value={formData.pending} onChange={e => setFormData({...formData, pending: e.target.value as PendingStatus})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white cursor-pointer transition-shadow">
                        <option value={PendingStatus.SI}>Pendiente</option>
                        <option value={PendingStatus.NO}>Realizado</option>
                    </select>
                </div>
                <div className="lg:col-span-1">
                    <button 
                        type="submit" 
                        className={`w-full py-2 rounded-lg text-sm font-medium transition-all shadow-md flex items-center justify-center h-[38px] text-white ${editingId ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none' : 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-200 dark:shadow-none'}`}
                    >
                        {editingId ? <RefreshCw className="w-4 h-4 mr-2" /> : null}
                        {editingId ? 'Actualizar' : 'Agregar'}
                    </button>
                </div>
            </form>
        </div>

        {/* --- List Section --- */}
        <div className="mb-12 no-print">
            
            {/* Mobile Cards (Visible only on < md) */}
            <div className="md:hidden space-y-4">
                 {baptisms.length === 0 ? (
                    <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <Users className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-gray-400 dark:text-slate-500 text-sm">No hay registros de bautismos.</p>
                    </div>
                 ) : (
                    baptisms.map(b => (
                        <div key={b.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-700 relative">
                            {/* Header: Name and Status */}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-white text-lg">{b.fullName || `${b.firstName} ${b.lastName}`}</h4>
                                    <p className="text-xs text-gray-400 mt-0.5 flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {formatDate(b.createdAt)}
                                    </p>
                                </div>
                                <select 
                                    value={b.pending} 
                                    onChange={(e) => updateBaptismStatus(b.id, e.target.value as PendingStatus)}
                                    className={`text-xs rounded-full px-2 py-1 border-0 cursor-pointer outline-none font-bold uppercase tracking-wide ${b.pending === PendingStatus.SI ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}
                                >
                                    <option value={PendingStatus.SI}>Pendiente</option>
                                    <option value={PendingStatus.NO}>Realizado</option>
                                </select>
                            </div>

                            {/* Contact Details */}
                            <div className="space-y-2 mb-4">
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 p-2 rounded-lg truncate">
                                        <Phone className="w-3.5 h-3.5 mr-2 shrink-0" />
                                        <span className="truncate">{b.phone}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 p-2 rounded-lg truncate">
                                        <Mail className="w-3.5 h-3.5 mr-2 shrink-0" />
                                        <span className="truncate">{b.email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer: Date Completed and Actions */}
                            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                                <div>
                                    {b.pending === PendingStatus.NO && b.completedAt && (
                                        <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center bg-green-50 dark:bg-green-900/10 px-2 py-1 rounded-md">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            {formatDate(b.completedAt)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleEditClick(b)}
                                        className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg"
                                    >
                                        <Pencil className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => setDeleteId(b.id)}
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
            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-700 overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-slate-300 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">Fecha Reg.</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">Nombre Completo</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">Contacto</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">Estado Pendiente</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {baptisms.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500 text-sm">No hay registros de bautismos.</td></tr>
                            ) : (
                                baptisms.map(b => (
                                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {formatDate(b.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-800 dark:text-white whitespace-nowrap">
                                            {b.fullName || `${b.firstName || ''} ${b.lastName || ''}`}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span>{b.phone}</span>
                                                <span className="text-xs text-gray-400 truncate max-w-[150px]" title={b.email}>{b.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-start gap-1">
                                                <div className="inline-block relative">
                                                    <select 
                                                        value={b.pending} 
                                                        onChange={(e) => updateBaptismStatus(b.id, e.target.value as PendingStatus)}
                                                        className={`
                                                            appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-slate-800
                                                            ${b.pending === PendingStatus.SI 
                                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 focus:ring-amber-400' 
                                                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 focus:ring-green-400'}
                                                        `}
                                                        title="Cambiar estado"
                                                    >
                                                        <option value={PendingStatus.SI}>Pendiente</option>
                                                        <option value={PendingStatus.NO}>Realizado</option>
                                                    </select>
                                                    {/* Custom Arrow for select */}
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-60">
                                                        <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                                                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                {b.pending === PendingStatus.NO && b.completedAt && (
                                                    <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center mt-1">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        {formatDate(b.completedAt)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEditClick(b)}
                                                    className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-colors"
                                                    title="Editar registro"
                                                >
                                                    <Pencil className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => setDeleteId(b.id)}
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
            {/* ... Existing stats code ... */}
             <div className="flex flex-col gap-6 no-print">
                <div className="flex items-center">
                    <BarChart3 className="w-6 h-6 mr-3 text-cyan-600" />
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Estadísticas y Análisis</h3>
                </div>
                
                {/* Date Filters - Large & Visible */}
                <div className="bg-cyan-50/50 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-cyan-200 dark:border-slate-700">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400 font-bold min-w-fit">
                            <Filter className="w-5 h-5" />
                            <span className="text-sm uppercase tracking-wide">Intervalo de Fechas</span>
                        </div>

                        <div className="flex flex-col sm:flex-row flex-1 items-center gap-4 w-full">
                            <div className="relative w-full">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-cyan-500 uppercase tracking-wider pointer-events-none">Desde</span>
                                <input 
                                    type="date" 
                                    value={statsStartDate} 
                                    onChange={(e) => setStatsStartDate(e.target.value)}
                                    className="w-full pl-16 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white font-medium shadow-sm outline-none focus:ring-2 focus:ring-cyan-500 dark:[color-scheme:dark]"
                                    title="Fecha inicio para estadísticas"
                                />
                            </div>
                            
                            <div className="relative w-full">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-cyan-500 uppercase tracking-wider pointer-events-none">Hasta</span>
                                <input 
                                    type="date" 
                                    value={statsEndDate} 
                                    onChange={(e) => setStatsEndDate(e.target.value)}
                                    className="w-full pl-16 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white font-medium shadow-sm outline-none focus:ring-2 focus:ring-cyan-500 dark:[color-scheme:dark]"
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
                        <div className="mt-4 flex items-center text-xs font-medium text-cyan-700 dark:text-cyan-400 bg-white dark:bg-slate-900/50 py-2 px-3 rounded-lg border border-cyan-200 dark:border-cyan-900/30 w-fit">
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
                            Reporte de Bautismos
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
                    {/* Total Baptisms */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-300 dark:border-slate-700 flex flex-col justify-between h-32 relative overflow-hidden group transition-all hover:-translate-y-1">
                            <div className="flex justify-between items-start z-10">
                            <div>
                                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Total Anotados</p>
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
                                <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">Realizados</p>
                                <h4 className="text-4xl font-bold text-cyan-600 dark:text-cyan-400">{stats.completedCount}</h4>
                            </div>
                            <div className="bg-cyan-50 dark:bg-cyan-900/20 p-2.5 rounded-2xl text-cyan-500 dark:text-cyan-400 transition-transform group-hover:scale-110">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-cyan-50 dark:bg-cyan-900/10 rounded-full z-0"></div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Status Distribution Chart */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-300 dark:border-slate-700 break-inside-avoid">
                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">Estado de Bautismos</h4>
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
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
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
                                    <Area type="monotone" dataKey="registered" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorRegistered)" name="Registrados" />
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
        description="¿Estás seguro de que deseas eliminar este registro de bautismo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
      />
    </div>
  );
};

export default Baptisms;
