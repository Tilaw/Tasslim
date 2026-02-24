"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Package,
    Tags,
    Users,
    Truck,
    History,
    Settings,
    LogOut,
    Menu,
    Wrench,
    Bike
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/auth-store"

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Categories", href: "/categories", icon: Tags },
    { name: "Suppliers", href: "/suppliers", icon: Truck },
    { name: "Transactions", href: "/transactions", icon: History },
    { name: "Mechanics", href: "/mechanics", icon: Wrench },
    { name: "Bikes", href: "/bikes", icon: Bike },
    { name: "Issue Part", href: "/inventory?action=issue", icon: Wrench },
    { name: "Users", href: "/users", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
]

export function AppSidebar() {
    const pathname = usePathname()
    const { user, logout } = useAuthStore()

    return (
        <Sidebar>
            <SidebarHeader className="p-4">
                <div className="flex items-center gap-2 font-bold text-xl text-primary">
                    <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                        T
                    </div>
                    Tasslim Parts
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Management</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navigation
                                .filter(item => {
                                    if (user?.role === 'staff') {
                                        return !['Users', 'Settings'].includes(item.name);
                                    }
                                    return true;
                                })
                                .map((item) => (
                                    <SidebarMenuItem key={item.name}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === item.href}
                                            tooltip={item.name}
                                        >
                                            <Link href={item.href}>
                                                <item.icon className="w-5 h-5" />
                                                <span>{item.name}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={logout}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
