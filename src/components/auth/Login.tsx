import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import api from "../../api/axios";
import "../../css/Login.css";
import { useEffect, useState } from "react";

type LoginInputs = {
  email: string;
  password: string;
};

// 📌 Mảng ảnh nền tĩnh
const backgroundImages = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e", // biển
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c", // phòng
  "https://images.unsplash.com/photo-1606402179428-a57976d71fa4?q=80&w=3174&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // sảnh
  "https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // lobby
];

const Login = () => {
  const [background, setBackground] = useState("");
  const [showThumbnails, setShowThumbnails] = useState(false);

 useEffect(() => {
  const randomIndex = Math.floor(Math.random() * backgroundImages.length);
  const randomImage = backgroundImages[randomIndex];
  setBackground(randomImage);
}, []);



  const changeBackground = (img: string) => {
    setBackground(img);
    localStorage.setItem("backgroundImage", img);
    setShowThumbnails(false); // Ẩn popup sau khi chọn
  };

  const toggleThumbnails = () => {
    setShowThumbnails((prev) => !prev);
  };

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputs>();

  const onSubmit = async (data: LoginInputs) => {
    try {
      const response = await api.post("/login", data);
      const token = response.data.token || response.data.access_token;
      const user = response.data.user;

      if (!token) throw new Error("Không nhận được token từ server");

      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(user));

      alert("Đăng nhập thành công!");
      navigate("/");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        alert("Sai email hoặc mật khẩu!");
      } else {
        alert("Đã xảy ra lỗi không xác định");
      }
    }
  };

  return (
    <div
      className="login-background"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {/* Nút chọn nền */}
      <div className="background-switcher">
        <button className="circle-button" onClick={toggleThumbnails}>
          🖼
        </button>

        {showThumbnails && (
          <div className="thumbnail-popup">
            {backgroundImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`bg-${index}`}
                onClick={() => changeBackground(img)}
                className={`thumbnail ${background === img ? "selected" : ""}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form đăng nhập */}
      <div className="login-container">
        <div className="logo">Villa</div>
        <h2>Welcome Back</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
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
              <span className="error">{errors.email.message}</span>
            )}
          </div>

          <div className="form-group">
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
              <span className="error">{errors.password.message}</span>
            )}
          </div>

          <div className="forgot">
            <Link to="#">Forgot your password?</Link>
          </div>

          <button type="submit" className="btn-primary">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
