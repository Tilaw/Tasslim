# Spare Parts Inventory & Sales Management System
## Next.js Full-Stack System Design

---

## 1. Executive Summary

A modern, full-stack inventory and sales management system built with Next.js 14+ App Router, featuring server-side rendering, role-based routing, and real-time inventory tracking for spare parts retail stores.

### Core Technologies
- **Frontend**: Next.js 14+ with TypeScript, App Router
- **Backend**: Express.js REST API
- **Database**: MySQL 8.0+
- **State**: Zustand + TanStack Query
- **UI**: Tailwind CSS + shadcn/ui
- **Validation**: Zod (shared between frontend and backend)

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Next.js Application                    │
│                    (Port 3000)                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │              App Router Structure                 │  │
│  │  ├── /app/(auth)           - Login, Register     │  │
│  │  ├── /app/(dashboard)      - Protected Routes    │  │
│  │  │   ├── /inventory        - SSR Product Lists   │  │
│  │  │   ├── /sales            - SSR Sales Orders    │  │
│  │  │   ├── /suppliers        - SSR Supplier Data   │  │
│  │  │   ├── /reports          - SSG Reports         │  │
│  │  │   └── /settings         - User Preferences    │  │
│  │  └── /api                  - API Routes (proxy)  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Server Components (SSR)                  │  │
│  │  - Data fetching on server                       │  │
│  │  - Role-based access control                     │  │
│  │  - SEO optimization                              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Client Components (Interactive)           │  │
│  │  - Forms (React Hook Form + Zod)                │  │
│  │  - Real-time updates (TanStack Query)           │  │
│  │  - Charts (Recharts)                            │  │
│  │  - Global state (Zustand)                       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │
┌───────────────────────────▼─────────────────────────────┐
│               Express.js API Server                      │
│                    (Port 4000)                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │              API Routes                           │  │
│  │  /api/v1/auth         - Authentication           │  │
│  │  /api/v1/products     - Product Management       │  │
│  │  /api/v1/inventory    - Inventory Operations     │  │
│  │  /api/v1/suppliers    - Supplier Management      │  │
│  │  /api/v1/sales        - Sales Orders             │  │
│  │  /api/v1/customers    - Customer Management      │  │
│  │  /api/v1/reports      - Analytics & Reports      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Middleware Layer                          │  │
│  │  - JWT Authentication                            │  │
│  │  - Role Authorization                            │  │
│  │  - Request Validation (Zod)                      │  │
│  │  - Error Handling                                │  │
│  │  - Rate Limiting                                 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │
┌───────────────────────────▼─────────────────────────────┐
│                    Data Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │    MySQL     │  │   AWS S3/    │  │    Redis     │ │
│  │   Database   │  │    MinIO     │  │   (Cache)    │ │
│  │              │  │ (File Store) │  │  (Optional)  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Next.js Application Structure

### 3.1 Directory Structure

