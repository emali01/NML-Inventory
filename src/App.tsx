import React, { useState, useRef, useEffect, useMemo } from 'react';
import { create } from 'zustand';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import {
  Package,
  Warehouse,
  FlaskConical,
  ArrowLeftRight,
  MessageSquare,
  Calendar,
  Users,
  LogOut,
  Plus,
  Search,
  Bell,
  ChevronDown,
  Upload,
  Trash2,
  Edit,
  Send,
  Check,
  AlertCircle,
  TrendingUp,
  Box,
  ClipboardList,
  DollarSign,
  Truck,
  Eye,
  X,
  User,
  Settings,
  FileText,
  Download,
} from 'lucide-react';
import Papa from 'papaparse';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { SupplierManagement } from './components/modules/SupplierManagement';
import NotificationsDashboard from './components/modules/NotificationsDashboard';
import brandLogo from './assets/nml-logo.svg';

const BRAND_NAME = 'NML Inventory';
const BRAND_LOGO_URL = brandLogo;
const formatCurrency = (value: number) => `Tsh ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const persistNotification = async (notification: { title: string; message: string; type: 'inventory' | 'production' | 'user' | 'system' | 'message' | 'sales' }) => {
  await db.notifications.put({
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    timestamp: Date.now(),
    read: false,
  } as any);
};

// Types
type UserRole = 'admin' | 'plant_manager' | 'storekeeper' | 'accountant' | 'procurement' | 'sales' | 'view_only';

interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  picture?: string;
}

interface Item {
  id: string;
  code: string;
  name: string;
  type: 'raw_material' | 'finished_product' | 'stored_item';
  unit: string;
  quantity: number;
  minStock: number;
  price: number;
  description?: string;
  location?: string;
  createdAt: string;
}

interface Movement {
  id: string;
  itemId: string;
  itemName: string;
  type: 'receive' | 'issue' | 'adjustment' | 'transfer' | 'created';
  quantity: number;
  destination: string;
  reference: string;
  createdAt: string;
  createdBy: string;
  user?: string;
  supplier?: string;
  invoiceNumber?: string;
  truckNumber?: string;
  invoiceFile?: string; // Base64 data
  invoiceFileType?: string; // MIME type
  receivedBy?: string;
  reason?: string;
  department?: string;
  issuedBy?: string;
  location?: string;
  fromLocation?: string;
  toLocation?: string;
  quantityAfter?: number;
  adjustedBy?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId?: string;
  groupId?: string;
  content: string;
  createdAt: string;
  read: boolean;
}

interface ProductionPlan {
  id: string;
  date: string;
  productId: string;
  productName: string;
  targetQuantity: number;
  actualQuantity: number;
  manpower: number;
  status: 'pending' | 'in_progress' | 'completed';
  createdBy: string;
}

interface Group {
  id: string;
  name: string;
  members: string[];
}

// Initial Data
const initialUsers: User[] = [
  { id: '1', username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator', email: 'admin@company.com' },
  { id: '2', username: 'manager', password: 'manager123', role: 'plant_manager', name: 'John Manager', email: 'manager@company.com' },
  { id: '3', username: 'storekeeper', password: 'store123', role: 'storekeeper', name: 'Sarah Store', email: 'store@company.com' },
  { id: '4', username: 'accountant', password: 'account123', role: 'accountant', name: 'Mike Account', email: 'account@company.com' },
  { id: '5', username: 'procurement', password: 'procure123', role: 'procurement', name: 'Lisa Procure', email: 'procure@company.com' },
  { id: '6', username: 'sales', password: 'sales123', role: 'sales', name: 'Sally Sales', email: 'sales@company.com' },
  { id: '7', username: 'viewer', password: 'view123', role: 'view_only', name: 'Tom Viewer', email: 'viewer@company.com' },
];

const initialItems: Item[] = [
  // Raw Materials (20)
  { id: 'rm1', code: 'RM001', name: 'Steel Sheet', type: 'raw_material', unit: 'pcs', quantity: 150, minStock: 50, price: 25.5, createdAt: '2024-01-01' },
  { id: 'rm2', code: 'RM002', name: 'Plastic Granules', type: 'raw_material', unit: 'kg', quantity: 500, minStock: 100, price: 5.2, createdAt: '2024-01-01' },
  { id: 'rm3', code: 'RM003', name: 'Aluminum Bar', type: 'raw_material', unit: 'pcs', quantity: 80, minStock: 30, price: 15.0, createdAt: '2024-01-01' },
  { id: 'rm4', code: 'RM004', name: 'Copper Wire', type: 'raw_material', unit: 'm', quantity: 1200, minStock: 200, price: 3.5, createdAt: '2024-01-01' },
  { id: 'rm5', code: 'RM005', name: 'Fabric Roll', type: 'raw_material', unit: 'roll', quantity: 40, minStock: 10, price: 45.0, createdAt: '2024-01-01' },
  { id: 'rm6', code: 'RM006', name: 'Glass Panel', type: 'raw_material', unit: 'pcs', quantity: 60, minStock: 15, price: 35.0, createdAt: '2024-01-01' },
  { id: 'rm7', code: 'RM007', name: 'Wood Plank', type: 'raw_material', unit: 'pcs', quantity: 250, minStock: 50, price: 12.0, createdAt: '2024-01-01' },
  { id: 'rm8', code: 'RM008', name: 'Rubber Sheet', type: 'raw_material', unit: 'pcs', quantity: 100, minStock: 20, price: 8.5, createdAt: '2024-01-01' },
  { id: 'rm9', code: 'RM009', name: 'Brass Tubing', type: 'raw_material', unit: 'm', quantity: 150, minStock: 30, price: 18.0, createdAt: '2024-01-01' },
  { id: 'rm10', code: 'RM010', name: 'Carbon Fiber', type: 'raw_material', unit: 'm', quantity: 80, minStock: 20, price: 55.0, createdAt: '2024-01-01' },
  { id: 'rm11', code: 'RM011', name: 'Chemical Resin', type: 'raw_material', unit: 'liters', quantity: 400, minStock: 100, price: 9.5, createdAt: '2024-01-01' },
  { id: 'rm12', code: 'RM012', name: 'Solder Wire', type: 'raw_material', unit: 'rolls', quantity: 30, minStock: 5, price: 25.0, createdAt: '2024-01-01' },
  { id: 'rm13', code: 'RM013', name: 'Titanium Rod', type: 'raw_material', unit: 'pcs', quantity: 20, minStock: 5, price: 150.0, createdAt: '2024-01-01' },
  { id: 'rm14', code: 'RM014', name: 'Iron Powder', type: 'raw_material', unit: 'kg', quantity: 600, minStock: 100, price: 4.0, createdAt: '2024-01-01' },
  { id: 'rm15', code: 'RM015', name: 'Zirconium Powder', type: 'raw_material', unit: 'kg', quantity: 10, minStock: 2, price: 350.0, createdAt: '2024-01-01' },
  { id: 'rm16', code: 'RM016', name: 'Clay Powder', type: 'raw_material', unit: 'kg', quantity: 1000, minStock: 200, price: 1.5, createdAt: '2024-01-01' },
  { id: 'rm17', code: 'RM017', name: 'Nickel Plate', type: 'raw_material', unit: 'pcs', quantity: 50, minStock: 10, price: 45.0, createdAt: '2024-01-01' },
  { id: 'rm18', code: 'RM018', name: 'Tin Ingot', type: 'raw_material', unit: 'kg', quantity: 200, minStock: 40, price: 22.0, createdAt: '2024-01-01' },
  { id: 'rm19', code: 'RM019', name: 'Lead Block', type: 'raw_material', unit: 'pcs', quantity: 15, minStock: 5, price: 80.0, createdAt: '2024-01-01' },
  { id: 'rm20', code: 'RM020', name: 'Silica Sand', type: 'raw_material', unit: 'kg', quantity: 2000, minStock: 500, price: 0.8, createdAt: '2024-01-01' },

  // Finished Products (20)
  { id: 'fp1', code: 'FP001', name: 'Finished Product A', type: 'finished_product', unit: 'pcs', quantity: 45, minStock: 20, price: 120.0, createdAt: '2024-01-01' },
  { id: 'fp2', code: 'FP002', name: 'Finished Product B', type: 'finished_product', unit: 'pcs', quantity: 30, minStock: 15, price: 180.0, createdAt: '2024-01-01' },
  { id: 'fp3', code: 'FP003', name: 'Steel Cabinet', type: 'finished_product', unit: 'pcs', quantity: 25, minStock: 5, price: 350.0, createdAt: '2024-01-01' },
  { id: 'fp4', code: 'FP004', name: 'Aluminum Window', type: 'finished_product', unit: 'pcs', quantity: 60, minStock: 10, price: 110.0, createdAt: '2024-01-01' },
  { id: 'fp5', code: 'FP005', name: 'Copper Coil 50m', type: 'finished_product', unit: 'pcs', quantity: 80, minStock: 20, price: 85.0, createdAt: '2024-01-01' },
  { id: 'fp6', code: 'FP006', name: 'Office Table', type: 'finished_product', unit: 'pcs', quantity: 15, minStock: 5, price: 240.0, createdAt: '2024-01-01' },
  { id: 'fp7', code: 'FP007', name: 'Ergonomic Chair', type: 'finished_product', unit: 'pcs', quantity: 40, minStock: 10, price: 150.0, createdAt: '2024-01-01' },
  { id: 'fp8', code: 'FP008', name: 'Industrial Fan', type: 'finished_product', unit: 'pcs', quantity: 12, minStock: 3, price: 420.0, createdAt: '2024-01-01' },
  { id: 'fp9', code: 'FP009', name: 'Led Streetlight', type: 'finished_product', unit: 'pcs', quantity: 100, minStock: 20, price: 65.0, createdAt: '2024-01-01' },
  { id: 'fp10', code: 'FP010', name: 'Power Inverter 1kW', type: 'finished_product', unit: 'pcs', quantity: 35, minStock: 8, price: 290.0, createdAt: '2024-01-01' },
  { id: 'fp11', code: 'FP011', name: 'Solar Panel 400W', type: 'finished_product', unit: 'pcs', quantity: 50, minStock: 15, price: 180.0, createdAt: '2024-01-01' },
  { id: 'fp12', code: 'FP012', name: 'Li-ion Battery Pack', type: 'finished_product', unit: 'pcs', quantity: 90, minStock: 25, price: 320.0, createdAt: '2024-01-01' },
  { id: 'fp13', code: 'FP013', name: 'Circuit Board v2', type: 'finished_product', unit: 'pcs', quantity: 200, minStock: 50, price: 45.0, createdAt: '2024-01-01' },
  { id: 'fp14', code: 'FP014', name: 'Water Pump 2HP', type: 'finished_product', unit: 'pcs', quantity: 18, minStock: 5, price: 520.0, createdAt: '2024-01-01' },
  { id: 'fp15', code: 'FP015', name: 'Electric Motor 5HP', type: 'finished_product', unit: 'pcs', quantity: 8, minStock: 2, price: 850.0, createdAt: '2024-01-01' },
  { id: 'fp16', code: 'FP016', name: 'Hydraulic Cylinder', type: 'finished_product', unit: 'pcs', quantity: 14, minStock: 4, price: 610.0, createdAt: '2024-01-01' },
  { id: 'fp17', code: 'FP017', name: 'Pneumatic Valve', type: 'finished_product', unit: 'pcs', quantity: 120, minStock: 30, price: 28.0, createdAt: '2024-01-01' },
  { id: 'fp18', code: 'FP018', name: 'Industrial Door', type: 'finished_product', unit: 'pcs', quantity: 5, minStock: 2, price: 1200.0, createdAt: '2024-01-01' },
  { id: 'fp19', code: 'FP019', name: 'Steel Rack System', type: 'finished_product', unit: 'pcs', quantity: 10, minStock: 3, price: 950.0, createdAt: '2024-01-01' },
  { id: 'fp20', code: 'FP020', name: 'Conveyor Belt 10m', type: 'finished_product', unit: 'pcs', quantity: 4, minStock: 1, price: 2500.0, createdAt: '2024-01-01' },

  // Stored Items (Consumables) (20)
  { id: 'si1', code: 'SI001', name: 'Packaging Box', type: 'stored_item', unit: 'pcs', quantity: 200, minStock: 100, price: 2.5, createdAt: '2024-01-01' },
  { id: 'si2', code: 'SI002', name: 'Maintenance Kit', type: 'stored_item', unit: 'set', quantity: 25, minStock: 10, price: 45.0, createdAt: '2024-01-01' },
  { id: 'si3', code: 'SI003', name: 'Safety Gloves', type: 'stored_item', unit: 'pairs', quantity: 500, minStock: 100, price: 3.0, createdAt: '2024-01-01' },
  { id: 'si4', code: 'SI004', name: 'Welding Rods', type: 'stored_item', unit: 'boxes', quantity: 80, minStock: 20, price: 18.0, createdAt: '2024-01-01' },
  { id: 'si5', code: 'SI005', name: 'Lubricant Oil', type: 'stored_item', unit: 'cans', quantity: 60, minStock: 15, price: 35.0, createdAt: '2024-01-01' },
  { id: 'si6', code: 'SI006', name: 'Cleaning Solvent', type: 'stored_item', unit: 'gallons', quantity: 40, minStock: 10, price: 22.0, createdAt: '2024-01-01' },
  { id: 'si7', code: 'SI007', name: 'Masking Tape', type: 'stored_item', unit: 'rolls', quantity: 300, minStock: 50, price: 1.5, createdAt: '2024-01-01' },
  { id: 'si8', code: 'SI008', name: 'Shrink Wrap', type: 'stored_item', unit: 'rolls', quantity: 150, minStock: 30, price: 12.0, createdAt: '2024-01-01' },
  { id: 'si9', code: 'SI009', name: 'Industrial Respirator', type: 'stored_item', unit: 'pcs', quantity: 50, minStock: 10, price: 45.0, createdAt: '2024-01-01' },
  { id: 'si10', code: 'SI010', name: 'Ear Plugs', type: 'stored_item', unit: 'box', quantity: 100, minStock: 20, price: 8.0, createdAt: '2024-01-01' },
  { id: 'si11', code: 'SI011', name: 'Safety Glasses', type: 'stored_item', unit: 'pcs', quantity: 120, minStock: 30, price: 6.5, createdAt: '2024-01-01' },
  { id: 'si12', code: 'SI012', name: 'Hard Hat', type: 'stored_item', unit: 'pcs', quantity: 80, minStock: 20, price: 14.0, createdAt: '2024-01-01' },
  { id: 'si13', code: 'SI013', name: 'Sandpaper Grit 120', type: 'stored_item', unit: 'packs', quantity: 200, minStock: 50, price: 4.5, createdAt: '2024-01-01' },
  { id: 'si14', code: 'SI014', name: 'Super Glue 50g', type: 'stored_item', unit: 'pcs', quantity: 150, minStock: 30, price: 2.8, createdAt: '2024-01-01' },
  { id: 'si15', code: 'SI015', name: 'Grinding Wheel', type: 'stored_item', unit: 'pcs', quantity: 90, minStock: 25, price: 7.5, createdAt: '2024-01-01' },
  { id: 'si16', code: 'SI016', name: 'Industrial Rag', type: 'stored_item', unit: 'bales', quantity: 10, minStock: 2, price: 30.0, createdAt: '2024-01-01' },
  { id: 'si17', code: 'SI017', name: 'First Aid Refill', type: 'stored_item', unit: 'kits', quantity: 15, minStock: 5, price: 25.0, createdAt: '2024-01-01' },
  { id: 'si18', code: 'SI018', name: 'Marking Paint', type: 'stored_item', unit: 'spray cans', quantity: 60, minStock: 15, price: 8.5, createdAt: '2024-01-01' },
  { id: 'si19', code: 'SI019', name: 'Hand Tool Set', type: 'stored_item', unit: 'sets', quantity: 20, minStock: 5, price: 85.0, createdAt: '2024-01-01' },
  { id: 'si20', code: 'SI020', name: 'Led Bulb 15W', type: 'stored_item', unit: 'pcs', quantity: 200, minStock: 50, price: 3.5, createdAt: '2024-01-01' },
];

const initialMovements: Movement[] = [
  { id: '1', itemId: '1', itemName: 'Steel Sheet', type: 'receive', quantity: 50, destination: 'Warehouse A', reference: 'PO-001', createdAt: '2024-01-15', createdBy: '2' },
  { id: '2', itemId: '4', itemName: 'Finished Product A', type: 'issue', quantity: 10, destination: 'Production Line 1', reference: 'WO-001', createdAt: '2024-01-16', createdBy: '3' },
  { id: '3', itemId: '2', itemName: 'Plastic Granules', type: 'receive', quantity: 100, destination: 'Warehouse B', reference: 'PO-002', createdAt: '2024-01-17', createdBy: '2' },
  { id: '4', itemId: '7', itemName: 'Maintenance Kit', type: 'issue', quantity: 2, destination: 'Maintenance Dept', reference: 'MR-001', createdAt: '2024-01-18', createdBy: '3' },
];

const initialMessages: Message[] = [
  { id: '1', senderId: '1', senderName: 'Administrator', receiverId: '2', content: 'Please review the production plan for next week.', createdAt: '2024-01-20 09:00', read: true },
  { id: '2', senderId: '3', senderName: 'Sarah Store', receiverId: '5', content: 'We need to order more Steel Sheets. Stock is low.', createdAt: '2024-01-20 10:30', read: false },
  { id: '3', senderId: '2', senderName: 'John Manager', groupId: '1', content: 'Team, production target for today is 50 units.', createdAt: '2024-01-20 08:00', read: false },
];

const initialGroups: Group[] = [
  { id: '1', name: 'Production Team', members: ['1', '2', '3'] },
  { id: '2', name: 'Management', members: ['1', '2'] },
];

const initialProductionPlans: ProductionPlan[] = [
  { id: '1', date: '2024-01-20', productId: '4', productName: 'Finished Product A', targetQuantity: 50, actualQuantity: 45, manpower: 12, status: 'completed', createdBy: '2' },
  { id: '2', date: '2024-01-20', productId: '5', productName: 'Finished Product B', targetQuantity: 30, actualQuantity: 28, manpower: 8, status: 'completed', createdBy: '2' },
  { id: '3', date: '2024-01-21', productId: '4', productName: 'Finished Product A', targetQuantity: 60, actualQuantity: 0, manpower: 15, status: 'pending', createdBy: '2' },
];

// Zustand Store
interface AppState {
  currentUser: User | null;
  users: User[];
  suppliers: any[];
  items: Item[];
  movements: Movement[];
  messages: Message[];
  groups: Group[];
  productionPlans: ProductionPlan[];
  activeTab: string;
  notifications: any[];
  setCurrentUser: (user: User | null) => void;
  setActiveTab: (tab: string) => void;
  addItem: (item: any) => Promise<any>;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  addMovement: (movement: any) => Promise<void>;
  addMessage: (message: Omit<Message, 'id' | 'createdAt' | 'read'>) => void;
  markMessageRead: (id: string) => void;
  addProductionPlan: (plan: any) => Promise<void>;
  updateProductionPlan: (id: string, updates: any) => Promise<void>;
  categories: string[];
  departments: string[];
  addCategory: (category: string) => void;
  deleteCategory: (category: string) => void;
  updateCategory: (oldCategory: string, newCategory: string) => Promise<void>;
  addDepartment: (department: string) => Promise<void>;
  updateDepartment: (oldDepartment: string, newDepartment: string) => Promise<void>;
  deleteDepartment: (department: string) => Promise<void>;
  bulkUploadItems: (items: any[]) => Promise<void>;
  addNotification: (notification: { type: string; title: string; message: string }) => void;
  setNotifications: (notifications: any[]) => void;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resetUserPassword: (id: string, password: string) => Promise<void>;
}

const useStore = create<AppState>((set) => ({
  currentUser: null,
  users: initialUsers,
  suppliers: [],
  items: initialItems,
  movements: initialMovements,
  messages: initialMessages,
  groups: initialGroups,
  productionPlans: initialProductionPlans,
  activeTab: 'dashboard',
  notifications: [],
  categories: ['raw_material', 'finished_product', 'stored_item'],
  departments: ['Production', 'Maintenance', 'Quality Control', 'Sales', 'Admin'],
  addCategory: async (category) => {
    const normalized = category.trim().toLowerCase();
    if (!normalized) return;

    const existsInDb = await db.categories.where('name').equalsIgnoreCase(normalized).first();
    if (!existsInDb) {
      await db.categories.add({ id: Date.now().toString(), name: normalized });
    }

    set((state) => {
      const existsInState = state.categories.some((c) => c.toLowerCase() === normalized);
      return {
        categories: existsInState ? state.categories : [...state.categories, normalized],
      };
    });
  },
  deleteCategory: async (category) => {
    const catRecords = await db.categories.where('name').equals(category).toArray();
    for (const record of catRecords) {
      await db.categories.delete(record.id);
    }
    set((state) => ({ categories: state.categories.filter(c => c !== category) }));
  },
  updateCategory: async (oldCategory, newCategory) => {
    const previous = oldCategory.trim().toLowerCase();
    const next = newCategory.trim().toLowerCase();
    if (!next || previous === next) return;

    const nextExists = await db.categories.where('name').equalsIgnoreCase(next).first();
    const oldRecords = await db.categories.where('name').equalsIgnoreCase(previous).toArray();

    if (nextExists) {
      for (const record of oldRecords) {
        await db.categories.delete(record.id);
      }
    } else {
      for (const record of oldRecords) {
        await db.categories.update(record.id, { name: next });
      }
    }

    set((state) => {
      const replaced = state.categories.map((c) => (c.toLowerCase() === previous ? next : c));
      const deduped = Array.from(new Map(replaced.map((c) => [c.toLowerCase(), c])).values());
      return { categories: deduped };
    });
  },
  addDepartment: async (department) => {
    const normalized = department.trim();
    if (!normalized) return;
    const exists = await db.departments.where('name').equalsIgnoreCase(normalized).first();
    if (!exists) {
      await db.departments.add({ id: Date.now().toString(), name: normalized, createdAt: Date.now() });
    }
    set((state) => ({
      departments: state.departments.some((d) => d.toLowerCase() === normalized.toLowerCase())
        ? state.departments
        : [...state.departments, normalized],
    }));
  },
  updateDepartment: async (oldDepartment, newDepartment) => {
    const previous = oldDepartment.trim();
    const next = newDepartment.trim();
    if (!next || previous.toLowerCase() === next.toLowerCase()) return;

    const nextExists = await db.departments.where('name').equalsIgnoreCase(next).first();
    const records = await db.departments.where('name').equalsIgnoreCase(previous).toArray();

    if (nextExists) {
      for (const record of records) {
        await db.departments.delete(record.id);
      }
    } else {
      for (const record of records) {
        await db.departments.update(record.id, { name: next });
      }
    }

    set((state) => {
      const replaced = state.departments.map((d) =>
        d.toLowerCase() === previous.toLowerCase() ? next : d
      );
      const deduped = Array.from(new Map(replaced.map((d) => [d.toLowerCase(), d])).values());
      return { departments: deduped };
    });
  },
  deleteDepartment: async (department) => {
    const records = await db.departments.where('name').equals(department).toArray();
    for (const record of records) {
      await db.departments.delete(record.id);
    }
    set((state) => ({
      departments: state.departments.filter((d) => d !== department),
    }));
  },
  setCurrentUser: (user) => set({ currentUser: user }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  addUser: async (user) => {
    const newUser: User = { ...user, id: Date.now().toString() };
    await db.users.put(newUser as any);
    set((state) => ({ users: [...state.users, newUser] }));
  },
  updateUser: async (id, updates) => {
    await db.users.update(id, updates as any);
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
      currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...updates } : state.currentUser,
    }));
  },
  deleteUser: async (id) => {
    await db.users.delete(id);
    set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
  },
  resetUserPassword: async (id, password) => {
    await db.users.update(id, { password } as any);
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, password } : u)),
      currentUser: state.currentUser?.id === id ? { ...state.currentUser, password } : state.currentUser,
    }));
  },
  addNotification: (notification) => set((state) => ({
    notifications: [{ ...notification, id: Date.now().toString(), timestamp: new Date().toISOString(), read: false }, ...state.notifications]
  })),
  setNotifications: (notifications) => set({ notifications }),
  addItem: async (item) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: Date.now(),
      category: item.category || item.type || 'raw_material',
      totalReceived: item.totalReceived || 0,
      totalIssued: item.totalIssued || 0,
    };
    await db.items.put(newItem);
    await persistNotification({
      type: 'inventory',
      title: 'New Item Added',
      message: `${newItem.name} (${newItem.code}) was added to the inventory.`,
    });
    set((state) => ({
      notifications: [{
        id: Date.now().toString() + '-notif',
        type: 'inventory',
        title: 'New Item Added',
        message: `${newItem.name} (${newItem.code}) was added to the inventory.`,
        timestamp: new Date().toISOString(),
        read: false
      }, ...state.notifications]
    }));
    return newItem;
  },
  updateItem: async (id, updates) => {
    const item = await db.items.get(id);
    if (item) {
      await db.items.update(id, updates);
    }
    await persistNotification({
      type: 'inventory',
      title: 'Item Updated',
      message: `Details for ${item?.name || 'an item'} were updated.`,
    });
    set((state) => ({
      notifications: [{
        id: Date.now().toString() + '-notif',
        type: 'inventory',
        title: 'Item Updated',
        message: `Details for ${item?.name || 'an item'} were updated.`,
        timestamp: new Date().toISOString(),
        read: false
      }, ...state.notifications]
    }));
  },
  deleteItem: async (id) => {
    const item = await db.items.get(id);
    if (item) {
      await db.items.delete(id);
    }
    await persistNotification({
      type: 'inventory',
      title: 'Item Deleted',
      message: `Item ${item?.name || 'unknown'} was removed from inventory.`,
    });
    set((state) => ({
      notifications: [{
        id: Date.now().toString() + '-notif',
        type: 'inventory',
        title: 'Item Deleted',
        message: `Item ${item?.name || 'unknown'} was removed from inventory.`,
        timestamp: new Date().toISOString(),
        read: false
      }, ...state.notifications]
    }));
  },
  addMovement: async (movement) => {
    const newMovement = { 
      ...movement, 
      id: Date.now().toString(), 
      createdAt: Date.now(),
      date: movement.date || Date.now(),
      user: movement.user || 'system',
      receivedBy: movement.receivedBy || movement.user || undefined,
      issuedBy: movement.issuedBy || (movement.type === 'issue' ? (movement.user || undefined) : undefined),
      location: movement.location || (movement.destination || undefined),
    };
    await db.movements.put(newMovement);
    
    // Update item totals
    const item = await db.items.get(movement.itemId);
    if (item) {
      if (movement.type === 'receive') {
        await db.items.update(movement.itemId, { 
          quantity: (item.quantity || 0) + movement.quantity,
          totalReceived: (item.totalReceived || 0) + movement.quantity
        });
      } else if (movement.type === 'issue') {
        await db.items.update(movement.itemId, { 
          quantity: Math.max(0, (item.quantity || 0) - movement.quantity),
          totalIssued: (item.totalIssued || 0) + movement.quantity
        });
      }
    }

    await persistNotification({
      type: movement.type === 'issue' && (movement as any).approvalStatus === 'pending' ? 'sales' : 'inventory',
      title: movement.type === 'receive' ? 'Stock Received' : movement.type === 'issue' ? 'Stock Issued' : 'Stock Movement',
      message: `${movement.quantity} units of ${movement.itemName} ${movement.type === 'receive' ? 'received from ' + (movement.supplier || 'source') : 'issued to ' + ((movement as any).department || (movement as any).destination || 'destination')} by ${(movement as any).user || 'system'}.`,
    });
    
    set((state) => ({
      notifications: [{
        id: Date.now().toString() + '-notif',
        type: 'inventory',
        title: `Stock ${movement.type === 'receive' ? 'Received' : 'Issued'}`,
        message: `${movement.quantity} units of ${movement.itemName} ${movement.type === 'receive' ? 'received from ' + (movement.supplier || 'source') : 'issued to ' + (movement.department || 'destination')}.`,
        timestamp: new Date().toISOString(),
        read: false
      }, ...state.notifications]
    }));
  },
  addMessage: async (message) => {
    const newMessage = { 
      ...message, 
      id: Date.now().toString(), 
      timestamp: Date.now(),
      receiverId: message.receiverId || 'group',
      read: false 
    };
    await db.messages.put(newMessage);
  },
  markMessageRead: (id) => set((state) => ({
    messages: state.messages.map((msg) => msg.id === id ? { ...msg, read: true } : msg),
  })),
  addProductionPlan: async (plan) => {
    const newPlan = { 
      ...plan, 
      id: Date.now().toString(), 
      actual: plan.actual || 0,
      status: plan.status || 'planned'
    };
    await db.productionPlans.put(newPlan);
  },
  updateProductionPlan: async (id, updates) => {
    await db.productionPlans.update(id, updates);
  },
  bulkUploadItems: async (items) => {
    const newItems = items.map((item) => ({ 
      ...item, 
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9), 
      createdAt: Date.now(),
      totalReceived: item.totalReceived || 0,
      totalIssued: item.totalIssued || 0
    }));
    await db.items.bulkPut(newItems);
  },
}));

const LocationSelector: React.FC<{
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}> = ({ value, onChange, required = false }) => {
  const dbLocations = useLiveQuery(() => db.locations.toArray(), []);
  const [isNew, setIsNew] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const locationOptions = useMemo(() => {
    const dbNames = (dbLocations || []).map((l) => l.name);
    return Array.from(new Set([...dbNames])).sort((a, b) => a.localeCompare(b));
  }, [dbLocations]);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '__new__') {
      setIsNew(true);
    } else {
      onChange(e.target.value);
      setIsNew(false);
    }
  };

  const handleAddNew = async () => {
    const name = newLocation.trim();
    if (!name) return;
    const exists = await db.locations.where('name').equalsIgnoreCase(name).first();
    if (!exists) {
      await db.locations.add({ id: `loc-${Date.now()}`, name, createdAt: Date.now(), description: '' } as any);
    }
    onChange(name);
    setIsNew(false);
    setNewLocation('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Location</label>
      {!isNew ? (
        <select
          value={value}
          onChange={handleSelect}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required={required}
        >
          <option value="">Select location</option>
          {locationOptions.map((location) => (
            <option key={location} value={location}>{location}</option>
          ))}
          <option value="__new__">+ Add New Location</option>
        </select>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            placeholder="Enter new warehouse location"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleAddNew}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => { setIsNew(false); setNewLocation(''); }}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// Supplier Selector Component
const SupplierSelector: React.FC<{
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}> = ({ value, onChange, required = false }) => {
  const dbSuppliers = useLiveQuery(() => db.suppliers.toArray(), []);
  const addAppNotification = useStore((state) => state.addNotification);
  const [localSuppliers, setLocalSuppliers] = useState<any[]>([]);
  const supplierOptions = useMemo(() => {
    const merged = [...localSuppliers, ...(dbSuppliers || [])];
    const unique = Array.from(new Map(merged.map((s) => [String(s.name).trim().toLowerCase(), s])).values());
    return unique.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [dbSuppliers, localSuppliers]);
  const [isNew, setIsNew] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '__new__') {
      setIsNew(true);
    } else {
      onChange(e.target.value);
      setIsNew(false);
    }
  };

  const handleAddNew = async () => {
    const name = newSupplierName.trim();
    if (!name) return;
    const supplierRecord = {
      id: `sup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      email: newSupplierEmail.trim(),
      phone: newSupplierPhone.trim(),
      address: '',
      status: 'active',
      totalSupplied: 0,
      transactions: 0,
      lastActivity: Date.now(),
    } as any;

    const existing = await db.suppliers.where('name').equalsIgnoreCase(name).first();
    if (!existing) {
      await db.suppliers.put(supplierRecord);
      setLocalSuppliers((prev) => {
        const merged = [...prev, supplierRecord];
        return Array.from(new Map(merged.map((s) => [String(s.name).trim().toLowerCase(), s])).values());
      });
      useStore.setState((state) => ({
        suppliers: Array.from(new Map([...(state.suppliers || []), supplierRecord].map((s: any) => [String(s.name).trim().toLowerCase(), s])).values()),
      }) as any);
      addAppNotification({
        type: 'user',
        title: 'New Supplier Added',
        message: `${name} was added to the system.`,
      });
    } else {
      setLocalSuppliers((prev) => {
        const merged = [...prev, existing];
        return Array.from(new Map(merged.map((s) => [String(s.name).trim().toLowerCase(), s])).values());
      });
    }
    onChange(name);
    setIsNew(false);
    setNewSupplierName('');
    setNewSupplierPhone('');
    setNewSupplierEmail('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
      {!isNew ? (
        <div className="flex gap-2">
          <select
            value={value}
            onChange={handleSelect}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={required}
          >
            <option value="">Select supplier</option>
            {supplierOptions.map((supplier) => (
              <option key={supplier.id} value={supplier.name}>{supplier.name}</option>
            ))}
            <option value="__new__">+ Add New Supplier</option>
          </select>
        </div>
      ) : (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
          <input
            type="text"
            value={newSupplierName}
            onChange={(e) => setNewSupplierName(e.target.value)}
            placeholder="Supplier Name *"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newSupplierPhone}
              onChange={(e) => setNewSupplierPhone(e.target.value)}
              placeholder="Phone"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="email"
              value={newSupplierEmail}
              onChange={(e) => setNewSupplierEmail(e.target.value)}
              placeholder="Email"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddNew}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              <Check className="w-4 h-4 inline mr-1" /> Add Supplier
            </button>
            <button
              type="button"
              onClick={() => { setIsNew(false); setNewSupplierName(''); setNewSupplierPhone(''); setNewSupplierEmail(''); }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Truck Selector Component
const TruckSelector: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  const dbTrucks = useLiveQuery(() => db.trucks.toArray(), []);
  const [localTrucks, setLocalTrucks] = useState<string[]>([]);
  const [isNew, setIsNew] = useState(false);
  const [newTruck, setNewTruck] = useState('');
  const truckOptions = useMemo(() => {
    const merged = [...localTrucks, ...(dbTrucks || []).map((t) => t.number)];
    return Array.from(new Map(merged.map((n) => [String(n).trim().toLowerCase(), n])).values()).sort((a, b) => a.localeCompare(b));
  }, [dbTrucks, localTrucks]);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '__new__') {
      setIsNew(true);
    } else {
      onChange(e.target.value);
      setIsNew(false);
    }
  };

  const handleAddNew = async () => {
    const number = newTruck.trim();
    if (!number) return;
    const exists = await db.trucks.where('number').equalsIgnoreCase(number).first();
    if (!exists) {
      await db.trucks.put({ id: `trk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, number, description: '', status: 'active', createdAt: Date.now() } as any);
      setLocalTrucks((prev) => Array.from(new Map([...prev, number].map((n) => [String(n).trim().toLowerCase(), n])).values()));
    } else {
      setLocalTrucks((prev) => Array.from(new Map([...prev, exists.number].map((n) => [String(n).trim().toLowerCase(), n])).values()));
    }
    onChange(number);
    setIsNew(false);
    setNewTruck('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Truck Number (Optional)</label>
      {!isNew ? (
        <div className="flex gap-2">
          <select
            value={value}
            onChange={handleSelect}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select truck</option>
            {truckOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
            <option value="__new__">+ Add New Truck</option>
          </select>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTruck}
            onChange={(e) => setNewTruck(e.target.value)}
            placeholder="Enter new truck number"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleAddNew}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => { setIsNew(false); setNewTruck(''); }}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// Invoice Upload Component
const InvoiceUpload: React.FC<{
  value: string;
  onChange: (value: string) => void;
  fileType?: string;
  onFileTypeChange?: (type: string) => void;
}> = ({ value, onChange, fileType, onFileTypeChange }) => {
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.type);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        console.log('File converted to base64, length:', base64.length);
        onChange(base64);
        if (onFileTypeChange) {
          const type = file.type.startsWith('image/') ? 'image' : (file.type === 'application/pdf' ? 'pdf' : 'other');
          console.log('Setting file type to:', type, 'original mime:', file.type);
          onFileTypeChange(type === 'pdf' ? 'application/pdf' : file.type);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setFileName('');
    onChange('');
    if (onFileTypeChange) onFileTypeChange('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Document (Image or PDF)</label>
      {!value ? (
        <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <Upload className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">Upload PDF or Image</span>
          <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
        </label>
      ) : (
        <div className="relative bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-3">
            {fileType && (fileType.startsWith('image/') || fileType === 'image') ? (
              <img src={value} alt="Preview" className="w-12 h-12 object-cover rounded shadow-sm" />
            ) : (
              <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center text-red-600">
                <ClipboardList className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{fileName || 'Invoice Document'}</p>
              <p className="text-xs text-gray-500 uppercase">{fileType || 'Document'}</p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Components
const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { users, setCurrentUser } = useStore();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find((u) => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      setError('');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img src={BRAND_LOGO_URL} alt="Newport Minerals Limited" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">{BRAND_NAME}</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter password"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </form>
        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-700 mb-2">Demo accounts from database</p>
          <div className="space-y-1 max-h-40 overflow-y-auto text-left">
            {users.map((u) => (
              <div key={u.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-gray-200 pb-1 last:border-b-0">
                <span className="font-medium capitalize">{u.role.replace('_', ' ')} - {u.name}</span>
                <span className="font-mono text-xs sm:text-sm">{u.username} / {u.password}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar: React.FC = () => {
  const { currentUser, activeTab, setActiveTab, setCurrentUser } = useStore();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, roles: ['admin', 'plant_manager', 'storekeeper', 'accountant', 'procurement', 'sales', 'view_only'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['admin', 'plant_manager', 'storekeeper', 'accountant', 'procurement', 'view_only'], submenu: [
      { id: 'raw-materials', label: 'Raw Materials', icon: FlaskConical },
      { id: 'finished-products', label: 'Finished Products', icon: Box },
      { id: 'stored-items', label: 'Stored Items', icon: Warehouse },
      ...useStore.getState().categories.filter(c => !['raw_material', 'finished_product', 'stored_item'].includes(c)).map(c => ({
        id: `category-${c}`,
        label: c.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        icon: Package
      })),
      { id: 'add-category', label: '+ Add Category', icon: Plus },
    ]},
    { id: 'movements', label: 'Movements', icon: ArrowLeftRight, roles: ['admin', 'plant_manager', 'storekeeper', 'view_only'] },
    { id: 'production', label: 'Production', icon: ClipboardList, roles: ['admin', 'plant_manager', 'view_only'], submenu: [
      { id: 'production-plan', label: 'Production Plan', icon: Calendar },
      { id: 'daily-achievements', label: 'Daily Achievements', icon: TrendingUp },
    ]},
    { id: 'messages', label: 'Messages', icon: MessageSquare, roles: ['admin', 'plant_manager', 'storekeeper', 'accountant', 'procurement', 'sales', 'view_only'] },
    { id: 'sales', label: 'Sales', icon: DollarSign, roles: ['admin', 'sales', 'accountant'] },
    { id: 'suppliers', label: 'Suppliers', icon: Truck, roles: ['admin', 'plant_manager', 'storekeeper', 'accountant', 'procurement', 'sales', 'view_only'] },
    { id: 'departments', label: 'Departments', icon: ClipboardList, roles: ['admin', 'plant_manager', 'storekeeper', 'accountant'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'plant_manager', 'storekeeper', 'accountant', 'procurement', 'sales', 'view_only'] },
    { id: 'users', label: 'Users', icon: Users, roles: ['admin'] },
    { id: 'reports', label: 'Reports', icon: DollarSign, roles: ['admin', 'plant_manager', 'accountant', 'sales', 'view_only'] },
    { id: 'profile', label: 'User Profile', icon: User, roles: ['admin', 'plant_manager', 'storekeeper', 'accountant', 'procurement', 'sales', 'view_only'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'plant_manager', 'accountant'] },
  ];

  const canAccess = (roles: string[]) => roles.includes(currentUser?.role || '');

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white flex-col overflow-hidden shadow-xl">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <img src={BRAND_LOGO_URL} alt="Newport Minerals Limited" className="h-10 w-auto" />
          <div>
            <h1 className="font-bold text-lg">{BRAND_NAME}</h1>
            <p className="text-xs text-gray-400">Newport Minerals Limited</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          canAccess(item.roles) && (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.submenu) {
                    setExpandedMenu(expandedMenu === item.id ? null : item.id);
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id || activeTab.startsWith(item.id)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.submenu && (
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedMenu === item.id ? 'rotate-180' : ''}`} />
                )}
              </button>
              {item.submenu && expandedMenu === item.id && (
                <div className="ml-6 mt-2 space-y-1">
                  {item.submenu.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveTab(sub.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                        activeTab === sub.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <sub.icon className="w-4 h-4" />
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        ))}
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-sm">{currentUser?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{currentUser?.role.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={() => setCurrentUser(null)}
          className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

const Header: React.FC = () => {
  const { currentUser, messages } = useStore();
  const unreadCount = messages.filter((m) => !m.read && (m.receiverId === currentUser?.id || m.groupId)).length;
  const { activeTab, setActiveTab } = useStore();
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);

  // Mobile menu items
  const mobileMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory', icon: Package, submenu: ['raw-materials', 'finished-products', 'stored-items'] },
    { id: 'movements', label: 'Movements', icon: ArrowLeftRight },
    { id: 'production', label: 'Production', icon: ClipboardList, submenu: ['production-plan', 'daily-achievements'] },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'sales', label: 'Sales', icon: DollarSign },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'departments', label: 'Departments', icon: ClipboardList },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'reports', label: 'Reports', icon: DollarSign },
  ];

  return (
    <header className="fixed md:static top-0 inset-x-0 z-40 bg-white shadow-sm px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {showMobileMenu ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">{BRAND_NAME}</h2>
          <p className="text-xs md:text-sm text-gray-500 hidden sm:block">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
      
      {/* Mobile Menu Dropdown */}
      {showMobileMenu && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t z-50 max-h-[80vh] overflow-y-auto">
          <div className="p-2 space-y-1">
            {mobileMenuItems.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (item.submenu) {
                      setActiveTab(item.submenu[0]);
                    } else {
                      setActiveTab(item.id);
                    }
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                    activeTab === item.id || (item.submenu && item.submenu.includes(activeTab))
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
                {item.submenu && (
                  <div className="ml-8 mt-1 space-y-1 border-l-2 border-gray-200">
                    {item.submenu.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => {
                          setActiveTab(sub);
                          setShowMobileMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm ${
                          activeTab === sub ? 'text-blue-600 font-medium' : 'text-gray-600'
                        }`}
                      >
                        {sub.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={() => setActiveTab('notifications')}
          className={`relative p-2 rounded-lg transition-colors ${
            activeTab === 'notifications' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Bell className="w-5 h-5 md:w-6 md:h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm md:text-base">
          {currentUser?.name.charAt(0)}
        </div>
      </div>
    </header>
  );
};

const Dashboard: React.FC = () => {
  const { items, movements } = useStore();
  
  const rawMaterials = items.filter((i) => i.type === 'raw_material');
  const finishedProducts = items.filter((i) => i.type === 'finished_product');
  const storedItems = items.filter((i) => i.type === 'stored_item');
  const lowStockItems = items.filter((i) => i.quantity < i.minStock);

  const chartData = items.map((i) => ({ name: i.name, quantity: i.quantity }));
  const movementChart = movements.slice(-10).map((m) => ({
    name: m.itemName.slice(0, 10),
    quantity: m.quantity,
    type: m.type,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Raw Materials</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{rawMaterials.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FlaskConical className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Total: {rawMaterials.reduce((a, b) => a + b.quantity, 0)} units</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Finished Products</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{finishedProducts.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Box className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Total: {finishedProducts.reduce((a, b) => a + b.quantity, 0)} units</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Stored Items</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{storedItems.length}</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <Warehouse className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Total: {storedItems.reduce((a, b) => a + b.quantity, 0)} units</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Low Stock Alerts</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{lowStockItems.length}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Items below minimum stock</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Inventory Levels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Movements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={movementChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="quantity" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Low Stock Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Item Code</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Current Stock</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Min Stock</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono">{item.code}</td>
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-4">{item.quantity} {item.unit}</td>
                  <td className="py-3 px-4">{item.minStock} {item.unit}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Low Stock</span>
                  </td>
                </tr>
              ))}
              {lowStockItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">No low stock items</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const InventoryList: React.FC<{ type: 'raw_material' | 'finished_product' | 'stored_item' }> = ({ type }) => {
  const { items, addItem, updateItem, deleteItem, bulkUploadItems, currentUser, movements, addMovement } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [showInStockModal, setShowInStockModal] = useState(false);
  const [showOutStockModal, setShowOutStockModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate total received and issued for each item
  const getItemStats = (itemId: string) => {
    const itemMovements = movements.filter(m => m.itemId === itemId);
    const totalReceived = itemMovements.filter(m => m.type === 'receive').reduce((sum, m) => sum + m.quantity, 0);
    const totalIssued = itemMovements.filter(m => m.type === 'issue').reduce((sum, m) => sum + m.quantity, 0);
    return { totalReceived, totalIssued };
  };

  // Filter items based on search, category, and stock status
  let filteredItems = items.filter((i) => 
    i.type === type && 
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Apply stock status filter
  if (stockStatusFilter === 'in_stock') {
    filteredItems = filteredItems.filter(i => i.quantity > 0);
  } else if (stockStatusFilter === 'low_stock') {
    filteredItems = filteredItems.filter(i => i.quantity <= i.minStock);
  } else if (stockStatusFilter === 'out_of_stock') {
    filteredItems = filteredItems.filter(i => i.quantity === 0);
  }

  const canEdit = ['admin', 'storekeeper', 'accountant', 'plant_manager', 'procurement', 'sales'].includes(currentUser?.role || '');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const newItems = results.data.map((row: any) => ({
            code: row.code || row.Code || '',
            name: row.name || row.Name || '',
            type: type,
            unit: row.unit || row.Unit || 'pcs',
            quantity: parseInt(row.quantity || row.Quantity || '0'),
            minStock: parseInt(row.minStock || row.MinStock || '0'),
            price: parseFloat(row.price || row.Price || '0'),
            description: row.description || row.Description || '',
          }));
          bulkUploadItems(newItems.filter((i: any) => i.code && i.name));
          setShowModal(false);
        },
      });
    }
  };

  const typeLabels = {
    raw_material: 'Raw Materials',
    finished_product: 'Finished Products',
    stored_item: 'Stored Items',
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-800">{typeLabels[type]}</h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Stock Status</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
              {canEdit && (
                <>
                  <button
                    onClick={() => { setEditingItem(null); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                  <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload CSV
                    <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1 bg-white">
                    <span className="text-xs font-semibold px-2 text-gray-500">Export:</span>
                    <button
                      onClick={() => {
                        const itemsToExport = items.filter(i => i.type === type);
                        const headers = ['Code', 'Name', 'Quantity', 'Unit', 'Price', 'Min Stock'];
                        const rows = itemsToExport.map(i => [i.code, i.name, i.quantity, i.unit, i.price, i.minStock]);
                        const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.setAttribute("href", url);
                        link.setAttribute("download", `${type}_all_items.csv`);
                        link.click();
                      }}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded font-medium"
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        const itemsToExport = items.filter(i => i.type === type && i.quantity > 0);
                        const headers = ['Code', 'Name', 'Quantity', 'Unit', 'Price', 'Min Stock'];
                        const rows = itemsToExport.map(i => [i.code, i.name, i.quantity, i.unit, i.price, i.minStock]);
                        const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.setAttribute("href", url);
                        link.setAttribute("download", `${type}_in_stock.csv`);
                        link.click();
                      }}
                      className="text-xs bg-green-100 hover:bg-green-200 text-green-800 py-1 px-2 rounded font-medium"
                    >
                      In Stock
                    </button>
                    <button
                      onClick={() => {
                        const itemsToExport = items.filter(i => i.type === type && i.quantity <= i.minStock && i.quantity > 0);
                        const headers = ['Code', 'Name', 'Quantity', 'Unit', 'Price', 'Min Stock'];
                        const rows = itemsToExport.map(i => [i.code, i.name, i.quantity, i.unit, i.price, i.minStock]);
                        const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.setAttribute("href", url);
                        link.setAttribute("download", `${type}_low_stock.csv`);
                        link.click();
                      }}
                      className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-1 px-2 rounded font-medium"
                    >
                      Low Stock
                    </button>
                    <button
                      onClick={() => {
                        const itemsToExport = items.filter(i => i.type === type && i.quantity === 0);
                        const headers = ['Code', 'Name', 'Quantity', 'Unit', 'Price', 'Min Stock'];
                        const rows = itemsToExport.map(i => [i.code, i.name, i.quantity, i.unit, i.price, i.minStock]);
                        const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.setAttribute("href", url);
                        link.setAttribute("download", `${type}_out_stock.csv`);
                        link.click();
                      }}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-800 py-1 px-2 rounded font-medium"
                    >
                      Out Stock
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Code</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Quantity</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Unit</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Total Received</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Total Issued</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Price</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Min Stock</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                {canEdit && <th className="text-left py-3 px-4 font-semibold text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const stats = getItemStats(item.id);
                return (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-blue-600">{item.code}</td>
                    <td className="py-3 px-4 font-medium">
                      <button 
                        onClick={() => { setSelectedItem(item); setShowHistoryModal(true); }}
                        className="text-blue-600 hover:underline text-left font-medium"
                      >
                        {item.name}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-semibold">{item.quantity}</td>
                    <td className="py-3 px-4">{item.unit}</td>
                    <td className="py-3 px-4 text-green-600 font-medium">{stats.totalReceived}</td>
                    <td className="py-3 px-4 text-orange-600 font-medium">{stats.totalIssued}</td>
                    <td className="py-3 px-4">{formatCurrency(item.price)}</td>
                    <td className="py-3 px-4">{item.minStock}</td>
                    <td className="py-3 px-4">
                      {item.quantity === 0 ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Out of Stock</span>
                      ) : item.quantity < item.minStock ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Low Stock</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">In Stock</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => { setSelectedItem(item); setShowInStockModal(true); }} 
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="In Stock (Receive)"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { setSelectedItem(item); setShowOutStockModal(true); }} 
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                            title={item.type === 'finished_product' ? 'Sales Out Stock (Approval Required)' : 'Out Stock (Issue)'}
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { setEditingItem(item); setShowModal(true); }} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteItem(item.id)} 
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ItemModal
          item={editingItem}
          type={type}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
          onSave={async (payload) => {
            if (editingItem) {
              await updateItem(editingItem.id, payload.item);
            } else {
              const initialQty = Number(payload.initialMovement?.quantity || payload.item.quantity || 0);
              const created = await addItem({
                ...payload.item,
                quantity: initialQty,
                totalReceived: initialQty,
                totalIssued: 0,
                supplier: payload.initialMovement?.supplier || '',
              });

                if (payload.initialMovement && created) {
                  await db.movements.put({
                    id: Date.now().toString(),
                    itemId: created.id,
                    itemName: created.name,
                    type: 'receive',
                    quantity: initialQty,
                    destination: payload.initialMovement.destination || payload.item.location || 'Warehouse',
                    reference: payload.initialMovement.reference || 'INITIAL-STOCK',
                    supplier: payload.initialMovement.supplier || '',
                    invoiceNumber: payload.initialMovement.invoiceNumber || '',
                    truckNumber: payload.initialMovement.truckNumber || '',
                    invoiceFile: payload.initialMovement.invoiceFile || '',
                    invoiceFileType: payload.initialMovement.invoiceFileType || '',
                    receivedBy: payload.initialMovement.receivedBy || (currentUser?.username || currentUser?.name || 'System'),
                    reason: payload.initialMovement.reason || 'Added Item / Initial Stock',
                    user: currentUser?.username || currentUser?.name || 'System',
                    location: payload.initialMovement.destination || payload.item.location || 'Warehouse',
                    createdAt: Date.now(),
                    date: Date.now(),
                  } as any);

                  if (['admin', 'storekeeper', 'accountant'].includes(currentUser?.role || '')) {
                    await db.inventoryApprovals.put({
                      id: `invapp-${Date.now()}`,
                      mode: 'new_item',
                      itemId: created.id,
                      itemName: created.name,
                      quantity: initialQty,
                      unit: created.unit,
                      supplier: payload.initialMovement.supplier || '',
                      invoiceNumber: payload.initialMovement.invoiceNumber || '',
                      invoiceFile: payload.initialMovement.invoiceFile || '',
                      invoiceFileType: payload.initialMovement.invoiceFileType || '',
                      location: payload.initialMovement.destination || payload.item.location || 'Warehouse',
                      truckNumber: payload.initialMovement.truckNumber || '',
                      createdBy: currentUser?.id || 'system',
                      createdByName: currentUser?.username || currentUser?.name || 'System',
                      createdAt: Date.now(),
                      status: ['admin', 'accountant', 'sales'].includes(currentUser?.role || '') ? 'approved' : 'pending',
                      approvedBy: ['admin', 'accountant', 'sales'].includes(currentUser?.role || '') ? (currentUser?.username || currentUser?.name || 'System') : undefined,
                      approvedAt: ['admin', 'accountant', 'sales'].includes(currentUser?.role || '') ? Date.now() : undefined,
                      note: 'New item receipt approval flow',
                    } as any);
                    await persistNotification({
                      type: 'inventory',
                      title: ['admin', 'accountant', 'sales'].includes(currentUser?.role || '') ? 'Item Receipt Approved' : 'Item Receipt Pending Approval',
                      message: `${currentUser?.username || currentUser?.name || 'User'} added ${created.name} (${initialQty} ${created.unit})${['admin', 'accountant', 'sales'].includes(currentUser?.role || '') ? ' and auto-approved it.' : ' and sent it for approval.'}`,
                    });
                  }

                const truckNo = (payload.initialMovement.truckNumber || '').trim();
                if (truckNo) {
                  const existingTruck = await db.trucks.where('number').equalsIgnoreCase(truckNo).first();
                  if (!existingTruck) {
                    await db.trucks.put({ id: `trk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, number: truckNo, description: '', status: 'active', createdAt: Date.now() } as any);
                  } else {
                    await db.trucks.put({ ...existingTruck, number: truckNo } as any);
                  }
                }

                const locationName = ((payload.initialMovement.destination || payload.item.location || '') as string).trim();
                if (locationName) {
                  const existingLocation = await db.locations.where('name').equalsIgnoreCase(locationName).first();
                  if (!existingLocation) {
                    await db.locations.add({ id: `loc-${Date.now()}`, name: locationName, description: '', createdAt: Date.now() } as any);
                  }
                }

                const supplierName = (payload.initialMovement.supplier || '').trim();
                if (supplierName) {
                  const existingSupplier = await db.suppliers.where('name').equalsIgnoreCase(supplierName).first();
                  let syncedSupplier: any;
                  if (!existingSupplier) {
                    syncedSupplier = {
                      id: `sup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                      name: supplierName,
                      email: '',
                      phone: '',
                      address: '',
                      status: 'active',
                      totalSupplied: initialQty,
                      transactions: 1,
                      lastActivity: Date.now(),
                    };
                    await db.suppliers.put(syncedSupplier as any);
                  } else {
                    syncedSupplier = {
                      ...existingSupplier,
                      totalSupplied: Number(existingSupplier.totalSupplied || 0) + initialQty,
                      transactions: Number(existingSupplier.transactions || 0) + 1,
                      lastActivity: Date.now(),
                    };
                    await db.suppliers.update(existingSupplier.id, {
                      totalSupplied: syncedSupplier.totalSupplied,
                      transactions: syncedSupplier.transactions,
                      lastActivity: syncedSupplier.lastActivity,
                    } as any);
                  }
                  useStore.setState((state) => ({
                    suppliers: Array.from(new Map([...(state.suppliers || []), syncedSupplier].map((s: any) => [String(s.name).trim().toLowerCase(), s])).values()),
                  }) as any);
                }
              }
            }
            setShowModal(false);
            setEditingItem(null);
          }}
        />
      )}

      {showInStockModal && selectedItem && (
        <InStockModal
          item={selectedItem}
          onClose={() => { setShowInStockModal(false); setSelectedItem(null); }}
          onSave={async (data) => {
            await addMovement({ ...data, user: currentUser?.username || currentUser?.name || 'System', receivedBy: currentUser?.username || currentUser?.name || 'System', location: (data as any).destination || '', date: Date.now() });

            if (['admin', 'storekeeper', 'accountant'].includes(currentUser?.role || '')) {
              await db.inventoryApprovals.put({
                id: `invapp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                mode: 'in_stock',
                itemId: data.itemId,
                itemName: data.itemName,
                quantity: data.quantity,
                unit: selectedItem?.unit || '',
                supplier: (data as any).supplier || '',
                invoiceNumber: (data as any).invoiceNumber || '',
                invoiceFile: (data as any).invoiceFile || '',
                invoiceFileType: (data as any).invoiceFileType || '',
                location: (data as any).destination || '',
                truckNumber: (data as any).truckNumber || '',
                createdBy: currentUser?.id || 'system',
                createdByName: currentUser?.username || currentUser?.name || 'System',
                createdAt: Date.now(),
                status: ['admin', 'accountant', 'sales'].includes(currentUser?.role || '') ? 'approved' : 'pending',
                approvedBy: ['admin', 'accountant', 'sales'].includes(currentUser?.role || '') ? (currentUser?.username || currentUser?.name || 'System') : undefined,
                approvedAt: ['admin', 'accountant', 'sales'].includes(currentUser?.role || '') ? Date.now() : undefined,
                note: 'Stock receipt approval flow',
              } as any);
              await persistNotification({
                type: 'inventory',
                title: ['admin', 'accountant', 'sales'].includes(currentUser?.role || '') ? 'Stock Receipt Approved' : 'Stock Receipt Pending Approval',
                message: `${currentUser?.username || currentUser?.name || 'User'} received ${data.quantity} ${(selectedItem as any)?.unit || ''} of ${data.itemName}${['admin', 'accountant', 'sales'].includes(currentUser?.role || '') ? ' and auto-approved it.' : ' and sent it for approval.'}`,
              });
            }

            const supplierName = (data.supplier || '').trim();
            if (supplierName) {
              const existingSupplier = await db.suppliers.where('name').equalsIgnoreCase(supplierName).first();
              let syncedSupplier: any;
              if (!existingSupplier) {
                syncedSupplier = {
                  id: `sup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  name: supplierName,
                  email: '',
                  phone: '',
                  address: '',
                  status: 'active',
                  totalSupplied: Number(data.quantity || 0),
                  transactions: 1,
                  lastActivity: Date.now(),
                };
                await db.suppliers.put(syncedSupplier as any);
              } else {
                syncedSupplier = {
                  ...existingSupplier,
                  totalSupplied: Number(existingSupplier.totalSupplied || 0) + Number(data.quantity || 0),
                  transactions: Number(existingSupplier.transactions || 0) + 1,
                  lastActivity: Date.now(),
                };
                await db.suppliers.update(existingSupplier.id, {
                  totalSupplied: syncedSupplier.totalSupplied,
                  transactions: syncedSupplier.transactions,
                  lastActivity: syncedSupplier.lastActivity,
                } as any);
              }
              useStore.setState((state) => ({
                suppliers: Array.from(new Map([...(state.suppliers || []), syncedSupplier].map((s: any) => [String(s.name).trim().toLowerCase(), s])).values()),
              }) as any);
            }

            const truckNo = ((data as any).truckNumber || '').trim();
            if (truckNo) {
              const existingTruck = await db.trucks.where('number').equalsIgnoreCase(truckNo).first();
              if (!existingTruck) {
                await db.trucks.put({ id: `trk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, number: truckNo, description: '', status: 'active', createdAt: Date.now() } as any);
              }
            }

            setShowInStockModal(false);
            setSelectedItem(null);
          }}
        />
      )}

      {showOutStockModal && selectedItem && selectedItem.type !== 'finished_product' && (
        <OutStockModal
          item={selectedItem}
          onClose={() => { setShowOutStockModal(false); setSelectedItem(null); }}
          onSave={async (data) => {
            await addMovement({ ...data, user: currentUser?.username || currentUser?.name || 'System', issuedBy: currentUser?.username || currentUser?.name || 'System', department: (data as any).destination || '', date: Date.now() });
            setShowOutStockModal(false);
            setSelectedItem(null);
          }}
        />
      )}

      {showOutStockModal && selectedItem && selectedItem.type === 'finished_product' && (
        <FinishedProductSalesModal
          item={selectedItem}
          onClose={() => { setShowOutStockModal(false); setSelectedItem(null); }}
          onSave={async (data) => {
            await db.salesRequests.put({
              id: `sale-${Date.now()}`,
              itemId: data.itemId,
              itemName: data.itemName,
              quantity: data.quantity,
              driverName: data.driverName,
              truckNumber: data.truckNumber,
              customer: data.customer,
              destination: data.destination,
              createdBy: currentUser?.id || 'system',
              createdByName: currentUser?.username || currentUser?.name || 'System',
              createdAt: Date.now(),
              status: 'pending',
              reason: 'Pending admin approval for finished product sales out stock',
            } as any);
            await persistNotification({
              type: 'sales',
              title: 'Pending Sales Approval',
              message: `${currentUser?.username || currentUser?.name || 'User'} submitted ${data.quantity} ${selectedItem.unit} of ${data.itemName} for approval.`,
            });
            setShowOutStockModal(false);
            setSelectedItem(null);
          }}
        />
      )}

      {showHistoryModal && selectedItem && (
        <ItemHistoryModal
          item={selectedItem}
          movements={movements.filter(m => m.itemId === selectedItem.id)}
          onClose={() => { setShowHistoryModal(false); setSelectedItem(null); }}
        />
      )}
    </div>
  );
};

const ItemHistoryModal: React.FC<{
  item: Item;
  movements: Movement[];
  onClose: () => void;
}> = ({ item, movements, onClose }) => {
  const [previewInvoice, setPreviewInvoice] = useState<{file: string, type: string} | null>(null);

  const handleViewInvoice = (m: Movement) => {
    const file = (m as any).invoiceFile || (m as any).invoiceImage || '';
    if (!file) return;
    setPreviewInvoice({ file, type: (m as any).invoiceFileType || 'image' });
  };

  const displayedMovements = [...movements];
  if (displayedMovements.length === 0) {
    displayedMovements.push({
      id: 'initial-' + item.id,
      itemId: item.id,
      itemName: item.name,
      type: 'receive',
      quantity: item.quantity || 0,
      createdAt: item.createdAt || new Date().toISOString(),
      reason: 'Initial Stock / Item Created',
      receivedBy: 'System',
      invoiceNumber: '-',
      invoiceFile: '',
      invoiceFileType: '',
      destination: 'Warehouse',
      reference: 'INITIAL',
      createdBy: 'System'
    });
  }
  const sortedMovements = displayedMovements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{item.name} History</h3>
            <p className="text-sm text-gray-500 font-mono">{item.code} | Current Stock: {item.quantity} {item.unit}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider">
                <th className="p-3">Date</th>
                <th className="p-3">Activity</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Who</th>
                <th className="p-3">Department/Location</th>
                <th className="p-3">Invoice No.</th>
                <th className="p-3">Reason</th>
                <th className="p-3 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {sortedMovements.map((m) => {
                const dateStr = new Date(m.createdAt).toISOString().split('T')[0];
                let activityStr = '';
                let whoStr = '-';
                let deptLocStr = '-';
                let reasonStr = '-';
                let quantityStr = '';
                let qtyColor = '';

                let invoiceNoStr = '-';

                if (m.type === 'receive') {
                  activityStr = '🟢 In-Stock';
                  quantityStr = `+${m.quantity}`;
                  qtyColor = 'text-green-600 font-bold';
                  whoStr = m.receivedBy ? `Received by: ${m.receivedBy}` : (m.user || '-');
                  deptLocStr = m.location || m.destination || '-';
                  invoiceNoStr = (m as any).invoiceNumber || '-';
                  reasonStr = m.reason || 'Received Stock';
                } else if (m.type === 'issue') {
                  activityStr = '🔴 Out-Stock';
                  quantityStr = `-${m.quantity}`;
                  qtyColor = 'text-red-600 font-bold';
                  whoStr = `${m.issuedBy ? `Issued by: ${m.issuedBy}` : 'Issued by: -'}${m.receivedBy ? ` | Received by: ${m.receivedBy}` : ''}`;
                  deptLocStr = m.department || m.destination || '-';
                  reasonStr = m.reason || '-';
                } else if (m.type === 'adjustment') {
                  activityStr = '🔵 Adjustment';
                  quantityStr = `${m.quantity >= 0 ? '+' : ''}${m.quantity}`;
                  qtyColor = m.quantity >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold';
                  whoStr = m.adjustedBy || '-';
                  deptLocStr = `${m.fromLocation || ''} → ${m.toLocation || ''}`.trim() === '→' ? '-' : `${m.fromLocation || ''} → ${m.toLocation || ''}`;
                  reasonStr = m.reason || '-';
                }

                return (
                  <tr key={m.id} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="p-3 font-mono text-xs">{dateStr}</td>
                    <td className="p-3 font-bold">{activityStr}</td>
                    <td className={`p-3 font-bold ${qtyColor}`}>{quantityStr}</td>
                    <td className="p-3">{whoStr}</td>
                    <td className="p-3">{deptLocStr}</td>
                    <td className="p-3 font-mono text-xs">{invoiceNoStr}</td>
                    <td className="p-3">{reasonStr}</td>
                    <td className="p-3 text-right">
                      {((m as any).invoiceFile || (m as any).invoiceImage) ? (
                        <button
                          onClick={() => handleViewInvoice(m)}
                          className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto shadow-sm"
                        >
                          <Eye className="w-3 h-3" /> 👁️ View
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-gray-800 text-white rounded-lg">Close</button>
        </div>
      </div>

      {previewInvoice && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Invoice Preview
              </h4>
              <div className="flex items-center gap-2">
                <a 
                  href={previewInvoice.file} 
                  download={`invoice_${Date.now()}.${previewInvoice.type.includes('pdf') ? 'pdf' : 'png'}`}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-semibold flex items-center gap-1 shadow-sm"
                >
                  <Download className="w-4 h-4" /> Download
                </a>
                <button 
                  onClick={() => setPreviewInvoice(null)} 
                  className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg text-sm font-semibold flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4 min-h-[50vh]">
              {previewInvoice.type === 'application/pdf' || previewInvoice.type === 'pdf' ? (
                <iframe src={previewInvoice.file} className="w-full h-full border-0 min-h-[60vh]" title="Invoice PDF" />
              ) : (
                <img src={previewInvoice.file} alt="Invoice Preview" className="max-w-full max-h-full object-contain shadow-md rounded" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};





                  




                    {/* ADJUSTMENT Details */}



const ItemModal: React.FC<{
  item: Item | null;
  type: 'raw_material' | 'finished_product' | 'stored_item';
  onClose: () => void;
  onSave: (data: {
    item: Omit<Item, 'id' | 'createdAt'>;
    initialMovement?: Partial<Movement>;
  }) => void;
}> = ({ item, type, onClose, onSave }) => {
  const { currentUser } = useStore();
  const [formData, setFormData] = useState({
    code: item?.code || '',
    name: item?.name || '',
    type: type,
    unit: item?.unit || 'pcs',
    quantity: item?.quantity || 0,
    minStock: item?.minStock || 0,
    price: item?.price || 0,
    description: item?.description || '',
    location: item?.location || '',
  });

  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [truckNumber, setTruckNumber] = useState('');
  const [invoiceImage, setInvoiceImage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      item: formData,
      initialMovement: !item && formData.quantity > 0
        ? {
            type: 'receive',
            quantity: formData.quantity,
            supplier,
            invoiceNumber,
            truckNumber,
            invoiceFile: invoiceImage,
            invoiceFileType: invoiceImage ? (invoiceImage.includes('application/pdf') ? 'application/pdf' : 'image/png') : '',
            destination: formData.location || 'Warehouse',
            receivedBy: currentUser?.username || currentUser?.name || 'System',
            reason: 'Added Item / Initial Stock',
            reference: 'INITIAL-STOCK',
          }
        : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{item ? 'Edit Item' : 'Add New Item'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="liters">Liters</option>
                <option value="boxes">Boxes</option>
                <option value="set">Set</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
              <input
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>
          
          {/* Supplier & Invoice Details */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-800 mb-3">Supplier & Invoice Details</h4>
            <div className="space-y-3">
              <SupplierSelector value={supplier} onChange={setSupplier} required />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Enter invoice number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <TruckSelector value={truckNumber} onChange={setTruckNumber} />
              <LocationSelector value={formData.location} onChange={(v) => setFormData({ ...formData, location: v })} required />
              <InvoiceUpload value={invoiceImage} onChange={setInvoiceImage} />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InStockModal: React.FC<{
  item: Item;
  onClose: () => void;
  onSave: (data: Omit<Movement, 'id' | 'createdAt'>) => void;
}> = ({ item, onClose, onSave }) => {
  const { currentUser } = useStore();
  const [formData, setFormData] = useState({
    itemId: item.id,
    itemName: item.name,
    type: 'receive' as const,
    quantity: 0,
    destination: '',
    reference: '',
    createdBy: currentUser?.id || '',
    supplier: '',
    invoiceNumber: '',
    truckNumber: '',
    invoiceFile: '',
    invoiceFileType: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Receive Stock - {item.name}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">Current Stock: <span className="font-semibold">{item.quantity} {item.unit}</span></p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Receive</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="1"
            />
          </div>
          
          {/* Supplier & Invoice Details */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-800 mb-3">Supplier & Invoice Details</h4>
            <div className="space-y-3">
              <SupplierSelector value={formData.supplier} onChange={(v) => setFormData({ ...formData, supplier: v })} required />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  placeholder="Enter invoice number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <TruckSelector value={formData.truckNumber} onChange={(v) => setFormData({ ...formData, truckNumber: v })} />
              <InvoiceUpload 
                value={formData.invoiceFile} 
                onChange={(v) => setFormData({ ...formData, invoiceFile: v })}
                fileType={formData.invoiceFileType}
                onFileTypeChange={(v) => setFormData({ ...formData, invoiceFileType: v })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference (PO #)</label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Purchase Order number"
              required
            />
          </div>
          <LocationSelector value={formData.destination} onChange={(v) => setFormData({ ...formData, destination: v })} required />
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Receive Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FinishedProductSalesModal: React.FC<{
  item: Item;
  onClose: () => void;
  onSave: (data: { itemId: string; itemName: string; quantity: number; driverName: string; truckNumber: string; customer?: string; destination?: string; }) => void;
}> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    itemId: item.id,
    itemName: item.name,
    quantity: 0,
    driverName: '',
    truckNumber: '',
    customer: '',
    destination: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.quantity > item.quantity) {
      alert('Cannot issue more than available stock');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Finished Product Sales Out Stock - {item.name}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-sm text-orange-700">Available Balance: <span className="font-semibold">{item.quantity} {item.unit}</span></p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selected Product</label>
            <input value={item.name} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input type="number" min="1" max={item.quantity} value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value || '0') })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
            <input type="text" value={formData.driverName} onChange={(e) => setFormData({ ...formData, driverName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
          </div>
          <TruckSelector value={formData.truckNumber} onChange={(v) => setFormData({ ...formData, truckNumber: v })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer (Optional)</label>
            <input type="text" value={formData.customer} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Customer name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination (Optional)</label>
            <input type="text" value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Delivery destination" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Send for Approval</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const OutStockModal: React.FC<{
  item: Item;
  onClose: () => void;
  onSave: (data: Omit<Movement, 'id' | 'createdAt'>) => void;
}> = ({ item, onClose, onSave }) => {
  const { currentUser, departments } = useStore();
  const [formData, setFormData] = useState({
    itemId: item.id,
    itemName: item.name,
    type: 'issue' as const,
    quantity: 0,
    destination: '',
    reference: '',
    receivedBy: '',
    reason: '',
    createdBy: currentUser?.id || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.quantity > item.quantity) {
      alert('Cannot issue more than available stock');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Issue Stock - {item.name}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-sm text-orange-700">Available Stock: <span className="font-semibold">{item.quantity} {item.unit}</span></p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Issue</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="1"
              max={item.quantity}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department to Receive</label>
            <select
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Received By</label>
            <input
              type="text"
              value={formData.receivedBy}
              onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Person receiving the items"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <input
              type="text"
              list={`issue-reasons-${item.id}`}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Select or type reason"
              required
            />
            <datalist id={`issue-reasons-${item.id}`}>
              <option value="Production Use" />
              <option value="Maintenance" />
              <option value="Quality Test" />
              <option value="Sample" />
              <option value="Damaged/Obsolete" />
              <option value="Transfer" />
              <option value="Other" />
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference (WO #)</label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Work Order number"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Issue Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MovementsPage: React.FC = () => {
  const { movements, items, addMovement, currentUser } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMovements = movements.filter((m) =>
    m.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = currentUser?.role !== 'view_only';

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Stock Movements</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search movements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {canEdit && (
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Movement
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Item</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Quantity</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Destination</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Reference</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map((movement) => (
                <tr key={movement.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{movement.createdAt}</td>
                  <td className="py-3 px-4 font-medium">{movement.itemName}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      movement.type === 'receive'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {movement.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold">{movement.quantity}</td>
                  <td className="py-3 px-4">{movement.destination}</td>
                  <td className="py-3 px-4 font-mono text-blue-600">{movement.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <MovementModal
          items={items}
          onClose={() => setShowModal(false)}
          onSave={(data) => {
            addMovement(data);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

const MovementModal: React.FC<{
  items: Item[];
  onClose: () => void;
  onSave: (data: Omit<Movement, 'id' | 'createdAt'>) => void;
}> = ({ items, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    itemId: '',
    itemName: '',
    type: 'receive' as 'receive' | 'issue',
    quantity: 0,
    destination: '',
    reference: '',
    createdBy: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">New Movement</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'receive' | 'issue' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="receive">Receive</option>
              <option value="issue">Issue</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
            <select
              value={formData.itemId}
              onChange={(e) => {
                const item = items.find((i) => i.id === e.target.value);
                setFormData({ ...formData, itemId: e.target.value, itemName: item?.name || '' });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination/Source</label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Supplier name or Department/Location"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="PO Number or Work Order"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProductionPlanPage: React.FC = () => {
  const { productionPlans, items, addProductionPlan, updateProductionPlan, currentUser } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ProductionPlan | null>(null);

  const finishedProducts = items.filter((i) => i.type === 'finished_product');
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'plant_manager';

  const handleUpdateActual = (planId: string, actual: number) => {
    const plan = productionPlans.find((p) => p.id === planId);
    if (plan) {
      const status = actual >= plan.targetQuantity ? 'completed' : actual > 0 ? 'in_progress' : 'pending';
      updateProductionPlan(planId, { actualQuantity: actual, status });
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Production Plan</h2>
            {canEdit && (
              <button
                onClick={() => { setEditingPlan(null); setShowModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Plan
              </button>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Product</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Target</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Actual</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Manpower</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Progress</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                {canEdit && <th className="text-left py-3 px-4 font-semibold text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {productionPlans.map((plan) => (
                <tr key={plan.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{plan.date}</td>
                  <td className="py-3 px-4 font-medium">{plan.productName}</td>
                  <td className="py-3 px-4">{plan.targetQuantity}</td>
                  <td className="py-3 px-4">
                    {canEdit ? (
                      <input
                        type="number"
                        value={plan.actualQuantity}
                        onChange={(e) => handleUpdateActual(plan.id, parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                      />
                    ) : (
                      plan.actualQuantity
                    )}
                  </td>
                  <td className="py-3 px-4">{plan.manpower}</td>
                  <td className="py-3 px-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min((plan.actualQuantity / plan.targetQuantity) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{Math.round((plan.actualQuantity / plan.targetQuantity) * 100)}%</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      plan.status === 'completed' ? 'bg-green-100 text-green-700' :
                      plan.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {plan.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="py-3 px-4">
                      <button
                        onClick={() => { setEditingPlan(plan); setShowModal(true); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ProductionPlanModal
          plan={editingPlan}
          products={finishedProducts}
          onClose={() => { setShowModal(false); setEditingPlan(null); }}
          onSave={(data) => {
            if (editingPlan) {
              updateProductionPlan(editingPlan.id, data);
            } else {
              addProductionPlan(data);
            }
            setShowModal(false);
            setEditingPlan(null);
          }}
        />
      )}
    </div>
  );
};

const ProductionPlanModal: React.FC<{
  plan: ProductionPlan | null;
  products: Item[];
  onClose: () => void;
  onSave: (data: any) => void;
}> = ({ plan, products, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    date: plan?.date || new Date().toISOString().split('T')[0],
    productId: plan?.productId || '',
    productName: plan?.productName || '',
    targetQuantity: plan?.targetQuantity || 0,
    manpower: plan?.manpower || 0,
    createdBy: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{plan ? 'Edit Plan' : 'New Production Plan'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select
              value={formData.productId}
              onChange={(e) => {
                const product = products.find((p) => p.id === e.target.value);
                setFormData({ ...formData, productId: e.target.value, productName: product?.name || '' });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Quantity</label>
              <input
                type="number"
                value={formData.targetQuantity}
                onChange={(e) => setFormData({ ...formData, targetQuantity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manpower</label>
              <input
                type="number"
                value={formData.manpower}
                onChange={(e) => setFormData({ ...formData, manpower: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min="1"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {plan ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DailyAchievements: React.FC = () => {
  const { productionPlans } = useStore();

  const dailyData = productionPlans.reduce((acc, plan) => {
    const existing = acc.find((a) => a.date === plan.date);
    if (existing) {
      existing.target += plan.targetQuantity;
      existing.actual += plan.actualQuantity;
      existing.manpower += plan.manpower;
    } else {
      acc.push({
        date: plan.date,
        target: plan.targetQuantity,
        actual: plan.actualQuantity,
        manpower: plan.manpower,
      });
    }
    return acc;
  }, [] as Array<{ date: string; target: number; actual: number; manpower: number }>);

  const chartData = dailyData.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Daily Achievements</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="target" name="Target" fill="#94A3B8" />
            <Bar dataKey="actual" name="Actual" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Target</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Actual</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Manpower</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Achievement Rate</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((data) => (
                <tr key={data.date} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{data.date}</td>
                  <td className="py-3 px-4">{data.target}</td>
                  <td className="py-3 px-4 font-semibold">{data.actual}</td>
                  <td className="py-3 px-4">{data.manpower}</td>
                  <td className="py-3 px-4">
                    <span className={`font-semibold ${data.actual >= data.target ? 'text-green-600' : 'text-amber-600'}`}>
                      {Math.round((data.actual / data.target) * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MessagesPage: React.FC = () => {
  const { messages, users, groups, addMessage, currentUser } = useStore();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');

  const userMessages = messages.filter((m) =>
    (m.senderId === currentUser?.id && m.receiverId === selectedUser) ||
    (m.receiverId === currentUser?.id && m.senderId === selectedUser)
  );

  const groupMessages = messages.filter((m) => m.groupId === selectedGroup);
  const displayMessages = activeTab === 'users' ? userMessages : groupMessages;

  const handleSend = () => {
    if (!newMessage.trim()) return;
    if (activeTab === 'users' && selectedUser) {
      addMessage({
        senderId: currentUser!.id,
        senderName: currentUser!.name,
        receiverId: selectedUser,
        content: newMessage,
      });
    } else if (activeTab === 'groups' && selectedGroup) {
      addMessage({
        senderId: currentUser!.id,
        senderName: currentUser!.name,
        groupId: selectedGroup,
        content: newMessage,
      });
    }
    setNewMessage('');
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm flex h-[calc(100vh-200px)]">
        <div className="w-72 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'groups' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Groups
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'users' ? (
              users.filter((u) => u.id !== currentUser?.id).map((user) => (
                <button
                  key={user.id}
                  onClick={() => { setSelectedUser(user.id); setSelectedGroup(null); }}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    selectedUser === user.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
                  </div>
                </button>
              ))
            ) : (
              groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => { setSelectedGroup(group.id); setSelectedUser(null); }}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    selectedGroup === group.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{group.name}</p>
                    <p className="text-xs text-gray-500">{group.members.length} members</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {(selectedUser || selectedGroup) ? (
            <>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {activeTab === 'users'
                      ? users.find((u) => u.id === selectedUser)?.name.charAt(0)
                      : groups.find((g) => g.id === selectedGroup)?.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {activeTab === 'users'
                        ? users.find((u) => u.id === selectedUser)?.name
                        : groups.find((g) => g.id === selectedGroup)?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activeTab === 'users' ? 'Direct Message' : 'Group Chat'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {displayMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.senderId === currentUser?.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.senderId !== currentUser?.id && (
                        <p className="text-xs font-medium mb-1">{msg.senderName}</p>
                      )}
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.senderId === currentUser?.id ? 'text-blue-200' : 'text-gray-500'}`}>
                        {msg.createdAt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSend}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Select a user or group to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UsersPage: React.FC = () => {
  const { users, currentUser, addUser, updateUser, deleteUser, resetUserPassword } = useStore();
  const [editingUser, setEditingUser] = React.useState<any>(null);
  const [isAddingUser, setIsAddingUser] = React.useState(false);
  const [newUser, setNewUser] = React.useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'view_only' as UserRole
  });

  const canEdit = currentUser?.role === 'admin';

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-red-100 text-red-700',
    plant_manager: 'bg-blue-100 text-blue-700',
    storekeeper: 'bg-green-100 text-green-700',
    accountant: 'bg-purple-100 text-purple-700',
    procurement: 'bg-amber-100 text-amber-700',
    sales: 'bg-pink-100 text-pink-700',
    view_only: 'bg-gray-100 text-gray-700',
  };

  const handleRestorePassword = async (user: User) => {
    const newPass = Math.random().toString(36).slice(-8);
    await resetUserPassword(user.id, newPass);
    alert(`Success: Restored password has been sent to the user email (${user.email}). New password is: ${newPass}`);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    await updateUser(editingUser.id, {
      name: editingUser.name,
      email: editingUser.email,
      username: editingUser.username,
      role: editingUser.role,
    });
    alert('User details updated successfully!');
    setEditingUser(null);
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.username || !newUser.email || !newUser.password) {
      alert('Please fill all fields');
      return;
    }
    const userExists = users.some((user) => user.username.toLowerCase() === newUser.username.toLowerCase());
    if (userExists) {
      alert('Username already exists. Use another username.');
      return;
    }

    await addUser({
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
    });
    
    setIsAddingUser(false);
    setNewUser({ name: '', username: '', email: '', password: '', role: 'view_only' });
    alert('User created successfully!');
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
            {canEdit && (
              <button onClick={() => setIsAddingUser(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                Add User
              </button>
            )}
            {isAddingUser && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded-xl max-w-sm w-full">
                  <h3 className="text-lg font-bold mb-4">Add User</h3>
                  <form onSubmit={handleAddUserSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm">Name</label>
                      <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full border p-2 rounded" required />
                    </div>
                    <div>
                      <label className="block text-sm">Username</label>
                      <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full border p-2 rounded" required />
                    </div>
                    <div>
                      <label className="block text-sm">Email</label>
                      <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full border p-2 rounded" required />
                    </div>
                    <div>
                      <label className="block text-sm">Password</label>
                      <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full border p-2 rounded" required />
                    </div>
                    <div>
                      <label className="block text-sm">Role</label>
                      <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className="w-full border p-2 rounded bg-white">
                        <option value="admin">Admin</option>
                        <option value="plant_manager">Plant Manager</option>
                        <option value="storekeeper">Storekeeper</option>
                        <option value="accountant">Accountant</option>
                        <option value="procurement">Procurement</option>
                        <option value="sales">Sales</option>
                        <option value="view_only">View Only</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setIsAddingUser(false)} className="px-4 py-2 border rounded">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">User</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Username</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Role</th>
                {canEdit && <th className="text-left py-3 px-4 font-semibold text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono">{user.username}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingUser(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit User">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleRestorePassword(user)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg text-xs font-semibold flex items-center gap-1" title="Restore Password">
                          <ArrowLeftRight className="w-3 h-3 animate-spin-hover" /> Restore Password
                        </button>
                        <button
                          onClick={async () => {
                            if (user.id === currentUser?.id) {
                              alert('You cannot delete your own account while logged in.');
                              return;
                            }
                            if (window.confirm(`Delete user ${user.name}?`)) {
                              await deleteUser(user.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit User Account</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Login Username</label>
                <input type="text" value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Access Role</label>
                <select
                  value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="admin">Admin</option>
                  <option value="plant_manager">Plant Manager</option>
                  <option value="storekeeper">Storekeeper</option>
                  <option value="accountant">Accountant</option>
                  <option value="procurement">Procurement</option>
                  <option value="sales">Sales</option>
                  <option value="view_only">View Only</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Updates</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SalesPage: React.FC = () => {
  const { currentUser, addMovement } = useStore();
  const salesRequests = useLiveQuery(() => db.salesRequests.orderBy('createdAt').reverse().toArray(), []);
  const inventoryApprovals = useLiveQuery(() => db.inventoryApprovals.orderBy('createdAt').reverse().toArray(), []);
  const items = useLiveQuery(() => db.items.toArray(), []);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [queueFilter, setQueueFilter] = useState<'sales' | 'inventory'>('sales');
  const [search, setSearch] = useState('');

  const canApprove = currentUser?.role === 'admin' || currentUser?.role === 'accountant' || currentUser?.role === 'sales';
  const canView = currentUser?.role === 'admin' || currentUser?.role === 'sales' || currentUser?.role === 'accountant';

  const filtered = (salesRequests || []).filter((r: any) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || r.itemName.toLowerCase().includes(q) || (r.customer || '').toLowerCase().includes(q) || (r.truckNumber || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const filteredInventoryApprovals = (inventoryApprovals || []).filter((r: any) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q || r.itemName.toLowerCase().includes(q) || (r.supplier || '').toLowerCase().includes(q) || (r.invoiceNumber || '').toLowerCase().includes(q) || (r.truckNumber || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const exportCsv = () => {
    const csv = Papa.unparse((queueFilter === 'sales' ? filtered : filteredInventoryApprovals).map((r: any) => queueFilter === 'sales' ? ({
      date: new Date(r.createdAt).toLocaleString(),
      queue: 'Sales',
      item: r.itemName,
      quantity: r.quantity,
      driverName: r.driverName,
      truck: r.truckNumber,
      customer: r.customer || '',
      destination: r.destination || '',
      createdBy: r.createdByName,
      status: r.status,
      approvedBy: r.approvedBy || '',
      approvedAt: r.approvedAt ? new Date(r.approvedAt).toLocaleString() : '',
    }) : ({
      date: new Date(r.createdAt).toLocaleString(),
      queue: 'Inventory Approval',
      item: r.itemName,
      quantity: r.quantity,
      unit: r.unit || '',
      supplier: r.supplier || '',
      invoiceNumber: r.invoiceNumber || '',
      truck: r.truckNumber || '',
      location: r.location || '',
      createdBy: r.createdByName,
      status: r.status,
      approvedBy: r.approvedBy || '',
      approvedAt: r.approvedAt ? new Date(r.approvedAt).toLocaleString() : '',
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${statusFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const approveRequest = async (req: any) => {
    const item = (items || []).find((i: any) => i.id === req.itemId);
    if (!item) {
      alert('Finished product not found.');
      return;
    }
    if (req.quantity > item.quantity) {
      alert('Cannot approve: requested quantity is greater than available stock.');
      return;
    }
    await db.salesRequests.update(req.id, {
      status: 'approved',
      approvedBy: currentUser?.username || currentUser?.name || 'Admin',
      approvedAt: Date.now(),
    } as any);
    await addMovement({
      itemId: req.itemId,
      itemName: req.itemName,
      type: 'issue',
      quantity: req.quantity,
      destination: req.destination || 'Customer Delivery',
      reference: `SALE-${req.id}`,
      createdBy: currentUser?.id || 'system',
      createdAt: Date.now(),
      user: currentUser?.username || currentUser?.name || 'Admin',
      issuedBy: currentUser?.username || currentUser?.name || 'Admin',
      receivedBy: req.customer || req.driverName || 'Customer',
      department: 'Sales',
      truckNumber: req.truckNumber,
      reason: `Sales delivery${req.customer ? ` to ${req.customer}` : ''}`,
      approvalStatus: 'approved',
    } as any);
    await persistNotification({
      type: 'sales',
      title: 'Sales Request Approved',
      message: `${req.quantity} of ${req.itemName} approved by ${currentUser?.username || currentUser?.name || 'Admin'}.`,
    });
  };

  const rejectRequest = async (req: any) => {
    await db.salesRequests.update(req.id, {
      status: 'rejected',
      approvedBy: currentUser?.username || currentUser?.name || 'Admin',
      approvedAt: Date.now(),
    } as any);
    await persistNotification({
      type: 'sales',
      title: 'Sales Request Rejected',
      message: `${req.quantity} of ${req.itemName} was rejected by ${currentUser?.username || currentUser?.name || 'Admin'}.`,
    });
  };

  const approveInventory = async (req: any) => {
    await db.inventoryApprovals.update(req.id, {
      status: 'approved',
      approvedBy: currentUser?.username || currentUser?.name || 'Approver',
      approvedAt: Date.now(),
    } as any);
    await persistNotification({
      type: 'inventory',
      title: 'Inventory Approval Approved',
      message: `${req.itemName} (${req.quantity} ${req.unit || ''}) approved by ${currentUser?.username || currentUser?.name || 'Approver'}.`,
    });
  };

  const rejectInventory = async (req: any) => {
    await db.inventoryApprovals.update(req.id, {
      status: 'rejected',
      approvedBy: currentUser?.username || currentUser?.name || 'Approver',
      approvedAt: Date.now(),
    } as any);
    await persistNotification({
      type: 'inventory',
      title: 'Inventory Approval Rejected',
      message: `${req.itemName} (${req.quantity} ${req.unit || ''}) rejected by ${currentUser?.username || currentUser?.name || 'Approver'}.`,
    });
  };

  if (!canView) {
    return <div className="p-6"><div className="bg-white rounded-xl p-6 shadow-sm text-gray-600">You do not have access to Sales.</div></div>;
  }

  const pendingCount = (salesRequests || []).filter((r: any) => r.status === 'pending').length;
  const approvedCount = (salesRequests || []).filter((r: any) => r.status === 'approved').length;
  const rejectedCount = (salesRequests || []).filter((r: any) => r.status === 'rejected').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sales Dashboard</h2>
          <p className="text-gray-500">Manage finished product sales requests, approvals, and delivery history.</p>
        </div>
        <button onClick={exportCsv} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm"><p className="text-sm text-gray-500">Pending Approval</p><p className="text-3xl font-bold text-amber-600">{pendingCount}</p></div>
        <div className="bg-white rounded-xl p-5 shadow-sm"><p className="text-sm text-gray-500">Approved</p><p className="text-3xl font-bold text-green-600">{approvedCount}</p></div>
        <div className="bg-white rounded-xl p-5 shadow-sm"><p className="text-sm text-gray-500">Rejected</p><p className="text-3xl font-bold text-red-600">{rejectedCount}</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={queueFilter === 'sales' ? 'Search item, customer, truck...' : 'Search item, supplier, invoice, truck...'} className="w-full pl-9 pr-3 py-2 border rounded-lg" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-3 py-2 border rounded-lg bg-white">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <div className="inline-flex rounded-lg overflow-hidden border">
            <button onClick={() => setQueueFilter('sales')} className={`px-3 py-2 text-sm ${queueFilter === 'sales' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>Sales Queue</button>
            <button onClick={() => setQueueFilter('inventory')} className={`px-3 py-2 text-sm ${queueFilter === 'inventory' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>Inventory Approvals</button>
          </div>
        </div>
      </div>

      {queueFilter === 'sales' ? (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Qty</th>
                <th className="text-left px-4 py-3">Driver</th>
                <th className="text-left px-4 py-3">Truck</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Destination</th>
                <th className="text-left px-4 py-3">Requested By</th>
                <th className="text-left px-4 py-3">Status</th>
                {canApprove && <th className="text-left px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((req: any) => (
                <tr key={req.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{new Date(req.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">{req.itemName}</td>
                  <td className="px-4 py-3">{req.quantity}</td>
                  <td className="px-4 py-3">{req.driverName}</td>
                  <td className="px-4 py-3">{req.truckNumber}</td>
                  <td className="px-4 py-3">{req.customer || '-'}</td>
                  <td className="px-4 py-3">{req.destination || '-'}</td>
                  <td className="px-4 py-3">{req.createdByName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${req.status === 'pending' ? 'bg-amber-100 text-amber-700' : req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {req.status.toUpperCase()}
                    </span>
                  </td>
                  {canApprove && (
                    <td className="px-4 py-3">
                      {req.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => approveRequest(req)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs">Approve</button>
                          <button onClick={() => rejectRequest(req)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs">Reject</button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">{req.approvedBy ? `By ${req.approvedBy}` : '-'}</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Mode</th>
                <th className="text-left px-4 py-3">Item</th>
                <th className="text-left px-4 py-3">Qty</th>
                <th className="text-left px-4 py-3">Supplier</th>
                <th className="text-left px-4 py-3">Invoice</th>
                <th className="text-left px-4 py-3">Truck</th>
                <th className="text-left px-4 py-3">Location</th>
                <th className="text-left px-4 py-3">Requested By</th>
                <th className="text-left px-4 py-3">Status</th>
                {canApprove && <th className="text-left px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredInventoryApprovals.map((req: any) => (
                <tr key={req.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{new Date(req.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 capitalize">{String(req.mode).replace('_', ' ')}</td>
                  <td className="px-4 py-3 font-medium">{req.itemName}</td>
                  <td className="px-4 py-3">{req.quantity} {req.unit || ''}</td>
                  <td className="px-4 py-3">{req.supplier || '-'}</td>
                  <td className="px-4 py-3">{req.invoiceNumber || '-'}</td>
                  <td className="px-4 py-3">{req.truckNumber || '-'}</td>
                  <td className="px-4 py-3">{req.location || '-'}</td>
                  <td className="px-4 py-3">{req.createdByName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${req.status === 'pending' ? 'bg-amber-100 text-amber-700' : req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {req.status.toUpperCase()}
                    </span>
                  </td>
                  {canApprove && (
                    <td className="px-4 py-3">
                      {req.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => approveInventory(req)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs">Approve</button>
                          <button onClick={() => rejectInventory(req)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs">Reject</button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">{req.approvedBy ? `By ${req.approvedBy}` : '-'}</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ReportsPage: React.FC = () => {
  const { items, movements, productionPlans } = useStore();
  const [filterType, setFilterType] = React.useState('all');

  const inventoryValue = items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const totalMovements = movements.length;
  const totalProduction = productionPlans.reduce((acc, p) => acc + p.actualQuantity, 0);
  const completedPlans = productionPlans.filter((p) => p.status === 'completed').length;

  const handleExportCSV = () => {
    let filteredItems = items;
    if (filterType !== 'all') {
      filteredItems = items.filter(i => i.type === filterType);
    }
    const headers = ['Item Name', 'Code', 'Type', 'Quantity', 'Unit', 'Unit Price', 'Total Value'];
    const rows = filteredItems.map(item => [
      item.name,
      item.code,
      item.type.replace('_', ' ').toUpperCase(),
      item.quantity,
      item.unit,
      formatCurrency(item.price),
      formatCurrency(item.quantity * item.price)
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Complete_Inventory_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Inventory Value</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(inventoryValue)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Movements</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{totalMovements}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <ArrowLeftRight className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Produced</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{totalProduction}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Box className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completed Plans</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{completedPlans}</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <Check className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Inventory Report</h3>
          <div className="flex gap-4">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Categories</option>
              <option value="raw_material">Raw Materials</option>
              <option value="finished_product">Finished Products</option>
              <option value="stored_item">Stored Items</option>
            </select>
            <button 
              onClick={handleExportCSV}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-semibold shadow-sm"
            >
              Export Report
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Item</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Quantity</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Unit Price</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-4 capitalize">{item.type.replace('_', ' ')}</td>
                  <td className="py-3 px-4">{item.quantity} {item.unit}</td>
                  <td className="py-3 px-4">{formatCurrency(item.price)}</td>
                  <td className="py-3 px-4 font-semibold">{formatCurrency(item.quantity * item.price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={4} className="py-3 px-4 text-right">Total Inventory Value:</td>
                <td className="py-3 px-4 text-blue-600">{formatCurrency(inventoryValue)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const { currentUser } = useStore();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [password, setPassword] = useState(currentUser?.password || '');
  const [picture, setPicture] = useState(currentUser?.picture || '');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !username || !password) {
      alert('Please fill all required fields.');
      return;
    }

    try {
      const updatedUser = {
        ...currentUser!,
        name,
        email,
        phone,
        username,
        password,
        picture,
      };

      // Save to IndexedDB
      await db.table('users').put(updatedUser);
      
      // Update store
      useStore.setState({ currentUser: updatedUser });

      alert('Profile updated permanently in the database!');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile changes.');
    }
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          {picture ? (
            <img src={picture} alt="Profile" className="w-20 h-20 rounded-full object-cover border" />
          ) : (
            <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold border">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{name || 'User Profile'}</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded capitalize">{currentUser?.role.replace('_', ' ')}</span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
              <input type="file" accept="image/*" onChange={handlePictureChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
          </div>

          <hr className="my-4" />

          <h3 className="font-semibold text-gray-800 mb-2">Login Credentials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm">
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">System Settings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-blue-600" /> Warehouse Operations
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">Auto-Sync Database</p>
                <p className="text-xs text-gray-500">Real-time persistence via IndexedDB</p>
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">Active</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">Minimum Stock Threshold</p>
                <p className="text-xs text-gray-500">Default fallback for alert flags</p>
              </div>
              <span className="font-semibold">20 units</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" /> Logistics & Auditing
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">Invoice Upload Mandate</p>
                <p className="text-xs text-gray-500">Require attachments on stock receive</p>
              </div>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">Recommended</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium">Audit Trailing</p>
                <p className="text-xs text-gray-500">Log all manual adjustments atomically</p>
              </div>
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-700">{message}</p>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const CategoryManagementPage: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, setActiveTab } = useStore();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const customCategories = categories.filter(
    (c) => !['raw_material', 'finished_product', 'stored_item'].includes(c)
  );

  const startCategoryEdit = (category: string) => {
    setEditingCategory(category);
    setEditingCategoryName(category.replace(/_/g, ' '));
  };

  const handleSaveCategoryEdit = async () => {
    if (!editingCategory || !editingCategoryName.trim()) return;
    const newId = editingCategoryName.trim().toLowerCase().replace(/\s+/g, '_');
    await updateCategory(editingCategory, newId);
    setEditingCategory(null);
    setEditingCategoryName('');
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const catId = newCategoryName.trim().toLowerCase().replace(/\s+/g, '_');
    await addCategory(catId);
    setNewCategoryName('');
    setActiveTab(`category-${catId}`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-5 text-white">
        <h2 className="text-2xl font-bold">Category Management</h2>
        <p className="mt-1 text-sm text-blue-100">
          Create, edit, and remove custom inventory categories.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Add New Category</h3>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category Name</label>
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                type="text"
                placeholder="e.g. Packaging Materials"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Create Category
            </button>
          </form>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-3">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Manage Custom Categories</h3>
          <div className="space-y-3">
            {customCategories.map((cat) => (
              <div
                key={cat}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                {editingCategory === cat ? (
                  <input
                    value={editingCategoryName}
                    onChange={(e) => setEditingCategoryName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div>
                    <p className="font-semibold capitalize text-gray-800">{cat.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">ID: {cat}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {editingCategory === cat ? (
                    <>
                      <button
                        onClick={handleSaveCategoryEdit}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingCategory(null);
                          setEditingCategoryName('');
                        }}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startCategoryEdit(cat)}
                        className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setCategoryToDelete(cat)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {customCategories.length === 0 && (
              <p className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-sm text-gray-500">
                No custom categories created yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(categoryToDelete)}
        title="Delete Category"
        message={
          categoryToDelete
            ? `Are you sure you want to delete "${categoryToDelete.replace(/_/g, ' ')}"?`
            : ''
        }
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={async () => {
          if (!categoryToDelete) return;
          await deleteCategory(categoryToDelete);
          setCategoryToDelete(null);
          setActiveTab('dashboard');
        }}
      />
    </div>
  );
};

const DepartmentManagementPage: React.FC = () => {
  const { departments, addDepartment, updateDepartment, deleteDepartment, currentUser } = useStore();
  const [newDepartment, setNewDepartment] = useState('');
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null);
  const [editingDepartmentName, setEditingDepartmentName] = useState('');
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null);

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'plant_manager' || currentUser?.role === 'storekeeper';

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepartment.trim()) return;
    await addDepartment(newDepartment.trim());
    setNewDepartment('');
  };

  const startDepartmentEdit = (department: string) => {
    setEditingDepartment(department);
    setEditingDepartmentName(department);
  };

  const handleSaveDepartmentEdit = async () => {
    if (!editingDepartment || !editingDepartmentName.trim()) return;
    await updateDepartment(editingDepartment, editingDepartmentName.trim());
    setEditingDepartment(null);
    setEditingDepartmentName('');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 px-6 py-5 text-white">
        <h2 className="text-2xl font-bold">Department Management</h2>
        <p className="mt-1 text-sm text-emerald-100">
          Maintain all departments used in stock issue, reporting, and movement tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {canManage && (
          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">Add Department</h3>
            <form onSubmit={handleAddDepartment} className="space-y-4">
              <input
                type="text"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                placeholder="e.g. Engineering, Procurement, Warehouse"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                required
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-700"
              >
                Add Department
              </button>
            </form>
          </div>
        )}

        <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-3">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Departments</h3>
          <div className="space-y-3">
            {departments.map((department) => (
              <div
                key={department}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                {editingDepartment === department ? (
                  <input
                    value={editingDepartmentName}
                    onChange={(e) => setEditingDepartmentName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                  />
                ) : (
                  <span className="font-semibold text-gray-800">{department}</span>
                )}

                {canManage && (
                  <div className="flex items-center gap-2">
                    {editingDepartment === department ? (
                      <>
                        <button
                          onClick={handleSaveDepartmentEdit}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingDepartment(null);
                            setEditingDepartmentName('');
                          }}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startDepartmentEdit(department)}
                          className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDepartmentToDelete(department)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}

            {departments.length === 0 && (
              <p className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-sm text-gray-500">
                No departments found.
              </p>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(departmentToDelete)}
        title="Delete Department"
        message={
          departmentToDelete
            ? `Are you sure you want to delete "${departmentToDelete}"?`
            : ''
        }
        onCancel={() => setDepartmentToDelete(null)}
        onConfirm={async () => {
          if (!departmentToDelete) return;
          await deleteDepartment(departmentToDelete);
          setDepartmentToDelete(null);
        }}
      />
    </div>
  );
};

const TruckManagementPage: React.FC = () => {
  const trucks = useLiveQuery(() => db.trucks.toArray(), []);
  const movements = useLiveQuery(() => db.movements.toArray(), []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [newTruck, setNewTruck] = useState('');
  const [editingTruckId, setEditingTruckId] = useState<string | null>(null);
  const [editingTruckNumber, setEditingTruckNumber] = useState('');
  const [truckToDelete, setTruckToDelete] = useState<any | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<any | null>(null);

  const filteredTrucks = (trucks || []).filter((truck) => {
    const matchesSearch = truck.number.toLowerCase().includes(searchTerm.toLowerCase()) || (truck.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : truck.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedTruckHistory = useMemo(() => {
    if (!selectedTruck) return [] as any[];
    return (movements || [])
      .filter((m) => (m.truckNumber || '').trim().toLowerCase() === selectedTruck.number.trim().toLowerCase())
      .sort((a, b) => {
        const aTime = new Date(String(a.date || a.createdAt || Date.now())).getTime();
        const bTime = new Date(String(b.date || b.createdAt || Date.now())).getTime();
        return bTime - aTime;
      });
  }, [movements, selectedTruck]);

  const addTruckRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const number = newTruck.trim();
    if (!number) return;
    const exists = await db.trucks.where('number').equalsIgnoreCase(number).first();
    if (!exists) {
      await db.trucks.put({ id: `trk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, number, description: '', status: 'active', createdAt: Date.now() } as any);
    }
    setNewTruck('');
  };

  const saveTruckEdit = async () => {
    if (!editingTruckId || !editingTruckNumber.trim()) return;
    await db.trucks.update(editingTruckId, { number: editingTruckNumber.trim() } as any);
    setEditingTruckId(null);
    setEditingTruckNumber('');
  };

  const exportTruckReport = (truck?: any) => {
    const targetHistory = truck
      ? (movements || []).filter((m) => (m.truckNumber || '').trim().toLowerCase() === truck.number.trim().toLowerCase())
      : (movements || []).filter((m) => m.truckNumber);
    const rows = [
      ['Date', 'Truck', 'Item', 'Type', 'Quantity', 'Supplier', 'Location', 'Invoice Number', 'Reason'],
      ...targetHistory.map((m) => [
        new Date(String(m.date || m.createdAt)).toISOString().split('T')[0],
        m.truckNumber || '-',
        m.itemName || '-',
        m.type || '-',
        m.quantity || 0,
        m.supplier || '-',
        m.location || (m as any).destination || '-',
        m.invoiceNumber || '-',
        m.reason || '-',
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = truck ? `${truck.number}_history.csv` : 'truck_report.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (selectedTruck) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <button onClick={() => setSelectedTruck(null)} className="text-sm text-blue-600 hover:underline mb-2">← Back to Trucks</button>
            <h2 className="text-2xl font-bold text-gray-900">Truck {selectedTruck.number}</h2>
            <p className="text-sm text-gray-500 mt-1">Truck movement history and delivery tracking</p>
          </div>
          <button onClick={() => exportTruckReport(selectedTruck)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Export Report</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-4 shadow-sm"><p className="text-sm text-gray-500">Transactions</p><p className="text-2xl font-bold">{selectedTruckHistory.length}</p></div>
          <div className="bg-white rounded-xl border p-4 shadow-sm"><p className="text-sm text-gray-500">Total Quantity</p><p className="text-2xl font-bold">{selectedTruckHistory.reduce((s, m) => s + Number(m.quantity || 0), 0)}</p></div>
          <div className="bg-white rounded-xl border p-4 shadow-sm"><p className="text-sm text-gray-500">Unique Items</p><p className="text-2xl font-bold">{new Set(selectedTruckHistory.map((m) => m.itemId)).size}</p></div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50"><h3 className="text-lg font-semibold">Truck History</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-600 uppercase text-xs">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Item</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Quantity</th>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Invoice No.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedTruckHistory.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{(() => { const d = new Date(String(m.date || m.createdAt || Date.now())); return Number.isNaN(d.getTime()) ? '-' : d.toISOString().split('T')[0]; })()}</td>
                    <td className="px-4 py-3">{m.itemName}</td>
                    <td className="px-4 py-3">{m.type}</td>
                    <td className="px-4 py-3">{m.quantity}</td>
                    <td className="px-4 py-3">{m.supplier || '-'}</td>
                    <td className="px-4 py-3">{m.location || (m as any).destination || '-'}</td>
                    <td className="px-4 py-3">{m.invoiceNumber || '-'}</td>
                  </tr>
                ))}
                {selectedTruckHistory.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">No truck history found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Truck Management</h2>
          <p className="text-gray-500">Manage trucks, filter history, and export reports</p>
        </div>
        <button onClick={() => exportTruckReport()} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Export All Trucks Report</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Add Truck</h3>
          <form onSubmit={addTruckRecord} className="space-y-4">
            <input value={newTruck} onChange={(e) => setNewTruck(e.target.value)} type="text" placeholder="Truck number" className="w-full rounded-lg border border-gray-300 px-3 py-2" required />
            <button type="submit" className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700">Add Truck</button>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm lg:col-span-3">
          <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between mb-4">
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search truck..." className="w-full md:max-w-sm rounded-lg border border-gray-300 px-3 py-2" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="rounded-lg border border-gray-300 px-3 py-2 bg-white">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="space-y-3">
            {filteredTrucks.map((truck) => (
              <div key={truck.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {editingTruckId === truck.id ? (
                    <input value={editingTruckNumber} onChange={(e) => setEditingTruckNumber(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" />
                  ) : (
                    <>
                      <p className="font-semibold text-gray-800">{truck.number}</p>
                      <p className="text-xs text-gray-500">Transactions: {(movements || []).filter((m) => (m.truckNumber || '').trim().toLowerCase() === truck.number.trim().toLowerCase()).length}</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingTruckId === truck.id ? (
                    <>
                      <button onClick={saveTruckEdit} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Save</button>
                      <button onClick={() => { setEditingTruckId(null); setEditingTruckNumber(''); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setSelectedTruck(truck)} className="rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50">View</button>
                      <button onClick={() => { setEditingTruckId(truck.id); setEditingTruckNumber(truck.number); }} className="rounded-lg border border-emerald-200 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50">Edit</button>
                      <button onClick={() => setTruckToDelete(truck)} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50">Delete</button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {filteredTrucks.length === 0 && <p className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-sm text-gray-500">No trucks found.</p>}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(truckToDelete)}
        title="Delete Truck"
        message={truckToDelete ? `Are you sure you want to delete truck "${truckToDelete.number}"?` : ''}
        onCancel={() => setTruckToDelete(null)}
        onConfirm={async () => {
          if (!truckToDelete) return;
          await db.trucks.delete(truckToDelete.id);
          setTruckToDelete(null);
        }}
      />
    </div>
  );
};

const MainContent: React.FC = () => {
  const { activeTab, notifications, setNotifications, currentUser } = useStore();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'raw-materials':
        return <InventoryList type="raw_material" />;
      case 'finished-products':
        return <InventoryList type="finished_product" />;
      case 'stored-items':
        return <InventoryList type="stored_item" />;
      case 'add-category':
        return <CategoryManagementPage />;
      case 'movements':
        return <MovementsPage />;
      case 'supplier-list':
      case 'supplier-history':
      case 'supplier-reports':
      case 'suppliers':
        return <SupplierManagement />;
      case 'trucks':
        return <TruckManagementPage />;
      case 'departments':
        return <DepartmentManagementPage />;
      case 'production-plan':
        return <ProductionPlanPage />;
      case 'daily-achievements':
        return <DailyAchievements />;
      case 'messages':
        return <MessagesPage />;
      case 'sales':
        return <SalesPage />;
      case 'notifications':
        return (
          <NotificationsDashboard 
            notifications={notifications} 
            setNotifications={setNotifications} 
            isAdmin={currentUser?.role === 'admin' || currentUser?.role === 'accountant' || currentUser?.role === 'sales'} 
          />
        );
      case 'users':
        return <UsersPage />;
      case 'reports':
        return <ReportsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        if (activeTab.startsWith('category-')) {
          const catName = activeTab.replace('category-', '');
          return <InventoryList type={catName as any} />;
        }
        return <Dashboard />;
    }
  };

  return (
    <main className="flex-1 bg-gray-50 overflow-auto md:ml-64 min-h-screen pt-[72px] md:pt-0">
      <Header />
      {renderContent()}
    </main>
  );
};

const App: React.FC = () => {
  const { currentUser, setNotifications, setActiveTab } = useStore();
  
  // Real-time synchronization with IndexedDB
  const items = useLiveQuery(() => db.items.toArray());
  const movements = useLiveQuery(() => db.movements.toArray());
  const usersFromDb = useLiveQuery(() => db.users.toArray());
  const suppliersFromDb = useLiveQuery(() => db.suppliers.toArray());
  const savedCategories = useLiveQuery(() => db.categories.toArray());
  const savedDepartments = useLiveQuery(() => db.departments.toArray());
  const productionPlans = useLiveQuery(() => db.productionPlans.toArray());
  const messages = useLiveQuery(() => db.messages.toArray());
  const notifications = useLiveQuery(() => db.notifications.orderBy('timestamp').reverse().toArray());



  useEffect(() => {
    const handleNavigateTab = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail) setActiveTab(customEvent.detail);
    };
    window.addEventListener('navigate-tab', handleNavigateTab as EventListener);
    return () => window.removeEventListener('navigate-tab', handleNavigateTab as EventListener);
  }, [setActiveTab]);

  useEffect(() => {
    const seedUsers = async () => {
      const existingUsers = await db.users.count();
      if (existingUsers === 0) {
        await db.users.bulkPut(initialUsers as any[]);
      }

      const existingTrucks = await db.trucks.count();
      if (existingTrucks === 0) {
        await db.trucks.bulkPut([
          { id: 'trk-1', number: 'TRK-001', description: 'Main delivery truck', status: 'active', createdAt: Date.now() },
          { id: 'trk-2', number: 'TRK-002', description: 'Raw material truck', status: 'active', createdAt: Date.now() },
          { id: 'trk-3', number: 'TRK-003', description: 'Finished goods truck', status: 'active', createdAt: Date.now() },
        ] as any[]);
      }

      const existingLocations = await db.locations.count();
      if (existingLocations === 0) {
        await db.locations.bulkPut([
          { id: 'loc-1', name: 'Warehouse A', description: 'Main warehouse', createdAt: Date.now() },
          { id: 'loc-2', name: 'Warehouse B', description: 'Secondary warehouse', createdAt: Date.now() },
          { id: 'loc-3', name: 'Cold Storage', description: 'Temperature controlled area', createdAt: Date.now() },
          { id: 'loc-4', name: 'Production Floor', description: 'Production receiving area', createdAt: Date.now() },
        ] as any[]);
      }

      const existingDepartments = await db.departments.count();
      if (existingDepartments === 0) {
        const defaultDepartments = ['Production', 'Maintenance', 'Quality Control', 'Sales', 'Admin'];
        await db.departments.bulkPut(
          defaultDepartments.map((name, index) => ({
            id: `dept-${index + 1}`,
            name,
            createdAt: Date.now(),
          }))
        );
      }

      const existingSuppliers = await db.suppliers.count();
      if (existingSuppliers === 0) {
        const sampleSuppliers = Array.from({ length: 5 }, (_, i) => ({
          id: `sup-${i + 1}`,
          name: `Supplier ${i + 1}`,
          email: `info@supplier${i + 1}.com`,
          phone: `+2557000000${i + 1}`,
          address: `${100 + i} Industrial Boulevard`,
          status: 'active' as const,
          totalSupplied: 0,
          transactions: 0,
          lastActivity: Date.now(),
        }));
        await db.suppliers.bulkPut(sampleSuppliers as any[]);
      }
    };
    seedUsers();
  }, []);

  useEffect(() => {
    if (usersFromDb) {
      useStore.setState((state) => {
        const mergedUsers = usersFromDb.length > 0 ? (usersFromDb as User[]) : state.users;
        const syncedCurrentUser = state.currentUser
          ? mergedUsers.find((user) => user.id === state.currentUser?.id) || state.currentUser
          : null;
        return { users: mergedUsers, currentUser: syncedCurrentUser };
      });
    }
  }, [usersFromDb]);

  useEffect(() => {
    if (suppliersFromDb) {
      useStore.setState({ suppliers: suppliersFromDb as any[] } as any);
    }
  }, [suppliersFromDb]);

  useEffect(() => {
    if (savedCategories) {
      useStore.setState(() => {
        const baseCategories = ['raw_material', 'finished_product', 'stored_item'];
        const ordered = [...baseCategories, ...savedCategories.map((c) => c.name.trim().toLowerCase())];
        const uniqueCategories = Array.from(new Map(ordered.map((c) => [c.toLowerCase(), c])).values());
        return { categories: uniqueCategories };
      });
    }
  }, [savedCategories]);

  useEffect(() => {
    if (savedDepartments) {
      useStore.setState(() => {
        const baseDepartments = ['Production', 'Maintenance', 'Quality Control', 'Sales', 'Admin'];
        const ordered = [...baseDepartments, ...savedDepartments.map((d) => d.name.trim())];
        const uniqueDepartments = Array.from(new Map(ordered.map((d) => [d.toLowerCase(), d])).values());
        return { departments: uniqueDepartments };
      });
    }
  }, [savedDepartments]);

  useEffect(() => {
    const seedInitialData = async () => {
      if (items && items.length === 0) {
        // Create 20 Raw Materials
        const rawMaterials = Array.from({ length: 20 }, (_, i) => ({
          id: `raw-${i + 1}`,
          name: `Raw Material Spec ${i + 1}`,
          code: `RM-${100 + i}`,
          category: 'raw_material',
          type: 'raw_material',
          quantity: 100 + i * 10,
          minStock: 20,
          unit: 'kg',
          price: 15 + i,
          supplier: `Supplier ${1 + (i % 5)}`,
          location: `Zone A-Shelf ${1 + (i % 10)}`,
          description: `Automatic sample raw material ${i + 1}`,
          createdAt: Date.now()
        }));

        // Create 20 Finished Products
        const finishedProducts = Array.from({ length: 20 }, (_, i) => ({
          id: `fin-${i + 1}`,
          name: `Finished Product Model ${String.fromCharCode(65 + i)}`,
          code: `FP-${200 + i}`,
          category: 'finished_product',
          type: 'finished_product',
          quantity: 50 + i * 5,
          minStock: 10,
          unit: 'pcs',
          price: 120 + i * 5,
          supplier: `Supplier ${1 + (i % 3)}`,
          location: `Zone B-Row ${1 + (i % 5)}`,
          description: `Automatic sample finished unit ${i + 1}`,
          createdAt: Date.now()
        }));

        // Create 20 Stored Items
        const storedItems = Array.from({ length: 20 }, (_, i) => ({
          id: `stor-${i + 1}`,
          name: `Consumable Item #${i + 1}`,
          code: `CS-${300 + i}`,
          category: 'stored_item',
          type: 'stored_item',
          quantity: 200 + i * 20,
          minStock: 30,
          unit: 'liters',
          price: 5 + i,
          supplier: `Supplier ${1 + (i % 4)}`,
          location: `Zone C-Bin ${1 + (i % 8)}`,
          description: `Automatic sample consumable item ${i + 1}`,
          createdAt: Date.now()
        }));

        const allItems = [...rawMaterials, ...finishedProducts, ...storedItems].map(item => ({
          ...item,
          totalReceived: item.quantity,
          totalIssued: 0
        }));
        await db.items.bulkAdd(allItems as any[]);

        // Add Movements (In-Stock & Out-Stock)
        const DEMO_INVOICE_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAWElEQVR4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeDAxaAABj77mzwAAAABJRU5ErkJggg==';
        const sampleMovements: any[] = [];
        for (const item of allItems) {
          sampleMovements.push({
            id: `mov-in-${item.id}`,
            itemId: item.id,
            itemName: item.name,
            type: 'receive',
            quantity: item.quantity,
            destination: item.location || '',
            reference: 'PO-2024-INITIAL',
            supplier: item.supplier || '',
            invoiceNumber: `INV-2024-${item.id}`,
            truckNumber: `TRUCK-${item.id}`,
            user: 'System Administrator',
            createdAt: Date.now() - 86400000 * 5,
            date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
            receivedBy: 'System Administrator',
            invoiceFile: DEMO_INVOICE_IMAGE,
            invoiceFileType: 'image/png'
          });

          // Add Out-Stock movement for some items
          if (Math.random() > 0.4) {
            const issueQty = Math.floor(item.quantity * 0.3);
            sampleMovements.push({
              id: `mov-out-${item.id}`,
              itemId: item.id,
              itemName: item.name,
              type: 'issue',
              quantity: issueQty,
              destination: 'Production Line A',
              reference: 'MO-2024-REQ',
              user: 'System Administrator',
              createdAt: Date.now() - 86400000 * 2,
              date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
              receivedBy: 'Line Supervisor',
              reason: 'Production Use',
              department: 'Manufacturing'
            });
            item.quantity -= issueQty;
            item.totalIssued += issueQty;
          }
        }
        await db.items.bulkPut(allItems as any[]);
        await db.movements.bulkAdd(sampleMovements as any[]);

        // Add 5 Sample Suppliers
        const sampleSuppliers = Array.from({ length: 5 }, (_, i) => ({
          id: `sup-${i + 1}`,
          name: `Supplier ${i + 1}`,
          email: `info@supplier${i + 1}.com`,
          phone: `+1-555-010${i + 1}`,
          address: `${100 + i} Industrial Boulevard`,
          status: 'active' as const,
          totalSupplied: 1000 + i * 200,
          transactions: 5 + i,
          lastActivity: Date.now(),
          createdAt: Date.now()
        }));
        await db.suppliers.bulkAdd(sampleSuppliers as any[]);

        // Add Sample Production Plans & Achievements Demo
        const samplePlans = Array.from({ length: 5 }, (_, i) => ({
          id: `plan-${i + 1}`,
          date: new Date(Date.now() + 86400000 * i).toISOString().split('T')[0],
          product: `Finished Product Model ${String.fromCharCode(65 + i)}`,
          target: 100 + i * 20,
          actual: i === 0 ? 110 : 0,
          manpower: 10 + i,
          status: i === 0 ? 'completed' : 'planned' as const,
          shift: 'morning' as const,
          createdAt: Date.now()
        }));
        await db.productionPlans.bulkAdd(samplePlans as any[]);
      }
    };
    seedInitialData();
  }, [items]);

  useEffect(() => {
    if (items) useStore.setState({ items: items as any[] });
  }, [items]);

  useEffect(() => {
    if (movements) useStore.setState({ movements: movements as any[] });
  }, [movements]);

  useEffect(() => {
    if (productionPlans) useStore.setState({ productionPlans: productionPlans as any[] });
  }, [productionPlans]);

  useEffect(() => {
    if (messages) useStore.setState({ messages: messages as any[] });
  }, [messages]);

  useEffect(() => {
    if (notifications) setNotifications(notifications as any[]);
  }, [notifications, setNotifications]);

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MainContent />
    </div>
  );
};

export default App;
