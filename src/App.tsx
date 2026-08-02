import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { lazy, Suspense } from "react";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Portal = lazy(() => import("./pages/Portal"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdminRoster = lazy(() => import("./pages/AdminRoster"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUmsatz = lazy(() => import("./pages/AdminUmsatz"));
const AdminOversight = lazy(() => import("./pages/AdminOversight"));
const ChildminderPortal = lazy(() => import("./pages/ChildminderPortal"));
const RegisterChildminder = lazy(() => import("./pages/RegisterChildminder"));
const ParentPortal = lazy(() => import("./pages/ParentPortal"));
const ChildminderOnboarding = lazy(() => import("./pages/portal/ChildminderOnboarding"));
const ChildminderDashboard = lazy(() => import("./pages/portal/ChildminderDashboard"));
const ProspectDashboard = lazy(() => import("./pages/portal/ProspectDashboard"));
const ChildminderProfile = lazy(() => import("./pages/portal/ChildminderProfile"));
const ChildminderShifts = lazy(() => import("./pages/portal/ChildminderShifts"));
const ChildminderAvailability = lazy(() => import("./pages/portal/ChildminderAvailability"));
const ChildminderTimesheets = lazy(() => import("./pages/portal/ChildminderTimesheets"));
const MessagesPage = lazy(() => import("./pages/portal/MessagesPage"));
const NotificationsPage = lazy(() => import("./pages/portal/NotificationsPage"));
const PerformanceDashboard = lazy(() => import("./pages/portal/PerformanceDashboard"));
const FindChildminder = lazy(() => import("./pages/portal/FindChildminder"));
const InvoicesPage = lazy(() => import("./pages/portal/InvoicesPage"));
const ParentProfile = lazy(() => import("./pages/portal/ParentProfile"));
const ChildrenManagement = lazy(() => import("./pages/portal/ChildrenManagement"));
const FundingPage = lazy(() => import("./pages/portal/FundingPage"));
const SubscriptionPage = lazy(() => import("./pages/portal/SubscriptionPage"));
const VerifizierungBestellen = lazy(() => import("./pages/portal/VerifizierungBestellen"));
const AkademiePage = lazy(() => import("./pages/portal/AkademiePage"));
const ExterneKursePage = lazy(() => import("./pages/portal/ExterneKursePage"));
const JugendamtReadyPage = lazy(() => import("./pages/portal/JugendamtReadyPage"));
const SafeguardingPage = lazy(() => import("./pages/portal/SafeguardingPage"));
const MFASetup = lazy(() => import("./pages/portal/MFASetup"));
const ParentOnboarding = lazy(() => import("./pages/portal/ParentOnboarding"));
const ParentDashboard = lazy(() => import("./pages/portal/ParentDashboard"));
const BookingsPage = lazy(() => import("./pages/portal/BookingsPage"));
const ContractsPage = lazy(() => import("./pages/portal/ContractsPage"));
const DocumentsPage = lazy(() => import("./pages/portal/DocumentsPage"));
const AdminCreateUser = lazy(() => import("./pages/portal/AdminCreateUser"));
const TrainingPage = lazy(() => import("./pages/portal/TrainingPage"));
const ReferralsPage = lazy(() => import("./pages/portal/ReferralsPage"));
const GDPRPolicy = lazy(() => import("./pages/GDPRPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const ComplaintsProcedure = lazy(() => import("./pages/ComplaintsProcedure"));
const Impressum = lazy(() => import("./pages/Impressum"));
const Datenschutz = lazy(() => import("./pages/Datenschutz"));
const Verifizierung = lazy(() => import("./pages/Verifizierung"));
const ErsteHilfe = lazy(() => import("./pages/ErsteHilfe"));
const Partner = lazy(() => import("./pages/Partner"));
const FuerArbeitgeber = lazy(() => import("./pages/FuerArbeitgeber"));
const EmployerPortal = lazy(() => import("./pages/EmployerPortal"));
const SaaS = lazy(() => import("./pages/SaaS"));
const JugendamtPortal = lazy(() => import("./pages/JugendamtPortal"));
const KitaPartner = lazy(() => import("./pages/KitaPartner"));
const AdminReferrals = lazy(() => import("./pages/AdminReferrals"));
const FlyerPage = lazy(() => import("./pages/FlyerPage"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Screensaver = lazy(() => import("./pages/Screensaver"));
import LoadingScreen from "./components/LoadingScreen";
import InstallPrompt from "./components/InstallPrompt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <LoadingScreen />
        <InstallPrompt />
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center" role="status">Seite wird geladen…</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/register/childminder" element={<RegisterChildminder />} />
            <Route path="/portal" element={<Portal />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/roster" element={<AdminRoster />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/umsatz" element={<AdminUmsatz />} />
            <Route path="/admin/oversight" element={<AdminOversight />} />
            <Route path="/admin/create-user" element={<AdminCreateUser />} />
            <Route path="/admin/referrals" element={<AdminReferrals />} />

            {/* Childminder portal */}
            <Route path="/childminder" element={<ChildminderPortal />}>
              <Route index element={<ChildminderDashboard />} />
              <Route path="prospect" element={<ProspectDashboard />} />
              <Route path="onboarding" element={<ChildminderOnboarding />} />
              <Route path="profile" element={<ChildminderProfile />} />
              <Route path="availability" element={<ChildminderAvailability />} />
              <Route path="shifts" element={<ChildminderShifts />} />
              <Route path="timesheets" element={<ChildminderTimesheets />} />
              <Route path="certificates" element={<DocumentsPage />} />
              <Route path="compliance" element={<DocumentsPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="contracts" element={<ContractsPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="performance" element={<PerformanceDashboard />} />
              <Route path="subscription" element={<SubscriptionPage />} />
              <Route path="verifizierung" element={<VerifizierungBestellen />} />
              <Route path="training" element={<TrainingPage />} />
              <Route path="akademie" element={<AkademiePage />} />
              <Route path="externe-kurse" element={<ExterneKursePage />} />
              <Route path="jugendamt-ready" element={<JugendamtReadyPage />} />
              <Route path="kinderschutz" element={<SafeguardingPage />} />
              <Route path="bookings" element={<BookingsPage />} />
              <Route path="empfehlungen" element={<ReferralsPage />} />
              <Route path="settings" element={<MFASetup />} />
            </Route>

            {/* Parent portal */}
            <Route path="/parent" element={<ParentPortal />}>
              <Route index element={<ParentDashboard />} />
              <Route path="onboarding" element={<ParentOnboarding />} />
              <Route path="profile" element={<ParentProfile />} />
              <Route path="children" element={<ChildrenManagement />} />
              <Route path="bookings" element={<BookingsPage />} />
              <Route path="find-childminder" element={<FindChildminder />} />
              <Route path="funding" element={<FundingPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="contracts" element={<ContractsPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="kinderschutz" element={<SafeguardingPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="empfehlungen" element={<ReferralsPage />} />
              <Route path="settings" element={<MFASetup />} />
            </Route>

            <Route path="/privacy-policy" element={<GDPRPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/complaints-procedure" element={<ComplaintsProcedure />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/datenschutz" element={<Datenschutz />} />
            <Route path="/verifizierung" element={<Verifizierung />} />
            <Route path="/erste-hilfe" element={<ErsteHilfe />} />
            <Route path="/partner" element={<Partner />} />
            <Route path="/fuer-arbeitgeber" element={<FuerArbeitgeber />} />
            <Route path="/employer" element={<EmployerPortal />} />
            <Route path="/saas" element={<SaaS />} />
            <Route path="/jugendamt" element={<JugendamtPortal />} />
            <Route path="/kita-partner" element={<KitaPartner />} />
            {/* German-friendly aliases */}
            <Route path="/agb" element={<TermsOfService />} />
            <Route path="/beschwerdeverfahren" element={<ComplaintsProcedure />} />
            <Route path="/flyer" element={<FlyerPage />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/screensaver" element={<Screensaver />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
