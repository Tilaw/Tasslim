"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Lock, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/auth-store"
import api from "@/lib/api/axios"

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const router = useRouter()
    const setAuth = useAuthStore((state) => state.setAuth)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(data: LoginFormValues) {
        setIsLoading(true)
        setError(null)
        try {
            const response = await api.post("/auth/login", data)
            const { user, token } = response.data.data
            setAuth(user, token)
            router.push("/")
        } catch (err: any) {
            setError(err.response?.data?.error?.message || "Invalid email or password")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <Card className="w-full max-w-md shadow-lg transition-all hover:shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-2">
                        <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                            T
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
                    <CardDescription>
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    {...form.register("email")}
                                    placeholder="name@example.com"
                                    className="pl-10"
                                    type="email"
                                    autoComplete="email"
                                    disabled={isLoading}
                                />
                            </div>
                            {form.formState.errors.email && (
                                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    {...form.register("password")}
                                    placeholder="••••••••"
                                    className="pl-10"
                                    type="password"
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                />
                            </div>
                            {form.formState.errors.password && (
                                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                            )}
                        </div>
                        {error && (
                            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                "Log In"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                    <div className="text-center text-sm text-muted-foreground">
                        Don't have an account? Contact your administrator.
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
