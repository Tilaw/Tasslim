"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import api from "@/lib/api/axios"

const transactionSchema = z.object({
    productId: z.string().uuid(),
    transactionType: z.enum(['purchase', 'sale', 'return', 'adjustment']),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
    mechanicId: z.string().uuid().optional().nullable(),
    bikeId: z.string().uuid().optional().nullable(),
    notes: z.string().optional().default(""),
})

type TransactionFormValues = z.infer<typeof transactionSchema>

interface TransactionModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    product: any
}

export function TransactionModal({ open, onOpenChange, product }: TransactionModalProps) {
    const queryClient = useQueryClient()

    const { data: mechanics } = useQuery({
        queryKey: ["mechanics"],
        queryFn: async () => {
            const response = await api.get("/mechanics")
            return response.data.data
        },
    })

    const { data: bikes } = useQuery({
        queryKey: ["bikes"],
        queryFn: async () => {
            const response = await api.get("/bikes")
            return response.data.data
        },
    })

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            productId: product?.id || "",
            transactionType: "sale",
            quantity: 1,
            mechanicId: null,
            bikeId: null,
            notes: "",
        },
    })

    const mutation = useMutation({
        mutationFn: (data: TransactionFormValues) => api.post("/transactions", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] })
            queryClient.invalidateQueries({ queryKey: ["products"] })
            onOpenChange(false)
            form.reset()
        },
    })

    function onSubmit(data: TransactionFormValues) {
        mutation.mutate(data)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Issue Part: {product?.name}</DialogTitle>
                    <DialogDescription>
                        Map this part to a mechanic and a bike.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="transactionType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="sale">Sale / Issue</SelectItem>
                                                <SelectItem value="purchase">Purchase (Restock)</SelectItem>
                                                <SelectItem value="adjustment">Adjustment</SelectItem>
                                                <SelectItem value="return">Return</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="mechanicId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mechanic (Optional)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Mechanic" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {mechanics?.map((m: any) => (
                                                <SelectItem key={m.id} value={m.id}>
                                                    {m.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="bikeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bike / Plate Number (Optional)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Bike" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {bikes?.map((b: any) => (
                                                <SelectItem key={b.id} value={b.id}>
                                                    {b.plate_number} - {b.brand}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Extra details..." {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Record Transaction
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
