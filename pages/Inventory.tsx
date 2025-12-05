
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { ProductType } from '../types';
import { ArrowUpDown, Filter, ArrowUp, ArrowDown, Download, Layers, Box, Trash2 } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

type SortKey = 'name' | 'type' | 'size' | 'price' | 'creationDate' | 'stock';
type SortDirection = 'asc' | 'desc';

const Inventory: React.FC = () => {
  const { products, getProductStock, removeProduct } = useStore();
  
  // State for filtering and sorting
  const [filterType, setFilterType] = useState<ProductType | 'ALL'>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'creationDate',
    direction: 'desc'
  });

  // State for Delete Action
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  // State for Animation
  const [isAnimatingOut, setIsAnimatingOut] = useState<string | null>(null);

  // Handle Sort Click
  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Logic: Filter -> Sort
  const processedProducts = useMemo(() => {
    let result = [...products];

    // 1. Filter
    if (filterType !== 'ALL') {
      result = result.filter(p => p.type === filterType);
    }

    // 2. Sort
    result.sort((a, b) => {
      let valA: any = a[sortConfig.key as keyof typeof a];
      let valB: any = b[sortConfig.key as keyof typeof b];

      // Special handling for 'stock' since it's not a property of product
      if (sortConfig.key === 'stock') {
        valA = getProductStock(a.code);
        valB = getProductStock(b.code);
      }

      // Special handling for 'size' to sort numerically
      if (sortConfig.key === 'size') {
          valA = Number(a.size || 0);
          valB = Number(b.size || 0);
      }
      
      // Handle potential undefined prices for old data
      if (sortConfig.key === 'price') {
          valA = a.price || 0;
          valB = b.price || 0;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, filterType, sortConfig, getProductStock]);

  const handleExportCSV = () => {
    const headers = ['Producto', 'Talle', 'Tipo', 'Precio', 'Stock Actual', 'Stock Mínimo'];
    
    const csvContent = [
      headers.join(','),
      ...processedProducts.map(p => {
        const stock = getProductStock(p.code);
        // Escape quotes in name
        const name = p.name ? `"${p.name.replace(/"/g, '""')}"` : '';
        return [
          name,
          p.size,
          p.type,
          p.price || 0,
          stock,
          p.minQuantity
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventario_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      // 1. Trigger Animation
      setIsAnimatingOut(productToDelete);

      // 2. Wait for animation to finish (500ms matches CSS duration)
      setTimeout(async () => {
          await removeProduct(productToDelete);
          // 3. Cleanup states
          setIsAnimatingOut(null);
          setProductToDelete(null);
      }, 500);
    }
  };

  const getProductToDeleteName = () => {
    if (!productToDelete) return '';
    const prod = products.find(p => p.code === productToDelete);
    return prod ? `${prod.name} (Talle ${prod.size})` : productToDelete;
  };

  // Helper for Sort Icon
  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortConfig.key !== colKey) return <ArrowUpDown className="w-4 h-4 text-gray-300 ml-1 inline-block" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-500 ml-1 inline-block" />
      : <ArrowDown className="w-4 h-4 text-blue-500 ml-1 inline-block" />;
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Inventario</h2>
        
        {/* Controls Container */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center transition-colors">
            
            {/* Left Side: Filter Only */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                {/* Filter Dropdown */}
                <div className="w-full sm:w-auto">
                     <label className="hidden md:block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Filtrar</label>
                     <label className="md:hidden text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 block">Filtrar por Tipo</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="w-4 h-4 text-gray-400" />
                        </div>
                        <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as ProductType | 'ALL')}
                            className="w-full pl-10 appearance-none bg-gray-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-gray-200 py-2 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white dark:focus:bg-slate-600 focus:border-blue-500 text-sm font-medium cursor-pointer"
                            title="Filtrar listado por tipo de producto"
                            aria-label="Filtrar listado por tipo de producto"
                        >
                            <option value="ALL">Todos los productos</option>
                            <option value={ProductType.REMERA}>Solo Remeras</option>
                            <option value={ProductType.BUZO}>Solo Buzos</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Right Side: Actions */}
            <button 
                onClick={handleExportCSV}
                className="w-full md:w-auto flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm active:scale-95"
                title="Descargar listado completo en formato CSV"
                aria-label="Descargar listado en formato CSV"
            >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
            </button>
        </div>
      </div>

      {/* Mobile Card View (Visible only on small screens) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
         {processedProducts.length === 0 ? (
             <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <Box className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-gray-400 dark:text-slate-500 text-sm">No se encontraron productos.</p>
             </div>
         ) : (
            processedProducts.map((product) => {
                const stock = getProductStock(product.code);
                const isLowStock = stock <= product.minQuantity;
                const isDeleting = isAnimatingOut === product.code;

                return (
                    <div 
                        key={product.code} 
                        className={`
                            bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-300 dark:border-slate-700 relative overflow-hidden 
                            transition-all duration-500 ease-in-out
                            ${isDeleting ? 'opacity-0 scale-90 translate-x-12' : 'opacity-100 scale-100 translate-x-0'}
                        `}
                    >
                        {/* Header: Name and Price */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="pr-4">
                                <h3 className="font-bold text-gray-800 dark:text-white text-lg leading-tight">{product.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500 dark:text-slate-400 font-medium flex items-center">
                                        <Layers className="w-3 h-3 mr-1" />
                                        Talle {product.size}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg flex items-center">
                                    <span className="text-xs mr-0.5">$</span>
                                    {(product.price || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Footer: Type and Stock */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                product.type === 'Buzos' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            }`}>
                                {product.type}
                            </span>

                            <div className="flex items-center gap-3">
                                <span 
                                    className={`flex items-center px-3 py-1 rounded-full text-sm font-bold border ${
                                        isLowStock 
                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30' 
                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-600'
                                    }`}
                                    title={`Stock actual: ${stock} unidades (Mínimo requerido: ${product.minQuantity})`}
                                >
                                    {isLowStock && <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />}
                                    {stock}
                                </span>
                                
                                {/* Trash Icon Mobile */}
                                <button 
                                    onClick={() => setProductToDelete(product.code)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 group"
                                    title="Eliminar este producto permanentemente"
                                    aria-label="Eliminar producto"
                                >
                                    <Trash2 className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })
         )}
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-300 dark:border-slate-700 overflow-hidden transition-colors">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-slate-300 dark:border-slate-700">
            <tr>
              <th 
                onClick={() => handleSort('name')}
                className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors select-none"
                title="Click para ordenar por Nombre de Producto"
                aria-label="Ordenar por Nombre de Producto"
              >
                Producto <SortIcon colKey="name" />
              </th>
              <th 
                onClick={() => handleSort('size')}
                className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors select-none"
                title="Click para ordenar por Talle"
                aria-label="Ordenar por Talle"
              >
                Talle <SortIcon colKey="size" />
              </th>
              <th 
                onClick={() => handleSort('type')}
                className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors select-none"
                title="Click para ordenar por Tipo"
                aria-label="Ordenar por Tipo"
              >
                Tipo <SortIcon colKey="type" />
              </th>
              <th 
                onClick={() => handleSort('price')}
                className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors select-none"
                title="Click para ordenar por Precio"
                aria-label="Ordenar por Precio"
              >
                Precio <SortIcon colKey="price" />
              </th>
              <th 
                onClick={() => handleSort('stock')}
                className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors select-none"
                title="Click para ordenar por Cantidad en Stock"
                aria-label="Ordenar por Cantidad en Stock"
              >
                Stock <SortIcon colKey="stock" />
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {processedProducts.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500">
                        No hay productos que coincidan con el filtro.
                    </td>
                </tr>
            ) : (
                processedProducts.map((product) => {
                    const stock = getProductStock(product.code);
                    const isDeleting = isAnimatingOut === product.code;

                    return (
                        <tr 
                            key={product.code} 
                            className={`
                                hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all duration-500 ease-in-out
                                ${isDeleting ? 'opacity-0 bg-red-50 dark:bg-red-900/10 transform translate-x-12' : 'opacity-100 translate-x-0'}
                            `}
                        >
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300 font-medium">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">{product.size || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${product.type === 'Buzos' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
                                {product.type}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-emerald-600 dark:text-emerald-400 font-bold text-right tabular-nums">
                           ${(product.price || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-right text-gray-700 dark:text-slate-200 tabular-nums">
                             <span 
                                className={stock <= product.minQuantity ? 'text-red-500 dark:text-red-400 flex justify-end items-center cursor-help' : 'text-gray-700 dark:text-slate-200 cursor-help'}
                                title={`Stock mínimo requerido: ${product.minQuantity}`}
                             >
                                {stock <= product.minQuantity && <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>}
                                {stock}
                             </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           {/* Trash Icon Desktop with Animation */}
                           <button 
                             onClick={() => setProductToDelete(product.code)}
                             className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 group"
                             title="Eliminar este producto permanentemente"
                             aria-label="Eliminar producto"
                           >
                             <Trash2 className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
                           </button>
                        </td>
                        </tr>
                    );
                })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmationModal 
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar Producto"
        description={
            <div>
                <p>¿Estás seguro de que deseas eliminar permanentemente <strong>{getProductToDeleteName()}</strong>?</p>
                <p className="mt-2 text-xs text-red-500">Esta acción no se puede deshacer y podría afectar el historial si el producto tiene movimientos.</p>
            </div>
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default Inventory;
