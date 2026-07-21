import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Portal from "./pages/Portal";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import AdminRoster from "./pages/AdminRoster";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUmsatz from "./pages/AdminUmsatz";
import AdminOversight from "./pages/AdminOversight";
import ChildminderPortal from "./pages/ChildminderPortal";
import ChildminderOnboarding from "./pages/portal/ChildminderOnboarding";
import RegisterChildminder from "./pages/RegisterChildminder";
import ParentPortal from "./pages/ParentPortal";
import ChildminderDashboard from "./pages/portal/ChildminderDashboard";
import ProspectDashboard from "./pages/portal/ProspectDashboard";
import ChildminderProfile from "./pages/portal/ChildminderProfile";
import ChildminderShifts from "./pages/portal/ChildminderShifts";
import ChildminderAvailability from "./pages/portal/ChildminderAvailability";
import ChildminderTimesheets from "./pages/portal/ChildminderTimesheets";
import MessagesPage from "./pages/portal/MessagesPage";
import NotificationsPage from "./pages/portal/NotificationsPage";
import PerformanceDashboard from "./pages/portal/PerformanceDashboard";
import FindChildminder from "./pages/portal/FindChildminder";
import InvoicesPage from "./pages/portal/InvoicesPage";
import ParentProfile from "./pages/portal/ParentProfile";
import ChildrenManagement from "./pages/portal/ChildrenManagement";
import FundingPage from "./pages/portal/FundingPage";
import SubscriptionPage from "./pages/portal/SubscriptionPage";
import VerifizierungBestellen from "./pages/portal/VerifizierungBestellen";
import AkademiePage from "./pages/portal/AkademiePage";
import ExterneKursePage from "./pages/portal/ExterneKursePage";
import JugendamtReadyPage from "./pages/portal/JugendamtReadyPage";
import SafeguardingPage from "./pages/portal/SafeguardingPage";
import MFASetup from "./pages/portal/MFASetup";
import ParentOnboarding from "./pages/portal/ParentOnboarding";
import ParentDashboard from "./pages/portal/ParentDashboard";
import PlaceholderPage from "./pages/portal/PlaceholderPage";
import BookingsPage from "./pages/portal/BookingsPage";
import ContractsPage from "./pages/portal/ContractsPage";
import DocumentsPage from "./pages/portal/DocumentsPage";
import AdminCreateUser from "./pages/portal/AdminCreateUser";
import TrainingPage from "./pages/portal/TrainingPage";
import GDPRPolicy from "./pages/GDPRPolicy";
import TermsOfService from "./pages/TermsOfService";
import ComplaintsProcedure from "./pages/ComplaintsProcedure";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import Verifizierung from "./pages/Verifizierung";
import ErsteHilfe from "./pages/ErsteHilfe";
import Partner from "./pages/Partner";
import FuerArbeitgeber from "./pages/FuerArbeitgeber";
import EmployerPortal from "./pages/EmployerPortal";
import SaaS from "./pages/SaaS";
import JugendamtPortal from "./pages/JugendamtPortal";
import KitaPartner from "./pages/KitaPartner";
import AdminReferrals from "./pages/AdminReferrals";
import ReferralsPage from "./pages/portal/ReferralsPage";
import FlyerPage from "./pages/FlyerPage";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import Screensaver from "./pages/Screensaver";
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
            {/* German-friendly aliases */}
            <Route path="/agb" element={<TermsOfService />} />
            <Route path="/beschwerdeverfahren" element={<ComplaintsProcedure />} />
            <Route path="/flyer" element={<FlyerPage />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/screensaver" element={<Screensaver />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
