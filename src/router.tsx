import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./components/layout/app-shell";
import { ProtectedRoute } from "./components/layout/protected-route";
import { AlbumPage } from "./pages/album";
import { ExpensesPage } from "./pages/expenses";
import { GamesPage } from "./pages/games";
import { GuidePage } from "./pages/guide";
import { HomePage } from "./pages/home";
import { LoginPage } from "./pages/login";
import { SchedulePage } from "./pages/schedule";
import { SeatsPage } from "./pages/seats";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/", element: <HomePage /> },
          { path: "/guide", element: <GuidePage /> },
          { path: "/schedule", element: <SchedulePage /> },
          { path: "/seats", element: <SeatsPage /> },
          { path: "/album", element: <AlbumPage /> },
          { path: "/expenses", element: <ExpensesPage /> },
          { path: "/games", element: <GamesPage /> }
        ]
      }
    ]
  }
]);
