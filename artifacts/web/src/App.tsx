import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from "@clerk/react";
import { ruRU } from "@clerk/localizations";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import LandingPage from "./pages/landing";
import DashboardPage from "./pages/dashboard";
const ProfilePage = lazy(() => import("./pages/profile"));
const MatrixPage = lazy(() => import("./pages/matrix"));
const BaziPage = lazy(() => import("./pages/bazi"));
const QimenPage = lazy(() => import("./pages/qimen"));
const AstrologyPage = lazy(() => import("./pages/astrology"));
const FengShuiPage = lazy(() => import("./pages/fengshui"));
const ContactsPage = lazy(() => import("./pages/contacts"));
const DreamsPage = lazy(() => import("./pages/dreams"));
const HabitsPage = lazy(() => import("./pages/habits"));
const TravelPage = lazy(() => import("./pages/travel"));
const TarotPage = lazy(() => import("./pages/tarot"));
const JournalPage = lazy(() => import("./pages/journal"));
const PsychologyPage = lazy(() => import("./pages/psychology"));
import PrivacyPage from "./pages/privacy";
import PrivacyPolicyPage from "./pages/privacy-policy";
import TermsOfServicePage from "./pages/terms-of-service";
const AdminStudioPage = lazy(() => import("./pages/admin-studio"));
import NotFound from "./pages/not-found";
import AppLayout from "./components/layout/app-layout";
import { CookieBanner } from "./components/cookie-banner";
import { Footer } from "./components/footer";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl) {
  setBaseUrl(apiUrl);
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.png`,
  },
  variables: {
    colorPrimary: "hsl(222 90% 63%)",
    colorForeground: "hsl(45 30% 90%)",
    colorMutedForeground: "hsl(164 15% 65%)",
    colorDanger: "hsl(0 62.8% 30.6%)",
    colorBackground: "hsl(18 43% 55%)",
    colorInput: "hsl(164 30% 25%)",
    colorInputForeground: "hsl(45 30% 90%)",
    colorNeutral: "hsl(164 30% 30%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-serif text-2xl",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground",
    footerActionLink: "text-primary hover:text-primary/90",
    footerActionText: "text-muted-foreground",
    dividerText: "hidden",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    formFieldSuccessText: "text-success",
    alertText: "text-destructive-foreground",
    logoBox: "flex justify-center mb-4",
    logoImage: "h-16 object-contain",
    socialButtonsBlockButton: "border border-border hover:bg-muted/50",
    socialButtonsBlockButton__github: "hidden",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
    formFieldInput: "bg-input border-border text-foreground focus:ring-ring",
    footerAction: "mt-4",
    dividerLine: "bg-border",
    dividerRow: "hidden",
    alert: "bg-destructive/20 border-destructive",
    otpCodeFieldInput: "bg-input border-border text-foreground",
    formFieldRow: "mb-4",
    main: "w-full",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(179,155,200,0.15),transparent_50%)] pointer-events-none"></div>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(179,155,200,0.15),transparent_50%)] pointer-events-none"></div>
      <div className="relative z-10 flex flex-col items-center gap-5">
        <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/60 max-w-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="h-4 w-4 accent-primary rounded cursor-pointer"
          />
          <span className="text-xs text-muted-foreground">
            Я принимаю условия{" "}
            <Link href="/terms-of-service" className="text-primary underline">
              Пользовательского соглашения
            </Link>{" "}
            и даю{" "}
            <Link href="/privacy-policy" className="text-primary underline">
              Согласие на обработку персональных данных
            </Link>
          </span>
        </label>

        <div className="relative w-full flex justify-center">
          <div
            className={
              agreed
                ? "w-full flex justify-center"
                : "w-full flex justify-center pointer-events-none opacity-50 select-none"
            }
            aria-hidden={!agreed}
          >
            <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
          </div>
          {!agreed && (
            <div className="absolute inset-0 z-20 flex items-center justify-center px-6 pointer-events-auto">
              <p className="max-w-xs text-center text-sm font-medium text-foreground/90 drop-shadow-sm">
                Пожалуйста, подтвердите согласие выше для регистрации
              </p>
            </div>
          )}
        </div>

        <p className="max-w-sm text-center text-sm text-muted-foreground">
          Регистрируясь, вы соглашаетесь с{" "}
          <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
            Политикой обработки персональных данных
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ApiTokenInitializer() {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    });
  }, [getToken]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: any }) {
  return (
    <>
      <Show when="signed-in">
        <AppLayout>
          <Component />
        </AppLayout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

const APP_SHELL_PREFIXES = [
  "/dashboard",
  "/profile",
  "/matrix",
  "/bazi",
  "/qimen",
  "/astrology",
  "/fengshui",
  "/contacts",
  "/dreams",
  "/journal",
  "/psychology",
  "/admin",
  "/habits",
  "/travel",
  "/tarot",
];

/**
 * Глобальные элементы, требуемые 152-ФЗ РФ и GDPR:
 * - CookieBanner показывается на всех страницах до получения согласия;
 * - Footer отображается на публичных страницах (страницы приложения
 *   получают Footer внутри AppLayout, чтобы он был виден в нижней части экрана).
 */
function SiteChrome() {
  const [location] = useLocation();
  const isAppShellRoute = APP_SHELL_PREFIXES.some(
    (prefix) => location === prefix || location.startsWith(`${prefix}/`),
  );

  return (
    <>
      {!isAppShellRoute && <Footer />}
      <CookieBanner />
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        ...ruRU,
        signIn: {
          ...ruRU.signIn,
          start: {
            ...ruRU.signIn?.start,
            title: "Войти в Aether Oracle",
            subtitle: "Чтобы продолжить работу в Aether Oracle",
            dividerText: "",
          },
        },
        signUp: {
          ...ruRU.signUp,
          start: {
            ...ruRU.signUp?.start,
            title: "Создать аккаунт в Aether Oracle",
            subtitle: "Начните свой путь в Aether Oracle",
            dividerText: "",
          },
        },
      } as any}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <ApiTokenInitializer />
        <TooltipProvider>
          <Suspense
            fallback={
              <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
                Загрузка раздела...
              </div>
            }
          >
            <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/privacy" component={PrivacyPage} />
            <Route path="/privacy-policy" component={PrivacyPolicyPage} />
            <Route path="/terms-of-service" component={TermsOfServicePage} />
            
            <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
            <Route path="/profile" component={() => <ProtectedRoute component={ProfilePage} />} />
            <Route path="/matrix" component={() => <ProtectedRoute component={MatrixPage} />} />
            <Route path="/bazi" component={() => <ProtectedRoute component={BaziPage} />} />
            <Route path="/qimen" component={() => <ProtectedRoute component={QimenPage} />} />
            <Route path="/astrology" component={() => <ProtectedRoute component={AstrologyPage} />} />
            <Route path="/fengshui" component={() => <ProtectedRoute component={FengShuiPage} />} />
            <Route path="/contacts" component={() => <ProtectedRoute component={ContactsPage} />} />
            <Route path="/dreams" component={() => <ProtectedRoute component={DreamsPage} />} />
            <Route path="/journal" component={() => <ProtectedRoute component={JournalPage} />} />
            <Route path="/psychology" component={() => <ProtectedRoute component={PsychologyPage} />} />
            <Route path="/admin/studio" component={() => <ProtectedRoute component={AdminStudioPage} />} />
            <Route path="/habits" component={() => <ProtectedRoute component={HabitsPage} />} />
            <Route path="/travel" component={() => <ProtectedRoute component={TravelPage} />} />
            <Route path="/tarot" component={() => <ProtectedRoute component={TarotPage} />} />
            
              <Route component={NotFound} />
            </Switch>
          </Suspense>
          <SiteChrome />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
