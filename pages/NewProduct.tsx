
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { ProductType } from '../types';
import { Loader2, Tag, RefreshCcw, DollarSign, Percent, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

const NewProduct: React.FC = () => {
  const { addProduct, products, updateGlobalPrice } = useStore();
  const [formData, setFormData] = useState({
    type: ProductType.REMERA,
    size: '1',
    minQuantity: 1 as number | string,
    price: '' as number | string
  });
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Estados para Actualización de Precios
  const [priceUpdateData, setPriceUpdateData] = useState({
    type: ProductType.REMERA,
    newPrice: '' as number | string
  });
  
  // Nuevo estado para modo de actualización (Fijo o Porcentaje)
  const [updateMode, setUpdateMode] = useState<'fixed' | 'percentage'>('fixed');
  const [percentageValue, setPercentageValue] = useState<string>('');

  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [priceMsg, setPriceMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isPriceConfirmOpen, setIsPriceConfirmOpen] = useState(false);

  // Derivar el nombre automáticamente basado en el tipo
  const derivedName = formData.type === ProductType.REMERA ? 'Remera' : 'Buzo';
  
  // Generar código interno automáticamente
  const generatedCode = formData.type === ProductType.REMERA 
    ? `REM-${formData.size}` 
    : `BUZ-${formData.size}`;

  // Obtener el precio actual de referencia (tomamos el primero que encontremos de ese tipo)
  const currentReferencePrice = useMemo(() => {
    const product = products.find(p => p.type === priceUpdateData.type);
    return product ? product.price : 0;
  }, [products, priceUpdateData.type]);

  // Calcular precio final basado en el modo seleccionado
  const calculatedFinalPrice = useMemo(() => {
    if (updateMode === 'fixed') {
        return Number(priceUpdateData.newPrice);
    } else {
        const pct = Number(percentageValue);
        if (isNaN(pct) || currentReferencePrice === 0) return 0;
        // Calcular porcentaje: Precio + (Precio * Porcentaje / 100)
        return Math.round(currentReferencePrice * (1 + pct / 100));
    }
  }, [updateMode, priceUpdateData.newPrice, percentageValue, currentReferencePrice]);

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    // Validación: Verificar si ya existe esa combinación Tipo + Talle
    if (products.some(p => p.code === generatedCode)) {
      setMsg({ type: 'error', text: `Ya existe un producto '${derivedName} Talle ${formData.size}' en el inventario.` });
      return;
    }

    // Abrir modal de confirmación antes de guardar
    setIsConfirmOpen(true);
  };

  const handleFinalSave = async () => {
    // Cerrar modal y comenzar estado de carga
    setIsConfirmOpen(false);
    setIsLoading(true);

    try {
      // Simular un pequeño delay para mejorar la percepción de la acción
      await new Promise(resolve => setTimeout(resolve, 800));

      await addProduct({
        code: generatedCode, // Usar código generado
        name: derivedName,
        type: formData.type,
        size: formData.size,
        minQuantity: Number(formData.minQuantity),
        price: Number(formData.price),
        creationDate: new Date().toISOString()
      });

      setMsg({ type: 'success', text: 'Producto agregado exitosamente.' });
      // Resetear formulario (manteniendo tipo para agilizar carga masiva)
      setFormData(prev => ({ ...prev, size: '1', minQuantity: 1, price: '' }));
    } catch (error) {
      console.error(error);
      setMsg({ type: 'error', text: 'Ocurrió un error al guardar el producto.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handleNumberChange = (field: 'minQuantity' | 'price', value: string) => {
    // Permitir borrar el contenido (string vacío)
    if (value === '') {
        setFormData({ ...formData, [field]: '' });
        return;
    }
    
    const parsed = parseInt(value);
    // Solo actualizar si es un número válido y mayor a 0
    if (!isNaN(parsed) && parsed > 0) {
        setFormData({ ...formData, [field]: parsed });
    }
  };

  // --- Lógica de Actualización de Precios ---
  const handlePriceNumberChange = (value: string) => {
    if (value === '') {
        setPriceUpdateData({ ...priceUpdateData, newPrice: '' });
        return;
    }
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed > 0) {
        setPriceUpdateData({ ...priceUpdateData, newPrice: parsed });
    }
  };

  const handlePreUpdatePrice = (e: React.FormEvent) => {
    e.preventDefault();
    setPriceMsg(null);
    if (calculatedFinalPrice <= 0) {
        setPriceMsg({ type: 'error', text: 'El precio calculado debe ser mayor a 0.' });
        return;
    }
    setIsPriceConfirmOpen(true);
  };

  const handleFinalUpdatePrice = async () => {
    setIsPriceConfirmOpen(false);
    setIsPriceLoading(true);

    try {
        await new Promise(resolve => setTimeout(resolve, 800)); // Animación de espera
        
        // Usamos el precio calculado final, sea fijo o porcentaje
        await updateGlobalPrice(priceUpdateData.type, calculatedFinalPrice);
        
        setPriceMsg({ type: 'success', text: `Precio de ${priceUpdateData.type} actualizado correctamente en todo el inventario.` });
        setPriceUpdateData({ ...priceUpdateData, newPrice: '' });
        setPercentageValue('');
    } catch (error) {
        console.error(error);
        setPriceMsg({ type: 'error', text: 'Error al actualizar los precios.' });
    } finally {
        setIsPriceLoading(false);
        setTimeout(() => setPriceMsg(null), 4000);
    }
  };

  const sizes = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      
      {/* Sección 1: Crear Producto */}
      <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Nuevos Productos</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Registra nuevos artículos en el catálogo para poder gestionar su stock.</p>
          </div>
          
          <form onSubmit={handlePreSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-700 space-y-6 transition-colors">
            {msg && (
              <div className={`p-4 rounded-lg text-sm flex items-center ${msg.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {msg.text}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as ProductType })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white cursor-pointer"
                    disabled={isLoading}
                  >
                    <option value={ProductType.REMERA}>Remeras</option>
                    <option value={ProductType.BUZO}>Buzos</option>
                  </select>
                </div>
              
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Talle</label>
                  <select
                    value={formData.size}
                    onChange={e => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white cursor-pointer"
                    disabled={isLoading}
                  >
                    {sizes.map(s => (
                      <option key={s} value={s}>Talle {s}</option>
                    ))}
                  </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio Unitario ($)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.price}
                    onChange={(e) => handleNumberChange('price', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="0"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad Mínima (Alerta)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.minQuantity}
                    onChange={(e) => handleNumberChange('minQuantity', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    disabled={isLoading}
                  />
                </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-blue-600 text-white font-medium py-3 rounded-lg transition-all shadow-md shadow-blue-200 dark:shadow-none flex items-center justify-center ${
                isLoading ? 'opacity-70 cursor-wait' : 'hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Producto'
              )}
            </button>
          </form>
      </section>
      
      {/* Sección 2: Actualización de Precios (Modificada) */}
      <section className="animate-fade-in">
         <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                <Tag className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Precios Actuales</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Actualiza el precio general por valor fijo o porcentaje</p>
            </div>
         </div>

         <form onSubmit={handlePreUpdatePrice} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-700 space-y-6 transition-colors relative overflow-hidden">
             {/* Decorative Background */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-3xl -z-0"></div>

             {priceMsg && (
              <div className={`p-4 rounded-lg text-sm flex items-center relative z-10 ${priceMsg.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                {priceMsg.text}
              </div>
            )}

            {/* Toggle Mode */}
            <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-xl relative z-10 w-fit">
                <button
                    type="button"
                    onClick={() => setUpdateMode('fixed')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        updateMode === 'fixed' 
                        ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                    Precio Fijo
                </button>
                <button
                    type="button"
                    onClick={() => setUpdateMode('percentage')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        updateMode === 'percentage' 
                        ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                    Porcentaje (%)
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Producto a Actualizar</label>
                   <select
                    value={priceUpdateData.type}
                    onChange={e => setPriceUpdateData({ ...priceUpdateData, type: e.target.value as ProductType })}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white cursor-pointer"
                    disabled={isPriceLoading}
                  >
                    <option value={ProductType.REMERA}>Remeras</option>
                    <option value={ProductType.BUZO}>Buzos</option>
                  </select>
                  {/* Current Price Info */}
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                     Precio actual base: <span className="text-gray-700 dark:text-white font-bold">${currentReferencePrice.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                    {updateMode === 'fixed' ? (
                        <>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nuevo Precio Unitario</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    value={priceUpdateData.newPrice}
                                    onChange={(e) => handlePriceNumberChange(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold"
                                    placeholder="Ej: 15000"
                                    disabled={isPriceLoading}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ajuste Porcentual</label>
                            <div className="relative">
                                <Percent className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    required
                                    type="number"
                                    value={percentageValue}
                                    onChange={(e) => setPercentageValue(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold"
                                    placeholder="Ej: 15 (aumento) o -10 (descuento)"
                                    disabled={isPriceLoading}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            {/* Preview of Calculation (Only if Percentage Mode) */}
            {updateMode === 'percentage' && percentageValue && (
                <div className="relative z-10 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Cálculo Previo</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-gray-400 line-through text-sm">${currentReferencePrice.toLocaleString()}</span>
                            <span className={`text-sm font-bold flex items-center ${Number(percentageValue) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                {Number(percentageValue) >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                {Number(percentageValue)}%
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                        <span className="text-2xl font-bold text-slate-800 dark:text-white">
                            ${calculatedFinalPrice.toLocaleString()}
                        </span>
                    </div>
                </div>
            )}

            <button
              type="submit"
              disabled={isPriceLoading || (updateMode === 'fixed' && !priceUpdateData.newPrice) || (updateMode === 'percentage' && !percentageValue)}
              className={`w-full bg-emerald-600 text-white font-medium py-4 rounded-xl transition-all shadow-md shadow-emerald-200 dark:shadow-none flex items-center justify-center relative z-10 ${
                isPriceLoading ? 'opacity-70 cursor-wait' : 'hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {isPriceLoading ? (
                <>
                  <RefreshCcw className="w-5 h-5 mr-2 animate-spin" />
                  Actualizando Inventario...
                </>
              ) : (
                <>
                    <RefreshCcw className="w-5 h-5 mr-2" />
                    Aplicar Actualización
                </>
              )}
            </button>
         </form>
      </section>

      {/* Modal Confirmación Crear Producto */}
      <ConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleFinalSave}
        title="Confirmar Nuevo Producto"
        description={
          <div>
            <p className="text-gray-600 dark:text-gray-300">¿Estás seguro de que deseas agregar este producto al inventario?</p>
            <div className="mt-3 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-gray-700 dark:text-gray-200">
              <p><strong>Producto:</strong> {derivedName}</p>
              <p><strong>Talle:</strong> {formData.size}</p>
              <p><strong>Precio:</strong> ${formData.price}</p>
            </div>
          </div>
        }
      />

      {/* Modal Confirmación Actualizar Precios */}
      <ConfirmationModal 
        isOpen={isPriceConfirmOpen}
        onClose={() => setIsPriceConfirmOpen(false)}
        onConfirm={handleFinalUpdatePrice}
        title="Actualizar Precios"
        description={
          <div>
            <p className="text-gray-600 dark:text-gray-300">Esta acción actualizará el precio de <strong>TODOS</strong> los productos del tipo seleccionado en el inventario actual.</p>
            <div className="mt-3 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-300 dark:border-emerald-800 text-center">
               <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nuevo Valor para {priceUpdateData.type}</p>
               <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">${calculatedFinalPrice.toLocaleString()}</p>
               {updateMode === 'percentage' && (
                   <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                       (Ajuste del {percentageValue}% sobre ${currentReferencePrice.toLocaleString()})
                   </p>
               )}
            </div>
            <p className="mt-4 text-xs text-red-500">Nota: Esto afectará inmediatamente a la visualización del Panel.</p>
          </div>
        }
        confirmText="Confirmar Actualización"
      />
    </div>
  );
};

export default NewProduct;
