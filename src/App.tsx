import { ThemeProvider, useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Moon, Sun } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES } from "@/i18n";
import { RecipeForm } from "./RecipeForm";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === "dark";
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={t("theme.toggle")}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}

function LanguageSelect() {
  const { i18n, t } = useTranslation();
  return (
    <Select
      value={i18n.language}
      onValueChange={(v) => {
        if (v) i18n.changeLanguage(v);
      }}
    >
      <SelectTrigger className="w-28" aria-label={t("language")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.value} value={lang.value}>
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function App() {
  const { t } = useTranslation();
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <div className="min-h-screen">
          <header className="sticky top-0 z-40 border-b bg-card/60 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="BreweryX"
                  className="size-9 rounded-lg object-contain"
                />
                <div>
                  <h1 className="text-base font-semibold leading-tight">{t("app.title")}</h1>
                  <p className="text-xs text-muted-foreground">{t("app.subtitle")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LanguageSelect />
                <ThemeToggle />
              </div>
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
