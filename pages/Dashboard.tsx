import React, { useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { ProductType, PendingStatus } from '../types';
import { AlertTriangle, CheckCircle2, Tag, Shirt, Box, Droplets, Baby } from 'lucide-react';
import * as d3 from 'd3';

const StatCard: React.FC<{ title: string; value: number | string; colorClass: string; bgIconClass: string; icon: React.ReactNode }> = ({ title, value, colorClass, bgIconClass, icon }) => (
  <div className="group bg-white p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between h-40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden">
    <div className="flex justify-between items-start z-10">
        <div>
            <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-1">{title}</h3>
            <span className={`text-4xl font-bold ${colorClass}`}>{value}</span>
        </div>
        <div className={`p-3 rounded-2xl ${bgIconClass} transition-transform group-hover:scale-110`}>
            {icon}
        </div>
    </div>
    
    {/* Decorative background shape */}
    <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 opacity-50 z-0"></div>
  </div>
);

const Dashboard: React.FC = () => {
  const { products, getProductStock, baptisms, presentations } = useStore();
  const d3Container = useRef(null);

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

  const pendingPresentations = useMemo(() => {
    return presentations.filter(p => p.pending === PendingStatus.SI).length;
  }, [presentations]);

  const pendingBaptisms = useMemo(() => {
    return baptisms.filter(b => b.pending === PendingStatus.SI).length;
  }, [baptisms]);

  // Low Stock Logic
  const lowStockItems = useMemo(() => {
    return products.filter(p => {
      const currentStock = getProductStock(p.code);
      return currentStock <= p.minQuantity;
    }).map(p => ({
      ...p,
      currentStock: getProductStock(p.code)
    }));
  }, [products, getProductStock]);

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

  // D3 Visualization (Simple Donut Chart for Stock Distribution)
  useEffect(() => {
    if (d3Container.current && (totalRemeras > 0 || totalBuzos > 0)) {
      const data = [
        { label: 'Remeras', value: totalRemeras, color: '#3b82f6' }, // blue-500
        { label: 'Buzos', value: totalBuzos, color: '#6366f1' },   // indigo-500
      ];

      const width = 200;
      const height = 200;
      const radius = Math.min(width, height) / 2;

      // Clear previous
      d3.select(d3Container.current).selectAll("*").remove();

      const svg = d3.select(d3Container.current)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

      const pie = d3.pie<any>().value(d => d.value);
      const data_ready = pie(data);

      const arc = d3.arc<any>()
        .innerRadius(radius * 0.6) // Thinner Donut
        .outerRadius(radius * 0.9)
        .cornerRadius(5);

      svg.selectAll('whatever')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => d.data.color)
        .attr("stroke", "white")
        .style("stroke-width", "4px")
        .style("opacity", 1);
        
      // Add Center Text
      svg.append("text")
         .attr("text-anchor", "middle")
         .attr("dy", "-0.2em")
         .attr("class", "text-xs font-bold fill-slate-400 uppercase tracking-widest")
         .text("Total");

       svg.append("text")
         .attr("text-anchor", "middle")
         .attr("dy", "1em")
         .attr("class", "text-2xl font-bold fill-slate-700")
         .text(totalRemeras + totalBuzos);

    } else if (d3Container.current) {
        d3.select(d3Container.current).selectAll("*").remove();
    }
  }, [totalRemeras, totalBuzos]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h2>
            <p className="text-slate-500 mt-1">Resumen general de actividad e inventario.</p>
        </div>
        <div className="text-sm text-slate-400 font-medium bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Notifications Section */}
      {lowStockItems.length > 0 ? (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 animate-pulse-slow">
          <div className="flex items-center mb-4">
            <div className="bg-red-100 p-2 rounded-full mr-3">
                <AlertTriangle className="text-red-500 w-5 h-5" />
            </div>
            <h3 className="text-red-800 font-bold text-lg">Alertas de Stock Bajo</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockItems.map(item => (
              <div key={item.code} className="bg-white p-4 rounded-2xl shadow-sm border border-red-100 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-400">Código: {item.code}</p>
                </div>
                <div className="text-right">
                  <span className="block text-xl font-bold text-red-500">{item.currentStock}</span>
                  <span className="text-[10px] text-red-400 font-medium uppercase bg-red-50 px-2 py-0.5 rounded-full">Mín: {item.minQuantity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
         <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 flex items-center shadow-sm">
            <div className="bg-emerald-100 p-2 rounded-full mr-3">
                <CheckCircle2 className="text-emerald-600 w-5 h-5" />
            </div>
            <span className="text-emerald-800 font-medium">Todo el inventario se encuentra con stock saludable.</span>
         </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Stock Remeras" 
          value={totalRemeras} 
          colorClass="text-blue-600" 
          bgIconClass="bg-blue-50 text-blue-500"
          icon={<Shirt className="w-6 h-6" />}
        />
        <StatCard 
          title="Stock Buzos" 
          value={totalBuzos} 
          colorClass="text-indigo-600" 
          bgIconClass="bg-indigo-50 text-indigo-500"
          icon={<Box className="w-6 h-6" />}
        />
        <StatCard 
          title="Bautismos Pend." 
          value={pendingBaptisms} 
          colorClass="text-cyan-600" 
          bgIconClass="bg-cyan-50 text-cyan-500"
          icon={<Droplets className="w-6 h-6" />}
        />
        <StatCard 
          title="Niños Pend." 
          value={pendingPresentations} 
          colorClass="text-amber-500" 
          bgIconClass="bg-amber-50 text-amber-500"
          icon={<Baby className="w-6 h-6" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Product Prices Table - Simplified and Expanded */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-slate-800 font-bold text-xl flex items-center">
                 <div className="bg-emerald-100 p-2.5 rounded-xl mr-4">
                    <Tag className="w-6 h-6 text-emerald-600" />
                 </div>
                 Lista de Precios
               </h3>
               <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Vigente</span>
            </div>
            
            <div className="overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Tipo de Producto</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-400 uppercase tracking-wider text-right">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pricesByType.map((item) => (
                    <tr key={item.type} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-8">
                         <div className="flex items-center">
                            <span className={`p-2 rounded-lg mr-4 ${item.type === ProductType.BUZO ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                                {item.type === ProductType.BUZO ? <Box className="w-6 h-6" /> : <Shirt className="w-6 h-6" />}
                            </span>
                            <span className="text-xl font-bold text-slate-700">{item.type}</span>
                         </div>
                      </td>
                      <td className="px-6 py-8 text-right">
                        {item.hasProduct ? (
                             <span className="text-3xl font-black text-slate-800 tracking-tight">
                                ${(item.price || 0).toLocaleString()}
                             </span>
                        ) : (
                            <span className="text-sm text-slate-400 italic">Sin datos</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock Distribution */}
          <div className="bg-white p-8 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 flex flex-col items-center justify-center">
            <h3 className="text-slate-800 font-bold text-lg mb-6 w-full text-left">Distribución</h3>
            
            <div ref={d3Container} className="mb-6 scale-110"></div>
            
            <div className="w-full space-y-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 shadow-sm shadow-blue-300"></div>
                        <span className="text-sm font-semibold text-slate-600">Remeras</span>
                    </div>
                    <span className="text-sm font-bold text-slate-800">{totalRemeras}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full mr-3 shadow-sm shadow-indigo-300"></div>
                        <span className="text-sm font-semibold text-slate-600">Buzos</span>
                    </div>
                    <span className="text-sm font-bold text-slate-800">{totalBuzos}</span>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;