import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/admin/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/data-table';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion';
import { Alert, AlertDescription } from '../../components/ui/alert';

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
                <DataTable 
                  columns={[
                    { id: 'name', header: 'Tên nguyên liệu', cell: ({ row }) => (
                      <div>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-sm text-gray-500">{row.supplier}</div>
                      </div>
                    )},
                    { id: 'currentStock', header: 'Tồn kho', cell: ({ row }) => (
                      <div className="font-semibold">{row.currentStock} {row.unit}</div>
                    )},
                    { id: 'minStock', header: 'Mức tối thiểu', cell: ({ row }) => (
                      <div className="text-gray-700">{row.minStock} {row.unit}</div>
                    )},
                    { id: 'stockProgress', header: 'Tiến độ', cell: ({ row }) => (
                      <div className="w-32">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getStockLevelColor(row.currentStock, row.minStock)}`}
                            style={{ width: getStockLevelWidth(row.currentStock, row.minStock) }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {row.currentStock < row.minStock ? 'Thấp' : 'Đủ'}
                        </div>
                      </div>
                    )},
                    { id: 'costPerUnit', header: 'Đơn giá', cell: ({ row }) => (
                      <div className="font-medium">{row.costPerUnit.toLocaleString('vi-VN')} ₫/{row.unit}</div>
                    )}
                  ]}
                  data={ingredients}
                  filterOptions={[
                    { id: 'name', placeholder: 'Lọc theo tên...' },
                    { id: 'unit', placeholder: 'Lọc theo đơn vị...' }
                  ]}
                />
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
                <DataTable 
                  columns={[
                    { id: 'employee', header: 'Nhân viên', cell: ({ row }) => (
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={row.avatar} alt={row.name} />
                          <AvatarFallback>
                            {row.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{row.name}</div>
                          <div className="text-sm text-gray-500">ID: NV{row.id.toString().padStart(3, '0')}</div>
                        </div>
                      </div>
                    )},
                    { id: 'role', header: 'Vị trí', cell: ({ row }) => (
                      <div className="font-medium">{row.role}</div>
                    )},
                    { id: 'monthlySalary', header: 'Lương tháng', cell: ({ row }) => (
                      <div className="font-semibold">{row.monthlySalary.toLocaleString('vi-VN')} ₫</div>
                    )},
                    { id: 'hireDate', header: 'Ngày vào', cell: ({ row }) => (
                      <div className="text-gray-700">{new Date(row.hireDate).toLocaleDateString('vi-VN')}</div>
                    )},
                    { id: 'status', header: 'Trạng thái', cell: ({ row }) => (
                      <Badge variant={row.status === 'active' ? 'success' : 'secondary'}>
                        {row.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      </Badge>
                    )}
                  ]}
                  data={staff}
                  filterOptions={[
                    { id: 'name', placeholder: 'Lọc theo tên...' },
                    { id: 'role', placeholder: 'Lọc theo vị trí...' }
                  ]}
                />

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