import React, { useState } from 'react';
import { useStore } from '../store';
import { PendingStatus } from '../types';

const Baptisms: React.FC = () => {
  const { baptisms, addBaptism, updateBaptismStatus } = useStore();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    pending: PendingStatus.SI
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBaptism({
      id: crypto.randomUUID(),
      ...formData
    });
    setFormData({ fullName: '', email: '', phone: '', pending: PendingStatus.SI });
  };

  return (
    <div className="space-y-8">
      <div className="max-w-4xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Bautismos</h2>
        
        {/* Registration Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Nuevo Registro</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nombre y Apellido</label>
                    <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Mail</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Pendiente</label>
                    <select value={formData.pending} onChange={e => setFormData({...formData, pending: e.target.value as PendingStatus})} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                        <option value={PendingStatus.SI}>Sí</option>
                        <option value={PendingStatus.NO}>No</option>
                    </select>
                </div>
                <div className="lg:col-span-1">
                    <button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 rounded-lg text-sm font-medium transition-colors">Agregar</button>
                </div>
            </form>
        </div>

        {/* List Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Mail</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Teléfono</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {baptisms.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-6 text-center text-gray-400 text-sm">No hay registros.</td></tr>
                    ) : (
                        baptisms.map(b => (
                            <tr key={b.id}>
                                <td className="px-6 py-4 text-sm text-gray-800">{b.fullName}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{b.email}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{b.phone}</td>
                                <td className="px-6 py-4">
                                    <select 
                                        value={b.pending} 
                                        onChange={(e) => updateBaptismStatus(b.id, e.target.value as PendingStatus)}
                                        className={`text-sm rounded-full px-3 py-1 border-0 cursor-pointer ${b.pending === PendingStatus.SI ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}
                                    >
                                        <option value={PendingStatus.SI}>Pendiente</option>
                                        <option value={PendingStatus.NO}>Realizado</option>
                                    </select>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Baptisms;