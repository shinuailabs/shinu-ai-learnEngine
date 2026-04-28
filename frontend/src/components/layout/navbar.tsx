import { Moon, Sun, User, Settings, Compass, BookOpen, Cpu } from 'lucide-react'
import { useTheme } from '../theme-provider'
import { Button } from '../ui/button'

export function Navbar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            {/* Logo placeholder - replace with actual image if available */}
            <img 
              src="/brand/ShinuAILabs_Logo.png" 
              alt="Shinu AI Labs" 
              className="h-8 w-8 object-contain"
              onError={(e) => {
                // Fallback if image not found
                e.currentTarget.style.display = 'none'
                e.currentTarget.parentElement!.innerHTML = '<div class="text-primary font-bold text-xl">S</div>'
              }}
            />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-card-foreground">Shinu AI Labs</span>
            <span className="ml-2 hidden text-sm font-medium text-muted-foreground md:inline">Learn Engine</span>
          </div>
        </div>

        <div className="hidden items-center gap-8 lg:flex">
          <nav className="flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Explore</a>
            <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">My Learning</a>
            <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">AI Tools</a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full hover:bg-muted"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
            <Settings className="h-5 w-5" />
          </Button>
          <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-primary/20 bg-muted">
            <div className="flex h-full w-full items-center justify-center bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
