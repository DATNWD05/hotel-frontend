import './App.css';
import { Route, Routes } from 'react-router-dom';
import AuthContainer from './components/auth/AuthContainer';

function App() {
  return (
    <Routes>
      <Route path='/auth' element={<AuthContainer />} />
    </Routes>
  );
}

export default App;
