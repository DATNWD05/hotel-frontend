import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
// import api from "../../api/axios";
import axios from "axios";

type LoginInputs = {
  email: string;
  password: string;
};

const Login = () => {
  const navigate = useNavigate();

  const {register,handleSubmit,formState: { errors }} = useForm<LoginInputs>();

  const onSubmit = async (data: LoginInputs) => { 
    try {
      const response = await axios.post("http://localhost:3001/login", data);

      const { user, token } = response.data;

      // Lưu token và thông tin người dùng
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(user));

      alert("Đăng nhập thành công!");
      navigate("/"); // hoặc điều hướng nơi bạn muốn
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("Login failed:", error.response?.data || error.message);
        alert("Sai email hoặc mật khẩu!");
      } else {
        console.error("Unexpected error:", error);
        alert("Đã xảy ra lỗi không xác định");
      }
    }
  };

  return (
    <div className="form-container sign-in-container">
      <form onSubmit={handleSubmit(onSubmit)}>
        <h1>Sign In</h1>

        <input
          type="email"
          placeholder="Email"
          {...register("email", {
            required: "Email không được để trống",
            pattern: {
              value: /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/,
              message: "Email không đúng định dạng",
            },
            validate: (value) =>
              value.endsWith("@gmail.com") ||
              "Email phải kết thúc bằng @gmail.com",
          })}
        />
        {errors.email && (
          <span style={{ color: "red", fontWeight: "600" }}>
            {errors.email.message}
          </span>
        )}

        <input
          type="password"
          placeholder="Password"
          {...register("password", {
            required: "Mật khẩu không được để trống",
            minLength: {
              value: 6,
              message: "Mật khẩu phải có ít nhất 6 ký tự",
            },
            pattern: {
              value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/,
              message: "Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số",
            },
          })}
        />
        {errors.password && (
          <span style={{ color: "red", fontWeight: "600" }}>
            {errors.password.message}
          </span>
        )}

        <Link to="#">Forgot your password?</Link>

        <button type="submit">SIGN IN</button>
      </form>
    </div>
  );
};

export default Login;
