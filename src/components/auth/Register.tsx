import React from 'react';

const Register = () => {
  return (
    <div className="form-container sign-up-container">
      <form>
        <h1>Sign Up</h1>
        <input type="text" placeholder="Name" />
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button>SIGN UP</button>
      </form>
    </div>
  );
};

export default Register;
