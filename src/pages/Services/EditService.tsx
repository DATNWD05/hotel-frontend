import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import "../../css/service.css";

interface Service {
  id: string;
  name: string;
  category: { id: string; name: string };
  price: number;
  description: string;
}

interface ServiceCategory {
  id: string;
  name: string;
}

interface RawService {
  id: number | string;
  name: string;
  category: { id: string | number; name: string };
  price: number;
  description?: string;
}

interface RawServiceCategory {
  id: number | string;
  name: string;
}

const EditService: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    document.title = 'Chỉnh sửa Dịch vụ';
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực');
      setLoading(false);
      return;
    }

    // Fetch service categories
    fetch('http://127.0.0.1:8000/api/service-categories', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => {
            throw new Error(`Lỗi tải danh mục: ${res.status} ${res.statusText}. Chi tiết: ${text}`);
          });
        }
        return res.json();
      })
      .then((response) => {
        const data = response.data || response;
        if (!Array.isArray(data)) {
          setError('Dữ liệu danh mục không đúng định dạng');
          return;
        }
        const categories: ServiceCategory[] = data.map((cat: RawServiceCategory) => ({
          id: cat.id.toString(),
          name: cat.name,
        }));
        setServiceCategories(categories);
      })
      .catch((err: unknown) => {
        const errorMessage = err instanceof Error ? `Không thể tải danh mục dịch vụ: ${err.message}` : 'Lỗi không xác định';
        setError(errorMessage);
      });

    // Fetch service details
    fetch(`http://127.0.0.1:8000/api/service/${serviceId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => {
            throw new Error(`Lỗi tải dịch vụ: ${res.status} ${res.statusText}. Chi tiết: ${text}`);
          });
        }
        return res.json();
      })
      .then((response) => {
        const item: RawService = response.data;
        const service: Service = {
          id: item.id.toString(),
          name: item.name,
          category: {
            id: item.category.id.toString(),
            name: item.category.name,
          },
          price: item.price,
          description: item.description || '–',
        };
        setEditingService(service);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const errorMessage = err instanceof Error ? `Không thể tải dịch vụ: ${err.message}` : 'Lỗi không xác định';
        setError(errorMessage);
        setLoading(false);
      });
  }, [serviceId]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    const numericPrice = Number(editingService.price);
    if (isNaN(numericPrice) || numericPrice < 0 || numericPrice > 9999999999) {
      setError('Giá dịch vụ phải là số từ 0 đến 9,999,999,999');
      return;
    }

    const payload = {
      name: editingService.name,
      category_id: editingService.category.id,
      price: numericPrice,
      description: editingService.description || null,
    };

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Không tìm thấy token xác thực');
        return;
      }

      const res = await fetch(`http://127.0.0.1:8000/api/service/${editingService.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        return res.text().then((text) => {
          throw new Error(`Lỗi cập nhật dịch vụ: ${res.status} ${res.statusText}. Chi tiết: ${text}`);
        });
      }

      setError('Cập nhật dịch vụ thành công!');
      navigate('/service'); // Redirect back to service list
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? `Không thể cập nhật dịch vụ: ${err.message}` : 'Lỗi không xác định';
      setError(errorMessage);
    }
  };

  const handleCancelEdit = () => {
    navigate('/service');
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (error && !editingService) {
    return <div className="error">{error}</div>;
  }

  if (!editingService) {
    return <div className="error">Không tìm thấy dịch vụ</div>;
  }

  return (
    <div className="service-container">
      <div className="breadcrumb">
        <a href="/service">Dịch vụ</a><span>Chỉnh sửa</span>
      </div>
      <div className="header">
        <h1>Chỉnh sửa Dịch vụ</h1>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="edit-form-container">
        <h3 className="edit-form-title">Chỉnh sửa Dịch vụ</h3>
        <form onSubmit={handleEditSubmit} className="edit-form">
          <div>
            <label className="form-label">Tên dịch vụ:</label>
            <input
              type="text"
              value={editingService.name}
              onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
              required
              maxLength={255}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Danh mục dịch vụ:</label>
            <select
              value={editingService.category.id}
              onChange={(e) =>
                setEditingService({
                  ...editingService,
                  category: {
                    id: e.target.value,
                    name: serviceCategories.find((cat) => cat.id === e.target.value)?.name || editingService.category.name,
                  },
                })
              }
              required
              className="form-select"
            >
              {serviceCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Giá dịch vụ:</label>
            <input
              type="number"
              value={editingService.price}
              onChange={(e) =>
                setEditingService({
                  ...editingService,
                  price: parseFloat(e.target.value) || 0,
                })
              }
              required
              min="0"
              max="9999999999"
              step="1"
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Mô tả:</label>
            <textarea
              value={editingService.description}
              onChange={(e) =>
                setEditingService({ ...editingService, description: e.target.value })
              }
              rows={4}
              className="form-textarea"
            />
          </div>
          <button type="submit" className="form-button">
            Lưu thay đổi
          </button>
          <button
            type="button"
            className="form-button cancel-button"
            onClick={handleCancelEdit}
          >
            Hủy
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditService;