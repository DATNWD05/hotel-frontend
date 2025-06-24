import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../css/service.css";

interface Amenity {
      id: string;
      category_id: string;
      code: string;
      name: string;
      description: string;
      icon: string;
      price: number;
      default_quantity: number;
      status: string;
}

interface AmenityCategory {
      id: string;
      name: string;
}

interface RawAmenityCategory {
      id?: number | string;
      name?: string;
}

interface CategoryData {
      id?: string | number | null;
      name?: string | null;
}

interface RawAmenity {
      id?: number | string;
      category_id?: number | string | null;
      code?: string | null;
      name?: string;
      description?: string;
      icon?: string;
      price?: number | string | null;
      default_quantity?: number | string | null;
      status?: string;
      category?: CategoryData | null;
}

const Amenities: React.FC = () => {
      const [amenities, setAmenities] = useState<Amenity[]>([]);
      const [amenityCategories, setAmenityCategories] = useState<AmenityCategory[]>([
            { id: 'all', name: 'Tất cả' },
      ]);
      const [activeCategory, setActiveCategory] = useState<string>('all');
      const [currentPage, setCurrentPage] = useState<number>(1);
      const [lastPage, setLastPage] = useState<number>(1);
      const [loading, setLoading] = useState<boolean>(false);
      const [error, setError] = useState<string | null>(null);
      const navigate = useNavigate();

      useEffect(() => {
            document.title = 'Danh sách Tiện ích';
            const token = localStorage.getItem('auth_token');
            if (!token) {
                  setError('Không tìm thấy token xác thực');
                  return;
            }

            fetch('http://127.0.0.1:8000/api/amenity-categories', {
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
                        console.log('Amenity Categories API Response:', response);
                        const data = response.data || response;
                        if (!Array.isArray(data)) {
                              setError('Dữ liệu danh mục không đúng định dạng');
                              return;
                        }
                        const categories: AmenityCategory[] = [
                              { id: 'all', name: 'Tất cả' },
                              ...data.map((cat: RawAmenityCategory) => ({
                                    id: cat.id != null ? String(cat.id) : '',
                                    name: cat.name || 'Không xác định',
                              })),
                        ];
                        setAmenityCategories(categories);
                  })
                  .catch((err: unknown) => {
                        const errorMessage = err instanceof Error ? `Không thể tải danh mục tiện ích: ${err.message}` : 'Lỗi không xác định';
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

            const url = `http://127.0.0.1:8000/api/amenities?page=${currentPage}${activeCategory !== 'all' ? `&category_id=${activeCategory}` : ''}`;

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
                                    throw new Error(`Lỗi tải tiện ích: ${res.status} ${res.statusText}. Chi tiết: ${text}`);
                              });
                        }
                        return res.json();
                  })
                  .then((response) => {
                        console.log('Amenities API Response:', response);
                        if (!response.data || !Array.isArray(response.data)) {
                              setError('Dữ liệu tiện ích không đúng định dạng');
                              setLoading(false);
                              return;
                        }

                        const mapped: Amenity[] = (response.data as RawAmenity[]).map((item) => {
                              const categoryId = item.category?.id != null ? String(item.category.id) : '0';
                              const mappedItem: Amenity = {
                                    id: item.id != null ? String(item.id) : '',
                                    category_id: categoryId,
                                    code: item.code || 'V101',
                                    name: item.name || 'Không xác định',
                                    description: item.description || '–',
                                    icon: item.icon || '',
                                    price: typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.-]+/g, '')) || 10000 : item.price != null ? Number(item.price) : 10000,
                                    default_quantity: typeof item.default_quantity === 'string' ? parseInt(item.default_quantity, 10) || 1 : item.default_quantity != null ? Number(item.default_quantity) : 1,
                                    status: item.status || 'active',
                              };
                              console.log('Mapped Amenity:', mappedItem);
                              return mappedItem;
                        });

                        setAmenities(mapped);
                        setLastPage(response.meta?.last_page || 1);
                        setLoading(false);
                  })
                  .catch((err: unknown) => {
                        const errorMessage = err instanceof Error ? `Không thể tải danh sách tiện ích: ${err.message}` : 'Lỗi không xác định';
                        setError(errorMessage);
                        setLoading(false);
                  });
      }, [currentPage, activeCategory]);

      const handleDeleteAmenity = async (id: string) => {
            if (!window.confirm('Bạn có chắc chắn muốn xóa tiện ích này?')) return;

            const token = localStorage.getItem('auth_token');
            if (!token) {
                  setError('Không tìm thấy token xác thực');
                  return;
            }

            try {
                  const res = await fetch(`http://127.0.0.1:8000/api/amenities/${id}`, {
                        method: 'DELETE',
                        headers: {
                              'Accept': 'application/json',
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`,
                        },
                  });

                  if (!res.ok) {
                        return res.text().then((text) => {
                              throw new Error(`Lỗi xóa tiện ích: ${res.status} ${res.statusText}. Chi tiết: ${text}`);
                        });
                  }

                  setAmenities((prev) => prev.filter((a) => a.id !== id));
                  setError('Xóa tiện ích thành công!');
            } catch (err: unknown) {
                  const errorMessage = err instanceof Error ? `Không thể xóa tiện ích: ${err.message}` : 'Lỗi không xác định';
                  setError(errorMessage);
            }
      };

      const handleEditAmenity = (id: string) => {
            navigate(`/amenities/edit/${id}`);
      };

      const filtered: Amenity[] = activeCategory === 'all'
            ? amenities
            : amenities.filter((a) => a.category_id === activeCategory);

      return (
            <div className="service-container">
                  <div className="breadcrumb">
                        <a href="#">Tiện ích</a><span>Danh sách</span>
                  </div>
                  <div className="header">
                        <h1>Tiện ích</h1>
                        <a className="btn-add" href="/amenities/add">
                              Tạo mới Tiện ích
                        </a>
                  </div>
                  {error && <div className="error">{error}</div>}
                  {loading && <div className="loading">Đang tải...</div>}
                  <ul className="tabs">
                        {amenityCategories.map((cat) => (
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
                                    <th>ID</th>
                                    <th>Nhóm</th>
                                    <th>Mã</th>
                                    <th>Tên</th>
                                    <th>Mô tả</th>
                                    <th>Biểu tượng</th>
                                    <th>Giá</th>
                                    <th>Số lượng mặc định</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                              </tr>
                        </thead>
                        <tbody>
                              {filtered.length === 0 && !loading && !error && (
                                    <tr>
                                          <td colSpan={10}>
                                                Không có tiện ích nào trong danh mục:{' '}
                                                <strong>
                                                      {amenityCategories.find((c) => c.id === activeCategory)?.name || activeCategory}
                                                </strong>
                                          </td>
                                    </tr>
                              )}
                              {filtered.map((amenity) => (
                                    <tr key={amenity.id} className="service-row">
                                          <td>{amenity.id}</td>
                                          <td>{amenityCategories.find((c) => c.id === amenity.category_id)?.name || 'Không xác định'}</td>
                                          <td>{amenity.code}</td>
                                          <td>{amenity.name}</td>
                                          <td>{amenity.description}</td>
                                          <td>{amenity.icon ? <img src={amenity.icon} alt={amenity.name} width="24" /> : 'Không có'}</td>
                                          <td>{amenity.price.toLocaleString('vi-VN')} đ</td>
                                          <td>{amenity.default_quantity}</td>
                                          <td>{amenity.status}</td>
                                          <td className="actions">
                                                <button
                                                      className="edit-btn"
                                                      onClick={() => handleEditAmenity(amenity.id)}
                                                      title="Chỉnh sửa tiện ích"
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
                                                      onClick={() => handleDeleteAmenity(amenity.id)}
                                                      title="Xóa tiện ích"
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

export default Amenities;