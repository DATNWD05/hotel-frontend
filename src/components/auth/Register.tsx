import { useForm } from "react-hook-form";
import api from "../../api/axios";

type RegisterInputs = {
  name: string;
  email: string;
  password: string;
};

const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInputs>();

  const onSubmit = async (data: RegisterInputs) => {
    try {
      await api.post("/register", data);
      alert("Đăng ký thành công! Bạn có thể đăng nhập.");
      // Không redirect vội → giữ nguyên UI cho người dùng nhấn Sign In
    } catch (error: unknown) {
      console.error("Register failed:", error);
      alert("Đăng ký thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="form-container sign-up-container">
      <form onSubmit={handleSubmit(onSubmit)}>
        <h1>Sign Up</h1>

        <input
          type="text"
          placeholder="Name"
          {...register("name", { required: "Tên không được để trống" })}
        />
        {errors.name && <span>{errors.name.message}</span>}

        <input
          type="email"
          placeholder="Email"
          {...register("email", { required: "Email không được để trống" })}
        />
        {errors.email && <span>{errors.email.message}</span>}

        <input
          type="password"
          placeholder="Password"
          {...register("password", { required: "Mật khẩu không được để trống" })}
        />
        {errors.password && <span>{errors.password.message}</span>}

        <button type="submit">SIGN UP</button>
      </form>
    </div>
  );
};

export default Register;
