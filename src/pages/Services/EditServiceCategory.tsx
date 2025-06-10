import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../../css/service.css';

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

interface RawServiceCategory {
  id: number | string;
  name: string;
  description?: string;
}

const EditServiceCategory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Category ID from URL:', id);
    if (!id) {
      setError('Không tìm thấy ID danh mục.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      setLoading(false);
      navigate('/login');
      return;
    }

    fetch(`http://127.0.0.1:8000/api/service-categories/${id}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        console.log('API Response Status:', res.status);
        const headersObj: Record<string, string> = {};
        res.headers.forEach((value, key) => {
          headersObj[key] = value;
        });
        console.log('API Response Headers:', headersObj);
        if (!res.ok) {
          const text = await res.text();
          console.log('API Error Response:', text);
          throw new Error(`Lỗi tải danh mục: ${res.status} ${res.statusText}. Chi tiết: ${text}`);
        }
        return res.json();
      })
      .then((response: { data?: RawServiceCategory } | RawServiceCategory) => {
        console.log('API Response Data:', response);
        const categoryData = 'data' in response ? response.data : response;
        if (!categoryData || typeof categoryData !== 'object' || !('id' in categoryData)) {
          throw new Error('Dữ liệu danh mục không đúng định dạng.');
        }
        setCategory({
          id: categoryData.id.toString(),
          name: categoryData.name || '',
          description: categoryData.description || '–',
        });
        setLoading(false);
      })
      .catch((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
        console.error('Fetch Error:', errorMessage);
        setError(`Không thể tải danh mục: ${errorMessage}`);
        setLoading(false);
        if (errorMessage.includes('401')) {
          navigate('/login');
        }
      });
  }, [id, navigate]);

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

    if (!category) {
      setError('Không có dữ liệu danh mục để cập nhật.');
      setLoading(false);
      return;
    }

    const payload = {
      name: category.name.trim(),
      description: category.description.trim() === '–' ? null : category.description.trim(),
    };

    if (!payload.name) {
      setError('Tên danh mục không được để trống.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/service-categories/${id}`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.log('API Update Error Response:', text);
        throw new Error(`Lỗi cập nhật danh mục: ${res.status} ${res.statusText} - ${text}`);
      }

      const responseData = await res.json();
      console.log('API Update Success Response:', responseData);
      setError('Cập nhật danh mục thành công!');
      setLoading(false);
      navigate('/service-categories');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
      console.error('Update Error:', errorMessage);
      setError(`Không thể cập nhật danh mục: ${errorMessage}`);
      setLoading(false);
      if (errorMessage.includes('401')) {
        navigate('/login');
      }
    }
  };

  const handleCancel = () => {
    navigate('/service-categories');
  };

  if (!category && !loading && error) {
    return (
      <div className="service-container">
        <div className="error">{error}</div>
        <button className="small-form-button" onClick={() => navigate('/service-categories')}>
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="service-container">
      <div className="breadcrumb">
        <a href="/service-categories">Danh mục dịch vụ</a><span>Chỉnh sửa</span>
      </div>
      <div className="header">
        <h1>Chỉnh sửa Danh mục dịch vụ</h1>
      </div>
      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Đang tải...</div>}
      {category && (
        <div className="edit-form-container">
          <h3 className="edit-form-title">Chỉnh sửa Danh mục</h3>
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
                value={category.description === '–' ? '' : category.description}
                onChange={(e) => setCategory({ ...category, description: e.target.value })}
                rows={4}
                className="form-textarea"
              />
            </div>
            <div className="button-group">
              <button type="submit" className="small-form-button" disabled={loading}>
                Lưu danh mục
              </button>
              <button
                type="button"
                className="small-form-button small-cancel-button"
                onClick={handleCancel}
                disabled={loading}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EditServiceCategory;