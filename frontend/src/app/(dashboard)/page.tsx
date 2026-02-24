"use client"

import { useQuery } from "@tanstack/react-query"
import { Package, Truck, ArrowUpRight, ArrowDownRight, Users, AlertCircle } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/lib/api/axios"

export default function DashboardPage() {
    // In a real app, these would be API calls
    const { data: statsData, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await api.get('/reports/dashboard-stats');
            return response.data.data;
        }
    });

    const stats = [
        {
            name: "Total Products",
            value: isLoading ? "..." : statsData?.totalProducts || "0",
            icon: Package,
            change: "+12%",
            trend: "up"
        },
        {
            name: "Active Suppliers",
            value: isLoading ? "..." : statsData?.activeSuppliers || "0",
            icon: Truck,
            change: "+3",
            trend: "up"
        },
        {
            name: "Low Stock Items",
            value: isLoading ? "..." : statsData?.lowStockItems || "0",
            icon: AlertCircle,
            change: "-2",
            trend: "down"
        },
        {
            name: "Total Users",
            value: isLoading ? "..." : statsData?.totalUsers || "0",
            icon: Users,
            change: "0",
            trend: "neutral"
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back to Tasslim Parts Manager.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.name} className="transition-all hover:border-primary/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                                {stat.trend === "up" && <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />}
                                {stat.trend === "down" && <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />}
                                <span className={stat.trend === "up" ? "text-green-500" : stat.trend === "down" ? "text-red-500" : ""}>
                                    {stat.change}
                                </span>
                                <span className="ml-1">from last month</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            [Recent transactions list will go here]
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top Suppliers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            [Top suppliers chart will go here]
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
