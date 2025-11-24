import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product, Movement, Baptism, ChildPresentation, MovementType, PendingStatus } from './types';
import { dbAPI } from './db';

interface AppContextType {
  products: Product[];
  movements: Movement[];
  baptisms: Baptism[];
  presentations: ChildPresentation[];
  isLoading: boolean;
  addProduct: (product: Product) => void;
  addMovement: (movement: Movement) => void;
  addBaptism: (baptism: Baptism) => void;
  addPresentation: (presentation: ChildPresentation) => void;
  updateBaptismStatus: (id: string, status: PendingStatus) => void;
  updatePresentationStatus: (id: string, status: PendingStatus) => void;
  getProductStock: (code: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Canal de comunicación para sincronizar pestañas (Mobile vs Desktop views)
const syncChannel = new BroadcastChannel('origen_app_sync');

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [baptisms, setBaptisms] = useState<Baptism[]>([]);
  const [presentations, setPresentations] = useState<ChildPresentation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Función centralizada para recargar datos desde la DB
  const refreshData = useCallback(async () => {
    try {
      const [
        loadedProducts,
        loadedMovements,
        loadedBaptisms,
        loadedPresentations
      ] = await Promise.all([
        dbAPI.getAllProducts(),
        dbAPI.getAllMovements(),
        dbAPI.getAllBaptisms(),
        dbAPI.getAllPresentations()
      ]);

      setProducts(loadedProducts);
      setMovements(loadedMovements);
      setBaptisms(loadedBaptisms);
      setPresentations(loadedPresentations);
    } catch (error) {
      console.error("Error cargando la base de datos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Inicialización y suscripción a eventos de sincronización
  useEffect(() => {
    refreshData();

    // Escuchar mensajes de otras pestañas/ventanas
    const handleSyncMessage = (event: MessageEvent) => {
      if (event.data === 'DATA_UPDATED') {
        console.log("Sincronizando datos desde otra instancia...");
        refreshData();
      }
    };

    syncChannel.onmessage = handleSyncMessage;

    return () => {
      syncChannel.onmessage = null;
    };
  }, [refreshData]);

  // Helper para notificar a otras instancias
  const notifySync = () => {
    syncChannel.postMessage('DATA_UPDATED');
  };

  const addProduct = async (product: Product) => {
    await dbAPI.addProduct(product);
    setProducts(prev => [...prev, product]);
    notifySync();
  };

  const addMovement = async (movement: Movement) => {
    await dbAPI.addMovement(movement);
    setMovements(prev => [...prev, movement]);
    notifySync();
  };

  const addBaptism = async (baptism: Baptism) => {
    await dbAPI.addBaptism(baptism);
    setBaptisms(prev => [...prev, baptism]);
    notifySync();
  };

  const addPresentation = async (presentation: ChildPresentation) => {
    await dbAPI.addPresentation(presentation);
    setPresentations(prev => [...prev, presentation]);
    notifySync();
  };

  const updateBaptismStatus = async (id: string, status: PendingStatus) => {
    const baptism = baptisms.find(b => b.id === id);
    if (baptism) {
      const updatedBaptism = { ...baptism, pending: status };
      await dbAPI.updateBaptism(updatedBaptism);
      setBaptisms(prev => prev.map(b => b.id === id ? updatedBaptism : b));
      notifySync();
    }
  };

  const updatePresentationStatus = async (id: string, status: PendingStatus) => {
    const presentation = presentations.find(p => p.id === id);
    if (presentation) {
      const updatedPresentation = { ...presentation, pending: status };
      await dbAPI.updatePresentation(updatedPresentation);
      setPresentations(prev => prev.map(p => p.id === id ? updatedPresentation : p));
      notifySync();
    }
  };

  const getProductStock = (code: string) => {
    const productMovements = movements.filter(m => m.code === code);
    const incoming = productMovements
      .filter(m => m.type === MovementType.INGRESO)
      .reduce((acc, curr) => acc + curr.quantity, 0);
    const outgoing = productMovements
      .filter(m => m.type === MovementType.VENTA)
      .reduce((acc, curr) => acc + curr.quantity, 0);
    return incoming - outgoing;
  };

  return (
    <AppContext.Provider value={{
      products,
      movements,
      baptisms,
      presentations,
      isLoading,
      addProduct,
      addMovement,
      addBaptism,
      addPresentation,
      updateBaptismStatus,
      updatePresentationStatus,
      getProductStock
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useStore must be used within AppProvider");
  return context;
};