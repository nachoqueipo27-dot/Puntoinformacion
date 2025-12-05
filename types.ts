
export enum ProductType {
  BUZO = 'Buzos',
  REMERA = 'Remeras',
}

export interface Product {
  code: string;
  name: string;
  type: ProductType;
  size: string;
  minQuantity: number;
  price: number;
  creationDate: string;
}

export enum MovementType {
  INGRESO = 'Ingreso',
  VENTA = 'Venta',
}

export interface Movement {
  id: string;
  code: string;
  date: string;
  type: MovementType;
  quantity: number;
}

export enum PendingStatus {
  SI = 'Si',
  NO = 'No',
}

export interface Baptism {
  id: string;
  firstName?: string; // Nuevo campo opcional
  lastName?: string;  // Nuevo campo opcional
  fullName: string;   // Mantenemos por compatibilidad y display
  email: string;
  phone: string;
  pending: PendingStatus;
  createdAt?: string; 
  completedAt?: string | null; // Allow null to clear date
}

export interface ChildPresentation {
  id: string;
  childName: string;
  motherName: string;
  fatherName: string;
  email: string;
  phone: string;
  pending: PendingStatus;
  scheduledDate?: string; 
  createdAt?: string; 
  completedAt?: string; 
}

export interface Loan {
  id: string;
  borrowerName: string;
  productType: ProductType;
  size: string;
  loanDate: string; 
  returnDate?: string; 
  status: PendingStatus; 
}

export interface AppEvent {
  id: string;
  name: string;
  link: string;
  createdAt: string;
}

export type UserRole = 'ADMIN' | 'USER' | 'MODERATOR';

export interface User {
  username: string;
  password: string; 
  role: UserRole;
  fullName: string;
  createdAt: string;
}

export interface ModuleConfig {
  enabled: boolean;
  label: string; 
  subLabel: string; 
  color: string; 
}

export interface AppSettings {
  appName: string;
  appSubtitle: string;
  primaryColor: string;
  logoUrl?: string; 
  inventoryAlertThreshold: number; 
  enabledModules: {
    inventory: ModuleConfig;
    movements: ModuleConfig;
    search: ModuleConfig;
    events: ModuleConfig;
    baptisms: ModuleConfig;
    presentations: ModuleConfig;
    loans: ModuleConfig; 
  };
}

export type ViewState = 
  | 'PANEL' 
  | 'NEW_PRODUCT' 
  | 'MOVEMENTS' 
  | 'INVENTORY' 
  | 'BAPTISMS' 
  | 'PRESENTATIONS' 
  | 'LOANS'
  | 'EVENTS'
  | 'SEARCH'
  | 'ADMIN_PANEL';
