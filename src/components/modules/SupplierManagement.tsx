import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Download,
  FileText,
  X,
  Mail,
  Phone,
  MapPin,
  Printer,
  Truck,
} from 'lucide-react';
import { db } from '../../db';

type SupplierRow = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  totalItems: number;
  totalQuantity: number;
  transactionCount: number;
  lastActivity: string;
};

const formatDate = (value?: number | string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().split('T')[0];
};

const toCsv = (rows: (string | number)[][]) => rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');

const downloadCsv = (filename: string, rows: (string | number)[][]) => {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const SupplierModal: React.FC<{
  supplier?: any | null;
  onClose: () => void;
  onSave: (data: { name: string; email: string; phone: string; address: string; status: 'active' | 'inactive' }) => Promise<void>;
}> = ({ supplier, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    status: (supplier?.status || 'active') as 'active' | 'inactive',
  });
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{supplier ? 'Edit Supplier' : 'Add Supplier'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!formData.name.trim()) return;
            setSaving(true);
            await onSave({
              name: formData.name.trim(),
              email: formData.email.trim(),
              phone: formData.phone.trim(),
              address: formData.address.trim(),
              status: formData.status,
            });
            setSaving(false);
          }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Saving...' : supplier ? 'Save Changes' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SupplierManagement: React.FC = () => {
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []);
  const movements = useLiveQuery(() => db.movements.toArray(), []);
  const items = useLiveQuery(() => db.items.toArray(), []);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<{ file: string; type: string; invoiceNumber?: string } | null>(null);

  const supplierRows = useMemo<SupplierRow[]>(() => {
    const supplierList = suppliers || [];
    const movementList = movements || [];
    return supplierList.map((supplier) => {
      const supplierName = supplier.name.trim().replace(/\s+/g, ' ').toLowerCase();
      const related = movementList.filter(
        (movement) => (movement.supplier || '').trim().replace(/\s+/g, ' ').toLowerCase() === supplierName
      );
      const totalQuantity = related
        .filter((movement) => movement.type === 'receive')
        .reduce((sum, movement) => sum + Number(movement.quantity || 0), 0);
      const transactionCount = related.length;
      const totalItems = new Set(related.map((movement) => movement.itemId)).size;
      const lastActivityValue = related
        .map((movement) => movement.date || movement.createdAt)
        .filter(Boolean)
        .sort((a, b) => new Date(String(b)).getTime() - new Date(String(a)).getTime())[0];
      return {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        status: supplier.status,
        totalItems,
        totalQuantity,
        transactionCount,
        lastActivity: formatDate(lastActivityValue || supplier.lastActivity),
      };
    });
  }, [suppliers, movements]);

  const filteredSuppliers = supplierRows.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedSupplier = supplierRows.find((supplier) => supplier.id === selectedSupplierId) || null;
  const selectedSupplierRaw = (suppliers || []).find((supplier) => supplier.id === selectedSupplierId) || null;

  const selectedSupplierHistory = useMemo(() => {
    if (!selectedSupplier) return [] as any[];
    const selectedName = selectedSupplier.name.trim().replace(/\s+/g, ' ').toLowerCase();
    return (movements || [])
      .filter((movement) => (movement.supplier || '').trim().replace(/\s+/g, ' ').toLowerCase() === selectedName)
      .sort((a, b) => new Date(String(b.date || b.createdAt)).getTime() - new Date(String(a.date || a.createdAt)).getTime());
  }, [movements, selectedSupplier]);

  const exportAllSuppliers = () => {
    const rows: (string | number)[][] = [
      ['Name', 'Email', 'Phone', 'Address', 'Status', 'Total Items', 'Total Quantity', 'Transactions', 'Last Activity'],
      ...filteredSuppliers.map((supplier) => [
        supplier.name,
        supplier.email || '',
        supplier.phone || '',
        supplier.address || '',
        supplier.status,
        supplier.totalItems,
        supplier.totalQuantity,
        supplier.transactionCount,
        supplier.lastActivity,
      ]),
    ];
    downloadCsv('suppliers_report.csv', rows);
  };

  const exportSupplierHistory = () => {
    if (!selectedSupplier) return;
    const rows: (string | number)[][] = [
      ['Supplier', selectedSupplier.name],
      ['Email', selectedSupplier.email || ''],
      ['Phone', selectedSupplier.phone || ''],
      ['Address', selectedSupplier.address || ''],
      [],
      ['Date', 'Item', 'Type', 'Quantity', 'Location/Department', 'Invoice Number', 'Reason', 'Reference'],
      ...selectedSupplierHistory.map((movement) => [
        formatDate(movement.date || movement.createdAt),
        movement.itemName,
        movement.type,
        movement.quantity,
        movement.location || movement.department || movement.destination || '-',
        movement.invoiceNumber || '-',
        movement.reason || '-',
        movement.reference || '-',
      ]),
    ];
    downloadCsv(`${selectedSupplier.name.replace(/\s+/g, '_')}_history.csv`, rows);
  };

  const printSupplier = () => {
    window.print();
  };

  const deleteSupplier = async (supplier: SupplierRow) => {
    if (!window.confirm(`Delete supplier "${supplier.name}"?`)) return;
    await db.suppliers.delete(supplier.id);
    if (selectedSupplierId === supplier.id) setSelectedSupplierId(null);
  };

  const saveSupplier = async (data: { name: string; email: string; phone: string; address: string; status: 'active' | 'inactive' }) => {
    if (editingSupplier) {
      await db.suppliers.update(editingSupplier.id, data);
    } else {
      const exists = await db.suppliers.where('name').equalsIgnoreCase(data.name).first();
      if (exists) {
        await db.suppliers.update(exists.id, { ...data, status: data.status });
      } else {
        await db.suppliers.add({
          id: Date.now().toString(),
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          status: data.status,
          totalSupplied: 0,
          transactions: 0,
          lastActivity: Date.now(),
        });
      }
    }
    setShowModal(false);
    setEditingSupplier(null);
  };

  if (selectedSupplier && selectedSupplierRaw) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <button onClick={() => setSelectedSupplierId(null)} className="text-sm text-blue-600 hover:underline mb-2">
              ← Back to Suppliers
            </button>
            <h2 className="text-2xl font-bold text-gray-900">{selectedSupplier.name}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
              {selectedSupplier.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{selectedSupplier.email}</span>}
              {selectedSupplier.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{selectedSupplier.phone}</span>}
              {selectedSupplier.address && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{selectedSupplier.address}</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={exportSupplierHistory} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="w-4 h-4" /> Export Data
            </button>
            <button onClick={printSupplier} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{selectedSupplier.totalItems}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Quantity</p>
            <p className="text-2xl font-bold text-gray-900">{selectedSupplier.totalQuantity}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Transactions</p>
            <p className="text-2xl font-bold text-gray-900">{selectedSupplier.transactionCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Last Activity</p>
            <p className="text-2xl font-bold text-gray-900">{selectedSupplier.lastActivity}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Supplier History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs tracking-wider">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Item</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Quantity</th>
                  <th className="px-4 py-3 text-left">Location / Department</th>
                  <th className="px-4 py-3 text-left">Invoice No.</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedSupplierHistory.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{formatDate(movement.date || movement.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{movement.itemName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${movement.type === 'receive' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {movement.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">{movement.quantity}</td>
                    <td className="px-4 py-3">{movement.location || movement.department || movement.destination || '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{movement.invoiceNumber || '-'}</td>
                    <td className="px-4 py-3">{movement.reason || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      {movement.invoiceFile ? (
                        <button
                          onClick={() => setPreviewInvoice({ file: movement.invoiceFile!, type: movement.invoiceFileType || 'image/png', invoiceNumber: movement.invoiceNumber })}
                          className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {selectedSupplierHistory.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-500">No supplier history found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {previewInvoice && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Invoice Preview
                  {previewInvoice.invoiceNumber ? <span className="ml-2 text-xs font-mono text-gray-500">{previewInvoice.invoiceNumber}</span> : null}
                </h4>
                <div className="flex items-center gap-2">
                  <a
                    href={previewInvoice.file}
                    download={`invoice_${previewInvoice.invoiceNumber || Date.now()}.${previewInvoice.type.includes('pdf') ? 'pdf' : 'png'}`}
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
                {previewInvoice.type.includes('pdf') ? (
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
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Supplier Management</h2>
          <p className="text-gray-500">Manage suppliers and track their inventory history</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'trucks' }))}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Truck className="w-4 h-4" /> Trucks
          </button>
          <button onClick={exportAllSuppliers} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Export All
          </button>
          <button onClick={() => { setEditingSupplier(null); setShowModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Suppliers</p>
          <p className="text-2xl font-bold text-gray-900">{supplierRows.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{supplierRows.reduce((sum, supplier) => sum + supplier.totalItems, 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Quantity</p>
          <p className="text-2xl font-bold text-gray-900">{supplierRows.reduce((sum, supplier) => sum + supplier.totalQuantity, 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Tracked Items</p>
          <p className="text-2xl font-bold text-gray-900">{(items || []).length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search suppliers..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs tracking-wider">
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-left">Quantity</th>
                <th className="px-4 py-3 text-left">Transactions</th>
                <th className="px-4 py-3 text-left">Last Activity</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedSupplierId(supplier.id)} className="font-semibold text-blue-600 hover:underline text-left">
                      {supplier.name}
                    </button>
                    <div className="text-xs text-gray-500 mt-1">{supplier.address || '-'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{supplier.email || '-'}</div>
                    <div className="text-xs text-gray-500">{supplier.phone || '-'}</div>
                  </td>
                  <td className="px-4 py-3">{supplier.totalItems}</td>
                  <td className="px-4 py-3">{supplier.totalQuantity}</td>
                  <td className="px-4 py-3">{supplier.transactionCount}</td>
                  <td className="px-4 py-3">{supplier.lastActivity}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${supplier.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {supplier.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setSelectedSupplierId(supplier.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditingSupplier((suppliers || []).find((s) => s.id === supplier.id) || null); setShowModal(true); }} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteSupplier(supplier)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">No suppliers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={() => { setShowModal(false); setEditingSupplier(null); }}
          onSave={saveSupplier}
        />
      )}
    </div>
  );
};

export default SupplierManagement;
