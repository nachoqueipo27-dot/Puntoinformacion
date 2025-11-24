import React, { useState } from 'react';
import { useStore } from '../store';
import { MovementType, ProductType, Product } from '../types';
import { Search as SearchIcon, AlertTriangle, TrendingUp, PackagePlus, BarChart3, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProductWithStock extends Product {
  currentStock: number;
}

const Search: React.FC = () => {
  const { products, getProductStock, movements } = useStore();
  
  // Search State
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [searchResults, setSearchResults] = useState<ProductWithStock[] | null>(null);

  // Analysis State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analysisType, setAnalysisType] = useState<'SALES' | 'INCOME'>('SALES');
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [sizeChartData, setSizeChartData] = useState<any[]>([]);
  const [totalInPeriod, setTotalInPeriod] = useState<number | null>(null);

  const handleSearch = () => {
    // Filtrar productos basados en los selectores
    const results = products.filter(p => {
        const matchType = selectedType ? p.type === selectedType : true;
        const matchSize = selectedSize ? p.size === selectedSize : true;
        return matchType && matchSize;
    }).map(p => ({
        ...p,
        currentStock: getProductStock(p.code)
    }));

    if (results.length > 0) {
        setSearchResults(results);
    } else {
        setSearchResults([]);
    }
  };

  const handleClear = () => {
      setSelectedType('');
      setSelectedSize('');
      setSearchResults(null);
  };

  const handleAnalysis = () => {
    if (!startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Determine movement type to filter
    const targetType = analysisType === 'SALES' ? MovementType.VENTA : MovementType.INGRESO;

    const relevantMovements = movements.filter(m => {
      const mDate = new Date(m.date);
      return m.type === targetType && mDate >= start && mDate <= end;
    });

    const total = relevantMovements.reduce((acc, m) => acc + m.quantity, 0);
    setTotalInPeriod(total);

    // 1. Data for Chart by Date
    const groupedByDate: Record<string, number> = {};
    relevantMovements.forEach(m => {
        groupedByDate[m.date] = (groupedByDate[m.date] || 0) + m.quantity;
    });

    const dailyData = Object.keys(groupedByDate).map(date => ({
        date,
        cantidad: groupedByDate[date]
    })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setChartData(dailyData);

    // 2. Data for Chart by Size
    const groupedBySize: Record<string, number> = {};
    // Initialize keys 1-10 for cleaner chart
    Array.from({length: 10}, (_, i) => (i + 1).toString()).forEach(k => groupedBySize[k] = 0);

    relevantMovements.forEach(m => {
        // Find product to get the size
        const product = products.find(p => p.code === m.code);
        if (product && product.size) {
            groupedBySize[product.size] = (groupedBySize[product.size] || 0) + m.quantity;
        }
    });

    const sizeData = Object.keys(groupedBySize).map(size => ({
        size: `Talle ${size}`,
        cantidad: groupedBySize[size]
    }));

    setSizeChartData(sizeData);
  };

  const isSales = analysisType === 'SALES';
  const themeColor = isSales ? '#6366f1' : '#10b981'; // Indigo vs Emerald
  const themeClass = isSales ? 'text-indigo-600' : 'text-emerald-600';
  const buttonClass = isSales ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700';

  const sizes = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

  return (
    <div className="space-y-12 max-w-5xl">
      
      {/* Search Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <SearchIcon className="w-6 h-6 mr-2 text-blue-500"/>
                Consultar Stock
            </h2>
            {searchResults !== null && (
                <button 
                    onClick={handleClear}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                    Limpiar filtros
                </button>
            )}
        </div>
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select 
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer transition-all hover:border-blue-300"
                    >
                        <option value="">Seleccionar Categoría</option>
                        <option value={ProductType.REMERA}>Remeras</option>
                        <option value={ProductType.BUZO}>Buzos</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Talle</label>
                    <select 
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer transition-all hover:border-blue-300"
                    >
                        <option value="">Seleccionar Talle</option>
                        {sizes.map(s => (
                            <option key={s} value={s}>Talle {s}</option>
                        ))}
                    </select>
                </div>

                <button 
                    onClick={handleSearch}
                    disabled={!selectedType && !selectedSize}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors h-[48px] flex items-center justify-center shadow-sm"
                >
                    <Filter className="w-4 h-4 mr-2" />
                    Filtrar Productos
                </button>
            </div>
        </div>

        {searchResults && (
            <div className="mt-8 animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Resultados encontrados: {searchResults.length}
                </h3>
                
                {searchResults.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-200">
                        <PackagePlus className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No hay productos que coincidan con estos filtros.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.map((product) => (
                            <div key={product.code} className={`p-5 rounded-xl border transition-all hover:shadow-md ${product.currentStock <= product.minQuantity ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${product.type === ProductType.REMERA ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                            {product.type}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-gray-400 font-mono">{product.code}</span>
                                    </div>
                                </div>
                                
                                <h4 className="font-bold text-gray-800 text-lg mb-1">{product.name}</h4>
                                <div className="flex items-center text-sm text-gray-500 mb-4">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">Talle {product.size}</span>
                                </div>

                                <div className="pt-3 border-t border-gray-100/50 flex justify-between items-end">
                                    <div>
                                        {product.currentStock <= product.minQuantity && (
                                            <div className="flex items-center text-red-500 text-xs font-bold">
                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                Stock Bajo
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xs text-gray-400 uppercase">Stock</span>
                                        <span className={`text-2xl font-bold ${product.currentStock <= product.minQuantity ? 'text-red-600' : 'text-gray-800'}`}>
                                            {product.currentStock}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </section>

      <div className="border-t border-gray-200"></div>

      {/* Analysis Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            {isSales ? <TrendingUp className="w-6 h-6 mr-2 text-indigo-500"/> : <PackagePlus className="w-6 h-6 mr-2 text-emerald-500"/>}
            Análisis de Movimientos
        </h2>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Reporte</label>
                    <select
                        value={analysisType}
                        onChange={(e) => setAnalysisType(e.target.value as 'SALES' | 'INCOME')}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                    >
                        <option value="SALES">Ventas (Salidas)</option>
                        <option value="INCOME">Ingresos (Entradas)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button 
                    onClick={handleAnalysis}
                    className={`${buttonClass} text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md`}
                >
                    Analizar
                </button>
            </div>

            {totalInPeriod !== null && (
                <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-100 mb-8 animate-fade-in">
                    <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">
                        {isSales ? 'Total productos vendidos' : 'Total productos ingresados'}
                    </p>
                    <p className={`text-4xl font-bold ${themeClass}`}>{totalInPeriod}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {chartData.length > 0 && (
                    <div className="h-64 w-full">
                        <h4 className="text-sm font-medium text-gray-500 mb-4 text-center">Evolución diaria</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} tickLine={false} axisLine={false} />
                                <YAxis tick={{fontSize: 12, fill: '#6b7280'}} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                                    cursor={{fill: '#f3f4f6'}}
                                />
                                <Bar dataKey="cantidad" fill={themeColor} radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {sizeChartData.length > 0 && (
                     <div className="h-64 w-full">
                        <h4 className="text-sm font-medium text-gray-500 mb-4 text-center">Distribución por Talle</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sizeChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="size" tick={{fontSize: 10, fill: '#6b7280'}} tickLine={false} axisLine={false} interval={0}/>
                                <YAxis tick={{fontSize: 12, fill: '#6b7280'}} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                                    cursor={{fill: '#f3f4f6'}}
                                />
                                <Bar dataKey="cantidad" fill={isSales ? '#818cf8' : '#34d399'} radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
            
            {chartData.length === 0 && totalInPeriod !== null && (
                 <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No se encontraron movimientos de {isSales ? 'venta' : 'ingreso'} en el periodo seleccionado.</p>
                 </div>
            )}
        </div>
      </section>
    </div>
  );
};

export default Search;