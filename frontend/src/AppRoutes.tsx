import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "../src/pages/Login";
import { Register } from "./pages/Register";
import { Home } from "../src/pages/Home";
import { Users } from "./pages/Users";
import { Reports } from "./pages/Reports"
import { Settings } from "./pages/Settings"
import { Dashboard } from "./pages/Dashboard";
import { AdminUsers } from "./pages/AdminUsers";
import { Profile } from "./pages/Profile";
import { ProfileSecurity } from "./pages/ProfileSecurity";
import { News } from "./pages/News";
import { Approaches } from "./pages/Approaches";
import { ApproachedList } from "./pages/ApproachedList";
import { CheckEmail } from "./pages/CheckEmail";
import { PrivateRoute } from "../src/routes/PrivateRoute";
import { PrivateLayout } from "./layouts/PrivateLayout";
import PublicHome from "./pages/public/Home";
import PublicNews from "./pages/public/News";
import NewsDetail from "./pages/public/NewsDetail";

type AppRoute = {
  path: string;
  element: React.ReactNode;
  isPrivate?: boolean;
  children?: AppRoute[];
};

const routes: AppRoute[] = [
  {
    path: "/",
    element: <PublicHome />,
  },
  {
    path: "/noticias",
    element: <PublicNews />,
  },
  {
    path: "/noticias/:id",
    element: <NewsDetail />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/check-email",
    element: <CheckEmail />,
  },
  {
    path: "/",
    element: (
      <PrivateRoute>
        <PrivateLayout />
      </PrivateRoute>
    ),
    children: [
      {
        path: "home",
        element: <Home />,
        children: [
          { path: "", element: <Dashboard /> },
          { path: "users", element: <Users /> },
          { path: "news", element: <News /> },
          { path: "approaches", element: <Approaches /> },
          { path: "abordados", element: <ApproachedList /> },
          { path: "reports", element: <Reports /> },
          { path: "settings", element: <Settings /> },
        ],
      },
      {
        path: "dashboard/admin/users",
        element: <AdminUsers />,
      },
      {
        path: "settings/profile",
        element: <Profile />,
      },
      {
        path: "settings/security",
        element: <ProfileSecurity />,
      },
    ],
  },
];

function renderRoute(route: AppRoute, index: number) {
  return (
    <Route key={`${route.path}-${index}`} path={route.path} element={route.element}>
      {route.children?.map(renderRoute)}
    </Route>
  );
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {routes.map(renderRoute)}
      </Routes>
    </BrowserRouter>
  );
}
