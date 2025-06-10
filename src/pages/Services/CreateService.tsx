import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../css/CraeteService.css";

interface ServiceCategory {
  id: string;
  name: string;
}

const CreateService: React.FC = () => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  // Lấy token từ localStorage (nếu cần xác thực)
  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const headers: HeadersInit = { 'Accept': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('http://127.0.0.1:8000/api/service-categories', {
          headers,
        });

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Không được phép truy cập. Vui lòng đăng nhập.');
          }
          throw new Error(`Lỗi HTTP! Trạng thái: ${res.status}`);
        }

        const data = await res.json();
        let categoriesData: ServiceCategory[];
        if (Array.isArray(data)) {
          categoriesData = data;
        } else if (data && Array.isArray(data.data)) {
          categoriesData = data.data;
        } else {
          throw new Error(`Dữ liệu danh mục không đúng định dạng: ${JSON.stringify(data)}`);
        }

        setCategories(categoriesData);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        setMessage(`Không thể tải danh mục dịch vụ: ${errorMessage}`);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setMessage(null);

    if (!categoryId) {
      setErrors({ category_id: 'Vui lòng chọn danh mục dịch vụ' });
      return;
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0 || numericPrice > 9999999999) {
      setErrors({ price: 'Giá dịch vụ phải là số từ 0 đến 9,999,999,999' });
      return;
    }

    const payload = {
      name,
      category_id: categoryId,
      description: description || null,
      price: numericPrice,
    };

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('http://127.0.0.1:8000/api/service', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setMessage('Không được phép truy cập. Vui lòng đăng nhập.');
          return;
        }
        if (res.status === 422 && result.errors) {
          const formattedErrors: Record<string, string> = {};
          Object.keys(result.errors).forEach((key) => {
            formattedErrors[key] = result.errors[key][0];
          });
          setErrors(formattedErrors);
        } else {
          setMessage(result.message || 'Đã xảy ra lỗi khi tạo dịch vụ');
        }
        return;
      }

      navigate('/service');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      setMessage(`Không thể gửi yêu cầu: ${errorMessage}`);
    }
  };

  return (
    <div className="create-service-container">
      <h2 className="create-service-title">Tạo Dịch vụ Mới</h2>
      {message && (
        <div className={`message ${message.startsWith('✅') ? 'message-success' : 'message-error'}`}>
          {message}
        </div>
      )}

      {categories.length === 0 && !message && (
        <div className="message message-loading">
          Đang tải danh mục dịch vụ...
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-service-form">
        <div>
          <label className="form-label">Tên dịch vụ:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={255}
            className="form-input"
          />
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>

        <div>
          <label className="form-label">Danh mục dịch vụ:</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="form-select"
            disabled={categories.length === 0}
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.category_id && <div className="form-error">{errors.category_id}</div>}
        </div>

        <div>
          <label className="form-label">Giá dịch vụ:</label>
          <input
            type="number"
            value={price}
            onChange={(e) => {
              const value = e.target.value;
              // Chỉ cho phép chuỗi rỗng hoặc số hợp lệ không âm
              if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                setPrice(value);
              }
            }}
            required
            min="0"
            max="9999999999" // Giới hạn ở 9,999,999,999
            step="1"
            className="form-input"
          />
          {errors.price && <div className="form-error">{errors.price}</div>}
        </div>

        <div>
          <label className="form-label">Mô tả:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="form-textarea"
          />
          {errors.description && <div className="form-error">{errors.description}</div>}
        </div>

        <button
          type="submit"
          className="form-button"
          disabled={categories.length === 0}
        >
          Tạo dịch vụ
        </button>
      </form>
    </div>
  );
};

export default CreateService;