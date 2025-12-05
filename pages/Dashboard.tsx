
import React, { useMemo } from 'react';
import { useStore } from '../store';
import { ProductType, PendingStatus } from '../types';
import { AlertTriangle, CheckCircle2, Tag, Shirt, Box, Droplets, Baby, CalendarDays, Check, BarChart3, User, Clock } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

const StatCard: React.FC<{ title: string; value: number | string; colorClass: string; bgIconClass: string; icon: React.ReactNode }> = ({ title, value, colorClass, bgIconClass, icon }) => (
  <div className="group bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-900 dark:border-slate-700 flex flex-col justify-between h-40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden">
    <div className="flex justify-between items-start z-10">
        <div>
            <h3 className="text-slate-500 dark:text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">{title}</h3>
            <span className={`text-4xl font-bold ${colorClass}`}>{value}</span>
        </div>
        <div className={`p-3 rounded-2xl ${bgIconClass} transition-transform group-hover:scale-110 border border-slate-900/10 dark:border-transparent`}>
            {icon}
        </div>
    </div>
    
    {/* Decorative background shape */}
    <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700/30 dark:to-slate-600/30 opacity-50 z-0"></div>
  </div>
);

const Dashboard: React.FC = () => {
  const { products, getProductStock, baptisms, presentations, updatePresentationStatus, updateBaptismStatus, theme, user } = useStore();

  // Stats Logic
  const totalRemeras = useMemo(() => {
    return products
      .filter(p => p.type === ProductType.REMERA)
      .reduce((acc, p) => acc + getProductStock(p.code), 0);
  }, [products, getProductStock]);

  const totalBuzos = useMemo(() => {
    return products
      .filter(p => p.type === ProductType.BUZO)
      .reduce((acc, p) => acc + getProductStock(p.code), 0);
  }, [products, getProductStock]);

  // Lists of Pending Items
  const pendingPresentationsList = useMemo(() => {
    return presentations.filter(p => p.pending === PendingStatus.SI);
  }, [presentations]);

  const pendingBaptismsList = useMemo(() => {
    return baptisms.filter(b => b.pending === PendingStatus.SI);
  }, [baptisms]);

  // Logic: Low Stock
  const lowStockItems = useMemo(() => {
    return products.filter(p => {
      const currentStock = getProductStock(p.code);
      return currentStock <= p.minQuantity;
    }).map(p => ({
      ...p,
      currentStock: getProductStock(p.code)
    }));
  }, [products, getProductStock]);

  // Logic: Today's Scheduled Presentations (Pending and Date <= Today)
  const todaysPresentations = useMemo(() => {
      const today = new Date().toISOString().split('T')[0];
      return presentations.filter(p => 
          p.pending === PendingStatus.SI && 
          p.scheduledDate && 
          p.scheduledDate <= today
      );
  }, [presentations]);

  // Simplified Price Logic: Get unique price per type
  const pricesByType = useMemo(() => {
    const types = [ProductType.REMERA, ProductType.BUZO];
    return types.map(t => {
        // Find the first product of this type to get the price
        const product = products.find(p => p.type === t);
        return {
            type: t,
            price: product ? product.price : 0,
            hasProduct: !!product
        };
    });
  }, [products]);

  // Data for Bar Chart (Sizes 1-10 Breakdown)
  const stockBySizeData = useMemo(() => {
      const sizes = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
      
      return sizes.map(size => {
          // Calculate stock for Remeras of this size
          const remeraStock = products
            .filter(p => p.type === ProductType.REMERA && p.size === size)
            .reduce((acc, p) => acc + getProductStock(p.code), 0);

          // Calculate stock for Buzos of this size
          const buzoStock = products
            .filter(p => p.type === ProductType.BUZO && p.size === size)
            .reduce((acc, p) => acc + getProductStock(p.code), 0);

          return {
              name: `T${size}`,
              remeras: remeraStock,
              buzos: buzoStock
          };
      });
  }, [products, getProductStock]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Hola, Punto de Información</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Resumen general de actividad e inventario.</p>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 font-bold bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-900 dark:border-slate-700 shadow-sm">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* --- AGENDA NOTIFICATIONS SECTION --- */}
      {todaysPresentations.length > 0 && (
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-300 dark:border-violet-800 rounded-3xl p-6 animate-fade-in-up">
              <div className="flex items-center mb-4">
                  <div className="bg-violet-100 dark:bg-violet-900/40 p-2 rounded-full mr-3 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-700">
                      <CalendarDays className="w-5 h-5" />
                  </div>
                  <h3 className="text-violet-900 dark:text-violet-100 font-bold text-lg">Agenda del Día: Presentaciones</h3>
              </div>
              <p className="text-sm text-violet-700 dark:text-violet-300 mb-4 font-medium">
                  Hay {todaysPresentations.length} presentación{todaysPresentations.length > 1 ? 'es' : ''} programada{todaysPresentations.length > 1 ? 's' : ''} para hoy o días anteriores pendientes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {todaysPresentations.map(p => (
                      <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-900 dark:border-slate-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                              <p className="font-bold text-slate-800 dark:text-white text-lg">{p.childName}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Prog: {new Date(p.scheduledDate!).toLocaleDateString('es-ES')}</p>
                          </div>
                          <button 
                              onClick={() => updatePresentationStatus(p.id, PendingStatus.NO)}
                              className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm border border-slate-900"
                              title="Confirmar que se realizó"
                          >
                              <Check className="w-4 h-4" />
                              Marcar Realizado
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Stock Notifications Section */}
      {lowStockItems.length > 0 ? (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-300 dark:border-red-900/30 rounded-3xl p-6 animate-pulse-slow">
          <div className="flex items-center mb-4">
            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full mr-3 border border-red-200 dark:border-red-800">
                <AlertTriangle className="text-red-500 dark:text-red-400 w-5 h-5" />
            </div>
            <h3 className="text-red-800 dark:text-red-200 font-bold text-lg">Alertas de Stock Bajo</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockItems.map(item => (
              <div key={item.code} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-900 dark:border-red-900/30 flex justify-between items-center group hover:border-red-400 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                     {/* Product Type */}
                     <span className={`text-sm font-bold ${item.type === 'Buzos' ? 'text-indigo-600 dark:text-indigo-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {item.type}
                     </span>
                  </div>
                  {/* Specific Size */}
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center">
                     <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">
                        Talle {item.size}
                     </span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-xl font-bold text-red-500 dark:text-red-400">{item.currentStock}</span>
                  <span className="text-[10px] text-red-400 font-bold uppercase bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full border border-red-100 dark:border-red-900/20">Mín: {item.minQuantity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
         <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-300 dark:border-emerald-900/30 rounded-3xl p-5 flex items-center shadow-sm">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-full mr-3 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
            </div>
            <span className="text-emerald-800 dark:text-emerald-200 font-bold">Todo el inventario se encuentra con stock saludable.</span>
         </div>
      )}

      {/* Main Stats Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`}>
        <StatCard 
          title="Stock Remeras" 
          value={totalRemeras} 
          colorClass="text-blue-600 dark:text-blue-400" 
          bgIconClass="bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400"
          icon={<Shirt className="w-6 h-6" />}
        />
        <StatCard 
          title="Stock Buzos" 
          value={totalBuzos} 
          colorClass="text-indigo-600 dark:text-indigo-400" 
          bgIconClass="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400"
          icon={<Box className="w-6 h-6" />}
        />
        
        {/* Visible for ADMIN and MODERATOR (anyone with dashboard access) */}
        <StatCard 
            title="Bautismos Pend." 
            value={pendingBaptismsList.length} 
            colorClass="text-cyan-600 dark:text-cyan-400" 
            bgIconClass="bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500 dark:text-cyan-400"
            icon={<Droplets className="w-6 h-6" />}
        />
        <StatCard 
            title="Niños Pend." 
            value={pendingPresentationsList.length} 
            colorClass="text-amber-500 dark:text-amber-400" 
            bgIconClass="bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400"
            icon={<Baby className="w-6 h-6" />}
        />
      </div>

      {/* PENDING REQUESTS SECTION (Visible to everyone) */}
      {(pendingBaptismsList.length > 0 || pendingPresentationsList.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Pending Baptisms List */}
            {pendingBaptismsList.length > 0 && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-900 dark:border-slate-700 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-800 dark:text-white font-bold text-lg flex items-center">
                            <Droplets className="w-5 h-5 mr-2 text-cyan-500" />
                            Bautismos Pendientes
                        </h3>
                        <span className="text-xs font-bold bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 px-2 py-1 rounded-full">
                            {pendingBaptismsList.length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar space-y-3">
                        {pendingBaptismsList.map(b => (
                            <div key={b.id} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-600 flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                                        {(b.fullName || b.firstName || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{b.fullName || `${b.firstName || ''} ${b.lastName || ''}`}</p>
                                        <p className="text-[10px] text-gray-400 flex items-center">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Reg: {new Date(b.createdAt!).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => updateBaptismStatus(b.id, PendingStatus.NO)}
                                    className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Marcar como Realizado"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pending Presentations List */}
            {pendingPresentationsList.length > 0 && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-900 dark:border-slate-700 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-800 dark:text-white font-bold text-lg flex items-center">
                            <Baby className="w-5 h-5 mr-2 text-amber-500" />
                            Presentaciones Pendientes
                        </h3>
                        <span className="text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full">
                            {pendingPresentationsList.length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar space-y-3">
                        {pendingPresentationsList.map(p => (
                            <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-600 flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs">
                                        {p.childName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{p.childName}</p>
                                        {p.scheduledDate ? (
                                            <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium flex items-center">
                                                <CalendarDays className="w-3 h-3 mr-1" />
                                                {new Date(p.scheduledDate).toLocaleDateString()}
                                            </p>
                                        ) : (
                                            <p className="text-[10px] text-gray-400 flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Sin fecha prog.
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => updatePresentationStatus(p.id, PendingStatus.NO)}
                                    className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Marcar como Realizado"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          
          {/* Chart Section: Distribution by Size & Type - ONLY FOR ADMIN */}
          {user?.role === 'ADMIN' && (
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-900 dark:border-slate-700 flex flex-col justify-center transition-colors">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-slate-800 dark:text-white font-bold text-lg flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-slate-500" />
                        Distribución de Stock por Talle
                    </h3>
                </div>
                
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={stockBySizeData}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                            <XAxis 
                                dataKey="name" 
                                tick={{fontSize: 12, fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 'bold'}} 
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis 
                                tick={{fontSize: 12, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} 
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip 
                                cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}
                                contentStyle={{
                                    borderRadius: '12px', 
                                    border: '1px solid #e2e8f0', 
                                    boxShape: '0 4px 12px rgba(0,0,0,0.1)', 
                                    backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', 
                                    color: theme === 'dark' ? '#fff' : '#000'
                                }}
                            />
                            <Legend wrapperStyle={{paddingTop: '20px'}} />
                            <Bar dataKey="remeras" name="Remeras" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            <Bar dataKey="buzos" name="Buzos" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
              </div>
          )}

          {/* Product Prices Table - Expands to full width if not Admin (because Chart is hidden) */}
          <div className={`${user?.role === 'ADMIN' ? 'lg:col-span-1' : 'lg:col-span-3'} bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-900 dark:border-slate-700 flex flex-col justify-center transition-colors`}>
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-slate-800 dark:text-white font-bold text-xl flex items-center">
                 <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2.5 rounded-xl mr-4 border border-emerald-200 dark:border-emerald-800">
                    <Tag className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                 </div>
                 Precios
               </h3>
               <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 uppercase tracking-wide">Vigente</span>
            </div>
            
            <div className="overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-2 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Producto</th>
                    <th className="px-2 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {pricesByType.map((item) => (
                    <tr key={item.type} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors group">
                      <td className="py-6 pr-2">
                         <div className="flex items-center">
                            <span className={`p-2 rounded-lg mr-3 border ${item.type === 'Buzos' ? 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800' : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'}`}>
                                {item.type === 'Buzos' ? <Box className="w-5 h-5" /> : <Shirt className="w-5 h-5" />}
                            </span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.type}</span>
                         </div>
                      </td>
                      <td className="py-6 pl-2 text-right">
                        {item.hasProduct ? (
                             <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                ${(item.price || 0).toLocaleString()}
                             </span>
                        ) : (
                            <span className="text-xs text-slate-400 italic font-medium">Sin datos</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
