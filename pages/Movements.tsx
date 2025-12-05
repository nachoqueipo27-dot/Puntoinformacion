
import React, { useState } from 'react';
import { useStore } from '../store';
import { MovementType, ProductType } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';
import { Download, RefreshCw } from 'lucide-react';

const Movements: React.FC = () => {
  const { addMovement, products, movements } = useStore();
  
  // Estado para el movimiento
  const [formData, setFormData] = useState({
    type: MovementType.INGRESO,
    category: ProductType.REMERA,
    size: '1',
    date: new Date().toISOString().split('T')[0],
    quantity: 1 as number | string
  });
  
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Derivar código interno
  const derivedCode = formData.category === ProductType.REMERA 
    ? `REM-${formData.size}` 
    : `BUZ-${formData.size}`;
    
  // Verificar si el producto existe
  const targetProduct = products.find(p => p.code === derivedCode);

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar si el producto existe
    if (!targetProduct) {
        setMsg({ 
            type: 'error', 
            text: `El producto ${formData.category} Talle ${formData.size} no existe en el inventario. Debes crearlo primero en "Nuevos Productos".` 
        });
        return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    if (!targetProduct) return;

    addMovement({
      id: crypto.randomUUID(),
      code: derivedCode,
      date: formData.date,
      type: formData.type,
      quantity: Number(formData.quantity)
    });

    setMsg({ type: 'success', text: 'Movimiento registrado correctamente.' });
    // Resetear cantidad a 1, mantener fecha y tipo para carga rápida
    setFormData(prev => ({ ...prev, quantity: 1 })); 
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
    const headers = ['Fecha', 'Categoría', 'Talle', 'Tipo Movimiento', 'Cantidad'];
    const csvContent = [
      headers.join(','),
      ...movements.map(m => {
        const product = products.find(p => p.code === m.code);
        // Si encontramos el producto, usamos sus datos, sino intentamos parsear el código
        const category = product ? product.type : (m.code.startsWith('REM') ? 'Remeras' : 'Buzos');
        const size = product ? product.size : m.code.split('-')[1];

        return [
          m.date,
          category,
          size,
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

  const sizes = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Movimientos de Inventario</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Registra entradas o salidas de stock para mantener el inventario actualizado.</p>
        </div>
        
        <button 
            onClick={handleExportCSV}
            className="flex items-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            title="Exportar historial completo de movimientos a CSV"
        >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Exportar Historial</span>
            <span className="sm:hidden">CSV</span>
        </button>
      </div>

      <form onSubmit={handlePreSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-300 dark:border-slate-700 transition-colors grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {msg && (
          <div className={`col-span-1 md:col-span-2 p-4 rounded-xl text-sm ${msg.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
            {msg.text}
          </div>
        )}

        <div className="col-span-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Categoría</label>
             <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as ProductType })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white cursor-pointer"
                title="Selecciona la categoría del producto (Remeras o Buzos)"
            >
                <option value={ProductType.REMERA}>Remeras</option>
                <option value={ProductType.BUZO}>Buzos</option>
            </select>
        </div>

        <div className="col-span-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Talle</label>
             <select
                value={formData.size}
                onChange={e => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white cursor-pointer"
                title="Selecciona el talle del producto"
            >
                {sizes.map(s => (
                    <option key={s} value={s}>Talle {s}</option>
                ))}
            </select>
        </div>

        <div className="col-span-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo de Movimiento</label>
            <div className="flex items-center px-4 h-[50px] border border-slate-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700/50">
                <div className="flex space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer group" title="Seleccionar Ingreso para aumentar stock">
                        <input 
                            type="radio" 
                            name="type" 
                            value={MovementType.INGRESO} 
                            checked={formData.type === MovementType.INGRESO}
                            onChange={() => setFormData({...formData, type: MovementType.INGRESO})}
                            className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Ingreso</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group" title="Seleccionar Venta para disminuir stock">
                        <input 
                            type="radio" 
                            name="type" 
                            value={MovementType.VENTA} 
                            checked={formData.type === MovementType.VENTA}
                            onChange={() => setFormData({...formData, type: MovementType.VENTA})}
                            className="text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Venta</span>
                    </label>
                </div>
            </div>
        </div>

        <div className="col-span-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha</label>
            <input
                required
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white dark:[color-scheme:dark]"
                title="Selecciona la fecha del movimiento"
            />
        </div>

        <div className="col-span-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cantidad</label>
            <input
                required
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleQuantityChange}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold"
                title="Ingresa la cantidad de unidades (mínimo 1)"
            />
        </div>

        <div className="col-span-1 flex items-end">
            <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors shadow-md shadow-indigo-200 dark:shadow-none flex items-center justify-center h-[50px]"
            title="Guardar el movimiento en el historial"
            >
            <RefreshCw className="w-4 h-4 mr-2" />
            Registrar Movimiento
            </button>
        </div>
      </form>

      <ConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        title="Confirmar Movimiento"
        description={
          <div>
            <p className="text-gray-600 dark:text-gray-300">Por favor confirma los detalles del movimiento:</p>
            <div className="mt-3 bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 space-y-2">
              <p className="flex justify-between"><strong>Tipo:</strong> <span className={formData.type === MovementType.INGRESO ? 'text-green-600 dark:text-green-400 font-bold' : 'text-indigo-600 dark:text-indigo-400 font-bold'}>{formData.type}</span></p>
              <p className="flex justify-between"><strong>Producto:</strong> {formData.category}</p>
              <p className="flex justify-between"><strong>Talle:</strong> {formData.size}</p>
              <p className="flex justify-between"><strong>Cantidad:</strong> {formData.quantity}</p>
              <p className="flex justify-between"><strong>Fecha:</strong> {new Date(formData.date).toLocaleDateString()}</p>
            </div>
            {!targetProduct && <p className="mt-2 text-xs text-red-500">Advertencia: Este producto no parece existir en el inventario.</p>}
          </div>
        }
      />
    </div>
  );
};

export default Movements;
