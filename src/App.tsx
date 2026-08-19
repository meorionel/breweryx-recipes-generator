import { ThemeProvider, useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Moon, Sun } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGES } from "@/i18n";
import { RecipeForm } from "./RecipeForm";

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="size-4"
    >
      <path d="M12 .297C5.37.297 0 5.67 0 12.297c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0 1 12 5.803c1.02 0 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.814 1.103.814 2.222 0 1.606-.015 2.898-.015 3.293 0 .319.218.693.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

function GitHubLink() {
  const { t } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href="https://github.com/meorionel/breweryx-recipes-generator"
            target="_blank"
            rel="noreferrer"
            aria-label={t("github")}
            className={buttonVariants({ variant: "outline", size: "icon" })}
          />
        }
      >
        <GitHubIcon />
      </TooltipTrigger>
      <TooltipContent>{t("github")}</TooltipContent>
    </Tooltip>
  );
}

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
                <GitHubLink />
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