```
spare-parts-system/
├── frontend/                          # Next.js Application
│   ├── app/
│   │   ├── (auth)/                   # Auth route group (no layout)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx            # Minimal auth layout
│   │   │
│   │   ├── (dashboard)/              # Protected route group
│   │   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   │   ├── page.tsx              # Dashboard home
│   │   │   │
│   │   │   ├── inventory/            # Inventory management
│   │   │   │   ├── page.tsx          # Product list (SSR)
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx      # Product details (SSR)
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Add product
│   │   │   │   ├── categories/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── stock-adjustment/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── sales/                # Sales management
│   │   │   │   ├── page.tsx          # Sales orders list (SSR)
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx      # Order details
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Create order (POS)
│   │   │   │   └── customers/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── suppliers/            # Supplier management
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── purchase-orders/
│   │   │   │       ├── page.tsx
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── reports/              # Reports & analytics
│   │   │   │   ├── page.tsx          # Dashboard (SSR)
│   │   │   │   ├── sales/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── inventory/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── profit-loss/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── settings/             # System settings
│   │   │       ├── page.tsx
│   │   │       ├── users/
│   │   │       │   └── page.tsx
│   │   │       └── roles/
│   │   │           └── page.tsx
│   │   │
│   │   ├── api/                      # Next.js API routes (proxy/BFF)
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   └── revalidate/
│   │   │       └── route.ts
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── loading.tsx               # Global loading
│   │   ├── error.tsx                 # Error boundary
│   │   └── not-found.tsx             # 404 page
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── forms/                    # Form components
│   │   │   ├── product-form.tsx
│   │   │   ├── sales-order-form.tsx
│   │   │   └── ...
│   │   ├── layout/                   # Layout components
│   │   │   ├── sidebar.tsx
│   │   │   ├── navbar.tsx
│   │   │   └── footer.tsx
│   │   ├── tables/                   # Table components
│   │   │   ├── products-table.tsx
│   │   │   ├── orders-table.tsx
│   │   │   └── ...
│   │   └── charts/                   # Chart components
│   │       ├── sales-chart.tsx
│   │       ├── inventory-chart.tsx
│   │       └── ...
│   │
│   ├── lib/
│   │   ├── api/                      # API client functions
│   │   │   ├── products.ts
│   │   │   ├── sales.ts
│   │   │   ├── suppliers.ts
│   │   │   └── auth.ts
│   │   ├── auth/                     # Auth utilities
│   │   │   ├── session.ts
│   │   │   ├── middleware.ts
│   │   │   └── permissions.ts
│   │   ├── utils/
│   │   │   ├── cn.ts                 # Tailwind class merger
│   │   │   ├── format.ts             # Formatters
│   │   │   └── validation.ts
│   │   └── constants.ts
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-products.ts
│   │   ├── use-sales.ts
│   │   ├── use-auth.ts
│   │   └── use-permissions.ts
│   │
│   ├── store/                        # Zustand stores
│   │   ├── auth-store.ts
│   │   ├── cart-store.ts
│   │   └── ui-store.ts
│   │
│   ├── types/                        # TypeScript types
│   │   ├── api.ts
│   │   ├── models.ts
│   │   └── index.ts
│   │
│   ├── middleware.ts                 # Next.js middleware
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
└── backend/                          # Express.js API
    ├── src/
    │   ├── config/
    │   │   ├── database.ts           # MySQL connection
    │   │   ├── environment.ts
    │   │   └── s3.ts
    │   │
    │   ├── middleware/
    │   │   ├── auth.middleware.ts
    │   │   ├── rbac.middleware.ts
    │   │   ├── validation.middleware.ts
    │   │   ├── error.middleware.ts
    │   │   └── rate-limit.middleware.ts
    │   │
    │   ├── modules/
    │   │   ├── auth/
    │   │   │   ├── auth.controller.ts
    │   │   │   ├── auth.service.ts
    │   │   │   ├── auth.routes.ts
    │   │   │   └── auth.validation.ts
    │   │   │
    │   │   ├── products/
    │   │   │   ├── products.controller.ts
    │   │   │   ├── products.service.ts
    │   │   │   ├── products.routes.ts
    │   │   │   └── products.validation.ts
    │   │   │
    │   │   ├── inventory/
    │   │   ├── sales/
    │   │   ├── suppliers/
    │   │   ├── customers/
    │   │   └── reports/
    │   │
    │   ├── models/                   # MySQL models/repositories
    │   │   ├── user.model.ts
    │   │   ├── product.model.ts
    │   │   ├── sales-order.model.ts
    │   │   └── ...
    │   │
    │   ├── utils/
    │   │   ├── jwt.ts
    │   │   ├── password.ts
    │   │   ├── response.ts
    │   │   └── logger.ts
    │   │
    │   ├── types/
    │   │   ├── express.d.ts
    │   │   └── index.ts
    │   │
    │   ├── database/
    │   │   ├── migrations/
    │   │   └── seeds/
    │   │
    │   ├── app.ts                    # Express app setup
    │   └── server.ts                 # Server entry point
    │
    ├── package.json
    └── tsconfig.json
```

