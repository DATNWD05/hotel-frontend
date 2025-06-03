import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/main-layout";
import AuthContainer from "./components/auth/AuthContainer";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import User from "./pages/User/User";
import AddUser from "./pages/User/AddUser";
import Client from "./pages/Client/Client";
import AddClient from "./pages/Client/AddClient";
import Dashboard from "./pages/Dashboard";
import AddPromotion from "./pages/Promotion/AddPromotion";
import Promotions from "./pages/Promotion/Promotions";
import RoleBasedRoute from "./routes/helpers/RoleBasedRoute";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./routes/helpers/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Main */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        
        <Route path="user" element={<ProtectedRoute><RoleBasedRoute allowedRoleIds={[1]}><User /></RoleBasedRoute></ProtectedRoute>}/>

        <Route path="user/add" element={<RoleBasedRoute allowedRoleIds={[1]}><AddUser /></RoleBasedRoute>} />

        <Route path="client" element={<RoleBasedRoute allowedRoleIds={[1]}><Client /></RoleBasedRoute>} />
        <Route path="client/add" element={<RoleBasedRoute allowedRoleIds={[1]}><AddClient /></RoleBasedRoute>} />

        <Route path="/promotions" element={<RoleBasedRoute allowedRoleIds={[1]}><Promotions /></RoleBasedRoute>} />
        <Route path="promotions/add" element={<RoleBasedRoute allowedRoleIds={[1]}><AddPromotion /></RoleBasedRoute>} />
      </Route>

      {/* Auth */}
      <Route path="/auth/*" element={<AuthContainer />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>

      {/* Unauthorized */}
      <Route path="/unauthorized" element={<Unauthorized />} />
    </Routes>
  );
}

export default App;
