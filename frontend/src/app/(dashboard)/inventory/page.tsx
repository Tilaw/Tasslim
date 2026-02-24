"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ProductModal } from "@/components/modals/product-modal"
import { TransactionModal } from "@/components/modals/transaction-modal"
import api from "@/lib/api/axios"
import { useAuthStore } from "@/store/auth-store"

export default function InventoryPage() {
    const { user } = useAuthStore()
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<any>(null)

    const { data: products, isLoading } = useQuery({
        queryKey: ["products"],
        queryFn: async () => {
            const response = await api.get("/products")
            return response.data.data
        },
    })

    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const response = await api.get("/categories")
            return response.data.data
        },
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
                    <p className="text-muted-foreground">Manage your spare parts and products.</p>
                </div>
                <Button onClick={() => setIsProductModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
            </div>

            <ProductModal
                open={isProductModalOpen}
                onOpenChange={setIsProductModalOpen}
                categories={categories || []}
            />

            <TransactionModal
                open={isTransactionModalOpen}
                onOpenChange={setIsTransactionModalOpen}
                product={selectedProduct}
            />

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by name or SKU..." className="pl-8" />
                </div>
                <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Loading inventory...
                                </TableCell>
                            </TableRow>
                        ) : products?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products?.map((product: any) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.sku}</TableCell>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>{product.category_name || "Uncategorized"}</TableCell>
                                    <TableCell>${product.unit_price}</TableCell>
                                    <TableCell>{product.quantity || 0}</TableCell>
                                    <TableCell>
                                        {product.quantity > product.reorder_level ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                In Stock
                                            </Badge>
                                        ) : product.quantity > 0 ? (
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                Low Stock
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                                Out of Stock
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => {
                                                    setSelectedProduct(product)
                                                    setIsTransactionModalOpen(true)
                                                }}>
                                                    <Plus className="mr-2 h-4 w-4" /> Issue Part
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                {user?.role !== 'staff' && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
