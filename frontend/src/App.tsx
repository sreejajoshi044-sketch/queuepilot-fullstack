
import { useState } from "react";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Queues from "./components/Queues";
import Tokens from "./components/Tokens";

import Login from "./pages/Login";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => Boolean(
      sessionStorage.getItem("queueflow_token")
    )
  );

  const [activePage, setActivePage] =
    useState("Dashboard");

  // Login component verifies credentials with backend.
  const handleLogin = () => {
    setIsLoggedIn(true);
    setActivePage("Dashboard");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("queueflow_token");
    sessionStorage.removeItem("queueflow_manager");

    window.dispatchEvent(
      new Event("queueflow-auth-changed")
    );

    setIsLoggedIn(false);
    setActivePage("Dashboard");
  };

  const handleNavigate = (page: string) => {
    if (page === "Logout") {
      handleLogout();
      return;
    }

    setActivePage(page);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return (
          <Dashboard
            onCreateQueue={() =>
              setActivePage("My Queues")
            }
          />
        );

      case "My Queues":
        return <Queues />;

      case "Tokens":
        return <Tokens />;

      case "Analytics":
        return <Analytics />;

      case "Settings":
        return (
          <Settings onLogout={handleLogout} />
        );

      default:
        return (
          <div className="rounded-2xl bg-white p-8">
            <h1 className="text-2xl font-bold text-slate-900">
              {activePage}
            </h1>
            <p className="mt-3 text-slate-500">
              Page not available.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar activePage={activePage} />

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto w-full max-w-6xl">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
