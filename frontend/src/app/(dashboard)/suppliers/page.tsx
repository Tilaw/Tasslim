"use client"

import { useQuery } from "@tanstack/react-query"
import { Plus, Search, Phone, Mail, MoreHorizontal, Edit, Trash2 } from "lucide-react"

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
import api from "@/lib/api/axios"

export default function SuppliersPage() {
    const { data: suppliers, isLoading } = useQuery({
        queryKey: ["suppliers"],
        queryFn: async () => {
            const response = await api.get("/suppliers")
            return response.data.data
        },
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
                    <p className="text-muted-foreground">Manage your vendors and contact information.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Supplier
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search suppliers..." className="pl-8" />
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vendor Name</TableHead>
                            <TableHead>Contact Person</TableHead>
                            <TableHead>Phone / Email</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Loading suppliers...
                                </TableCell>
                            </TableRow>
                        ) : suppliers?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No suppliers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            suppliers?.map((supplier: any) => (
                                <TableRow key={supplier.id}>
                                    <TableCell className="font-medium">{supplier.name}</TableCell>
                                    <TableCell>{supplier.contact_person || "N/A"}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs">
                                            {supplier.phone && <span className="flex items-center text-muted-foreground"><Phone className="mr-1 h-3 w-3" /> {supplier.phone}</span>}
                                            {supplier.email && <span className="flex items-center text-muted-foreground"><Mail className="mr-1 h-3 w-3" /> {supplier.email}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">{supplier.address || "N/A"}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
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
