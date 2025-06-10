import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const Service: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([
    { id: 'all', name: 'Tất cả' },
  ]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Danh sách Dịch vụ';
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực');
      return;
    }

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
        const categories: ServiceCategory[] = [
          { id: 'all', name: 'Tất cả' },
          ...data.map((cat: RawServiceCategory) => ({
            id: cat.id.toString(),
            name: cat.name,
          })),
        ];
        setServiceCategories(categories);
      })
      .catch((err: unknown) => {
        const errorMessage = err instanceof Error ? `Không thể tải danh mục dịch vụ: ${err.message}` : 'Lỗi không xác định';
        setError(errorMessage);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực');
      setLoading(false);
      return;
    }

    let url = `http://127.0.0.1:8000/api/service?page=${currentPage}`;
    if (activeCategory !== 'all') {
      url += `&category_id=${activeCategory}`;
    }

    fetch(url, {
      method: 'GET',
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
        if (!response.data || !Array.isArray(response.data)) {
          setError('Dữ liệu dịch vụ không đúng định dạng');
          setLoading(false);
          return;
        }

        const mapped: Service[] = (response.data as RawService[]).map((item) => ({
          id: item.id.toString(),
          name: item.name,
          category: {
            id: item.category.id.toString(),
            name: item.category.name,
          },
          price: item.price,
          description: item.description || '–',
        }));

        setServices(mapped);
        setLastPage(response.meta?.last_page || 1);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const errorMessage = err instanceof Error ? `Không thể tải danh sách dịch vụ: ${err.message}` : 'Lỗi không xác định';
        setError(errorMessage);
        setLoading(false);
      });
  }, [currentPage, activeCategory]);

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Không tìm thấy token xác thực');
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/service/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        return res.text().then((text) => {
          throw new Error(`Lỗi xóa dịch vụ: ${res.status} ${res.statusText}. Chi tiết: ${text}`);
        });
      }

      setServices((prev) => prev.filter((s) => s.id !== id));
      setError('Xóa dịch vụ thành công!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? `Không thể xóa dịch vụ: ${err.message}` : 'Lỗi không xác định';
      setError(errorMessage);
    }
  };

  const handleEditService = (id: string) => {
    navigate(`/service/edit/${id}`);
  };

  const filtered: Service[] = activeCategory === 'all'
    ? services
    : services.filter((s) => s.category.id.toString() === activeCategory.toString());

  return (
    <div className="service-container">
      <div className="breadcrumb">
        <a href="#">Dịch vụ</a><span>Danh sách</span>
      </div>
      <div className="header">
        <h1>Dịch vụ</h1>
        <a className="btn-add" href="/service/add">
          Tạo mới Dịch vụ
        </a>
      </div>
      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Đang tải...</div>}
      <ul className="tabs">
        {serviceCategories.map((cat) => (
          <li
            key={cat.id}
            className={activeCategory === cat.id ? 'active' : ''}
            onClick={() => {
              setActiveCategory(cat.id);
              setCurrentPage(1);
            }}
          >
            {cat.name}
          </li>
        ))}
      </ul>
      <table>
        <thead>
          <tr>
            <th>Tên dịch vụ</th>
            <th>Nhóm dịch vụ</th>
            <th>Giá mỗi đơn</th>
            <th>Mô tả</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && !loading && !error && (
            <tr>
              <td colSpan={5}>
                Không có dịch vụ nào trong danh mục:{' '}
                <strong>
                  {serviceCategories.find((c) => c.id === activeCategory)?.name || activeCategory}
                </strong>
              </td>
            </tr>
          )}
          {filtered.map((svc) => (
            <tr key={svc.id} className="service-row">
              <td>{svc.name}</td>
              <td>{svc.category.name}</td>
              <td>{svc.price.toLocaleString()} đ</td>
              <td>{svc.description}</td>
              <td className="actions">
                <button
                  className="edit-btn"
                  onClick={() => handleEditService(svc.id)}
                  title="Chỉnh sửa dịch vụ"
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
                  onClick={() => handleDeleteService(svc.id)}
                  title="Xóa dịch vụ"
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
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Trang trước
        </button>
        <span>
          Trang {currentPage} / {lastPage}
        </span>
        <button
          disabled={currentPage === lastPage}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Trang sau
        </button>
      </div>
    </div>
  );
};

export default Service;