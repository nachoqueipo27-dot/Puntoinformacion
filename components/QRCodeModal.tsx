
import React, { useMemo } from 'react';
import { X } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: string;
  eventName: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, link, eventName }) => {
  // Memoize QR URL generation to prevent recalculations on re-renders
  const qrUrl = useMemo(() => {
    if (!link) return '';
    const encodedLink = encodeURIComponent(link);
    // Using high error correction (ECC) usually makes QRs denser, 
    // but here we keep standard settings optimized for screen reading.
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedLink}&bgcolor=ffffff`;
  }, [link]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
       <div 
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm relative z-10 p-6 flex flex-col items-center animate-in fade-in zoom-in duration-200">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Cerrar ventana"
        >
            <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 text-center">{eventName}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 text-center break-all max-w-full px-2">{link}</p>
        
        <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100 flex items-center justify-center min-h-[200px]">
            {qrUrl ? (
                <img 
                    src={qrUrl} 
                    alt={`QR Code para ${eventName}`} 
                    className="w-48 h-48 object-contain" 
                    loading="lazy"
                />
            ) : (
                <div className="w-48 h-48 bg-gray-100 animate-pulse rounded-lg"></div>
            )}
        </div>

        <button
            onClick={onClose}
            className="mt-6 px-6 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors w-full"
        >
            Cerrar
        </button>
      </div>
    </div>
  );
};

export default QRCodeModal;
