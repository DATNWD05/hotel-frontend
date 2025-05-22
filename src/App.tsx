import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/main-layout';
import AuthContainer from './components/auth/AuthContainer';
import Dashboard from './pages/Dashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

function App() {
  return (
    <Routes>
      {/* Main */}
      <Route path='/' element={<MainLayout />}>
        <Route index element={<Dashboard />} />
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
