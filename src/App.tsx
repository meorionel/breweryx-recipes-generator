import { ThemeProvider, useTheme } from "next-themes";
import { Beer, Moon, Sun } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { RecipeForm } from "./RecipeForm";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="切换主题"
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}

export function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <div className="min-h-screen">
          <header className="sticky top-0 z-40 border-b bg-card/60 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Beer className="size-5" />
                </div>
                <div>
                  <h1 className="text-base font-semibold leading-tight">BreweryX 配方生成器</h1>
                  <p className="text-xs text-muted-foreground">生成 BreweryX 酿造配方 YAML 代码</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6">
            <RecipeForm />
          </main>
        </div>
        <Toaster position="top-right" richColors />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
