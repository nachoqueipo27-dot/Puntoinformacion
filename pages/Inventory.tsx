import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { ProductType } from '../types';
import { ArrowUpDown, Filter, ArrowUp, ArrowDown, Download, Layers, Box } from 'lucide-react';

type SortKey = 'code' | 'name' | 'type' | 'size' | 'price' | 'creationDate' | 'stock';
type SortDirection = 'asc' | 'desc';

const Inventory: React.FC = () => {
  const { products, getProductStock } = useStore();
  
  // State for filtering and sorting
  const [filterType, setFilterType] = useState<ProductType | 'ALL'>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'creationDate',
    direction: 'desc'
  });

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
    const headers = ['Código', 'Producto', 'Talle', 'Tipo', 'Precio', 'Stock Actual', 'Stock Mínimo'];
    
    const csvContent = [
      headers.join(','),
      ...processedProducts.map(p => {
        const stock = getProductStock(p.code);
        // Escape quotes in name
        const name = p.name ? `"${p.name.replace(/"/g, '""')}"` : '';
        return [
          p.code,
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
        <h2 className="text-2xl font-bold text-gray-800">Inventario</h2>
        
        {/* Controls Container */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            
            {/* Left Side: Filter Only */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                {/* Filter Dropdown */}
                <div className="w-full sm:w-auto">
                     <label className="hidden md:block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Filtrar</label>
                     <label className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Filtrar por Tipo</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="w-4 h-4 text-gray-400" />
                        </div>
                        <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as ProductType | 'ALL')}
                            className="w-full pl-10 appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-blue-500 text-sm font-medium cursor-pointer"
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
                className="w-full md:w-auto flex items-center justify-center bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm active:scale-95"
            >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
            </button>
        </div>
      </div>

      {/* Mobile Card View (Visible only on small screens) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
         {processedProducts.length === 0 ? (
             <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                <Box className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No se encontraron productos.</p>
             </div>
         ) : (
            processedProducts.map((product) => {
                const stock = getProductStock(product.code);
                const isLowStock = stock <= product.minQuantity;

                return (
                    <div key={product.code} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                        {/* Header: Name and Price */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="pr-4">
                                <h3 className="font-bold text-gray-800 text-lg leading-tight">{product.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                        {product.code}
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium flex items-center">
                                        <Layers className="w-3 h-3 mr-1" />
                                        Talle {product.size}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-emerald-600 font-bold text-lg flex items-center">
                                    <span className="text-xs mr-0.5">$</span>
                                    {(product.price || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Footer: Type and Stock */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                product.type === 'Buzos' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                                {product.type}
                            </span>

                            <div className="flex items-center">
                                <span className="text-xs text-gray-400 mr-2 uppercase font-bold tracking-wider">Stock</span>
                                <span className={`flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                                    isLowStock 
                                    ? 'bg-red-50 text-red-600 border border-red-100' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {isLowStock && <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />}
                                    {stock}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })
         )}
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th 
                onClick={() => handleSort('code')}
                className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
              >
                Código <SortIcon colKey="code" />
              </th>
              <th 
                onClick={() => handleSort('name')}
                className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
              >
                Producto <SortIcon colKey="name" />
              </th>
              <th 
                onClick={() => handleSort('size')}
                className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
              >
                Talle <SortIcon colKey="size" />
              </th>
              <th 
                onClick={() => handleSort('type')}
                className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
              >
                Tipo <SortIcon colKey="type" />
              </th>
              <th 
                onClick={() => handleSort('price')}
                className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right cursor-pointer hover:bg-gray-100 transition-colors select-none"
              >
                Precio <SortIcon colKey="price" />
              </th>
              <th 
                onClick={() => handleSort('stock')}
                className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right cursor-pointer hover:bg-gray-100 transition-colors select-none"
              >
                Stock <SortIcon colKey="stock" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {processedProducts.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                        No hay productos que coincidan con el filtro.
                    </td>
                </tr>
            ) : (
                processedProducts.map((product) => {
                    const stock = getProductStock(product.code);
                    return (
                        <tr key={product.code} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.code}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{product.size || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${product.type === 'Buzos' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                                {product.type}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-emerald-600 font-bold text-right tabular-nums">
                           ${(product.price || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-right text-gray-700 tabular-nums">
                             <span className={stock <= product.minQuantity ? 'text-red-500 flex justify-end items-center' : 'text-gray-700'}>
                                {stock <= product.minQuantity && <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>}
                                {stock}
                             </span>
                        </td>
                        </tr>
                    );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;