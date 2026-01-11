import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Customer Pages
import ProductsPage from './pages/customer/ProductsPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import InventoryPage from './pages/admin/InventoryPage';

// Customer Components
import Header from './components/customer/Header';
import HeroSection from './components/customer/HeroSection';
import VoucherSection from './components/customer/VoucherSection';

// Admin Components
import Sidebar from './components/admin/Sidebar';

function App() {
  const { t } = useTranslation();

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={
            <div className="min-h-screen bg-gray-50">
              <Header cartItemCount={3} />
              <HeroSection />
              <div className="py-12">
                <div className="container mx-auto px-4">
                  <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
                    {t('product.featured')} {t('products')}
                  </h2>
                  <ProductsPage />
                </div>
              </div>
              <VoucherSection />
            </div>
          } />
          <Route path="/products" element={<ProductsPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/inventory" element={<InventoryPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;