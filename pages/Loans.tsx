
import React, { useState } from 'react';
import { useStore } from '../store';
import { ProductType, PendingStatus } from '../types';
import { Shirt, Trash2, Clock, CheckCircle2, User, FileSpreadsheet, Box, Calendar } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

const Loans: React.FC = () => {
  const { loans, addLoan, updateLoanStatus, removeLoan, user } = useStore();
  
  // Form State
  const [formData, setFormData] = useState({
    borrowerName: '',
    productType: ProductType.REMERA,
    size: '1'
  });
  
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addLoan({
        id: crypto.randomUUID(),
        borrowerName: formData.borrowerName,
        productType: formData.productType,
        size: formData.size,
        loanDate: new Date().toISOString(),
        status: PendingStatus.SI // Starts as Pending
    });

    // Reset Form but keep Type/Size for faster entry
    setFormData(prev => ({ ...prev, borrowerName: '' }));
  };

  const handleDelete = async () => {
      if (deleteId) {
          await removeLoan(deleteId);
          setDeleteId(null);
      }
  };

  const handleExportCSV = () => {
      const BOM = "\uFEFF";
      const headers = ['Fecha Préstamo', 'Prestado A', 'Producto', 'Talle', 'Estado', 'Fecha Devolución'].join(',');
      
      const rows = loans.map(loan => {
          return [
              new Date(loan.loanDate).toLocaleDateString() + ' ' + new Date(loan.loanDate).toLocaleTimeString(),
              `"${loan.borrowerName}"`,
              loan.productType,
              loan.size,
              loan.status === PendingStatus.SI ? 'Pendiente' : 'Devuelto',
              loan.returnDate ? (new Date(loan.returnDate).toLocaleDateString() + ' ' + new Date(loan.returnDate).toLocaleTimeString()) : '-'
          ].join(',');
      });

      const csvContent = BOM + [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prestamos_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const sortedLoans = [...loans].sort((a, b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime());
  const sizes = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Préstamos de Indumentaria</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Registra y controla quién tiene remeras o buzos prestados.</p>
        </div>
        
        {/* Export Button - Hidden for MODERATOR */}
        {user?.role !== 'MODERATOR' && (
            <button 
                onClick={handleExportCSV}
                className="hidden sm:flex items-center px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-sm font-medium transition-colors border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                title="Descargar historial en Excel"
            >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar Planilla
            </button>
        )}
      </div>

      {/* Registration Form */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-900 dark:border-slate-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
            <Shirt className="w-5 h-5 mr-2 text-orange-500" />
            Nuevo Préstamo
        </h3>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
             <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Prestado A (Nombre)</label>
                <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input 
                        required 
                        type="text" 
                        value={formData.borrowerName} 
                        onChange={e => setFormData({...formData, borrowerName: e.target.value})} 
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-900 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                        placeholder="Nombre de la persona"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Producto</label>
                <select
                    value={formData.productType}
                    onChange={e => setFormData({ ...formData, productType: e.target.value as ProductType })}
                    className="w-full px-3 py-2.5 border border-slate-900 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white cursor-pointer"
                >
                    <option value={ProductType.REMERA}>Remera</option>
                    <option value={ProductType.BUZO}>Buzo</option>
                </select>
            </div>
            
            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Talle</label>
                <select
                    value={formData.size}
                    onChange={e => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-900 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white cursor-pointer"
                >
                    {sizes.map(s => (
                        <option key={s} value={s}>Talle {s}</option>
                    ))}
                </select>
            </div>

            <button 
                type="submit" 
                className="md:col-span-4 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors shadow-md flex items-center justify-center mt-2 border border-slate-900"
            >
                Registrar Préstamo
            </button>
        </form>
      </div>

      {/* --- Historical List --- */}
      
      {/* 1. Mobile Card View (md:hidden) */}
      <div className="md:hidden space-y-4">
         <div className="flex items-center justify-between mb-2">
             <h3 className="font-bold text-gray-700 dark:text-gray-200">Historial</h3>
             <span className="text-xs font-medium bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full text-slate-600 dark:text-slate-300">
                Total: {loans.length}
             </span>
         </div>

         {sortedLoans.length === 0 ? (
             <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-900 dark:border-slate-700">
                <Box className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-gray-400 dark:text-slate-500 text-sm">No hay préstamos registrados.</p>
             </div>
         ) : (
             sortedLoans.map(loan => (
                <div key={loan.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-900 dark:border-slate-700 relative">
                    {/* Header: Name and Date */}
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white text-lg leading-tight">{loan.borrowerName}</h4>
                            <p className="text-xs text-gray-400 mt-1 flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(loan.loanDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${loan.productType === ProductType.BUZO ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                {loan.productType}
                            </span>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 px-1.5 rounded bg-slate-50 dark:bg-slate-700">
                                T{loan.size}
                            </span>
                        </div>
                    </div>

                    {/* Status Toggle Button (Large for Mobile) */}
                    <button 
                        onClick={() => updateLoanStatus(loan.id, loan.status === PendingStatus.SI ? PendingStatus.NO : PendingStatus.SI)}
                        className={`w-full py-2.5 mb-3 rounded-xl text-sm font-bold uppercase tracking-wide border transition-all flex items-center justify-center gap-2 ${
                            loan.status === PendingStatus.SI 
                            ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' 
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                        }`}
                    >
                        {loan.status === PendingStatus.SI ? (
                            <>
                                <Clock className="w-4 h-4" /> Pendiente
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" /> Realizado / Devuelto
                            </>
                        )}
                    </button>

                    {/* Footer: Return Info & Delete */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div>
                             {loan.returnDate && loan.status === PendingStatus.NO ? (
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/10 px-2 py-1 rounded">
                                    Devuelto: {new Date(loan.returnDate).toLocaleDateString()}
                                </div>
                            ) : (
                                <span className="text-[10px] text-gray-400 italic">Sin devolución</span>
                            )}
                        </div>
                        <button 
                            onClick={() => setDeleteId(loan.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Eliminar registro"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
             ))
         )}
      </div>

      {/* 2. Desktop Table View (hidden md:block) */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-900 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
             <h3 className="font-bold text-gray-700 dark:text-gray-200">Planilla Histórica</h3>
             <span className="text-xs font-medium bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full text-slate-600 dark:text-slate-300">
                Total: {loans.length}
             </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-100 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prestado A</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detalle</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Estado / Acción</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Devolución</th>
                        <th className="px-6 py-4 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {sortedLoans.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">
                                <Box className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                No hay préstamos registrados.
                            </td>
                        </tr>
                    ) : (
                        sortedLoans.map(loan => (
                            <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap font-medium">
                                    {new Date(loan.loanDate).toLocaleDateString()}
                                    <span className="block text-[10px] opacity-70">{new Date(loan.loanDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-gray-800 dark:text-white">{loan.borrowerName}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${loan.productType === ProductType.BUZO ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                            {loan.productType}
                                        </span>
                                        <span className="text-sm text-gray-600 dark:text-gray-300 font-semibold border border-slate-300 dark:border-slate-600 px-1.5 rounded">T{loan.size}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => updateLoanStatus(loan.id, loan.status === PendingStatus.SI ? PendingStatus.NO : PendingStatus.SI)}
                                        className={`w-full py-1.5 px-3 rounded-full text-xs font-bold uppercase tracking-wide border transition-all flex items-center justify-center gap-2 ${
                                            loan.status === PendingStatus.SI 
                                            ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' 
                                            : 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                                        }`}
                                    >
                                        {loan.status === PendingStatus.SI ? (
                                            <>
                                                <Clock className="w-3 h-3" /> Pendiente
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-3 h-3" /> Realizado
                                            </>
                                        )}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {loan.returnDate ? (
                                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                            {new Date(loan.returnDate).toLocaleDateString()}
                                            <span className="block text-[10px] opacity-70">{new Date(loan.returnDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => setDeleteId(loan.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                        title="Eliminar registro"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
          </div>
      </div>

      {/* Mobile Export Button - Hidden for MODERATOR */}
      {user?.role !== 'MODERATOR' && (
        <button 
                onClick={handleExportCSV}
                className="sm:hidden w-full flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-sm font-bold transition-colors border border-green-200 border-slate-900"
            >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Descargar Planilla Excel
        </button>
      )}

      <ConfirmationModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Registro"
        description="¿Estás seguro de que deseas eliminar este registro del historial? Esta acción no se puede deshacer."
        confirmText="Eliminar"
      />
    </div>
  );
};

export default Loans;