---

## 4. Next.js App Router Implementation

### 4.1 Role-Based Routing with Middleware

**`middleware.ts`** (Root level)
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';

// Define role-based route access
const ROUTE_PERMISSIONS = {
  '/dashboard': ['super_admin', 'store_manager', 'inventory_manager', 'sales_person', 'accountant', 'viewer'],
  '/dashboard/inventory': ['super_admin', 'store_manager', 'inventory_manager', 'sales_person', 'viewer'],
  '/dashboard/inventory/new': ['super_admin', 'store_manager', 'inventory_manager'],
  '/dashboard/sales': ['super_admin', 'store_manager', 'sales_person', 'accountant', 'viewer'],
  '/dashboard/sales/new': ['super_admin', 'store_manager', 'sales_person'],
  '/dashboard/suppliers': ['super_admin', 'store_manager', 'inventory_manager', 'viewer'],
  '/dashboard/reports': ['super_admin', 'store_manager', 'accountant', 'viewer'],
  '/dashboard/settings': ['super_admin', 'store_manager'],
  '/dashboard/settings/users': ['super_admin'],
  '/dashboard/settings/roles': ['super_admin'],
} as const;

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const pathname = request.nextUrl.pathname;

  // Public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    // Redirect to dashboard if already authenticated
    if (token) {
      try {
        await verifyJWT(token);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch {
        // Invalid token, continue to login
      }
    }
    return NextResponse.next();
  }

  // Protected routes - require authentication
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const decoded = await verifyJWT(token);
      
      // Check role-based permissions
      const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find(route => 
        pathname.startsWith(route)
      );
      
      if (matchedRoute) {
        const allowedRoles = ROUTE_PERMISSIONS[matchedRoute as keyof typeof ROUTE_PERMISSIONS];
        
        if (!allowedRoles.includes(decoded.role)) {
          return NextResponse.redirect(new URL('/dashboard/unauthorized', request.url));
        }
      }

      // Add user info to headers for server components
      const response = NextResponse.next();
      response.headers.set('x-user-id', decoded.userId);
      response.headers.set('x-user-role', decoded.role);
      
      return response;
    } catch (error) {
      // Invalid token
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 4.2 Authentication Utilities

**`lib/auth/session.ts`**
```typescript
import { cookies } from 'next/headers';
import { verifyJWT } from './jwt';

export interface UserSession {
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

export async function getServerSession(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) return null;

  try {
    const decoded = await verifyJWT(token);
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getServerSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  return session;
}

export async function requireRole(allowedRoles: string[]): Promise<UserSession> {
  const session = await requireAuth();
  
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Forbidden');
  }
  
  return session;
}
```

**`lib/auth/permissions.ts`**
```typescript
export const PERMISSIONS = {
  // Products
  PRODUCTS_VIEW: 'products:view',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_EDIT: 'products:edit',
  PRODUCTS_DELETE: 'products:delete',
  
  // Inventory
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_ADJUST: 'inventory:adjust',
  INVENTORY_TRANSFER: 'inventory:transfer',
  
  // Sales
  SALES_VIEW: 'sales:view',
  SALES_CREATE: 'sales:create',
  SALES_EDIT: 'sales:edit',
  SALES_DELETE: 'sales:delete',
  
  // Suppliers
  SUPPLIERS_VIEW: 'suppliers:view',
  SUPPLIERS_MANAGE: 'suppliers:manage',
  
  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_FINANCIAL: 'reports:financial',
  
  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_MANAGE: 'settings:manage',
  USERS_MANAGE: 'users:manage',
  ROLES_MANAGE: 'roles:manage',
} as const;

export const ROLE_PERMISSIONS = {
  super_admin: Object.values(PERMISSIONS),
  store_manager: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_TRANSFER,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_EDIT,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.SUPPLIERS_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_FINANCIAL,
    PERMISSIONS.SETTINGS_VIEW,
  ],
  inventory_manager: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_TRANSFER,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.SUPPLIERS_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
  ],
  sales_person: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.SALES_EDIT,
    PERMISSIONS.REPORTS_VIEW,
  ],
  accountant: [
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_FINANCIAL,
  ],
  viewer: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
};

export function hasPermission(userRole: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
  return permissions?.includes(permission) ?? false;
}
```

### 4.3 Server-Side Rendering with Data Fetching

**`app/(dashboard)/inventory/page.tsx`** - SSR Product List
```typescript
import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth/session';
import { ProductsTable } from '@/components/tables/products-table';
import { ProductsTableSkeleton } from '@/components/tables/products-table-skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

// API function with server-side fetch
async function getProducts(searchParams: {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
}) {
  const session = await requireAuth();
  
  const params = new URLSearchParams({
    page: searchParams.page || '1',
    limit: searchParams.limit || '20',
    ...(searchParams.search && { search: searchParams.search }),
    ...(searchParams.category && { category: searchParams.category }),
  });

  const res = await fetch(
    `${process.env.API_URL}/api/v1/products?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${session.token}`,
      },
      // Important for SSR
      cache: 'no-store', // or 'force-cache' with revalidate
      next: {
        tags: ['products'], // For on-demand revalidation
        revalidate: 60, // Revalidate every 60 seconds
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }

  return res.json();
}

interface PageProps {
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
    category?: string;
  };
}

export default async function InventoryPage({ searchParams }: PageProps) {
  // This runs on the server
  const session = await requireAuth();
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your product inventory and stock levels
          </p>
        </div>
        <Link href="/dashboard/inventory/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <Suspense fallback={<ProductsTableSkeleton />}>
        <ProductsList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

// Separate component for data fetching
async function ProductsList({ searchParams }: PageProps) {
  const data = await getProducts(searchParams);
  
  return (
    <ProductsTable 
      products={data.products} 
      pagination={data.pagination}
    />
  );
}

// Generate metadata for SEO
export async function generateMetadata() {
  return {
    title: 'Inventory Management | Spare Parts System',
    description: 'Manage your spare parts inventory',
  };
}
```

**`app/(dashboard)/inventory/[id]/page.tsx`** - SSR Product Details
```typescript
import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth/session';
import { ProductDetails } from '@/components/products/product-details';
import { InventoryHistory } from '@/components/inventory/inventory-history';

async function getProduct(id: string) {
  const session = await requireAuth();
  
  const res = await fetch(
    `${process.env.API_URL}/api/v1/products/${id}`,
    {
      headers: {
        'Authorization': `Bearer ${session.token}`,
      },
      cache: 'no-store',
      next: { tags: [`product-${id}`] },
    }
  );

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to fetch product');
  }

  return res.json();
}

async function getInventoryHistory(productId: string) {
  const session = await requireAuth();
  
  const res = await fetch(
    `${process.env.API_URL}/api/v1/inventory/transactions?productId=${productId}`,
    {
      headers: {
        'Authorization': `Bearer ${session.token}`,
      },
      cache: 'no-store',
      next: { tags: [`inventory-${productId}`] },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch inventory history');
  }

  return res.json();
}

export default async function ProductPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const [productData, historyData] = await Promise.all([
    getProduct(params.id),
    getInventoryHistory(params.id),
  ]);

  if (!productData) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <ProductDetails product={productData.data} />
      <InventoryHistory transactions={historyData.data} />
    </div>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const productData = await getProduct(params.id);
  
  if (!productData) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: `${productData.data.name} | Inventory`,
    description: productData.data.description,
  };
}
```

### 4.4 Static Generation for Reports

**`app/(dashboard)/reports/page.tsx`** - SSG Dashboard
```typescript
import { requireAuth } from '@/lib/auth/session';
import { SalesChart } from '@/components/charts/sales-chart';
import { InventoryChart } from '@/components/charts/inventory-chart';
import { KPICards } from '@/components/dashboard/kpi-cards';

async function getDashboardData() {
  const session = await requireAuth();
  
  const res = await fetch(
    `${process.env.API_URL}/api/v1/reports/dashboard`,
    {
      headers: {
        'Authorization': `Bearer ${session.token}`,
      },
      // Static generation with revalidation
      next: { 
        revalidate: 300, // Revalidate every 5 minutes
        tags: ['dashboard-stats']
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch dashboard data');
  }

  return res.json();
}

export default async function ReportsPage() {
  const data = await getDashboardData();

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Reports & Analytics</h1>
      
      <KPICards stats={data.kpis} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <SalesChart data={data.salesData} />
        <InventoryChart data={data.inventoryData} />
      </div>
    </div>
  );
}

// Revalidate on demand
export const revalidate = 300; // 5 minutes
```

### 4.5 Client Components with TanStack Query

**`components/forms/product-form.tsx`**
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createProduct, updateProduct } from '@/lib/api/products';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Shared validation schema
const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  categoryId: z.string().uuid('Invalid category'),
  brand: z.string().optional(),
  reorderLevel: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: ProductFormData & { id: string };
  mode: 'create' | 'edit';
}

