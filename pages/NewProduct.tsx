import React, { useState } from 'react';
import { useStore } from '../store';
import { ProductType } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';

const NewProduct: React.FC = () => {
  const { addProduct, products } = useStore();
  const [formData, setFormData] = useState({
    code: '',
    type: ProductType.REMERA,
    size: '1',
    minQuantity: 1 as number | string,
    price: '' as number | string
  });
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Derivar el nombre automáticamente basado en el tipo
  const derivedName = formData.type === ProductType.REMERA ? 'Remera' : 'Buzo';

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (products.some(p => p.code === formData.code)) {
      setMsg({ type: 'error', text: 'El código de producto ya existe.' });
      return;
    }
    // Abrir modal si la validación básica pasa
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    addProduct({
      code: formData.code,
      name: derivedName,
      type: formData.type,
      size: formData.size,
      minQuantity: Number(formData.minQuantity),
      price: Number(formData.price),
      creationDate: new Date().toISOString()
    });

    setMsg({ type: 'success', text: 'Producto agregado exitosamente.' });
    setFormData({ code: '', type: ProductType.REMERA, size: '1', minQuantity: 1, price: '' });
    setIsConfirmOpen(false);
    
    setTimeout(() => setMsg(null), 3000);
  };

  const handleNumberChange = (field: 'minQuantity' | 'price', value: string) => {
    // Permitir borrar el contenido (string vacío)
    if (value === '') {
        setFormData({ ...formData, [field]: '' });
        return;
    }
    
    const parsed = parseInt(value);
    // Solo actualizar si es un número válido y mayor a 0 (o igual a 0 si quisieras permitir precio 0, pero pediste no 0)
    if (!isNaN(parsed) && parsed > 0) {
        setFormData({ ...formData, [field]: parsed });
    }
  };

  const sizes = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Nuevos Productos</h2>
      
      <form onSubmit={handlePreSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        {msg && (
          <div className={`p-4 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.text}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input
              required
              type="text"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="EJ: REM-001"
            />
          </div>
          
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Talle</label>
            <select
              value={formData.size}
              onChange={e => setFormData({ ...formData, size: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
            >
              {sizes.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Input de Producto eliminado: El nombre se deriva del Tipo */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as ProductType })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
              >
                <option value={ProductType.REMERA}>Remeras</option>
                <option value={ProductType.BUZO}>Buzos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unitario ($)</label>
              <input
                required
                type="number"
                min="1"
                value={formData.price}
                onChange={(e) => handleNumberChange('price', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Mínima</label>
              <input
                required
                type="number"
                min="1"
                value={formData.minQuantity}
                onChange={(e) => handleNumberChange('minQuantity', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">Aviso de poco stock</p>
            </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors shadow-md shadow-blue-200"
        >
          Guardar Producto
        </button>
      </form>

      <ConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        title="Confirmar Nuevo Producto"
        description={
          <div>
            <p>¿Estás seguro de que deseas crear el siguiente producto?</p>
            <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p><strong>Nombre:</strong> {derivedName}</p>
              <p><strong>Código:</strong> {formData.code}</p>
              <p><strong>Tipo:</strong> {formData.type} - Talle {formData.size}</p>
              <p><strong>Precio:</strong> ${formData.price}</p>
              <p><strong>Mínimo:</strong> {formData.minQuantity}</p>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default NewProduct;