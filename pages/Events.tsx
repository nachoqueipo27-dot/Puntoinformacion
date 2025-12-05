
import React, { useState, lazy, Suspense } from 'react';
import { useStore } from '../store';
import { QrCode, Trash2, Link as LinkIcon, Plus, Share2, Check, Loader2, Calendar, Pencil, X } from 'lucide-react';
import { AppEvent } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';

// Lazy load the QR Modal to improve initial page load and list rendering performance
const QRCodeModal = lazy(() => import('../components/QRCodeModal'));

const Events: React.FC = () => {
  const { events, addEvent, editEvent, removeEvent, user } = useStore();
  const [formData, setFormData] = useState({ name: '', link: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [qrModalData, setQrModalData] = useState<{ isOpen: boolean; link: string; name: string }>({
    isOpen: false,
    link: '',
    name: ''
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict Security Check: Only ADMIN (Admin_global) can create/edit
    if (user?.role !== 'ADMIN') return;

    if (!formData.name || !formData.link) return;

    if (editingId) {
        // Update
        const existing = events.find(e => e.id === editingId);
        if (existing) {
            editEvent({
                ...existing,
                name: formData.name,
                link: formData.link
            });
        }
        setEditingId(null);
    } else {
        // Create
        addEvent({
            id: crypto.randomUUID(),
            name: formData.name,
            link: formData.link,
            createdAt: new Date().toISOString()
        });
    }
    setFormData({ name: '', link: '' });
  };

  const handleEditClick = (event: AppEvent) => {
    // UI Check is handled in render, but good to check here too implicitly by UI visibility
    setFormData({ name: event.name, link: event.link });
    setEditingId(event.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', link: '' });
  };

  const confirmDelete = async () => {
    // Strict Security Check: Only ADMIN (Admin_global) can delete
    if (user?.role !== 'ADMIN') return;

    if (eventToDelete) {
      await removeEvent(eventToDelete);
      setEventToDelete(null);
    }
  };

  const openQr = (name: string, link: string) => {
    setQrModalData({ isOpen: true, link, name });
  };

  const handleShare = async (event: AppEvent) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: `Te invito a ver este evento: ${event.name}`,
          url: event.link
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(event.link);
        setCopiedId(event.id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  const formatDate = (dateString?: string) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Gestión de Eventos</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Crea eventos con enlaces para generar códigos QR y compartirlos fácilmente.</p>
      </div>

      {/* Formulario de Ingreso/Edición - Solo para ADMIN */}
      {user?.role === 'ADMIN' && (
      <div className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border transition-colors ${editingId ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10' : 'border-slate-300 dark:border-slate-700'}`}>
        <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold flex items-center ${editingId ? 'text-amber-700 dark:text-amber-500' : 'text-gray-700 dark:text-gray-200'}`}>
                {editingId ? <Pencil className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                {editingId ? 'Editar Evento' : 'Nuevo Evento'}
            </h3>
            {editingId && (
                <button onClick={handleCancelEdit} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 flex items-center">
                    <X className="w-4 h-4 mr-1" /> Cancelar
                </button>
            )}
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre del Evento</label>
                <input 
                    required 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="Ej: Campamento de Verano"
                />
            </div>
            <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Enlace / URL</label>
                <div className="relative">
                    <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input 
                        required 
                        type="url" 
                        value={formData.link} 
                        onChange={e => setFormData({...formData, link: e.target.value})} 
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="https://forms.google.com/..."
                    />
                </div>
            </div>
            <button 
                type="submit" 
                className={`w-full md:w-auto text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors h-[38px] flex items-center justify-center shadow-md ${editingId ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none'}`}
            >
                {editingId ? 'Actualizar' : 'Agregar'}
            </button>
        </form>
      </div>
      )}

      {/* Mobile Card View (Solo visible en móviles) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
         {events.length === 0 ? (
             <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <QrCode className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-gray-400 dark:text-gray-500 text-sm">No hay eventos registrados aún.</p>
             </div>
         ) : (
            events.map(event => (
                <div key={event.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-700 relative">
                    {/* Header: Event Name and Date */}
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-white text-lg">{event.name}</h3>
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDate(event.createdAt)}
                            </p>
                        </div>
                    </div>
                    
                    {/* Content: Link */}
                    <div className="mb-4 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <a 
                            href={event.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 flex items-center truncate font-medium"
                        >
                            <LinkIcon className="w-3.5 h-3.5 mr-2 shrink-0" />
                            <span className="truncate">{event.link}</span>
                        </a>
                    </div>

                    {/* Footer: Actions */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                         <button 
                            onClick={() => openQr(event.name, event.link)}
                            className="p-2.5 bg-gray-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg"
                            title="Ver QR"
                        >
                            <QrCode className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => handleShare(event)}
                            className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg"
                            title="Compartir"
                        >
                            {copiedId === event.id ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                        </button>
                        
                        {/* Admin Only Actions - Moderators can NOT see this */}
                        {user?.role === 'ADMIN' && (
                            <>
                                <button 
                                    onClick={() => handleEditClick(event)}
                                    className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg"
                                    title="Editar"
                                >
                                    <Pencil className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => setEventToDelete(event.id)}
                                    className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ))
         )}
      </div>

      {/* Desktop Table View (Oculto en móviles) */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-700 overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-slate-300 dark:border-slate-700">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Nombre del Evento</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Enlace</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {events.length === 0 ? (
                        <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                                <QrCode className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                No hay eventos registrados aún.
                            </td>
                        </tr>
                    ) : (
                        events.map(event => (
                            <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-800 dark:text-white">{event.name}</div>
                                </td>
                                <td className="px-6 py-4 max-w-xs">
                                    <a 
                                        href={event.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 hover:underline flex items-center truncate"
                                        title={event.link}
                                    >
                                        <LinkIcon className="w-3 h-3 mr-1.5 shrink-0" />
                                        <span className="truncate">{event.link}</span>
                                    </a>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => openQr(event.name, event.link)}
                                            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Ver Código QR"
                                        >
                                            <QrCode className="w-5 h-5" />
                                        </button>
                                        
                                        <button 
                                            onClick={() => handleShare(event)}
                                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                            title={copiedId === event.id ? "Enlace copiado" : "Compartir enlace"}
                                        >
                                            {copiedId === event.id ? (
                                                <Check className="w-5 h-5 text-emerald-500" />
                                            ) : (
                                                <Share2 className="w-5 h-5" />
                                            )}
                                        </button>

                                        {/* Admin Only Actions - Moderators can NOT see this */}
                                        {user?.role === 'ADMIN' && (
                                            <>
                                                <div className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1"></div>
                                                <button 
                                                    onClick={() => handleEditClick(event)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                    title="Editar evento"
                                                >
                                                    <Pencil className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => setEventToDelete(event.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Eliminar evento"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
          </div>
      </div>

      {/* Modales */}
      <ConfirmationModal 
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar Evento"
        description="¿Estás seguro de que deseas eliminar este evento? Esta acción borrará el enlace y el QR generado."
        confirmText="Eliminar"
      />

      {/* Lazy Loaded QR Modal wrapped in Suspense */}
      <Suspense fallback={
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
             <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl flex flex-col items-center">
                 <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                 <p className="text-sm text-gray-500">Generando QR...</p>
             </div>
         </div>
      }>
        {qrModalData.isOpen && (
            <QRCodeModal 
                isOpen={qrModalData.isOpen}
                onClose={() => setQrModalData({ ...qrModalData, isOpen: false })}
                link={qrModalData.link}
                eventName={qrModalData.name}
            />
        )}
      </Suspense>
    </div>
  );
};

export default Events;
