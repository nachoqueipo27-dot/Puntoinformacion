import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Product, Movement, Baptism, ChildPresentation } from './types';

interface OrigenDB extends DBSchema {
  products: {
    key: string;
    value: Product;
    indexes: { 'by-type': string };
  };
  movements: {
    key: string;
    value: Movement;
    indexes: { 'by-code': string; 'by-date': string };
  };
  baptisms: {
    key: string;
    value: Baptism;
    indexes: { 'by-pending': string };
  };
  presentations: {
    key: string;
    value: ChildPresentation;
    indexes: { 'by-pending': string };
  };
}

const DB_NAME = 'OrigenDB';
const DB_VERSION = 1;

// Inicialización de la base de datos y creación de tablas (Object Stores)
export const initDB = async (): Promise<IDBPDatabase<OrigenDB>> => {
  return openDB<OrigenDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Tabla Productos
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'code' });
        productStore.createIndex('by-type', 'type');
      }

      // Tabla Movimientos
      if (!db.objectStoreNames.contains('movements')) {
        const movementStore = db.createObjectStore('movements', { keyPath: 'id' });
        movementStore.createIndex('by-code', 'code');
        movementStore.createIndex('by-date', 'date');
      }

      // Tabla Bautismos
      if (!db.objectStoreNames.contains('baptisms')) {
        const baptismStore = db.createObjectStore('baptisms', { keyPath: 'id' });
        baptismStore.createIndex('by-pending', 'pending');
      }

      // Tabla Presentaciones
      if (!db.objectStoreNames.contains('presentations')) {
        const presentationStore = db.createObjectStore('presentations', { keyPath: 'id' });
        presentationStore.createIndex('by-pending', 'pending');
      }
    },
  });
};

// --- Helpers para operaciones CRUD ---

export const dbAPI = {
  // Products
  async getAllProducts() {
    const db = await initDB();
    return db.getAll('products');
  },
  async addProduct(product: Product) {
    const db = await initDB();
    return db.put('products', product);
  },

  // Movements
  async getAllMovements() {
    const db = await initDB();
    return db.getAll('movements');
  },
  async addMovement(movement: Movement) {
    const db = await initDB();
    return db.add('movements', movement);
  },

  // Baptisms
  async getAllBaptisms() {
    const db = await initDB();
    return db.getAll('baptisms');
  },
  async addBaptism(baptism: Baptism) {
    const db = await initDB();
    return db.add('baptisms', baptism);
  },
  async updateBaptism(baptism: Baptism) {
    const db = await initDB();
    return db.put('baptisms', baptism);
  },

  // Presentations
  async getAllPresentations() {
    const db = await initDB();
    return db.getAll('presentations');
  },
  async addPresentation(presentation: ChildPresentation) {
    const db = await initDB();
    return db.add('presentations', presentation);
  },
  async updatePresentation(presentation: ChildPresentation) {
    const db = await initDB();
    return db.put('presentations', presentation);
  }
};
