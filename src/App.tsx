import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/main-layout";
import Login from "./components/auth/Login";
import User from "./pages/User/User";
import AddUser from "./pages/User/AddUser";
import Dashboard from "./pages/OrderRoom/OrderRoom";
import AddPromotion from "./pages/Promotion/AddPromotion";
import Promotions from "./pages/Promotion/Promotions";
import RoleBasedRoute from "./routes/helpers/RoleBasedRoute";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./routes/helpers/ProtectedRoute";
import Role from "./pages/Role/Role";
import AddRole from "./pages/Role/AddRole";
import Service from "./pages/Services/service";
import CreateService from "./pages/Services/CreateService";
import EditService from "./pages/Services/EditService";
import ServiceCategoryList from "./pages/Services/Service_category";
import AddServiceCategory from "./pages/Services/AddServiceCategory";
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

        <Route path="/role" element={<RoleBasedRoute allowedRoleIds={[1]}><Role /></RoleBasedRoute>} />
        <Route path="role/add" element={<RoleBasedRoute allowedRoleIds={[1]}><AddRole /></RoleBasedRoute>} />

        <Route path="/service" element={<RoleBasedRoute allowedRoleIds={[1]}><Service /></RoleBasedRoute>} />
        <Route path="service/add" element={<RoleBasedRoute allowedRoleIds={[1]}><CreateService /></RoleBasedRoute>} />
        <Route path="/service/edit/:serviceId" element={<RoleBasedRoute allowedRoleIds={[1]}><EditService /></RoleBasedRoute>} />
        <Route path="service-categories" element={<RoleBasedRoute allowedRoleIds={[1]}><ServiceCategoryList /></RoleBasedRoute>} />
        <Route path="/service-categories/add" element={<RoleBasedRoute allowedRoleIds={[1]}><AddServiceCategory /></RoleBasedRoute>} />
      </Route>

      {/* Auth */}
        <Route path="login" element={<Login />} />

      {/* Unauthorized */}
      <Route path="/unauthorized" element={<Unauthorized />} />
    </Routes>
  );
}

export default App;
