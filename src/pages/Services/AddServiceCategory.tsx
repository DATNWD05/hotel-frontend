import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/service.css';

interface ServiceCategoryInput {
  name: string;
  description: string;
}

const AddServiceCategory: React.FC = () => {
  const [category, setCategory] = useState<ServiceCategoryInput>({
    name: '',
    description: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      setLoading(false);
      navigate('/login');
      return;
    }

    const payload = {
      name: category.name.trim(),
      description: category.description.trim() || null,
    };

    if (!payload.name) {
      setError('Tên danh mục không được để trống.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/api/service-categories', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Lỗi tạo danh mục: ${res.status} ${res.statusText}. Chi tiết: ${text}`);
      }

      setError('Tạo danh mục thành công!');
      setLoading(false);
      navigate('/service-categories');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? `Không thể tạo danh mục: ${err.message}` : 'Lỗi không xác định';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/service-categories');
  };

  return (
    <div className="service-container">
      <div className="breadcrumb">
        <a href="/service-categories">Danh mục dịch vụ</a><span>Tạo mới</span>
      </div>
      <div className="header">
        <h1>Tạo mới Danh mục dịch vụ</h1>
      </div>
      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Đang xử lý...</div>}
      <div className="edit-form-container">
        <h3 className="edit-form-title">Tạo mới Danh mục</h3>
        <form onSubmit={handleSubmit} className="edit-form">
          <div>
            <label className="form-label">Tên danh mục:</label>
            <input
              type="text"
              value={category.name}
              onChange={(e) => setCategory({ ...category, name: e.target.value })}
              required
              maxLength={255}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Mô tả:</label>
            <textarea
              value={category.description}
              onChange={(e) => setCategory({ ...category, description: e.target.value })}
              rows={4}
              className="form-textarea"
            />
          </div>
          <button type="submit" className="form-button" disabled={loading}>
            Lưu danh mục
          </button>
          <button
            type="button"
            className="form-button cancel-button"
            onClick={handleCancel}
            disabled={loading}
          >
            Hủy
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddServiceCategory;