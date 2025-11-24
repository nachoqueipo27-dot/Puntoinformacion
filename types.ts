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
  fullName: string;
  email: string;
  phone: string;
  pending: PendingStatus;
}

export interface ChildPresentation {
  id: string;
  motherName: string;
  fatherName: string;
  email: string;
  phone: string;
  pending: PendingStatus;
}

export type ViewState = 
  | 'DASHBOARD' 
  | 'NEW_PRODUCT' 
  | 'MOVEMENTS' 
  | 'INVENTORY' 
  | 'BAPTISMS' 
  | 'PRESENTATIONS' 
  | 'SEARCH';