export function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product || {
      sku: '',
      name: '',
      description: '',
      brand: '',
      reorderLevel: 0,
      unitPrice: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (mode === 'edit' && product?.id) {
        return updateProduct(product.id, data);
      }
      return createProduct(data);
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      toast.success(
        mode === 'create' ? 'Product created successfully' : 'Product updated successfully'
      );
      
      router.push('/dashboard/inventory');
      router.refresh(); // Refresh server components
    },
    onError: (error: any) => {
      toast.error(error.message || 'Something went wrong');
    },
  });

  const onSubmit = (data: ProductFormData) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input placeholder="PROD-001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Engine Oil Filter" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* More form fields... */}

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? 'Saving...'
              : mode === 'create'
              ? 'Create Product'
              : 'Update Product'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

**`hooks/use-products.ts`** - TanStack Query Hook
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct } from '@/lib/api/products';

export function useProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

### 4.6 Zustand Store for Global State

**`store/auth-store.ts`**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

**`store/cart-store.ts`** - POS Cart State
```typescript
import { create } from 'zustand';

interface CartItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity' | 'discount'>) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
  getTotalDiscount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  
  addItem: (product) =>
    set((state) => {
      const existingItem = state.items.find(
        (item) => item.productId === product.productId
      );

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.productId === product.productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }

      return {
        items: [...state.items, { ...product, quantity: 1, discount: 0 }],
      };
    }),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      ),
    })),

  updateDiscount: (productId, discount) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId ? { ...item, discount } : item
      ),
    })),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    })),

  clearCart: () => set({ items: [] }),

  getSubtotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  },

  getTotalDiscount: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.discount * item.quantity, 0);
  },

  getTotal: () => {
    return get().getSubtotal() - get().getTotalDiscount();
  },
}));
```

