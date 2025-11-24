import React, { useState } from 'react';
import { useStore } from '../store';
import { MovementType } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';
import { Download } from 'lucide-react';

const Movements: React.FC = () => {
  const { addMovement, products, movements } = useStore();
  const [formData, setFormData] = useState({
    code: '',
    date: new Date().toISOString().split('T')[0],
    type: MovementType.INGRESO,
    quantity: 1 as number | string
  });
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Obtener nombre del producto seleccionado para mostrar en el modal
  const selectedProduct = products.find(p => p.code === formData.code);

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate code exists
    if (!products.some(p => p.code === formData.code)) {
        setMsg({ type: 'error', text: 'El código ingresado no existe en el inventario.' });
        return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    addMovement({
      id: crypto.randomUUID(),
      code: formData.code,
      date: formData.date,
      type: formData.type,
      quantity: Number(formData.quantity)
    });

    setMsg({ type: 'success', text: 'Movimiento registrado correctamente.' });
    setFormData(prev => ({ ...prev, quantity: 1, code: '' })); // Reset code and qty
    setIsConfirmOpen(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
        setFormData({ ...formData, quantity: '' });
        return;
    }
    const parsed = parseInt(val);
    if (!isNaN(parsed) && parsed > 0) {
        setFormData({ ...formData, quantity: parsed });
    }
  };

  const handleExportCSV = () => {
    const headers = ['Fecha', 'Código', 'Producto', 'Tipo', 'Cantidad'];
    const csvContent = [
      headers.join(','),
      ...movements.map(m => {
        const product = products.find(p => p.code === m.code);
        const productName = product ? `"${product.name.replace(/"/g, '""')}"` : 'Producto Desconocido';
        return [
          m.date,
          m.code,
          productName,
          m.type,
          m.quantity
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `movimientos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Movimientos de Inventario</h2>
        
        <button 
            onClick={handleExportCSV}
            className="flex items-center bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            title="Exportar historial completo de movimientos"
        >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Exportar Historial</span>
            <span className="sm:hidden">CSV</span>
        </button>
      </div>

      <form onSubmit={handlePreSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        {msg && (
          <div className={`p-4 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código de Producto</label>
            <input
                required
                type="text"
                list="product-codes"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Buscar código..."
            />
            <datalist id="product-codes">
                {products.map(p => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                ))}
            </datalist>
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
                required
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimiento</label>
            <div className="flex space-x-4 mt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                        type="radio" 
                        name="type" 
                        value={MovementType.INGRESO} 
                        checked={formData.type === MovementType.INGRESO}
                        onChange={() => setFormData({...formData, type: MovementType.INGRESO})}
                        className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Ingreso</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                        type="radio" 
                        name="type" 
                        value={MovementType.VENTA} 
                        checked={formData.type === MovementType.VENTA}
                        onChange={() => setFormData({...formData, type: MovementType.VENTA})}
                        className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Venta</span>
                </label>
            </div>
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
            <input
                required
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleQuantityChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            </div>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors shadow-md shadow-indigo-200"
        >
          Registrar Movimiento
        </button>
      </form>

      <ConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        title="Confirmar Movimiento"
        description={
          <div>
            <p>Por favor confirma los detalles del movimiento:</p>
            <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p><strong>Tipo:</strong> <span className={formData.type === MovementType.INGRESO ? 'text-green-600 font-bold' : 'text-indigo-600 font-bold'}>{formData.type}</span></p>
              <p><strong>Producto:</strong> {selectedProduct?.name || formData.code}</p>
              <p><strong>Cantidad:</strong> {formData.quantity}</p>
              <p><strong>Fecha:</strong> {new Date(formData.date).toLocaleDateString()}</p>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default Movements;