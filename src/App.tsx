import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/main-layout';
import AuthContainer from './components/auth/AuthContainer';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import User from './pages/User/User';
import AddUser from './pages/User/AddUser';
import Client from './pages/Client/Client';
import AddClient from './pages/Client/AddClient';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Routes>
      {/* Main */}
      <Route path='/' element={<MainLayout />}>
        <Route index element={<Dashboard />} />
      <Route path="user" element={<User/>} />
      <Route path="user/add" element={<AddUser/>} />

      <Route path="client" element={<Client/>} />
      <Route path="client/add" element={<AddClient/>} />

      </Route>

      {/* Auth */}
      <Route path='/auth/*' element={<AuthContainer />}>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      </Route>
    </Routes>
  );
}

export default App;
