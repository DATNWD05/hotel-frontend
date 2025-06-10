import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const ServiceCategoryList: React.FC = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      setLoading(false);
      return;
    }

    fetch(`http://127.0.0.1:8000/api/service-categories?page=${page}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        console.log('Mã trạng thái:', res.status);
        console.log('Content-Type:', res.headers.get('Content-Type'));
        console.log('Headers:');
        res.headers.forEach((value, key) => {
          console.log(`${key}: ${value}`);
        });
        if (!res.ok) {
          const text = await res.text();
          console.log('Phản hồi gốc:', text.substring(0, 200));
          throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}...`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('Dữ liệu JSON:', data);
        if (!Array.isArray(data.data)) {
          setError('Dữ liệu danh mục không đúng định dạng.');
          setLoading(false);
          return;
        }
        setCategories(
          data.data.map((cat: RawServiceCategory) => ({
            id: cat.id.toString(),
            name: cat.name,
            description: cat.description || '–',
          }))
        );
        setMeta(data.meta);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi fetch:', err);
        if (err.message.includes('401')) {
          setError('Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.');
          navigate('/login');
        } else {
          setError(err.message || 'Lỗi mạng hoặc máy chủ.');
        }
        setLoading(false);
      });
  }, [page, navigate]);

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực');
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/service-categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Lỗi xóa danh mục: ${res.status} ${res.statusText}. Chi tiết: ${text}`);
      }

      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      setError('Xóa danh mục thành công!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? `Không thể xóa danh mục: ${err.message}` : 'Lỗi không xác định';
      setError(errorMessage);
    }
  };

  const handleEditCategory = (id: string) => {
    navigate(`/service-categories/edit/${id}`);
  };

  const goToPage = (newPage: number) => {
    if (meta && newPage > 0 && newPage <= meta.last_page) {
      setPage(newPage);
    }
  };

  return (
    <div className="service-container">
      <div className="breadcrumb">
        <a href="#">Danh mục dịch vụ</a><span>Danh sách</span>
      </div>
      <div className="header">
        <h1>Danh mục dịch vụ</h1>
        <a className="btn-add" href="/service-categories/add">
          Tạo mới Danh mục
        </a>
      </div>
      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Đang tải...</div>}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên danh mục</th>
            <th>Mô tả</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 && !loading && !error && (
            <tr>
              <td colSpan={4}>
                Không có danh mục dịch vụ nào.
              </td>
            </tr>
          )}
          {categories.map((cat) => (
            <tr key={cat.id} className="service-row">
              <td>{cat.id}</td>
              <td>{cat.name}</td>
              <td>{cat.description}</td>
              <td className="actions">
                <button
                  className="edit-btn"
                  onClick={() => handleEditCategory(cat.id)}
                  title="Chỉnh sửa danh mục"
                >
                  <img
                    src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/pencil.svg"
                    alt="Chỉnh sửa"
                    className="edit-icon"
                    style={{ fill: 'yellow' }}
                  />
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteCategory(cat.id)}
                  title="Xóa danh mục"
                >
                  <img
                    src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/icons/trash.svg"
                    alt="Xóa"
                    className="delete-icon"
                    style={{ fill: 'red' }}
                  />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {meta && meta.last_page > 1 && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => goToPage(page - 1)}
          >
            Trang trước
          </button>
          <span>
            Trang {page} / {meta.last_page}
          </span>
          <button
            disabled={page === meta.last_page}
            onClick={() => goToPage(page + 1)}
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
};

export default ServiceCategoryList;