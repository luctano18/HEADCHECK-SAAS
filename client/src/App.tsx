import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CheckIn from "./pages/CheckIn";
import CheckInResult from "./pages/CheckInResult";
import SevenMirrors from "./pages/SevenMirrors";
import Dashboard from "./pages/Dashboard";
import FacilitatorDashboard from "./pages/FacilitatorDashboard";
import Onboarding from "./pages/Onboarding";
import JoinInstitution from "./pages/JoinInstitution";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/join" component={JoinInstitution} />
      <Route path="/check-in" component={CheckIn} />
      <Route path="/check-in/:id" component={CheckInResult} />
      <Route path="/seven-mirrors" component={SevenMirrors} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/facilitator" component={FacilitatorDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
