import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import LoginAdminPage from './pages/auth/login.admin.jsx';
import RegisterPage from './pages/auth/register.jsx';
import LayoutAdmin from './pages/layout.admin.jsx';
import DashboardPage from './pages/dashboard.jsx';
import { AuthWrapper } from './components/context/auth.context.jsx';

import ReportsScreen from './pages/report.jsx';
import SettingsScreen from './pages/setting.jsx';
import StockCheckScreen from './pages/stock.check.jsx';
import PrivateRoute from './pages/private.route.jsx';
import ErrorPage from './pages/error.jsx';
import UserPermissionScreen from './pages/user.permissin.jsx';
import ProductManagement from './pages/product.jsx';
import { StockInScreen } from './pages/stock.in.page.jsx';
import StockOutScreen from './pages/stock.out.page.jsx';

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginAdminPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },

  {
    path: "/",
    element:
      <PrivateRoute>
        <LayoutAdmin />,
      </PrivateRoute>,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <DashboardPage />
      },
      {
        path: "stock-check",
        element: <StockCheckScreen />
      },
      {
        path: "stock-in",
        element: <StockInScreen />
      },
      {
        path: "stock-out",
        element: <StockOutScreen />
      },
      {
        path: "reports",
        element: <ReportsScreen />
      },
      {
        path: "settings",
        element: <SettingsScreen />
      },
      {
        path: "permissions",
        element: <UserPermissionScreen />
      },
      {
        path: "products",
        element: <ProductManagement />
      },
    ]
  },

])

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <AuthWrapper>
    <RouterProvider router={router} />
  </AuthWrapper>
  // </React.StrictMode>
)
