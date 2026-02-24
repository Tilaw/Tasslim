"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient()

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated, user } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        // In a real app, you'd check a server-side session too
        if (!isAuthenticated) {
            router.push("/login")
        }
    }, [isAuthenticated, router])

    if (!isAuthenticated) return null

    return (
        <QueryClientProvider client={queryClient}>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <Header />
                    <main className="flex-1 p-4 md:p-6 bg-slate-50/50">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </QueryClientProvider>
    )
}
