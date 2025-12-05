
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Product, Movement, Baptism, ChildPresentation, MovementType, PendingStatus, User, AppEvent, ProductType, AppSettings, ModuleConfig, Loan } from './types';
import { dbAPI } from './db';

interface AppContextType {
  products: Product[];
  movements: Movement[];
  baptisms: Baptism[];
  presentations: ChildPresentation[];
  loans: Loan[];
  events: AppEvent[];
  settings: AppSettings;
  isLoading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  addProduct: (product: Product) => Promise<void>;
  removeProduct: (code: string) => Promise<void>;
  updateGlobalPrice: (type: ProductType, price: number) => Promise<void>;
  addMovement: (movement: Movement) => Promise<void>;
  addBaptism: (baptism: Baptism) => Promise<void>;
  editBaptism: (baptism: Baptism) => Promise<void>;
  removeBaptism: (id: string) => Promise<void>;
  addPresentation: (presentation: ChildPresentation) => Promise<void>;
  editPresentation: (presentation: ChildPresentation) => Promise<void>;
  removePresentation: (id: string) => Promise<void>;
  addLoan: (loan: Loan) => Promise<void>;
  updateLoanStatus: (id: string, status: PendingStatus) => Promise<void>;
  removeLoan: (id: string) => Promise<void>;
  addEvent: (event: AppEvent) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  updateBaptismStatus: (id: string, status: PendingStatus) => Promise<void>;
  updatePresentationStatus: (id: string, status: PendingStatus) => Promise<void>;
  getProductStock: (code: string) => number;
  
  // Settings & Real-time
  updateSettings: (settings: AppSettings) => void; 
  settingsSaveStatus: 'idle' | 'saving' | 'saved' | 'error';

  // Auth
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  authError: string | null;
  checkUserExists: (username: string) => Promise<boolean>;
  validateUser: (username: string, password: string) => Promise<boolean>;
  
