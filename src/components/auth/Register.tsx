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
      await api.post("/user", data);
      alert("Đăng ký thành công! Bạn có thể đăng nhập.");
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
          {...register("name", {
            required: "Tên không được để trống",
            minLength: {
              value: 2,
              message: "Tên phải có ít nhất 2 ký tự",
            },
            pattern: {
              value: /^[A-Za-zÀ-ỹ\s]+$/,
              message: "Tên chỉ được chứa chữ cái và khoảng trắng",
            },
          })}
        />
        {errors.name && (
          <span style={{ color: "red", fontWeight: "600" }}>
            {errors.name.message}
          </span>
        )}

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

        <button type="submit">SIGN UP</button>
      </form>
    </div>
  );
};

export default Register;
