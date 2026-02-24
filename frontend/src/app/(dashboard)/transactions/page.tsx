"use client"

import { useQuery } from "@tanstack/react-query"
import { History, Search, ArrowUp, ArrowDown } from "lucide-react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api/axios"

export default function TransactionsPage() {
    const { data: transactions, isLoading } = useQuery({
        queryKey: ["transactions"],
        queryFn: async () => {
            const response = await api.get("/transactions")
            return response.data.data
        },
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Stock Transactions</h1>
                <p className="text-muted-foreground">Review history of stock movements and adjustments.</p>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search records..." className="pl-8" />
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead>User</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Loading history...
                                </TableCell>
                            </TableRow>
                        ) : transactions?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No records found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions?.map((tx: any) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {new Date(tx.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{tx.product_name}</span>
                                            <span className="text-xs text-muted-foreground">{tx.product_sku}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                tx.transaction_type === "purchase" || tx.transaction_type === "return"
                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                    : "bg-red-50 text-red-700 border-red-200"
                                            }
                                        >
                                            {tx.transaction_type.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center font-bold">
                                            {tx.quantity > 0 ? (
                                                <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
                                            ) : (
                                                <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
                                            )}
                                            {Math.abs(tx.quantity)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[150px] truncate">
                                        {tx.notes || "---"}
                                    </TableCell>
                                    <TableCell>
                                        {tx.first_name} {tx.last_name}
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
