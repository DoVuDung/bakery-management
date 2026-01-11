import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/admin/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const InventoryPage = () => {
  const { t } = useTranslation();
  const [ingredients, setIngredients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call to get inventory data
    setTimeout(() => {
      const mockIngredients = [
        {
          id: 1,
          name: 'Bột mì',
          unit: 'kg',
          currentStock: 12.5,
          minStock: 5,
          costPerUnit: 25000,
          supplier: 'Công ty TNHH ABC',
          lastUpdated: '2023-01-01'
        },
        {
          id: 2,
          name: 'Đường trắng',
          unit: 'kg',
          currentStock: 3.2,
          minStock: 5,
          costPerUnit: 22000,
          supplier: 'Công ty TNHH XYZ',
          lastUpdated: '2023-01-01'
        },
        {
          id: 3,
          name: 'Bơ nhạt',
          unit: 'kg',
          currentStock: 8.7,
          minStock: 3,
          costPerUnit: 85000,
          supplier: 'Công ty TNHH Butter',
          lastUpdated: '2023-01-01'
        },
        {
          id: 4,
          name: 'Trứng gà',
          unit: 'chục',
          currentStock: 15,
          minStock: 10,
          costPerUnit: 35000,
          supplier: 'Nông trại A',
          lastUpdated: '2023-01-01'
        },
        {
          id: 5,
          name: 'Sữa tươi',
          unit: 'lít',
          currentStock: 4.5,
          minStock: 8,
          costPerUnit: 28000,
          supplier: 'Công ty sữa Việt',
          lastUpdated: '2023-01-01'
        }
      ];

      const mockStaff = [
        {
          id: 1,
          name: 'Nguyễn Văn A',
          role: 'Bếp trưởng',
          avatar: '/avatars/beptruong.jpg',
          monthlySalary: 15000000,
          hireDate: '2022-01-15',
          status: 'active'
        },
        {
          id: 2,
          name: 'Trần Thị B',
          role: 'Nhân viên bán hàng',
          avatar: '/avatars/nhanvien.jpg',
          monthlySalary: 8000000,
          hireDate: '2022-03-20',
          status: 'active'
        },
        {
          id: 3,
          name: 'Lê Văn C',
          role: 'Tài xế giao hàng',
          avatar: '/avatars/taixe.jpg',
          monthlySalary: 10000000,
          hireDate: '2022-05-10',
          status: 'active'
        },
        {
          id: 4,
          name: 'Phạm Thị D',
          role: 'Phụ bếp',
          avatar: '/avatars/phubep.jpg',
          monthlySalary: 7000000,
          hireDate: '2022-07-05',
          status: 'active'
        }
      ];

      // Find low stock items
      const lowStock = mockIngredients.filter(item => item.currentStock < item.minStock);
      setLowStockAlerts(lowStock);

      setIngredients(mockIngredients);
      setStaff(mockStaff);
    }, 800);
  }, []);

  const getStockLevelColor = (current, min) => {
    if (current < min) return 'bg-red-500';
    if (current < min * 1.5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStockLevelWidth = (current, min) => {
    // Calculate percentage: if current is 0, it's 0%; if it's much higher than min, cap at 100%
    const maxDisplay = min * 3; // Show up to 3x the minimum as full bar
    const percentage = Math.min(100, (current / maxDisplay) * 100);
    return `${percentage}%`;
  };

  const renderPaymentStatus = () => {
    return (
      <div className="flex space-x-2">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span className="text-xs">MoMo</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
          <span className="text-xs">VNPay</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
          <span className="text-xs">ZaloPay</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-gray-500 mr-1"></div>
          <span className="text-xs">Facebook Ads</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Kho & Nhân Sự</h1>
            <p className="text-gray-600">Theo dõi nguyên liệu và nhân viên của bạn</p>
          </div>

          {/* Low Stock Alerts */}
          {lowStockAlerts.length > 0 && (
            <div className="mb-6">
              <Card className="border-l-4 border-red-500">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-red-600">Cảnh báo tồn kho thấp</CardTitle>
                  <Badge variant="destructive">{lowStockAlerts.length} mặt hàng</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lowStockAlerts.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-red-600">{item.currentStock} {item.unit} (tối thiểu: {item.minStock} {item.unit})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inventory Table */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Nguyên Liệu Kho</CardTitle>
                  <Button variant="outline">Thêm nguyên liệu</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Tên nguyên liệu</th>
                        <th className="text-left py-3 px-2">Tồn kho</th>
                        <th className="text-left py-3 px-2">Mức tối thiểu</th>
                        <th className="text-left py-3 px-2">Tiến độ</th>
                        <th className="text-left py-3 px-2">Đơn giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingredients.map(item => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.supplier}</div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="font-semibold">{item.currentStock} {item.unit}</div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="text-gray-700">{item.minStock} {item.unit}</div>
                          </td>
                          <td className="py-3 px-2 w-32">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getStockLevelColor(item.currentStock, item.minStock)}`}
                                style={{ width: getStockLevelWidth(item.currentStock, item.minStock) }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {item.currentStock < item.minStock ? 'Thấp' : 'Đủ'}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="font-medium">{item.costPerUnit.toLocaleString('vi-VN')} ₫/{item.unit}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Staff Table */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Nhân Viên</CardTitle>
                  <Button variant="outline">Thêm nhân viên</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Nhân viên</th>
                        <th className="text-left py-3 px-2">Vị trí</th>
                        <th className="text-left py-3 px-2">Lương tháng</th>
                        <th className="text-left py-3 px-2">Ngày vào</th>
                        <th className="text-left py-3 px-2">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map(person => (
                        <tr key={person.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 flex items-center justify-center">
                                <span className="font-medium text-gray-700">
                                  {person.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">{person.name}</div>
                                <div className="text-sm text-gray-500">ID: NV{person.id.toString().padStart(3, '0')}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="font-medium">{person.role}</div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="font-semibold">{person.monthlySalary.toLocaleString('vi-VN')} ₫</div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="text-gray-700">{new Date(person.hireDate).toLocaleDateString('vi-VN')}</div>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant={person.status === 'active' ? 'success' : 'secondary'}>
                              {person.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Payment & Ads Status */}
                <div className="mt-6 pt-4 border-t">
                  <h3 className="font-medium mb-3">Trạng thái tích hợp</h3>
                  {renderPaymentStatus()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-4">
            <Button className="bg-green-600 hover:bg-green-700">
              📤 Xuất PDF Báo Cáo
            </Button>
            <Button variant="outline">
              👤 Thêm Nhân Viên
            </Button>
            <Button variant="outline">
              ➕ Nhập Kho Mới
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;