import React, { useState, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download, 
  FileText,
  Users,
  Eye,
  X,
  Printer,
  ArrowLeft,
  Box,
  Package,
  Calendar
} from 'lucide-react';

// Types - Simplified for clarity
interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  totalItems: number;
  totalQuantity: number;
  totalTransactions: number;
  lastTransaction?: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

interface SupplierTransaction {
  id: string;
  supplierId: string;
  itemName: string;
  quantity: number;
  unit: string;
  type: 'receive' | 'issue';
  date: string;
  invoiceNumber?: string;
  truckNumber?: string;
  notes?: string;
}

// Zustand store for suppliers data
interface SupplierStore {
  suppliers: Supplier[];
  transactions: SupplierTransaction[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'totalItems' | 'totalQuantity' | 'totalTransactions'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addTransaction: (transaction: Omit<SupplierTransaction, 'id'>) => void;
  getSupplierTransactions: (supplierId: string) => SupplierTransaction[];
}

const useSupplierStore = create<SupplierStore>()(
  persist(
    (set, get) => ({
      suppliers: [
        { id: '1', name: 'ABC Steel Corporation', contactPerson: 'John Smith', phone: '+1-555-0100', email: 'john@abcsteel.com', address: '123 Industrial Ave, City A', totalItems: 5, totalQuantity: 430, totalTransactions: 8, lastTransaction: '2024-01-25', createdAt: '2024-01-01', status: 'active' },
        { id: '2', name: 'Global Trading Co', contactPerson: 'Maria Garcia', phone: '+1-555-0101', email: 'maria@globaltrading.com', address: '456 Commerce St, City B', totalItems: 3, totalQuantity: 150, totalTransactions: 5, lastTransaction: '2024-01-24', createdAt: '2024-01-05', status: 'active' },
        { id: '3', name: 'XYZ Materials Ltd', contactPerson: 'David Lee', phone: '+1-555-0102', email: 'david@xyzmat.com', address: '789 Supply Rd, City C', totalItems: 4, totalQuantity: 200, totalTransactions: 6, lastTransaction: '2024-01-23', createdAt: '2024-01-08', status: 'active' },
        { id: '4', name: 'Quality Parts Inc', contactPerson: 'Sarah Wilson', phone: '+1-555-0103', email: 'sarah@qualityparts.com', address: '321 Factory Ln, City D', totalItems: 2, totalQuantity: 85, totalTransactions: 3, lastTransaction: '2024-01-20', createdAt: '2024-01-10', status: 'inactive' },
      ],
      transactions: [
        { id: '1', supplierId: '1', itemName: 'Steel Sheet', quantity: 50, unit: 'pcs', type: 'receive', date: '2024-01-25', invoiceNumber: 'INV-001', truckNumber: 'TR-001' },
        { id: '2', supplierId: '1', itemName: 'Steel Beams', quantity: 100, unit: 'pcs', type: 'receive', date: '2024-01-20', invoiceNumber: 'INV-002', truckNumber: 'TR-002' },
        { id: '3', supplierId: '1', itemName: 'Steel Rods', quantity: 200, unit: 'pcs', type: 'receive', date: '2024-01-15', invoiceNumber: 'INV-003', truckNumber: 'TR-001' },
        { id: '4', supplierId: '1', itemName: 'Steel Plates', quantity: 80, unit: 'pcs', type: 'receive', date: '2024-01-10', invoiceNumber: 'INV-004', truckNumber: 'TR-003' },
        { id: '5', supplierId: '2', itemName: 'Plastic Granules', quantity: 50, unit: 'kg', type: 'receive', date: '2024-01-24', invoiceNumber: 'INV-005', truckNumber: 'TR-004' },
        { id: '6', supplierId: '2', itemName: 'Packaging Material', quantity: 100, unit: 'rolls', type: 'receive', date: '2024-01-18', invoiceNumber: 'INV-006', truckNumber: 'TR-004' },
        { id: '7', supplierId: '3', itemName: 'Aluminum Bars', quantity: 80, unit: 'pcs', type: 'receive', date: '2024-01-23', invoiceNumber: 'INV-007', truckNumber: 'TR-005' },
        { id: '8', supplierId: '3', itemName: 'Aluminum Sheets', quantity: 120, unit: 'pcs', type: 'receive', date: '2024-01-15', invoiceNumber: 'INV-008', truckNumber: 'TR-005' },
      ],
      addSupplier: (supplier) => set((state) => ({ 
        suppliers: [...state.suppliers, { 
          ...supplier, 
          id: Date.now().toString(), 
          createdAt: new Date().toISOString().split('T')[0],
          totalItems: 0,
          totalQuantity: 0,
          totalTransactions: 0
        }] 
      })),
      updateSupplier: (id, updates) => set((state) => ({ 
        suppliers: state.suppliers.map((s) => s.id === id ? { ...s, ...updates } : s) 
      })),
      deleteSupplier: (id) => set((state) => ({ 
        suppliers: state.suppliers.filter((s) => s.id !== id),
        transactions: state.transactions.filter((t) => t.supplierId !== id)
      })),
      addTransaction: (transaction) => set((state) => {
        const newTransaction = { ...transaction, id: Date.now().toString() };
        // Update supplier stats
        const targetSupplierId = transaction.supplierId;
        const updatedSuppliers = state.suppliers.map((s) => {
          if (s.id === targetSupplierId) {
            return {
              ...s,
              totalTransactions: s.totalTransactions + 1,
              totalQuantity: s.totalQuantity + transaction.quantity,
              totalItems: s.totalItems + 1,
              lastTransaction: transaction.date
            };
          }
          return s;
        });
        return { 
          suppliers: updatedSuppliers,
          transactions: [...state.transactions, newTransaction] 
        };
      }),
      getSupplierTransactions: (supplierId) => {
        return get().transactions.filter((t) => t.supplierId === supplierId);
      }
    }),
    { name: 'supplier-data-store' }
  )
);

// ============ SUPPLIER LIST PAGE ============
const SupplierListPage: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSupplierStore();
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    status: 'active' as 'active' | 'inactive'
  });

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [suppliers, searchTerm, filterStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, formData);
    } else {
      addSupplier(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', contactPerson: '', phone: '', email: '', address: '', status: 'active' });
    setEditingSupplier(null);
    setShowModal(false);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      status: supplier.status
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      deleteSupplier(id);
    }
  };

  // Export all suppliers to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Contact Person', 'Phone', 'Email', 'Address', 'Total Items', 'Total Quantity', 'Transactions', 'Last Delivery', 'Status', 'Created'];
    const rows = suppliers.map((s) => [
      s.name,
      s.contactPerson || '',
      s.phone || '',
      s.email || '',
      s.address || '',
      s.totalItems.toString(),
      s.totalQuantity.toString(),
      s.totalTransactions.toString(),
      s.lastTransaction || '',
      s.status,
      s.createdAt
    ]);
    
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suppliers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const stats = useMemo(() => ({
    total: suppliers.length,
    active: suppliers.filter((s) => s.status === 'active').length,
    totalItems: suppliers.reduce((acc, s) => acc + s.totalItems, 0),
    totalQuantity: suppliers.reduce((acc, s) => acc + s.totalQuantity, 0)
  }), [suppliers]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Supplier Management</h2>
          <p className="text-gray-500">Manage your suppliers and their delivery history</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-fit"
        >
          <Plus className="w-5 h-5" />
          Add Supplier
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Suppliers</p>
              <p className="text-xl font-bold text-gray-800">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Box className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-xl font-bold text-gray-800">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-xl font-bold text-gray-800">{stats.totalItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Qty</p>
              <p className="text-xl font-bold text-gray-800">{stats.totalQuantity.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>

      {/* Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Supplier Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Contact</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Total Items</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Total Qty</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Transactions</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedSupplier(supplier)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-left"
                  >
                    {supplier.name}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <p>{supplier.contactPerson}</p>
                  <p className="text-gray-400">{supplier.phone}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">{supplier.totalItems}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{supplier.totalQuantity.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{supplier.totalTransactions}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${supplier.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {supplier.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSupplier(supplier)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSuppliers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No suppliers found. Add your first supplier!
          </div>
        )}
      </div>

      {/* Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredSuppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white p-4 rounded-xl shadow-sm border">
            <button
              onClick={() => setSelectedSupplier(supplier)}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{supplier.name}</h3>
                  <p className="text-sm text-gray-500">{supplier.contactPerson} • {supplier.phone}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${supplier.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {supplier.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-gray-400">Items</p>
                  <p className="font-medium">{supplier.totalItems}</p>
                </div>
                <div>
                  <p className="text-gray-400">Quantity</p>
                  <p className="font-medium">{supplier.totalQuantity.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">Transactions</p>
                  <p className="font-medium">{supplier.totalTransactions}</p>
                </div>
              </div>
            </button>
          </div>
        ))}
        {filteredSuppliers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No suppliers found. Add your first supplier!
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter supplier name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contact person name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+1-555-0100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Full address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSupplier ? 'Update' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Detail Modal */}
      {selectedSupplier && (
        <SupplierDetailView 
          supplier={selectedSupplier} 
          onClose={() => setSelectedSupplier(null)} 
        />
      )}
    </div>
  );
};

// ============ SUPPLIER DETAIL VIEW ============
interface SupplierDetailViewProps {
  supplier: Supplier;
  onClose: () => void;
}

const SupplierDetailView: React.FC<SupplierDetailViewProps> = ({ supplier, onClose }) => {
  const { getSupplierTransactions } = useSupplierStore();
  const supplierTransactions = getSupplierTransactions(supplier.id);

  // Export single supplier data
  const exportSupplierData = () => {
    const headers = ['Date', 'Item', 'Quantity', 'Unit', 'Type', 'Invoice', 'Truck', 'Notes'];
    const rows = supplierTransactions.map((t) => [
      t.date,
      t.itemName,
      t.quantity.toString(),
      t.unit,
      t.type,
      t.invoiceNumber || '',
      t.truckNumber || '',
      t.notes || ''
    ]);
    
    // Add summary rows
    const summaryRows = [
      ['', '', '', '', '', '', '', ''],
      ['Supplier Summary', '', '', '', '', '', '', ''],
      ['Total Items', supplier.totalItems.toString(), '', '', '', '', '', ''],
      ['Total Quantity', supplier.totalQuantity.toString(), '', '', '', '', '', ''],
      ['Total Transactions', supplier.totalTransactions.toString(), '', '', '', '', '', ''],
      ['Last Delivery', supplier.lastTransaction || '', '', '', '', '', '', ''],
      ['Status', supplier.status, '', '', '', '', '', '']
    ];

    const allRows = [...rows, ...summaryRows];
    const csvContent = [headers, ...allRows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${supplier.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print supplier report
  const printReport = () => {
    const content = `
      <html>
        <head>
          <title>Supplier Report - ${supplier.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .summary { margin: 20px 0; }
            .summary div { margin: 5px 0; }
          </style>
        </head>
        <body>
          <h1>Supplier Report: ${supplier.name}</h1>
          <div class="summary">
            <div><strong>Contact:</strong> ${supplier.contactPerson || '-'}</div>
            <div><strong>Phone:</strong> ${supplier.phone || '-'}</div>
            <div><strong>Email:</strong> ${supplier.email || '-'}</div>
            <div><strong>Address:</strong> ${supplier.address || '-'}</div>
            <div><strong>Status:</strong> ${supplier.status}</div>
            <div><strong>Total Items:</strong> ${supplier.totalItems}</div>
            <div><strong>Total Quantity:</strong> ${supplier.totalQuantity.toLocaleString()}</div>
            <div><strong>Total Transactions:</strong> ${supplier.totalTransactions}</div>
            <div><strong>Last Delivery:</strong> ${supplier.lastTransaction || '-'}</div>
          </div>
          <h2>Transaction History</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Type</th>
                <th>Invoice</th>
                <th>Truck</th>
              </tr>
            </thead>
            <tbody>
              ${supplierTransactions.map((t) => `
                <tr>
                  <td>${t.date}</td>
                  <td>${t.itemName}</td>
                  <td>${t.quantity}</td>
                  <td>${t.unit}</td>
                  <td>${t.type}</td>
                  <td>${t.invoiceNumber || '-'}</td>
                  <td>${t.truckNumber || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-lg font-semibold">{supplier.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${supplier.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {supplier.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportSupplierData}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={printReport}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Contact Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Contact Person</p>
              <p className="font-medium text-sm">{supplier.contactPerson || '-'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Phone</p>
              <p className="font-medium text-sm">{supplier.phone || '-'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="font-medium text-sm">{supplier.email || '-'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Address</p>
              <p className="font-medium text-sm truncate">{supplier.address || '-'}</p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Box className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-blue-600">Total Items</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{supplier.totalItems}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-green-600" />
                <p className="text-xs text-green-600">Total Quantity</p>
              </div>
              <p className="text-2xl font-bold text-green-700">{supplier.totalQuantity.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-purple-600" />
                <p className="text-xs text-purple-600">Transactions</p>
              </div>
              <p className="text-2xl font-bold text-purple-700">{supplier.totalTransactions}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-orange-600" />
                <p className="text-xs text-orange-600">Last Delivery</p>
              </div>
              <p className="text-lg font-bold text-orange-700">{supplier.lastTransaction || '-'}</p>
            </div>
          </div>

          {/* Transaction History */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Transaction History</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-left">Unit</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Invoice</th>
                    <th className="px-3 py-2 text-left">Truck</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {supplierTransactions.length > 0 ? (
                    supplierTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{t.date}</td>
                        <td className="px-3 py-2 font-medium">{t.itemName}</td>
                        <td className="px-3 py-2 text-right">{t.quantity.toLocaleString()}</td>
                        <td className="px-3 py-2">{t.unit}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${t.type === 'receive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="px-3 py-2">{t.invoiceNumber || '-'}</td>
                        <td className="px-3 py-2">{t.truckNumber || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                        No transactions yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the main component
const SupplierList: React.FC = () => {
  return <SupplierListPage />;
};

export default SupplierList;
export { SupplierListPage, SupplierDetailView };