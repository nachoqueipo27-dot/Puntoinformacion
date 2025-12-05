
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { MovementType, ProductType } from '../types';
import { Search as SearchIcon, AlertTriangle, TrendingUp, PackagePlus, BarChart3, Printer, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Search: React.FC = () => {
  const { products, getProductStock, movements, theme, user } = useStore();
  
  // Search State
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Analysis State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analysisType, setAnalysisType] = useState<'SALES' | 'INCOME'>('SALES');
  const [isAnalysisActive, setIsAnalysisActive] = useState(false);

  // Memoized Search Results
  const searchResults = useMemo(() => {
    if (!isSearchActive) return null;
    
    return products.filter(p => {
        const matchType = selectedType ? p.type === selectedType : true;
        const matchSize = selectedSize ? p.size === selectedSize : true;
        return matchType && matchSize;
    }).map(p => ({
        ...p,
        currentStock: getProductStock(p.code)
    }));
  }, [products, selectedType, selectedSize, isSearchActive, getProductStock]);

  const handleSearch = () => {
    setIsSearchActive(true);
  };

  const handleClear = () => {
      setSelectedType('');
      setSelectedSize('');
      setIsSearchActive(false);
  };

  const handleAnalysis = () => {
    if (startDate && endDate) {
        setIsAnalysisActive(true);
    }
  };

  // Memoized Analysis Data
  const analysisData = useMemo(() => {
    if (!isAnalysisActive || !startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    // Ajustar fin del día para incluir la fecha seleccionada completa
    end.setHours(23, 59, 59, 999);
    
    // Determine movement type to filter
    const targetType = analysisType === 'SALES' ? MovementType.VENTA : MovementType.INGRESO;

    const relevantMovements = movements.filter(m => {
      const mDate = new Date(m.date);
      // Comparación simple de fechas (ignorando horas para inicio, usando fin de día para fin)
      return m.type === targetType && mDate >= start && mDate <= end;
    });

    const total = relevantMovements.reduce((acc, m) => acc + m.quantity, 0);

    // 1. Data for Chart by Date (Split by Remeras/Buzos)
    const groupedByDate: Record<string, { remeras: number; buzos: number }> = {};
    
    relevantMovements.forEach(m => {
        // Inicializar fecha
        if (!groupedByDate[m.date]) {
            groupedByDate[m.date] = { remeras: 0, buzos: 0 };
        }

        // Determinar tipo (Mirando el producto o parseando el código para robustez)
        const product = products.find(p => p.code === m.code);
        const isRemera = product ? product.type === ProductType.REMERA : m.code.includes('REM');
        
        if (isRemera) {
            groupedByDate[m.date].remeras += m.quantity;
        } else {
            groupedByDate[m.date].buzos += m.quantity;
        }
    });

    const chartData = Object.keys(groupedByDate).map(date => ({
        date,
        remeras: groupedByDate[date].remeras,
        buzos: groupedByDate[date].buzos,
        total: groupedByDate[date].remeras + groupedByDate[date].buzos
    })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 2. Data for Chart by Size (Split by Remeras/Buzos)
    const groupedBySize: Record<string, { remeras: number; buzos: number }> = {};
    // Initialize keys 1-10 for cleaner chart
    Array.from({length: 10}, (_, i) => (i + 1).toString()).forEach(k => {
        groupedBySize[k] = { remeras: 0, buzos: 0 };
    });

    relevantMovements.forEach(m => {
        const product = products.find(p => p.code === m.code);
        // Intentar obtener talle del producto o parsear código (ej: REM-5)
        let size = '1';
        let isRemera = true;

        if (product) {
            size = product.size;
            isRemera = product.type === ProductType.REMERA;
        } else {
            const parts = m.code.split('-');
            if (parts.length > 1) size = parts[1];
            isRemera = m.code.includes('REM');
        }

        if (groupedBySize[size]) {
            if (isRemera) groupedBySize[size].remeras += m.quantity;
            else groupedBySize[size].buzos += m.quantity;
        }
    });

    const sizeChartData = Object.keys(groupedBySize).map(size => ({
        size: `Talle ${size}`,
        remeras: groupedBySize[size].remeras,
        buzos: groupedBySize[size].buzos
    }));

    return { total, chartData, sizeChartData };
  }, [movements, products, startDate, endDate, analysisType, isAnalysisActive]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportData = () => {
    if (!startDate || !endDate) return;

    // Recalcular los movimientos detallados para el reporte
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const targetType = analysisType === 'SALES' ? MovementType.VENTA : MovementType.INGRESO;

    const filteredMovements = movements.filter(m => {
        const mDate = new Date(m.date);
        return m.type === targetType && mDate >= start && mDate <= end;
    });

    // 1. Generate Detail Rows
    const detailRows = filteredMovements.map(m => {
        const product = products.find(p => p.code === m.code);
        const name = product ? `"${product.name}"` : (m.code.includes('REM') ? 'Remera' : 'Buzo');
        const size = product ? product.size : (m.code.split('-')[1] || '-');
        // Ensure standard date format YYYY-MM-DD
        return [m.date, m.type, name, size, m.quantity].join(',');
    });

    // 2. Generate Summary Rows (Date | Total) for Excel Charting
    const summaryMap: Record<string, number> = {};
    filteredMovements.forEach(m => {
        summaryMap[m.date] = (summaryMap[m.date] || 0) + m.quantity;
    });
    
    // Sort by date
    const sortedDates = Object.keys(summaryMap).sort();
    const summaryRows = sortedDates.map(date => [date, summaryMap[date]].join(','));

    // 3. Assemble CSV content
    const BOM = "\uFEFF"; 
    const detailHeader = ['Fecha', 'Tipo Movimiento', 'Producto', 'Talle', 'Cantidad'].join(',');
    const summaryHeader = ['Fecha (Resumen)', 'Total Cantidad'].join(',');

    const csvContent = BOM + [
      detailHeader,
      ...detailRows,
      '', // Empty Line
      '', // Empty Line
      'RESUMEN PARA GRÁFICOS (DÍAS vs CANTIDAD)',
      summaryHeader,
      ...summaryRows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_${analysisType.toLowerCase()}_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isSales = analysisType === 'SALES';
  // Colores para el contexto general (Barra de título, Total)
  const themeClass = isSales ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400';
  const buttonClass = isSales ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700';

  // Colores específicos para productos (Consistentes con Dashboard)
  const colorRemera = '#3b82f6'; // blue-500
  const colorBuzo = '#6366f1';   // indigo-500

  const sizes = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

  return (
    <div className="space-y-12 max-w-5xl">
      
      {/* Search Section */}
      <section className="no-print">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                <SearchIcon className="w-6 h-6 mr-2 text-blue-500"/>
                Consultar Stock
            </h2>
            {isSearchActive && (
                <button 
                    onClick={handleClear}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
                    title="Limpiar filtros de búsqueda"
                >
                    Limpiar filtros
                </button>
            )}
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-700 transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                    <select 
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white cursor-pointer transition-all hover:border-blue-300"
                        title="Selecciona una categoría de producto"
                    >
                        <option value="">Seleccionar Categoría</option>
                        <option value={ProductType.REMERA}>Remeras</option>
                        <option value={ProductType.BUZO}>Buzos</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Talle</label>
                    <select 
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white cursor-pointer transition-all hover:border-blue-300"
                        title="Selecciona un talle"
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
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors h-[48px] flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-none"
                    title="Buscar productos en el inventario"
                >
                    <SearchIcon className="w-5 h-5 mr-2" />
                    Buscar
                </button>
            </div>
        </div>

        {searchResults && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {searchResults.length === 0 ? (
                    <div className="col-span-full text-center py-10 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <PackagePlus className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">No se encontraron productos con esos criterios.</p>
                    </div>
                ) : (
                    searchResults.map(p => (
                        <div key={p.code} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-700 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-md">
                             <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{p.name}</h3>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${p.type === 'Buzos' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                                        {p.type}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Talle: {p.size}</p>
                             </div>
                             
                             <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                                <span className="text-xs text-gray-400 uppercase font-semibold">Stock Actual</span>
                                <span className={`text-2xl font-bold ${p.currentStock <= p.minQuantity ? 'text-red-500 dark:text-red-400' : 'text-gray-800 dark:text-white'}`}>
                                    {p.currentStock}
                                </span>
                             </div>
                             {p.currentStock <= p.minQuantity && (
                                <div className="mt-2 text-xs text-red-500 flex items-center justify-end">
                                    <AlertTriangle className="w-3 h-3 mr-1" /> Stock Bajo
                                </div>
                             )}
                        </div>
                    ))
                )}
            </div>
        )}
      </section>

      <hr className="border-slate-300 dark:border-slate-700 no-print" />

      {/* Analysis Section - Only visible to ADMIN */}
      {user?.role === 'ADMIN' && (
      <section>
        <div className="flex items-center justify-between mb-6 no-print">
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                <BarChart3 className="w-6 h-6 mr-2 text-indigo-500"/>
                Análisis de {isSales ? 'Ventas' : 'Ingresos'}
            </h2>
            
            <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex text-sm">
                <button 
                    onClick={() => { setAnalysisType('SALES'); setIsAnalysisActive(false); }}
                    className={`px-3 py-1.5 rounded-md font-medium transition-all ${isSales ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    title="Analizar historial de Ventas"
                >
                    Ventas
                </button>
                <button 
                    onClick={() => { setAnalysisType('INCOME'); setIsAnalysisActive(false); }}
                    className={`px-3 py-1.5 rounded-md font-medium transition-all ${!isSales ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    title="Analizar historial de Ingresos"
                >
                    Ingresos
                </button>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-700 transition-colors no-print">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Desde</label>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white dark:[color-scheme:dark]"
                        title="Selecciona la fecha de inicio para el análisis"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Hasta</label>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white dark:[color-scheme:dark]"
                        title="Selecciona la fecha de fin para el análisis"
                    />
                </div>
                <button 
                    onClick={handleAnalysis}
                    disabled={!startDate || !endDate}
                    className={`${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors h-[48px] flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none`}
                    title="Generar gráficos y estadísticas"
                >
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Analizar
                </button>
             </div>
        </div>

        {analysisData && (
            <div className="mt-8 space-y-8 animate-fade-in print-break-inside">
                
                {/* Header for Print/Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-300 dark:border-slate-700 pb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                            Reporte de {isSales ? 'Ventas' : 'Ingresos'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Período: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                        </p>
                    </div>
                    
                    <div className="flex gap-2 no-print">
                         <button 
                            onClick={handleExportData}
                            className="flex items-center px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors border border-green-200"
                            title="Descargar detalle y resumen para gráficos en Excel"
                         >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Exportar Datos (CSV)
                         </button>
                         <button 
                            onClick={handlePrint}
                            className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"
                            title="Imprimir visualización con gráficos"
                         >
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimir Reporte
                         </button>
                    </div>
                </div>

                {/* Summary Card */}
                <div className={`bg-gradient-to-r ${isSales ? 'from-indigo-800 to-indigo-900' : 'from-emerald-800 to-emerald-900'} dark:from-slate-700 dark:to-slate-800 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between`}>
                    <div>
                        <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">Total {isSales ? 'Vendido' : 'Ingresado'}</p>
                        <h3 className="text-4xl font-bold">{analysisData.total} <span className="text-lg font-normal text-white/60">unidades</span></h3>
                    </div>
                    <div className={`p-4 rounded-full bg-white/10`}>
                        <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chart 1: Over Time (Side-by-side) */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-700 transition-colors break-inside-avoid">
                        <h4 className={`text-lg font-bold ${themeClass} mb-6`}>Evolución por Fecha</h4>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analysisData.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                                    <XAxis 
                                        dataKey="date" 
                                        tick={{fontSize: 12, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} 
                                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                    />
                                    <YAxis tick={{fontSize: 12, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', color: theme === 'dark' ? '#fff' : '#000'}}
                                        cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}
                                    />
                                    <Legend />
                                    <Bar dataKey="remeras" name="Remeras" fill={colorRemera} radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="buzos" name="Buzos" fill={colorBuzo} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart 2: By Size (Side-by-side vertical) */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-700 transition-colors break-inside-avoid">
                        <h4 className={`text-lg font-bold ${themeClass} mb-6`}>Distribución por Talle</h4>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analysisData.sizeChartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                                    <XAxis type="number" tick={{fontSize: 12, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} />
                                    <YAxis 
                                        dataKey="size" 
                                        type="category" 
                                        tick={{fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} 
                                        width={60}
                                    />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', color: theme === 'dark' ? '#fff' : '#000'}}
                                        cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}
                                    />
                                    <Legend />
                                    <Bar dataKey="remeras" name="Remeras" fill={colorRemera} barSize={20} radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="buzos" name="Buzos" fill={colorBuzo} radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </section>
      )}
    </div>
  );
};

export default Search;
