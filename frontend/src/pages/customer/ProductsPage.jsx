import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../../components/customer/Header';
import ProductCard from '../../components/customer/ProductCard';
import { Button } from '../../components/ui/Button';

const ProductsPage = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockProducts = [
        {
          id: 1,
          name: 'Bánh Mì Thượng Hải',
          description: 'Bánh mì đặc sản với nhân thịt nướng thơm ngon, rau sống tươi mát',
          price: 35000,
          category: 'Bánh Mì',
          image: '/images/banhmi-thuonghai.jpg',
          rating: 4.8,
          reviewCount: 128,
          isFeatured: true,
          discountPercent: 10
        },
        {
          id: 2,
          name: 'Bánh Su Kem',
          description: 'Bánh su kem mềm mịn, nhân kem trứng sữa thơm ngon, ngọt dịu',
          price: 15000,
          category: 'Bánh Tây',
          image: '/images/banh-su-kem.jpg',
          rating: 4.6,
          reviewCount: 89,
          isFeatured: true
        },
        {
          id: 3,
          name: 'Bánh Mousse Dâu',
          description: 'Bánh mousse dâu tây tươi nguyên chất, thơm ngon, chua ngọt hài hòa',
          price: 45000,
          category: 'Bánh Sinh Nhật',
          image: '/images/banh-mousse-dau.jpg',
          rating: 4.9,
          reviewCount: 204,
          isFeatured: true
        },
        {
          id: 4,
          name: 'Bánh Cuộn Dừa',
          description: 'Bánh cuộn dừa tự nhiên, dai mềm, vị dừa thơm lừng',
          price: 25000,
          category: 'Bánh Việt',
          image: '/images/banh-cuon-dua.jpg',
          rating: 4.5,
          reviewCount: 76,
          isFeatured: false
        },
        {
          id: 5,
          name: 'Bánh Macaron Pháp',
          description: 'Macaron Pháp chính hiệu, nhiều hương vị, độ giòn chuẩn',
          price: 30000,
          category: 'Bánh Tây',
          image: '/images/macaron-phap.jpg',
          rating: 4.7,
          reviewCount: 156,
          isFeatured: true,
          discountPercent: 15
        },
        {
          id: 6,
          name: 'Bánh Kem Trái Cây',
          description: 'Bánh kem trái cây tươi, tùy chọn theo mùa, trang trí đẹp mắt',
          price: 320000,
          category: 'Bánh Sinh Nhật',
          image: '/images/banh-kem-trai-cay.jpg',
          rating: 4.9,
          reviewCount: 312,
          isFeatured: true
        }
      ];

      const mockCategories = [
        { id: 'all', name: 'Tất cả' },
        { id: 'banh-mi', name: 'Bánh Mì' },
        { id: 'banh-tay', name: 'Bánh Tây' },
        { id: 'banh-sinh-nhat', name: 'Bánh Sinh Nhật' },
        { id: 'banh-viet', name: 'Bánh Việt' }
      ];

      setProducts(mockProducts);
      setCategories(mockCategories);
      setLoading(false);
    }, 800);
  }, []);

  const filteredProducts = products.filter(product => {
    if (selectedCategory === 'all') return true;
    return product.category.toLowerCase().includes(selectedCategory);
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    // Default: featured first
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <svg 
        key={i} 
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-amber-400 fill-current' : 'text-gray-300 stroke-current fill-none'}`} 
        viewBox="0 0 24 24"
      >
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.92 0 1.22.5.64 1.12l-3.71 3.51a1 1 0 00-.25 1.09l1.53 4.71c.3.92-.75 1.65-1.55 1.08L12 16.32l-4.25 2.94c-.8.57-1.85-.16-1.55-1.08l1.53-4.71a1 1 0 00-.25-1.09l-3.71-3.51c-.58-.62-.28-1.12.64-1.12h4.915a1 1 0 00.95-.69l1.519-4.674z" />
      </svg>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-md p-4">
                  <div className="bg-gray-200 h-40 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartItemCount={3} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('products')}</h1>
          <p className="text-gray-600">{t('product.description')}: Các sản phẩm mới nhất và nổi bật</p>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id 
                  ? 'bg-amber-500 hover:bg-amber-600 border-amber-500' 
                  : 'border-gray-300'
                }
              >
                {category.name}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <label htmlFor="sort" className="text-gray-700">Sắp xếp:</label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="featured">Nổi bật</option>
              <option value="price-low">Giá: Thấp đến cao</option>
              <option value="price-high">Giá: Cao đến thấp</option>
              <option value="rating">Đánh giá</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Load More Button */}
        {products.length > 0 && (
          <div className="text-center mt-12">
            <Button variant="outline" className="border-2 border-amber-500 text-amber-600 hover:bg-amber-50">
              {t('load_more')}: Tải thêm sản phẩm
            </Button>
          </div>
        )}
      </div>

      {/* Floating Zalo Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          <Button className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.58 12.2c-.45 0-.81.36-.81.81 0 .45.36.81.81.81.45 0 .81-.36.81-.81 0-.45-.36-.81-.81-.81zm-10 0c-.45 0-.81.36-.81.81 0 .45.36.81.81.81.45 0 .81-.36.81-.81 0-.45-.36-.81-.81-.81zm5.02 0c-.45 0-.81.36-.81.81 0 .45.36.81.81.81.45 0 .81-.36.81-.81 0-.45-.36-.81-.81-.81zm0-7.85c-3.8 0-6.88 3.08-6.88 6.88s3.08 6.88 6.88 6.88 6.88-3.08 6.88-6.88-3.08-6.88-6.88-6.88zm0 12.16c-2.9 0-5.28-2.38-5.28-5.28s2.38-5.28 5.28-5.28 5.28 2.38 5.28 5.28-2.38 5.28-5.28 5.28z" />
            </svg>
          </Button>
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            Chat với chúng tôi
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;