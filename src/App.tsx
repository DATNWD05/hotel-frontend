import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/main-layout";
import Login from "./components/auth/Login";
import User from "./pages/User/User";
import AddUser from "./pages/User/AddUser";
import Dashboard from "./pages/OrderRoom/OrderRoom";
import AddPromotion from "./pages/Promotion/AddPromotion";
import Promotions from "./pages/Promotion/Promotions";
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
import AccountProfile from "./pages/User/AccountProfile";

function App() {
  return (
    <Routes>
      {/* Main */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />

        {/* Các route luôn hiển thị cho người đã đăng nhập */}
        <Route path="account" element={<ProtectedRoute><AccountProfile /></ProtectedRoute>} />
        <Route path="listbookings" element={<ProtectedRoute><ListBookings /></ProtectedRoute>} />
        <Route path="listbookings/add" element={<ProtectedRoute><AddBookings /></ProtectedRoute>} />
        <Route path="listbookings/detail/:id" element={<ProtectedRoute><DetailBookings /></ProtectedRoute>} />

        {/* Các route chỉ cho phép role admin */}
        <Route path="user" element={<ProtectedRoute allowedRoles={[1]}><User /></ProtectedRoute>} />
        <Route path="user/add" element={<ProtectedRoute allowedRoles={[1]}><AddUser /></ProtectedRoute>} />

        <Route path="customer" element={<ProtectedRoute allowedRoles={[1]}><Customer /></ProtectedRoute>} />

        <Route path="promotions" element={<ProtectedRoute allowedRoles={[1]}><Promotions /></ProtectedRoute>} />
        <Route path="promotions/add" element={<ProtectedRoute allowedRoles={[1]}><AddPromotion /></ProtectedRoute>} />

        <Route path="role" element={<ProtectedRoute allowedRoles={[1]}><Role /></ProtectedRoute>} />
        <Route path="role/add" element={<ProtectedRoute allowedRoles={[1]}><AddRole /></ProtectedRoute>} />

        <Route path="service" element={<ProtectedRoute allowedRoles={[1]}><Service /></ProtectedRoute>} />
        <Route path="service/add" element={<ProtectedRoute allowedRoles={[1]}><CreateService /></ProtectedRoute>} />
        <Route path="service-categories" element={<ProtectedRoute allowedRoles={[1]}><ServiceCategoryList /></ProtectedRoute>} />
        <Route path="service-categories/add" element={<ProtectedRoute allowedRoles={[1]}><AddServiceCategory /></ProtectedRoute>} />

        <Route path="room-types" element={<ProtectedRoute allowedRoles={[1]}><RoomTypesList /></ProtectedRoute>} />
        <Route path="room-types/add" element={<ProtectedRoute allowedRoles={[1]}><AddRoomType /></ProtectedRoute>} />

        <Route path="amenities" element={<ProtectedRoute allowedRoles={[1]}><Amenities /></ProtectedRoute>} />
        <Route path="amenities/add" element={<ProtectedRoute allowedRoles={[1]}><AmenitiesAdd /></ProtectedRoute>} />

        <Route path="amenity-categories" element={<ProtectedRoute allowedRoles={[1]}><AmenitiesCategoryList /></ProtectedRoute>} />
        <Route path="amenity-categories/add" element={<ProtectedRoute allowedRoles={[1]}><AddAmenityCategory /></ProtectedRoute>} />

        <Route path="departments" element={<ProtectedRoute allowedRoles={[1]}><Departments /></ProtectedRoute>} />
        <Route path="departments/add" element={<ProtectedRoute allowedRoles={[1]}><AddDepartment /></ProtectedRoute>} />

        <Route path="statistics" element={<ProtectedRoute allowedRoles={[1]}><Statistics /></ProtectedRoute>} />
        <Route path="statistics-services" element={<ProtectedRoute allowedRoles={[1]}><BookingService /></ProtectedRoute>} />
        <Route path="statistics-revenues" element={<ProtectedRoute allowedRoles={[1]}><Revenue /></ProtectedRoute>} />

        <Route path="hiddenrooms" element={<ProtectedRoute allowedRoles={[1]}><HiddenRoom /></ProtectedRoute>} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<Login />} />

      {/* Unauthorized */}
      <Route path="/unauthorized" element={<Unauthorized />} />
    </Routes>
  );
}

export default App;