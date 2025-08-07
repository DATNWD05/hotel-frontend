import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./components/auth/Login";
import Unauthorized from "./pages/Unauthorized";
import MainLayout from "./layouts/main-layout";
import ProtectedRoute from "./routes/helpers/ProtectedRoute";

// Pages
import Dashboard from "./pages/OrderRoom/OrderRoom";
import User from "./pages/User/User";
import AddUser from "./pages/User/AddUser";
import Profile from "./pages/User/Profile";

import Role from "./pages/Role/Role";
import AddRole from "./pages/Role/AddRole";
import EditRole from "./pages/Role/EditRole";

import Customer from "./pages/Customer/Customer";
import AddCustomer from "./pages/Customer/AddCustomer";

import Promotions from "./pages/Promotion/Promotions";
import AddPromotion from "./pages/Promotion/AddPromotion";

import CreateService from "./pages/Services/CreateService";
import Service from "./pages/Services/service";
import ServiceCategoryList from "./pages/Services/Service_category";
import AddServiceCategory from "./pages/Services/AddServiceCategory";

import RoomTypesList from "./pages/Room/RoomTypeList";
import AddRoomType from "./pages/Room/AddRoomType";
import HiddenRoom from "./pages/Room/HiddenRoom";

import Amenities from "./pages/Room/Amenities";
import AmenitiesAdd from "./pages/Room/AmenitiesAdd";
import AmenitiesCategoryList from "./pages/Room/Amenities_Category";
import AddAmenityCategory from "./pages/Room/AddAmenitiesCaregory";

import ListBookings from "./pages/Bookings/ListBookings";
import AddBookings from "./pages/Bookings/AddBookings";

import Statistics from "./pages/Statistics/Statistics";
import BookingService from "./pages/Statistics/BookingService";
import Revenue from "./pages/Statistics/Revenue";

import Departments from "./pages/Departments/DepartmentList";
import AddDepartment from "./pages/Departments/DepartmentAdd";

import RosterTable from "./pages/WorkAssignment/RosterTable";
import OvertimeForm from "./pages/WorkAssignment/OvertimeForm";
import Payroll from "./pages/WorkAssignment/Payroll";
// import DetailBookings from "./pages/DetailBooking/DetailBookings";
import BookingDetail from "./pages/DetailBooking/booking-detail";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/" element={<MainLayout />}>
          <Route
            index
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Users */}
          <Route
            path="user"
            element={
              <ProtectedRoute permission="view_users">
                <User />
              </ProtectedRoute>
            }
          />
          <Route
            path="user/add"
            element={
              <ProtectedRoute permission="create_users">
                <AddUser />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute permission="view_employees">
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Roles */}
          <Route
            path="role"
            element={
              <ProtectedRoute permission="view_roles">
                <Role />
              </ProtectedRoute>
            }
          />
          <Route
            path="role/add"
            element={
              <ProtectedRoute permission="create_roles">
                <AddRole />
              </ProtectedRoute>
            }
          />
          <Route
            path="role/edit/:id"
            element={
              <ProtectedRoute permission="edit_roles">
                <EditRole />
              </ProtectedRoute>
            }
          />

          {/* Bookings */}
          <Route
            path="listbookings"
            element={
              <ProtectedRoute permission="view_bookings">
                <ListBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="listbookings/add"
            element={
              <ProtectedRoute permission="create_bookings">
                <AddBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="listbookings/detail/:id"
            element={
              <ProtectedRoute permission="view_bookings">
                <BookingDetail />
              </ProtectedRoute>
            }
          />

          {/* Customers */}
          <Route
            path="customer"
            element={
              <ProtectedRoute permission="view_customers">
                <Customer />
              </ProtectedRoute>
            }
          />
          <Route
            path="customer/add"
            element={
              <ProtectedRoute permission="create_customers">
                <AddCustomer />
              </ProtectedRoute>
            }
          />

          {/* Promotions */}
          <Route
            path="promotions"
            element={
              <ProtectedRoute permission="view_promotions">
                <Promotions />
              </ProtectedRoute>
            }
          />
          <Route
            path="promotions/add"
            element={
              <ProtectedRoute permission="create_promotions">
                <AddPromotion />
              </ProtectedRoute>
            }
          />

          {/* Services */}
          <Route
            path="service"
            element={
              <ProtectedRoute permission="view_services">
                <Service />
              </ProtectedRoute>
            }
          />
          <Route
            path="service/add"
            element={
              <ProtectedRoute permission="create_services">
                <CreateService />
              </ProtectedRoute>
            }
          />
          <Route
            path="service-categories"
            element={
              <ProtectedRoute permission="view_service_categories">
                <ServiceCategoryList />
              </ProtectedRoute>
            }
          />
          <Route
            path="service-categories/add"
            element={
              <ProtectedRoute permission="create_service_categories">
                <AddServiceCategory />
              </ProtectedRoute>
            }
          />

          {/* Room Types */}
          <Route
            path="room-types"
            element={
              <ProtectedRoute permission="view_room_types">
                <RoomTypesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="room-types/add"
            element={
              <ProtectedRoute permission="create_room_types">
                <AddRoomType />
              </ProtectedRoute>
            }
          />

          {/* Amenities */}
          <Route
            path="amenities"
            element={
              <ProtectedRoute permission="view_amenities">
                <Amenities />
              </ProtectedRoute>
            }
          />
          <Route
            path="amenities/add"
            element={
              <ProtectedRoute permission="create_amenities">
                <AmenitiesAdd />
              </ProtectedRoute>
            }
          />
          <Route
            path="amenity-categories"
            element={
              <ProtectedRoute permission="view_amenity_categories">
                <AmenitiesCategoryList />
              </ProtectedRoute>
            }
          />
          <Route
            path="amenity-categories/add"
            element={
              <ProtectedRoute permission="create_amenity_categories">
                <AddAmenityCategory />
              </ProtectedRoute>
            }
          />

          {/* Departments */}
          <Route
            path="departments"
            element={
              <ProtectedRoute permission="view_departments">
                <Departments />
              </ProtectedRoute>
            }
          />
          <Route
            path="departments/add"
            element={
              <ProtectedRoute permission="create_departments">
                <AddDepartment />
              </ProtectedRoute>
            }
          />

          {/* Statistics */}
          <Route
            path="statistics"
            element={
              <ProtectedRoute permission="view_total_revenue_statistics">
                <Statistics />
              </ProtectedRoute>
            }
          />
          <Route
            path="statistics-services"
            element={
              <ProtectedRoute permission="view_total_service_revenue_statistics">
                <BookingService />
              </ProtectedRoute>
            }
          />
          <Route
            path="statistics-revenues"
            element={
              <ProtectedRoute permission="view_revenue_table_statistics">
                <Revenue />
              </ProtectedRoute>
            }
          />

          {/* Hidden Rooms */}
          <Route
            path="hiddenrooms"
            element={
              <ProtectedRoute permission="restore_rooms">
                <HiddenRoom />
              </ProtectedRoute>
            }
          />

          {/* Work Assignment */}
          <Route
            path="work-assignment"
            element={
              <ProtectedRoute permission="view_work_assignments">
                <RosterTable />
              </ProtectedRoute>
            }
          />
          <Route
            path="overtimeform"
            element={
              <ProtectedRoute permission="">
                <OvertimeForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="payroll"
            element={
              <ProtectedRoute permission="">
                <Payroll />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
      <ToastContainer />
    </AuthProvider>
  );
};

export default App;
