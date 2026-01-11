import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/admin/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import KanbanBoard from '../../components/admin/KanbanBoard';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Alert, AlertDescription } from '../../components/ui/alert';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0,
    todayOrders: 0
  });

  // Mock data for demonstration
  useEffect(() => {
    // In a real app, this would come from an API
    const mockOrders = [
      {
        id: '1',
        orderId: 'BN20230101001',
        status: 'NEW',
        totalAmount: 350000,
        shippingRecipient: 'Nguyễn Văn A',
        createdAt: '2023-01-01T10:00:00Z',
        customerNotes: 'Giao trong giờ hành chính'
      },
      {
        id: '2',
        orderId: 'BN20230101002',
        status: 'PROCESSING',
        totalAmount: 420000,
        shippingRecipient: 'Trần Thị B',
        createdAt: '2023-01-01T09:30:00Z',
        customerNotes: 'Không ớt'
      },
      {
        id: '3',
        orderId: 'BN20230101003',
        status: 'COOKING',
        totalAmount: 280000,
        shippingRecipient: 'Lê Văn C',
        createdAt: '2023-01-01T08:45:00Z',
        customerNotes: ''
      },
      {
        id: '4',
        orderId: 'BN20230101004',
        status: 'COMPLETED',
        totalAmount: 550000,
        shippingRecipient: 'Phạm Thị D',
        createdAt: '2023-01-01T07:20:00Z',
        customerNotes: 'Giao nhanh'
      },
      {
        id: '5',
        orderId: 'BN20230101005',
        status: 'DELIVERED',
        totalAmount: 180000,
        shippingRecipient: 'Hoàng Văn E',
        createdAt: '2023-01-01T06:15:00Z',
        customerNotes: ''
      }
    ];

    setOrders(mockOrders);
    
    // Calculate stats
    const totalOrders = mockOrders.length;
    const pendingOrders = mockOrders.filter(o => o.status === 'NEW').length;
    const revenue = mockOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const todayOrders = mockOrders.length; // Simplified for demo
    
    setStats({
      totalOrders,
      pendingOrders,
      revenue,
      todayOrders
    });
  }, []);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    // In a real app, this would call an API to update the order status
    console.log(`Updating order ${orderId} to status: ${newStatus}`);
    
    // Update local state
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus } 
          : order
      )
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{t('admin_panel')}</h1>
            <p className="text-gray-600">Quản lý đơn hàng và hoạt động kinh doanh</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">+10% so với tuần trước</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Đơn chờ xử lý</CardTitle>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 8v4"></path>
                  <path d="M12 16h.01"></path>
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{stats.pendingOrders}</div>
                <p className="text-xs text-muted-foreground">Cần xử lý ngay</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.revenue.toLocaleString('vi-VN')} ₫</div>
                <p className="text-xs text-muted-foreground">+15% so với tuần trước</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Đơn hôm nay</CardTitle>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayOrders}</div>
                <p className="text-xs text-muted-foreground">+3 so với ngày hôm qua</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList>
              <TabsTrigger value="orders">{t('orders')}</TabsTrigger>
              <TabsTrigger value="inventory">{t('inventory')}</TabsTrigger>
              <TabsTrigger value="finance">{t('finance')}</TabsTrigger>
              <TabsTrigger value="staff">{t('staff')}</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Đơn hàng mới ({orders.filter(o => o.status === 'NEW').length})</h2>
                <Button>Thêm đơn hàng</Button>
              </div>
              
              <KanbanBoard />
            </TabsContent>

            <TabsContent value="inventory">
              <Card>
                <CardHeader>
                  <CardTitle>Quản lý kho</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Chức năng quản lý kho sẽ được cập nhật...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="finance">
              <Card>
                <CardHeader>
                  <CardTitle>Quản lý tài chính</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Chức năng quản lý tài chính sẽ được cập nhật...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="staff">
              <Card>
                <CardHeader>
                  <CardTitle>Quản lý nhân viên</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Chức năng quản lý nhân viên sẽ được cập nhật...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;