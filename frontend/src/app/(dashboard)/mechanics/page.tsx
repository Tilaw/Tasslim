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

export default function MechanicsPage() {
    const { user } = useAuthStore()
    const queryClient = useQueryClient()

    const { data: mechanics, isLoading } = useQuery({
        queryKey: ["mechanics"],
        queryFn: async () => {
            const response = await api.get("/mechanics")
            return response.data.data
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/mechanics/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mechanics"] })
        },
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mechanics</h1>
                    <p className="text-muted-foreground">Manage service personnel and assignments.</p>
                </div>
                <Button onClick={() => { }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Mechanic
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search mechanics..." className="pl-8" />
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Specialization</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Loading mechanics...
                                </TableCell>
                            </TableRow>
                        ) : mechanics?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No mechanics found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            mechanics?.map((mechanic: any) => (
                                <TableRow key={mechanic.id}>
                                    <TableCell className="font-medium">{mechanic.name}</TableCell>
                                    <TableCell>{mechanic.phone || "---"}</TableCell>
                                    <TableCell>{mechanic.specialization || "---"}</TableCell>
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
                                                            onClick={() => deleteMutation.mutate(mechanic.id)}
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