  // Database Error State
  dbConnectionError: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Canal de comunicación para sincronizar pestañas
let syncChannel: BroadcastChannel | null = null;
try {
  syncChannel = new BroadcastChannel('origen_app_sync');
} catch (e) {
  console.warn("BroadcastChannel not supported in this environment");
}

// Default settings with RICH configuration for modules
const DEFAULT_SETTINGS: AppSettings = {
  appName: 'Origen Iglesia',
  appSubtitle: 'Punto de Información',
  primaryColor: '#2563eb', // Blue-600 default
  logoUrl: '',
  inventoryAlertThreshold: 5,
  enabledModules: {
    inventory: { enabled: true, label: 'Inventario', subLabel: 'Catálogo', color: 'blue' },
    movements: { enabled: true, label: 'Movimientos', subLabel: 'Historial', color: 'indigo' },
    search: { enabled: true, label: 'Buscar / Análisis', subLabel: 'Consultas', color: 'violet' },
    events: { enabled: true, label: 'Eventos', subLabel: 'Gestión QR', color: 'pink' },
    baptisms: { enabled: true, label: 'Bautismos', subLabel: 'Registro', color: 'cyan' },
    presentations: { enabled: true, label: 'Niños', subLabel: 'Presentación', color: 'amber' },
    loans: { enabled: true, label: 'Préstamos', subLabel: 'Remeras y Buzos', color: 'orange' }
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [baptisms, setBaptisms] = useState<Baptism[]>([]);
  const [presentations, setPresentations] = useState<ChildPresentation[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [dbConnectionError, setDbConnectionError] = useState(false);

  // Settings Save Status
  const [settingsSaveStatus, setSettingsSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const settingsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Apply theme class to HTML element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Update Document Title based on Settings
  useEffect(() => {
    document.title = `${settings.appName} - ${settings.appSubtitle}`;
  }, [settings]);

  // Check LocalStorage for Session
  useEffect(() => {
    const sessionUser = localStorage.getItem('session_user');
    if (sessionUser) {
      try {
        setUser(JSON.parse(sessionUser));
      } catch (e) {
        localStorage.removeItem('session_user');
      }
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Función centralizada para recargar datos desde la DB
  const refreshData = useCallback(async () => {
    try {
      setDbConnectionError(false);
      const [
        loadedProducts,
        loadedMovements,
        loadedBaptisms,
        loadedPresentations,
        loadedLoans,
        loadedEvents,
        loadedSettings
      ] = await Promise.all([
        dbAPI.getAllProducts(),
        dbAPI.getAllMovements(),
        dbAPI.getAllBaptisms(),
        dbAPI.getAllPresentations(),
        dbAPI.getAllLoans(),
        dbAPI.getAllEvents(),
        dbAPI.getSettings()
      ]);

      setProducts(loadedProducts);
      setMovements(loadedMovements);
      setBaptisms(loadedBaptisms);
      setPresentations(loadedPresentations);
      setLoans(loadedLoans);
      setEvents(loadedEvents);
      
      // Settings Migration Logic
      if (loadedSettings) {
         const mergedModules = { ...DEFAULT_SETTINGS.enabledModules, ...loadedSettings.enabledModules };
         setSettings({ 
             ...DEFAULT_SETTINGS, 
             ...loadedSettings,
             enabledModules: mergedModules
         });
      }
    } catch (error: any) {
      console.error("Error cargando la base de datos:", error);
      // Si el error es de tabla no encontrada (PostgREST code PGRST205), marcamos error crítico
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          setDbConnectionError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Inicialización, Seed Admin/Users y suscripción a eventos
  useEffect(() => {
    const seedAdmin = async () => {
        try {
            await dbAPI.ensureFixedAdmin({
                username: 'Punto',
                password: 'puntoinformacion32',
                role: 'ADMIN',
                fullName: 'Punto de Información',
                createdAt: new Date().toISOString()
            });
        } catch (e) {
            console.error("Failed to seed admin", e);
        }
    };

    const seedInfoUser = async () => {
        try {
             await dbAPI.ensureFixedAdmin({
                username: 'Info',
                password: 'info32',
                role: 'MODERATOR',
                fullName: 'Info (Acceso Limitado)',
                createdAt: new Date().toISOString()
            });
        } catch (e) {
            console.error("Failed to seed info user", e);
        }
    };

    const init = async () => {
        await seedAdmin();
        await seedInfoUser();
        await refreshData();
    };
    init();

    const handleSyncMessage = (event: MessageEvent) => {
      if (event.data === 'DATA_UPDATED') {
        refreshData();
      }
    };

    if (syncChannel) {
      syncChannel.onmessage = handleSyncMessage;
    }

    return () => {
      if (syncChannel) {
        syncChannel.onmessage = null;
      }
    };
  }, [refreshData]);

  // Auth Methods
  const login = async (username: string, pass: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const foundUser = await dbAPI.getUser(username);
      if (foundUser && foundUser.password === pass) {
        setUser(foundUser);
        localStorage.setItem('session_user', JSON.stringify(foundUser));
        return true;
      } else {
        setAuthError('Usuario o contraseña incorrectos.');
        return false;
      }
    } catch (e) {
      setAuthError('Error al iniciar sesión.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('session_user');
  };

  const checkUserExists = async (username: string): Promise<boolean> => {
    return await dbAPI.checkUserExists(username);
  };

  const validateUser = async (username: string, pass: string): Promise<boolean> => {
    try {
      const foundUser = await dbAPI.getUser(username);
      return !!(foundUser && foundUser.password === pass);
    } catch (e) {
      return false;
    }
  };

  const notifySync = () => {
    if (syncChannel) {
      syncChannel.postMessage('DATA_UPDATED');
    }
  };

  // --- CRUD Operations ---

  const addProduct = async (product: Product) => {
    await dbAPI.addProduct(product);
    setProducts(prev => [...prev, product]);
    notifySync();
  };

  const removeProduct = async (code: string) => {
    await dbAPI.deleteProduct(code);
    setProducts(prev => prev.filter(p => p.code !== code));
    notifySync();
  };

  const updateGlobalPrice = async (type: ProductType, price: number) => {
    await dbAPI.updateProductPricesByType(type, price);
    setProducts(prev => prev.map(p => p.type === type ? { ...p, price } : p));
    notifySync();
  };

  const addMovement = async (movement: Movement) => {
    await dbAPI.addMovement(movement);
    setMovements(prev => [...prev, movement]);
    notifySync();
  };

  const addBaptism = async (baptism: Baptism) => {
    const newBaptism = {
      ...baptism,
      createdAt: baptism.createdAt || new Date().toISOString()
    };
    await dbAPI.addBaptism(newBaptism);
    setBaptisms(prev => [...prev, newBaptism]);
    notifySync();
  };

  const editBaptism = async (baptism: Baptism) => {
    await dbAPI.updateBaptism(baptism);
    setBaptisms(prev => prev.map(b => b.id === baptism.id ? baptism : b));
    notifySync();
  };

  const removeBaptism = async (id: string) => {
    await dbAPI.deleteBaptism(id);
    setBaptisms(prev => prev.filter(b => b.id !== id));
    notifySync();
  };

  const addPresentation = async (presentation: ChildPresentation) => {
    const newPresentation = {
      ...presentation,
      createdAt: presentation.createdAt || new Date().toISOString()
    };
    await dbAPI.addPresentation(newPresentation);
    setPresentations(prev => [...prev, newPresentation]);
    notifySync();
  };

  const editPresentation = async (presentation: ChildPresentation) => {
     await dbAPI.updatePresentation(presentation);
     setPresentations(prev => prev.map(p => p.id === presentation.id ? presentation : p));
     notifySync();
  };

  const removePresentation = async (id: string) => {
     await dbAPI.deletePresentation(id);
     setPresentations(prev => prev.filter(p => p.id !== id));
     notifySync();
  };

  // --- LOANS CRUD ---
  const addLoan = async (loan: Loan) => {
    const newLoan = {
        ...loan,
        loanDate: loan.loanDate || new Date().toISOString()
    };
    await dbAPI.addLoan(newLoan);
    setLoans(prev => [...prev, newLoan]);
    notifySync();
  };

  const updateLoanStatus = async (id: string, status: PendingStatus) => {
    const loan = loans.find(l => l.id === id);
    if (loan) {
        const returnDate = status === PendingStatus.NO ? new Date().toISOString() : undefined;
        const updatedLoan = { ...loan, status, returnDate };
        await dbAPI.updateLoan(updatedLoan);
        setLoans(prev => prev.map(l => l.id === id ? updatedLoan : l));
        notifySync();
    }
  };

  const removeLoan = async (id: string) => {
      await dbAPI.deleteLoan(id);
      setLoans(prev => prev.filter(l => l.id !== id));
      notifySync();
  };

  const addEvent = async (event: AppEvent) => {
    await dbAPI.addEvent(event);
    setEvents(prev => [...prev, event]);
    notifySync();
  };

  const removeEvent = async (id: string) => {
    await dbAPI.deleteEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
    notifySync();
  };

  // --- Real-time Settings Update (Debounced) ---
  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    setSettingsSaveStatus('saving');

    if (settingsTimeoutRef.current) {
      clearTimeout(settingsTimeoutRef.current);
    }

    settingsTimeoutRef.current = setTimeout(async () => {
      try {
        await dbAPI.saveSettings(newSettings);
        setSettingsSaveStatus('saved');
        notifySync();
        
        setTimeout(() => {
          setSettingsSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
        }, 3000);
      } catch (e) {
        console.error("Error saving settings", e);
        setSettingsSaveStatus('error');
      }
    }, 800);
  };

  const updateBaptismStatus = async (id: string, status: PendingStatus) => {
    const baptism = baptisms.find(b => b.id === id);
    if (baptism) {
      const completedAt = status === PendingStatus.NO ? new Date().toISOString() : undefined;
      const updatedBaptism = { ...baptism, pending: status, completedAt };
      await dbAPI.updateBaptism(updatedBaptism);
      setBaptisms(prev => prev.map(b => b.id === id ? updatedBaptism : b));
      notifySync();
    }
  };

  const updatePresentationStatus = async (id: string, status: PendingStatus) => {
    const presentation = presentations.find(p => p.id === id);
    if (presentation) {
      const completedAt = status === PendingStatus.NO ? new Date().toISOString() : undefined;
      const updatedPresentation = { ...presentation, pending: status, completedAt };
      await dbAPI.updatePresentation(updatedPresentation);
      setPresentations(prev => prev.map(p => p.id === id ? updatedPresentation : p));
      notifySync();
    }
  };

  const getProductStock = useCallback((code: string) => {
    const productMovements = movements.filter(m => m.code === code);
    const incoming = productMovements
      .filter(m => m.type === MovementType.INGRESO)
      .reduce((acc, curr) => acc + curr.quantity, 0);
    const outgoing = productMovements
      .filter(m => m.type === MovementType.VENTA)
      .reduce((acc, curr) => acc + curr.quantity, 0);
    return incoming - outgoing;
  }, [movements]);

  return (
    <AppContext.Provider value={{
      products,
      movements,
      baptisms,
      presentations,
      loans,
      events,
      settings,
      isLoading,
      theme,
      toggleTheme,
      addProduct,
      removeProduct,
      updateGlobalPrice,
      addMovement,
      addBaptism,
      editBaptism,
      removeBaptism,
      addPresentation,
      editPresentation,
      removePresentation,
      addLoan,
      updateLoanStatus,
      removeLoan,
      addEvent,
      removeEvent,
      updateSettings,
      settingsSaveStatus,
      updateBaptismStatus,
      updatePresentationStatus,
      getProductStock,
      user,
      login,
      logout,
      authError,
      checkUserExists,
      validateUser,
      dbConnectionError
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
