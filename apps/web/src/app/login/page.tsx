"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PasswordInput } from "@/components/ui/password-input"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, Mail, User } from "lucide-react"

export default function LoginPage() {
  const [loginType, setLoginType] = useState<"email" | "username">("email")
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const { login, isAuthenticated } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/feed")
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const loginData = loginType === "email" 
        ? { email: identifier, password }
        : { username: identifier, password }
      
      await login(loginData)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
    } finally {
      setIsLoading(false)
    }
  }

  const detectLoginType = (value: string) => {
    if (value.includes("@")) {
      setLoginType("email")
    } else if (value.length > 0) {
      setLoginType("username")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.svg"
              alt="Royal Media"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your Royal Media account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">
                {loginType === "email" ? "Email" : "Username"}
              </Label>
              <div className="relative">
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Enter email or username"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value)
                    detectLoginType(e.target.value)
                  }}
                  className="pl-10"
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {loginType === "email" ? (
                    <Mail className="h-4 w-4 text-gray-400" />
                  ) : (
                    <User className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {loginType === "email" ? "Using email login" : "Using username login"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !identifier || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            <div className="text-center">
              <Link 
                href="/forgot-password" 
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-blue-600 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
      
      <footer className="fixed bottom-4 left-0 right-0 text-center text-sm text-gray-500">
        © Design and Developed by Aninda Sundar Roy
      </footer>
    </div>
  )
}