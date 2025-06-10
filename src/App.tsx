import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/main-layout";
import Login from "./components/auth/Login";
import User from "./pages/User/User";
import AddUser from "./pages/User/AddUser";
import Dashboard from "./pages/Dashboard";
import AddPromotion from "./pages/Promotion/AddPromotion";
import Promotions from "./pages/Promotion/Promotions";
import RoleBasedRoute from "./routes/helpers/RoleBasedRoute";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./routes/helpers/ProtectedRoute";
import Customer from "./pages/Customer/Customer";
import AddCustomer from "./pages/Customer/AddCustomer";

function App() {
  return (
    <Routes>
      {/* Main */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        
        <Route path="user" element={<ProtectedRoute><RoleBasedRoute allowedRoleIds={[1]}><User /></RoleBasedRoute></ProtectedRoute>}/>

        <Route path="user/add" element={<RoleBasedRoute allowedRoleIds={[1]}><AddUser /></RoleBasedRoute>} />

        <Route path="customer" element={<RoleBasedRoute allowedRoleIds={[1]}><Customer /></RoleBasedRoute>} />
        <Route path="customer/add" element={<RoleBasedRoute allowedRoleIds={[1]}><AddCustomer
         /></RoleBasedRoute>} />

        <Route path="/promotions" element={<RoleBasedRoute allowedRoleIds={[1]}><Promotions /></RoleBasedRoute>} />
        <Route path="promotions/add" element={<RoleBasedRoute allowedRoleIds={[1]}><AddPromotion /></RoleBasedRoute>} />
      </Route>

      {/* Auth */}
        <Route path="login" element={<Login />} />

      {/* Unauthorized */}
      <Route path="/unauthorized" element={<Unauthorized />} />
    </Routes>
  );
}

export default App;
