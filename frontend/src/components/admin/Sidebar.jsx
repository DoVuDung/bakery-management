import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';

const Sidebar = () => {
  const { t } = useTranslation();

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: '📊' },
    { id: 'orders', label: t('orders'), icon: '📦' },
    { id: 'products', label: t('products'), icon: '🍰' },
    { id: 'inventory', label: t('inventory'), icon: '📦' },
    { id: 'customers', label: 'Khách hàng', icon: '👥' },
    { id: 'finance', label: t('finance'), icon: '💰' },
    { id: 'staff', label: 'Nhân viên', icon: '👤' },
    { id: 'vouchers', label: 'Mã giảm giá', icon: '🏷️' },
    { id: 'reports', label: 'Báo cáo', icon: '📈' },
    { id: 'settings', label: t('settings'), icon: '⚙️' }
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">BN</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Bánh Ngọt Pro</h2>
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <Button
                variant="ghost"
                className="w-full justify-start space-x-3 py-3 px-4 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <Button variant="outline" className="w-full">
          🔐 Đăng xuất
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;