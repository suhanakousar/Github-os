import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { RepositoryProvider } from "@/contexts/repository-context";

import Dashboard from "@/pages/dashboard";
import KnowledgeGraphPage from "@/pages/knowledge-graph";
import RiskAnalysisPage from "@/pages/risk-analysis";
import TemporalPage from "@/pages/temporal";
import ContributorsPage from "@/pages/contributors";
import SprintPage from "@/pages/sprint";
import ArchitecturePage from "@/pages/architecture";
import PredictionsPage from "@/pages/predictions";
import GovernancePage from "@/pages/governance";
import RefactorPage from "@/pages/refactor";
import SimulationPage from "@/pages/simulation";
import SettingsPage from "@/pages/settings";
import HelpPage from "@/pages/help";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/knowledge-graph" component={KnowledgeGraphPage} />
      <Route path="/risk-analysis" component={RiskAnalysisPage} />
      <Route path="/temporal" component={TemporalPage} />
      <Route path="/contributors" component={ContributorsPage} />
      <Route path="/sprint" component={SprintPage} />
      <Route path="/architecture" component={ArchitecturePage} />
      <Route path="/predictions" component={PredictionsPage} />
      <Route path="/governance" component={GovernancePage} />
      <Route path="/refactor" component={RefactorPage} />
      <Route path="/simulation" component={SimulationPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/help" component={HelpPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <RepositoryProvider>
        <ThemeProvider>
          <TooltipProvider>
            <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between gap-4 px-4 py-2 border-b border-border h-14 flex-shrink-0">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto bg-background">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
      </RepositoryProvider>
    </QueryClientProvider>
  );
}

export default App;
