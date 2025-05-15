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
import StockInScreen from './pages/stock.in.jsx';
import StockOutScreen from './pages/stock.out.jsx';
import ReportsScreen from './pages/report.jsx';
import SettingsScreen from './pages/setting.jsx';
import StockCheckScreen from './pages/stock.check.jsx';

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
      // <PrivateRouteAdmin>
        <LayoutAdmin />,
      // </PrivateRouteAdmin>,
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
