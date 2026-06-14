# Plan: Stock-In / Restock Flow

## Goal
Enable SUPER_ADMIN users to add stock to existing products and view a history of stock additions. Currently, product quantity can only decrease via sales transactions — there is no way to replenish inventory.

## Why a New `StockIn` Model (Not Just Update `qty`)
- Provides an **audit trail** (who added stock, when, how much, and why via notes)
- Matches the existing pattern: `Transaction` + `TransactionItem` track every sale
- Enables debugging inventory discrepancies
- Minimal additional complexity — one small model and two endpoints

## Architecture

### New Backend Model: `StockIn`
```
id          PK int AUTO_INCREMENT
productId   FK int NOT NULL → Product
quantity    int NOT NULL (> 0)
note        STRING nullable
userId      FK int NOT NULL → User
schoolId    FK int NOT NULL → School
createdAt   DATE NOT NULL DEFAULT NOW
updatedAt   DATE NOT NULL DEFAULT NOW
```
- Associations: `StockIn.belongsTo(Product)`, `StockIn.belongsTo(User)`

### New API Endpoints (in `backend/src/routes/product.ts`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/products/stock-in` | JWT | SUPER_ADMIN | Add stock to a product. Body: `{ productId, quantity, note? }`. Atomically increments `Product.qty` and creates `StockIn` record. |
| `GET`  | `/api/products/stock-in` | JWT | Any | List stock-in history. Query: `productId?`. Includes Product name + User name. Ordered `createdAt DESC`, limit 50. |

### Database Migration Strategy
- The project uses `sequelize.sync()` (no formal migrations)
- Adding a **new model** auto-creates the table on next server restart
- No schema changes to existing tables needed

---

## Files to Change

### Backend
1. **`backend/src/models/StockIn.ts`** — NEW model file
2. **`backend/src/config/database.ts`** — Register `initStockInModel`
3. **`backend/src/models/index.ts`** — Add `StockIn` associations
4. **`backend/src/routes/product.ts`** — Add `POST` and `GET` `/stock-in` handlers

### Frontend
5. **`frontend/src/features/inventory/api/index.ts`** — Add `stockInProduct()` and `fetchStockIns()`
6. **`frontend/src/features/inventory/pages/Inventory.tsx`** — Add:
   - "Stock In" button (SUPER_ADMIN only)
   - Stock In modal (product dropdown, qty input, optional note)
   - "Recent Stock Ins" section below products table

---

## UI Mockup (Inventory Page)

```
┌─────────────────────────────────────────┐
│ Inventory Management                    │
│                              [Sell] [Stock In] [Add Product] │
├─────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐               │
│ │Total│ │Low  │ │Total│   Stats Cards │
│ │Prod │ │Stock│ │Units│               │
│ └─────┘ └─────┘ └─────┘               │
├─────────────────────────────────────────┤
│ Products                [Search...]     │
│ • Notebook          50 in stock    ₹25  │
│ • Pen               12 left        ₹10  │
│ • Eraser            3 left          ₹5  │
├─────────────────────────────────────────┤
│ Recent Stock Ins                        │
│ ─────────────────────────────────────── │
│ Date       Product      Qty   Added By  │
│ 10 Jun     Notebook     +50   Admin     │
│ 09 Jun     Pen          +100  Admin     │
└─────────────────────────────────────────┘
```

---

## Verification Steps
1. Add stock to a low-quantity product → verify badge updates from red → green
2. Refresh page → verify stock-in entry persists in history
3. Log in as non-SUPER_ADMIN → verify "Stock In" button is hidden
4. Verify `Product.qty` correctly sums across multiple stock-in operations
