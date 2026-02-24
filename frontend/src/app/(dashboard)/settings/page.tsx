"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/store/auth-store"
import { User, Bell, Shield, Database } from "lucide-react"

export default function SettingsPage() {
    const user = useAuthStore((state) => state.user)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your profile and application preferences.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="system">System</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal details below.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-muted-foreground">First Name</span>
                                    <p className="mt-1">{user?.firstName}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-muted-foreground">Last Name</span>
                                    <p className="mt-1">{user?.lastName}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="font-medium text-muted-foreground">Email Address</span>
                                    <p className="mt-1">{user?.email}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="font-medium text-muted-foreground">Account Role</span>
                                    <p className="mt-1 capitalize">{user?.role?.replace('_', ' ')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
