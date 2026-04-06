# COMPLETE SUPPLIER MANAGEMENT - USER GUIDE

## Overview
The Supplier Management subpage provides a complete system for managing supplier information, tracking delivery history, and generating detailed reports. Access it from the menu: **Messages → Suppliers** (both desktop sidebar and mobile menu).

---

## Menu Structure

### Desktop View (Sidebar)
```
┌────────────────────────────┐
│ ▸ Dashboard        │
│ ▸ Inventory       │
│ ▸ Movements      │
│ ▸ Production     │
│ ▸ Messages       │  ← Below Messages
│ ▸ Suppliers     │  ← NEW POSITION
│   ├─ Supplier List│     (submenu)
│   ├─ Supplier History
│   └─ Supplier Reports
│ ▸ Users         │
│ ▸ Reports       │
└────────────────────────────┘
```

### Mobile View (Hamburger Menu)
```
☰ Menu
├── Dashboard
├── Inventory
├── Movements
├── Production
├── Messages        ← Tap
├── Suppliers     ← NEW (Tap for submenu)
│   ├── Supplier List
│   ├── Supplier History
│   └── Supplier Reports
├── Users
└── Reports
```

---

## Features

### 1. Supplier List
- View all suppliers in table (desktop) or cards (mobile)
- Search by name, contact, or email
- Filter by status (All/Active/Inactive)
- See key metrics: Total Items, Total Qty, Transactions
- Quick actions: View, Edit, Delete
- Export all suppliers to CSV

**Search & Filter:**
- Type in search box to find suppliers
- Select status filter dropdown

### 2. Add/Edit Supplier
Fields:
- Supplier Name (required)
- Contact Person
- Phone
- Email
- Address
- Status (Active/Inactive)

**How to Add:**
1. Click "+ Add Supplier" button
2. Fill in the form
3. Click "Add Supplier"

**How to Edit:**
1. Click edit icon on supplier row
2. Modify fields
3. Click "Update"

### 3. Supplier Detail View
Click on any supplier name to see:

**Contact Information:**
- Name, Contact Person
- Phone, Email
- Address
- Status

**Summary Stats:**
- Total Items Supplied
- Total Quantity
- Total Transactions
- Last Delivery Date

**Transaction History:**
- Date, Item, Quantity
- Unit, Type (Receive/Issue)
- Invoice Number
- Truck Number

### 4. Export Options
- **Export Button:** Download all suppliers as CSV
- **From Detail View:**
  - Export (CSV for single supplier)
  - Print (Printable report)

---

## How to Use

### Scenario: View Supplier History
1. Go to **Suppliers → Supplier List**
2. Find supplier in list (search if needed)
3. Click supplier name
4. View transaction history
5. Click "Export" or "Print" as needed

### Scenario: Add New Supplier
1. Click **"+ Add Supplier"**
2. Enter supplier details
3. Click **"Add Supplier"**

### Scenario: Generate Supplier Report
1. Click supplier name in list
2. View summary and transactions
3. Click **Export** or **Print**
4. Save/Print the report

---

## Responsive Design

### Desktop (≥1024px)
- Table format
- Sidebar menu
- Full details visible
- Export buttons in header

### Mobile (<1024px)
- Card format
- Hamburger menu
- Tap to view details
- Export in detail modal

---

## Data Fields

### Supplier Record
```
{
  id: string
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  totalItems: number
  totalQuantity: number
  totalTransactions: number
  lastTransaction: string
  createdAt: string
  status: 'active' | 'inactive'
}
```

### Transaction Record
```
{
  id: string
  supplierId: string
  itemName: string
  quantity: number
  unit: string
  type: 'receive' | 'issue'
  date: string
  invoiceNumber: string
  truckNumber: string
  notes: string
}
```

---

## Keyboard Shortcuts
- **Tab:** Navigate form fields
- **Enter:** Submit form (when not in textarea)
- **Escape:** Close modal

---

## Troubleshooting

**Q: Can't find supplier?**
A: Use search box or status filter

**Q: Export not working?**
A: Check browser pop-up settings

**Q: Modal won't close?**
A: Click X button or outside modal

---

## Next Steps
1. Open `dist/index.html`
2. Login
3. Navigate to Suppliers subpage (below Messages)
4. Add/view/edit suppliers
5. Generate reports

---

## Support
For issues, check the console (F12) for errors.