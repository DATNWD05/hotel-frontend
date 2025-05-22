import React, { useState } from 'react';
import Register from './Register';
import Login from './Login';
import '../../css/RegisterLogin.css';

const AuthContainer = () => {
  const [isSignUpActive, setIsSignUpActive] = useState(false);

  return (
    <div className={`container ${isSignUpActive ? 'right-panel-active' : ''}`}>
      <Register />
      <Login />

      <div className="overlay-container">
        <div className="overlay">
          <div className="overlay-panel overlay-left">
            <h1>Welcome Back!</h1>
            <p>To keep connected with us please login with your personal info</p>
            <button className="ghost" onClick={() => setIsSignUpActive(false)}>
              Sign In
            </button>
          </div>
          <div className="overlay-panel overlay-right">
            <h1>Hello, Friend!</h1>
            <p>Enter your personal details and start journey with us</p>
            <button className="ghost" onClick={() => setIsSignUpActive(true)}>
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;
