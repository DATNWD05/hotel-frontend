import React from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className="form-container sign-in-container">
      <form>
        <h1>Sign In</h1>
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <Link to="#">Forgot your password?</Link>
        <button>SIGN IN</button>
      </form>
    </div>
  );
};

export default Login;