---

## 5. MySQL Database Schema

### 5.1 Complete Database Schema

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS spare_parts_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE spare_parts_db;

-- Users & Authentication
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role_id CHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE roles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    INDEX idx_resource_action (resource, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
    role_id CHAR(36),
    permission_id CHAR(36),
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refresh_tokens (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key for users.role_id after roles table is created
ALTER TABLE users
ADD FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- Products & Inventory
CREATE TABLE categories (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    parent_category_id CHAR(36) NULL,
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_parent (parent_category_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id CHAR(36),
    brand VARCHAR(100),
    model VARCHAR(100),
    unit_of_measure VARCHAR(20) DEFAULT 'piece',
    reorder_level INT DEFAULT 0,
    reorder_quantity INT DEFAULT 0,
    min_stock_level INT DEFAULT 0,
    max_stock_level INT NULL,
    unit_cost DECIMAL(10, 2) DEFAULT 0.00,
    unit_price DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    specifications JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_sku (sku),
    INDEX idx_name (name),
    INDEX idx_category (category_id),
    INDEX idx_active (is_active),
    FULLTEXT idx_search (name, description, brand, model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_images (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE locations (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inventory (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,
    location_id CHAR(36) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT DEFAULT 0,
    available_quantity INT GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    last_stock_check TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_location (product_id, location_id),
    INDEX idx_product (product_id),
    INDEX idx_location (location_id),
    INDEX idx_available (available_quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inventory_transactions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id CHAR(36) NOT NULL,
    location_id CHAR(36) NOT NULL,
    transaction_type ENUM('purchase', 'sale', 'return', 'adjustment', 'transfer_in', 'transfer_out') NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10, 2),
    reference_type VARCHAR(50),
    reference_id CHAR(36),
    notes TEXT,
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_product (product_id),
    INDEX idx_location (location_id),
    INDEX idx_type (transaction_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Suppliers & Purchase Orders
CREATE TABLE suppliers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    tax_id VARCHAR(50),
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(12, 2),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE supplier_products (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    supplier_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    supplier_sku VARCHAR(100),
    cost_price DECIMAL(10, 2) NOT NULL,
    lead_time_days INT,
    min_order_quantity INT DEFAULT 1,
    is_preferred BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_supplier_product (supplier_id, product_id),
    INDEX idx_supplier (supplier_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_orders (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id CHAR(36) NOT NULL,
    location_id CHAR(36) NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    status ENUM('pending', 'approved', 'ordered', 'received', 'cancelled') DEFAULT 'pending',
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) DEFAULT 0.00,
    shipping_cost DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    created_by CHAR(36),
    approved_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_po_number (po_number),
    INDEX idx_supplier (supplier_id),
    INDEX idx_status (status),
    INDEX idx_order_date (order_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE purchase_order_items (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    purchase_order_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    quantity INT NOT NULL,
    received_quantity INT DEFAULT 0,
    unit_cost DECIMAL(10, 2) NOT NULL,
    line_total DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_po (purchase_order_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers & Sales
CREATE TABLE customers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    customer_number VARCHAR(50) UNIQUE NOT NULL,
    type ENUM('retail', 'wholesale', 'distributor') DEFAULT 'retail',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    tax_id VARCHAR(50),
    credit_limit DECIMAL(12, 2),
    payment_terms VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_number (customer_number),
    INDEX idx_type (type),
    INDEX idx_active (is_active),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sales_orders (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id CHAR(36),
    location_id CHAR(36) NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('unpaid', 'partial', 'paid', 'refunded') DEFAULT 'unpaid',
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) DEFAULT 0.00,
    shipping_cost DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) DEFAULT 0.00,
    notes TEXT,
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_order_number (order_number),
    INDEX idx_customer (customer_id),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_order_date (order_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sales_order_items (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    sales_order_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    quantity INT NOT NULL,
    fulfilled_quantity INT DEFAULT 0,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0.00,
    line_total DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_sales_order (sales_order_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    sales_order_id CHAR(36) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method ENUM('cash', 'card', 'bank_transfer', 'check', 'other') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    processed_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE RESTRICT,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_payment_number (payment_number),
    INDEX idx_sales_order (sales_order_id),
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Logs
CREATE TABLE audit_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id CHAR(36),
    changes JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default roles
INSERT INTO roles (id, name, description) VALUES
(UUID(), 'super_admin', 'Full system access'),
(UUID(), 'store_manager', 'Manage store operations'),
(UUID(), 'inventory_manager', 'Manage inventory and suppliers'),
(UUID(), 'sales_person', 'Process sales and view inventory'),
(UUID(), 'accountant', 'Financial reports and payment tracking'),
(UUID(), 'viewer', 'Read-only access');
```

---

## 6. Backend Express.js Implementation

### 6.1 Main Application Setup

**`src/app.ts`**
```typescript
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorMiddleware } from './middleware/error.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { productRoutes } from './modules/products/products.routes';
import { inventoryRoutes } from './modules/inventory/inventory.routes';
import { salesRoutes } from './modules/sales/sales.routes';
import { supplierRoutes } from './modules/suppliers/suppliers.routes';
import { customerRoutes } from './modules/customers/customers.routes';
import { reportRoutes } from './modules/reports/reports.routes';

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/sales', salesRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/reports', reportRoutes);

// Error handling (must be last)
app.use(errorMiddleware);

export default app;
```

### 6.2 Authentication & Authorization Middleware

**`src/middleware/auth.middleware.ts`**
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
    });
  }
}
```

**`src/middleware/rbac.middleware.ts`**
```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
    }

    next();
  };
}
```

**`src/middleware/validation.middleware.ts`**
```typescript
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        });
      }
      next(error);
    }
  };
}
```

---

## 7. Key Features & Components

### 7.1 Dashboard with KPI Cards

**`components/dashboard/kpi-cards.tsx`**
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingCart, Package, DollarSign } from 'lucide-react';

interface KPICardsProps {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    lowStockItems: number;
    averageOrderValue: number;
  };
}

export function KPICards({ stats }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${stats.totalRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            +12.5% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
          <p className="text-xs text-muted-foreground mt-1">
            +8.3% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.lowStockItems}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Requires attention
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${stats.averageOrderValue.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            +5.2% from last month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 7.2 POS Interface

**`components/sales/pos-interface.tsx`**
```typescript
'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cart-store';
import { ProductSearch } from './product-search';
import { CartItems } from './cart-items';
import { PaymentDialog } from './payment-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function POSInterface() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const { items, getTotal, getSubtotal, getTotalDiscount } = useCartStore();

  const subtotal = getSubtotal();
  const discount = getTotalDiscount();
  const total = getTotal();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left: Product Search */}
      <div className="lg:col-span-2">
        <Card className="p-6 h-full flex flex-col">
          <h2 className="text-2xl font-bold mb-4">New Sale</h2>
          <ProductSearch />
        </Card>
      </div>

      {/* Right: Cart & Checkout */}
      <div className="lg:col-span-1">
        <Card className="p-6 h-full flex flex-col">
          <h3 className="text-xl font-semibold mb-4">Cart</h3>
          
          <div className="flex-1 overflow-y-auto">
            <CartItems items={items} />
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium text-red-600">
                  -${discount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <Button
            className="w-full mt-4"
            size="lg"
            disabled={items.length === 0}
            onClick={() => setIsPaymentOpen(true)}
          >
            Proceed to Payment
          </Button>
        </Card>
      </div>

      <PaymentDialog
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        total={total}
      />
    </div>
  );
}
```

### 7.3 Charts with Recharts

**`components/charts/sales-chart.tsx`**
```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SalesChartProps {
  data: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="sales"
              stroke="#8884d8"
              name="Sales ($)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              stroke="#82ca9d"
              name="Orders"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

---

## 8. Environment Configuration

**`.env.local` (Next.js Frontend)**
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000
API_URL=http://localhost:4000

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_SECRET=your-nextauth-secret-change-this
NEXTAUTH_URL=http://localhost:3000

# File Storage
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=spare-parts-files

# Optional: MinIO (self-hosted)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

**`.env` (Express Backend)**
```bash
# Server
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_NAME=spare_parts_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# File Storage
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=spare-parts-files
```

---

## 9. Development & Deployment

### 9.1 Development Scripts

**Frontend `package.json`**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

**Backend `package.json`**
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

### 9.2 Running the Application

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Access the application
Frontend: http://localhost:3000
Backend API: http://localhost:4000
```

---

## 10. Future Enhancements

- Barcode scanning integration
- Email invoice generation (PDF)
- SMS notifications for low stock
- Multi-currency support
- Export reports to Excel/PDF
- Mobile app with React Native
- Real-time notifications with WebSocket
- Advanced analytics with AI/ML
- Offline mode with sync
- Multi-tenant support
- Automated backup system
- Integration with accounting software

---

This comprehensive system design provides a production-ready architecture for your spare parts inventory management system, leveraging Next.js App Router with SSR, role-based routing, Express.js backend, and MySQL database. The design emphasizes modern best practices, type safety, and scalability.
