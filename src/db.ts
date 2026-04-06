import Dexie, { type Table } from 'dexie';

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'plant_manager' | 'storekeeper' | 'accountant' | 'procurement' | 'sales' | 'view_only';
  password?: string;
  name?: string;
  email?: string;
  phone?: string;
  picture?: string;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  location?: string;
  supplier?: string;
  totalReceived: number;
  totalIssued: number;
  type?: 'raw_material' | 'finished_product' | 'stored_item';
  price?: number;
  description?: string;
  createdAt: number | string;
}

export interface Movement {
  id: string;
  itemId: string;
  itemName: string;
  type: 'receive' | 'issue' | 'transfer';
  quantity: number;
  date: number | string;
  user: string;
  reference?: string;
  supplier?: string;
  invoiceNumber?: string;
  truckNumber?: string;
  invoiceFile?: string;
  invoiceFileType?: string;
  invoiceFileName?: string;
  department?: string;
  receivedBy?: string;
  reason?: string;
  location?: string;
  createdAt?: number;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  totalSupplied: number;
  transactions: number;
  lastActivity: number;
}

export interface ProductionPlan {
  id: string;
  date: string;
  product: string;
  target: number;
  actual: number;
  manpower: number;
  status: 'planned' | 'in-progress' | 'completed';
  shift: 'morning' | 'evening' | 'night';
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string; // 'group' for group messages
  content: string;
  timestamp: number;
  read: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'inventory' | 'production' | 'user' | 'system' | 'message' | 'sales';
  timestamp: number;
  read: boolean;
}

export interface SalesRequest {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  driverName: string;
  truckNumber: string;
  customer?: string;
  destination?: string;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: number;
  reason?: string;
}

export interface InventoryApproval {
  id: string;
  mode: 'new_item' | 'in_stock';
  itemId: string;
  itemName: string;
  quantity: number;
  unit?: string;
  supplier?: string;
  invoiceNumber?: string;
  invoiceFile?: string;
  invoiceFileType?: string;
  location?: string;
  truckNumber?: string;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: number;
  note?: string;
}

export class MyDatabase extends Dexie {
  items!: Table<Item>;
  movements!: Table<Movement>;
  suppliers!: Table<Supplier>;
  productionPlans!: Table<ProductionPlan>;
  messages!: Table<Message>;
  notifications!: Table<Notification>;
  users!: Table<User>;
  categories!: Table<{ id: string; name: string }>;
  departments!: Table<{ id: string; name: string; createdAt: number }>;
  trucks!: Table<{ id: string; number: string; description?: string; status: 'active' | 'inactive'; createdAt: number }>;
  locations!: Table<{ id: string; name: string; description?: string; createdAt: number }>;
  salesRequests!: Table<SalesRequest>;
  inventoryApprovals!: Table<InventoryApproval>;

  constructor() {
    super('InventoryDB');
    this.version(1).stores({
      items: 'id, name, category, supplier, location',
      categories: 'id, name',
      movements: 'id, itemId, type, date, supplier, invoiceNumber',
      suppliers: 'id, name, email, status',
      productionPlans: 'id, date, product, status',
      messages: 'id, senderId, receiverId, timestamp',
      notifications: 'id, type, timestamp, read',
      users: 'id, username, role'
    });

    // Add departments table for centralized department management.
    this.version(2).stores({
      items: 'id, name, category, supplier, location',
      categories: 'id, name',
      movements: 'id, itemId, type, date, supplier, invoiceNumber',
      suppliers: 'id, name, email, status',
      productionPlans: 'id, date, product, status',
      messages: 'id, senderId, receiverId, timestamp',
      notifications: 'id, type, timestamp, read',
      users: 'id, username, role',
      departments: 'id, name, createdAt',
    });

    // Add trucks and locations for persistent logistics and warehouse management.
    this.version(3).stores({
      items: 'id, name, category, supplier, location',
      categories: 'id, name',
      movements: 'id, itemId, type, date, supplier, invoiceNumber, truckNumber, location',
      suppliers: 'id, name, email, status',
      productionPlans: 'id, date, product, status',
      messages: 'id, senderId, receiverId, timestamp',
      notifications: 'id, type, timestamp, read',
      users: 'id, username, role',
      departments: 'id, name, createdAt',
      trucks: 'id, number, status, createdAt',
      locations: 'id, name, createdAt',
    });

    this.version(4).stores({
      items: 'id, name, category, supplier, location',
      categories: 'id, name',
      movements: 'id, itemId, type, date, supplier, invoiceNumber, truckNumber, location',
      suppliers: 'id, name, email, status',
      productionPlans: 'id, date, product, status',
      messages: 'id, senderId, receiverId, timestamp',
      notifications: 'id, type, timestamp, read',
      users: 'id, username, role',
      departments: 'id, name, createdAt',
      trucks: 'id, number, status, createdAt',
      locations: 'id, name, createdAt',
      salesRequests: 'id, itemId, status, createdAt, createdBy'
    });

    this.version(5).stores({
      items: 'id, name, category, supplier, location',
      categories: 'id, name',
      movements: 'id, itemId, type, date, supplier, invoiceNumber, truckNumber, location',
      suppliers: 'id, name, email, status',
      productionPlans: 'id, date, product, status',
      messages: 'id, senderId, receiverId, timestamp',
      notifications: 'id, type, timestamp, read',
      users: 'id, username, role',
      departments: 'id, name, createdAt',
      trucks: 'id, number, status, createdAt',
      locations: 'id, name, createdAt',
      salesRequests: 'id, itemId, status, createdAt, createdBy',
      inventoryApprovals: 'id, itemId, status, createdAt, createdBy, mode'
    });
  }
}

export const db = new MyDatabase();
