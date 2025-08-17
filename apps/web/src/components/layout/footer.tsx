import Link from "next/link"
import { Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <Link href="/" className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Royal Media</span>
            </Link>
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Connecting people around the world
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-2 text-center md:items-end">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link 
                href="/privacy" 
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link 
                href="/terms" 
                className="hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link 
                href="/support" 
                className="hover:text-foreground transition-colors"
              >
                Support
              </Link>
            </div>
            
            {/* Required global footer copyright */}
            <p className="text-xs text-muted-foreground">
              © Design and Developed by Aninda Sundar Roy
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}