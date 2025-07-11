import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/auth/Login';
import User from './pages/User/User';
import AddUser from './pages/User/AddUser';
import Dashboard from './pages/OrderRoom/OrderRoom';
import AddPromotion from './pages/Promotion/AddPromotion';
import Promotions from './pages/Promotion/Promotions';
import Role from './pages/Role/Role';
import AddRole from './pages/Role/AddRole';
import EditRole from './pages/Role/EditRole';
import Customer from './pages/Customer/Customer';
import AddCustomer from './pages/Customer/AddCustomer';
import CreateService from './pages/Services/CreateService';
import AddServiceCategory from './pages/Services/AddServiceCategory';
import RoomTypesList from './pages/Room/RoomTypeList';
import AddRoomType from './pages/Room/AddRoomType';
import Amenities from './pages/Room/Amenities';
import AmenitiesAdd from './pages/Room/AmenitiesAdd';
import ListBookings from './pages/Bookings/ListBookings';
import AddBookings from './pages/Bookings/AddBookings';
import DetailBookings from './pages/Bookings/DetailBookings';
import Statistics from './pages/Statistics/Statistics';
import HiddenRoom from './pages/Room/HiddenRoom';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './routes/helpers/ProtectedRoute';
import MainLayout from './layouts/main-layout';
import Service from './pages/Services/service';
import ServiceCategoryList from './pages/Services/Service_category';
import AmenitiesCategoryList from './pages/Room/Amenities_Category';
import AddAmenityCategory from './pages/Room/AddAmenitiesCaregory';
import BookingService from './pages/Statistics/BookingService';
import Revenue from './pages/Statistics/Revenue';
import Departments from './pages/Departments/DepartmentList';
import AddDepartment from './pages/Departments/DepartmentAdd';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

          <Route path="user" element={<ProtectedRoute permission="view_users"><User /></ProtectedRoute>} />
          <Route path="user/add" element={<ProtectedRoute permission="create_users"><AddUser /></ProtectedRoute>} />

          <Route path="listbookings" element={<ProtectedRoute permission="view_bookings"><ListBookings /></ProtectedRoute>} />
          <Route path="listbookings/add" element={<ProtectedRoute permission="create_bookings"><AddBookings /></ProtectedRoute>} />
          <Route path="listbookings/detail/:id" element={<ProtectedRoute permission="view_bookings"><DetailBookings /></ProtectedRoute>} />

          <Route path="statistics" element={<ProtectedRoute permission="view_total_revenue_statistics"><Statistics /></ProtectedRoute>} />
          <Route path="statistics-services" element={<ProtectedRoute permission=""><BookingService /></ProtectedRoute>} />
          <Route path="statistics-revenues" element={<ProtectedRoute permission=""><Revenue /></ProtectedRoute>} />

          <Route path="departments" element={<ProtectedRoute permission=""><Departments  /></ProtectedRoute>} />
          <Route path="departments/add" element={<ProtectedRoute permission=""><AddDepartment /></ProtectedRoute>} />

          <Route path="hiddenrooms" element={<ProtectedRoute permission="restore_rooms"><HiddenRoom /></ProtectedRoute>} />

          <Route path="customer" element={<ProtectedRoute permission="view_customers"><Customer /></ProtectedRoute>} />
          <Route path="customer/add" element={<ProtectedRoute permission="create_customers"><AddCustomer /></ProtectedRoute>} />

          <Route path="promotions" element={<ProtectedRoute permission="view_promotions"><Promotions /></ProtectedRoute>} />
          <Route path="promotions/add" element={<ProtectedRoute permission="create_promotions"><AddPromotion /></ProtectedRoute>} />

          <Route path="role" element={<ProtectedRoute permission="view_roles"><Role /></ProtectedRoute>} />
          <Route path="role/add" element={<ProtectedRoute permission="create_roles"><AddRole /></ProtectedRoute>} />
          <Route path="role/edit/:id" element={<ProtectedRoute permission="edit_roles"><EditRole /></ProtectedRoute>} />

          <Route path="service" element={<ProtectedRoute permission="view_services"><Service /></ProtectedRoute>} />
          <Route path="service/add" element={<ProtectedRoute permission="create_services"><CreateService /></ProtectedRoute>} />
          <Route path="service-categories" element={<ProtectedRoute permission="view_service_categories"><ServiceCategoryList /></ProtectedRoute>} />
          <Route path="service-categories/add" element={<ProtectedRoute permission="create_service_categories"><AddServiceCategory /></ProtectedRoute>} />
          
          <Route path="room-types" element={<ProtectedRoute permission="view_room_types"><RoomTypesList /></ProtectedRoute>} />
          <Route path="room-types/add" element={<ProtectedRoute permission="create_room_types"><AddRoomType /></ProtectedRoute>} />
          
          <Route path="amenities" element={<ProtectedRoute permission="view_amenities"><Amenities /></ProtectedRoute>} />
          <Route path="amenities/add" element={<ProtectedRoute permission="create_amenities"><AmenitiesAdd /></ProtectedRoute>} />
          <Route path="amenity-categories" element={<ProtectedRoute permission="view_amenity_categories"><AmenitiesCategoryList /></ProtectedRoute>} />
          <Route path="amenity-categories/add" element={<ProtectedRoute permission="create_amenity_categories"><AddAmenityCategory /></ProtectedRoute>} />
        
        </Route>
      </Routes>
      <ToastContainer />
    </AuthProvider>
  );
};

export default App;