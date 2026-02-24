"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react"

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
import { useAuthStore } from "@/store/auth-store"

export default function BikesPage() {
    const { user } = useAuthStore()
    const queryClient = useQueryClient()

    const { data: bikes, isLoading } = useQuery({
        queryKey: ["bikes"],
        queryFn: async () => {
            const response = await api.get("/bikes")
            return response.data.data
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/bikes/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bikes"] })
        },
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bikes</h1>
                    <p className="text-muted-foreground">Track customer bikes and service history.</p>
                </div>
                <Button onClick={() => { }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Bike
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by plate number..." className="pl-8" />
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Plate Number</TableHead>
                            <TableHead>Brand/Model</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Loading bikes...
                                </TableCell>
                            </TableRow>
                        ) : bikes?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No bikes found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            bikes?.map((bike: any) => (
                                <TableRow key={bike.id}>
                                    <TableCell className="font-medium">{bike.plate_number}</TableCell>
                                    <TableCell>{bike.brand} {bike.model}</TableCell>
                                    <TableCell>{bike.customer_name || "---"}</TableCell>
                                    <TableCell>{bike.customer_phone || "---"}</TableCell>
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

                                                {user?.role !== 'staff' && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => deleteMutation.mutate(bike.id)}
                                                        >
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
