import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Plans from "./pages/Plans";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentForm from "./pages/StudentForm";
import StudentDetail from "./pages/StudentDetail";
import Games from "./pages/Games";
import GamePlay from "./pages/GamePlay";
import Materials from "./pages/Materials";
import Videos from "./pages/Videos";
import Progress from "./pages/Progress";
import AIAssistant from "./pages/AIAssistant";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import AAC from "./pages/AAC";

function Router() {
  return (
    <Switch>      <Route path={"/"} component={Home} />
      <Route path={"/plans"} component={Plans} />      <Route path="/dashboard" component={Dashboard} />
      <Route path="/students" component={Students} />
      <Route path="/students/new" component={StudentForm} />
      <Route path="/students/:id/edit" component={StudentForm} />
      <Route path="/students/:id" component={StudentDetail} />
      <Route path="/games" component={Games} />
      <Route path="/games/:id/play" component={GamePlay} />
      <Route path="/games/:id" component={GamePlay} />
      <Route path="/materials" component={Materials} />
      <Route path="/videos" component={Videos} />
      <Route path="/progress" component={Progress} />
      <Route path="/ai-assistant" component={AIAssistant} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/profile" component={Profile} />
      <Route path="/aac" component={AAC} />
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
          <Toaster position="top-right" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
