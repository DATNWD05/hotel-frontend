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
import Customer from "./pages/Customer/Customer";
import CreateService from "./pages/Services/CreateService";
import ServiceCategoryList from "./pages/Services/Service_category";
import AddServiceCategory from "./pages/Services/AddServiceCategory";
import RoomTypesList from "./pages/Room/RoomTypeList";
import AddRoomType from "./pages/Room/AddRoomType";
import Amenities from "./pages/Room/Amenities";
import AmenitiesAdd from "./pages/Room/AmenitiesAdd";
import AmenitiesCategoryList from "./pages/Room/Amenities_Category";
import AddAmenityCategory from "./pages/Room/AddAmenitiesCaregory";
import ListBookings from "./pages/Bookings/ListBookings";
import AddBookings from "./pages/Bookings/AddBookings";
import DetailBookings from "./pages/Bookings/DetailBookings";
import Statistics from "./pages/Statistics/Statistics";
import Service from "./pages/Services/service";
import Departments from "./pages/Departments/DepartmentList";
import AddDepartment from "./pages/Departments/DepartmentAdd";
import HiddenRoom from "./pages/Room/HiddenRoom";
import BookingService from "./pages/Statistics/BookingService";
import Revenue from "./pages/Statistics/Revenue";

function App() {
  return (
    <Routes>
      {/* Main */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        
        <Route path="user" element={<ProtectedRoute><RoleBasedRoute allowedRoleIds={[1]}><User /></RoleBasedRoute></ProtectedRoute>}/>

        <Route path="user/add" element={<RoleBasedRoute allowedRoleIds={[1]}><AddUser /></RoleBasedRoute>} />

        <Route path="/listbookings" element={<RoleBasedRoute allowedRoleIds={[1]}><ListBookings /></RoleBasedRoute>} />
        <Route path="/listbookings/add" element={<RoleBasedRoute allowedRoleIds={[1]}><AddBookings /></RoleBasedRoute>} />
        <Route path="/listbookings/detail/:id" element={<RoleBasedRoute allowedRoleIds={[1]}><DetailBookings /></RoleBasedRoute>} />

        <Route path="/statistics" element={<RoleBasedRoute allowedRoleIds={[1]}><Statistics /></RoleBasedRoute>} />
        <Route path="/statistics-services" element={<RoleBasedRoute allowedRoleIds={[1]}><BookingService  /></RoleBasedRoute>} />
        <Route path="/statistics-revenues" element={<RoleBasedRoute allowedRoleIds={[1]}><Revenue  /></RoleBasedRoute>} />

        <Route path="/hiddenrooms" element={<RoleBasedRoute allowedRoleIds={[1]}><HiddenRoom /></RoleBasedRoute>} />



        <Route path="customer" element={<RoleBasedRoute allowedRoleIds={[1]}><Customer /></RoleBasedRoute>} />

        <Route path="/promotions" element={<RoleBasedRoute allowedRoleIds={[1]}><Promotions /></RoleBasedRoute>} />
        <Route path="promotions/add" element={<RoleBasedRoute allowedRoleIds={[1]}><AddPromotion /></RoleBasedRoute>} />

        <Route path="/role" element={<RoleBasedRoute allowedRoleIds={[1]}><Role /></RoleBasedRoute>} />
        <Route path="role/add" element={<RoleBasedRoute allowedRoleIds={[1]}><AddRole /></RoleBasedRoute>} />

        <Route path="/service" element={<RoleBasedRoute allowedRoleIds={[1]}><Service /></RoleBasedRoute>} />
        <Route path="service/add" element={<RoleBasedRoute allowedRoleIds={[1]}><CreateService /></RoleBasedRoute>} />
        <Route path="/service-categories" element={<RoleBasedRoute allowedRoleIds={[1]}><ServiceCategoryList /></RoleBasedRoute>} />
        <Route path="service-categories/add" element={<RoleBasedRoute allowedRoleIds={[1]}><AddServiceCategory /></RoleBasedRoute>} />

        <Route path="/room-types" element={<RoleBasedRoute allowedRoleIds={[1]}><RoomTypesList /></RoleBasedRoute>} />
        <Route path="/room-types/add" element={<RoleBasedRoute allowedRoleIds={[1]}><AddRoomType /></RoleBasedRoute>} />

        <Route path="/amenities" element={<RoleBasedRoute allowedRoleIds={[1]}><Amenities /></RoleBasedRoute>} />
        <Route path="/amenities/add" element={<RoleBasedRoute allowedRoleIds={[1]}><AmenitiesAdd /></RoleBasedRoute>} />

        <Route path="/amenity-categories" element={<RoleBasedRoute allowedRoleIds={[1]}><AmenitiesCategoryList /></RoleBasedRoute>} />
        <Route path="/amenity-categories/add" element={<RoleBasedRoute allowedRoleIds={[1]}><AddAmenityCategory /></RoleBasedRoute>} />

        <Route path="/departments" element={<RoleBasedRoute allowedRoleIds={[1]}><Departments /></RoleBasedRoute>} />
        <Route path="/departments/add" element={<RoleBasedRoute allowedRoleIds={[1]}><AddDepartment /></RoleBasedRoute>} />

        
        {/* Add more routes as needed */}
      </Route>

      {/* Auth */}
        <Route path="login" element={<Login />} />

      {/* Unauthorized */}
      <Route path="/unauthorized" element={<Unauthorized />} />
    </Routes>
  );
}

export default App;
