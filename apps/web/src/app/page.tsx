"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { Users, MessageSquare, Heart, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const features = [
  {
    icon: Users,
    title: "Connect with Friends",
    description: "Build meaningful relationships and stay connected with people who matter to you."
  },
  {
    icon: MessageSquare,
    title: "Share Your Thoughts",
    description: "Express yourself, share updates, and engage in conversations with your community."
  },
  {
    icon: Heart,
    title: "Discover Content",
    description: "Explore interesting posts, discover new perspectives, and engage with diverse content."
  },
  {
    icon: Zap,
    title: "Real-time Updates",
    description: "Stay up-to-date with instant notifications and real-time interactions."
  }
]

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect authenticated users to feed
    if (user && !isLoading) {
      router.push("/feed")
    }
  }, [user, isLoading, router])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <Image
                src="/logo.svg"
                alt="Royal Media"
                width={200}
                height={60}
                className="h-16 w-auto"
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
              Welcome to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Royal Media
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Connect with friends, share your moments, and discover amazing content 
              in a beautiful, modern social platform designed for meaningful interactions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/register">
                  Get Started
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Royal Media?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience social networking like never before with our thoughtfully designed features
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-8">
            Ready to join the community?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start connecting with friends and sharing your story today.
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link href="/register">
              Create Your Account
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}