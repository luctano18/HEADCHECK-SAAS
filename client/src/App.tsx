import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import GuestCheckInResult from "@/pages/GuestCheckInResult";
import CheckIn from "./pages/CheckIn";
import CheckInResult from "./pages/CheckInResult";
import SevenMirrors from "./pages/SevenMirrors";
import Dashboard from "./pages/Dashboard";
import FacilitatorDashboard from "./pages/FacilitatorDashboard";
import WeeklyReport from "./pages/WeeklyReport";
import Onboarding from "./pages/Onboarding";
import JoinInstitution from "./pages/JoinInstitution";
import NotFound from "./pages/NotFound";
import Resources from "./pages/Resources";
import LearnEI from "./pages/LearnEI";
import Mindset from "./pages/Mindset";
import ForInstitutions from "./pages/ForInstitutions";
import ZeraCards from "./pages/ZeraCards";
import Coaching from "./pages/Coaching";
import About from "./pages/About";
import EIQuiz from "./pages/EIQuiz";
import EIQuizResult from "./pages/EIQuizResult";
import CrisisSupport from "./pages/CrisisSupport";
import ViolencePrevention from "./pages/ViolencePrevention";
import Profile from "./pages/Profile";
import AlertDetail from "./pages/AlertDetail";
import Notifications from "./pages/Notifications";
import CheckInSummary from "./pages/CheckInSummary";
import Messages from "./pages/Messages";
import WellnessLogbook from "./pages/WellnessLogbook";
import SupportOptions from "./pages/SupportOptions";
import AIEILibrary from "./pages/AIEILibrary";
import PulseSurveys from "./pages/PulseSurveys";
import TeamSentiment from "./pages/TeamSentiment";
import FeelingWheel from "./pages/FeelingWheel";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import EmailVerificationBanner from "./components/EmailVerificationBanner";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/join" component={JoinInstitution} />
      <Route path="/checkin" component={CheckIn} />
      {/* Canonical routes */}
      <Route path="/checkin/summary" component={CheckInSummary} />
      <Route path="/checkin/guest-result" component={GuestCheckInResult} />
      <Route path="/checkin/result/:id" component={CheckInResult} />
      <Route path="/compass" component={SevenMirrors} />
      {/* Legacy aliases removed — use canonical routes above */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/facilitator" component={FacilitatorDashboard} />
      <Route path="/admin/weekly-report" component={WeeklyReport} />
      <Route path="/resources" component={Resources} />
      <Route path="/learn-ei" component={LearnEI} />
      <Route path="/mindset" component={Mindset} />
      <Route path="/for-institutions" component={ForInstitutions} />
      <Route path="/zera-cards" component={ZeraCards} />
      <Route path="/coaching" component={Coaching} />
      <Route path="/about" component={About} />
      <Route path="/ei-quiz" component={EIQuiz} />
      <Route path="/ei-quiz/result" component={EIQuizResult} />
      {/* Safety & Crisis routes */}
      <Route path="/crisis-support" component={CrisisSupport} />
      <Route path="/violence-prevention" component={ViolencePrevention} />
      {/* Profile */}
      <Route path="/profile" component={Profile} />
      {/* Notifications */}
      <Route path="/notifications" component={Notifications} />
      {/* Secure Messaging */}
      <Route path="/messages" component={Messages} />
      {/* Wellness Logbook */}
      <Route path="/wellness-logbook" component={WellnessLogbook} />
      {/* Support Options */}
      <Route path="/support-options" component={SupportOptions} />
      {/* AIEI Content Library */}
      <Route path="/aiei-library" component={AIEILibrary} />
      {/* Business / Team features */}
      <Route path="/pulse-surveys" component={PulseSurveys} />
      <Route path="/team-sentiment" component={TeamSentiment} />
      {/* Feeling Wheel */}
      <Route path="/feeling-wheel" component={FeelingWheel} />
      {/* Alert Detail pages (admin/facilitator only) */}
      <Route path="/alert/crisis/:id" component={AlertDetail} />
      <Route path="/alert/violence/:id" component={AlertDetail} />
      {/* Auth routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Toaster richColors position="top-right" />
        <EmailVerificationBanner />
        {/* ErrorBoundary wraps Router to auto-recover from DOM mutation errors
            caused by browser extensions (Google Translate, Grammarly, etc.) */}
        <ErrorBoundary>
          <Router />
        </ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
