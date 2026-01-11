import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

const ProductCard = ({ product }) => {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    // Simulate adding to cart
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img 
          src={product.image || '/placeholder-banh-mi.jpg'} 
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.isFeatured && (
          <div className="absolute top-3 left-3 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            {t('product.featured')}
          </div>
        )}
        {product.discountPercent && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            -{product.discountPercent}%
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-800 line-clamp-1">{product.name}</h3>
          <span className="text-sm text-gray-500">{product.category}</span>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex justify-between items-center mb-4">
          <div>
            {product.discountPercent ? (
              <div className="flex items-baseline space-x-2">
                <span className="text-lg font-bold text-amber-600">
                  {(product.price * (1 - product.discountPercent/100)).toLocaleString('vi-VN')} ₫
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {product.price.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-amber-600">
                {product.price.toLocaleString('vi-VN')} ₫
              </span>
            )}
          </div>
          <div className="flex items-center">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <svg 
                  key={i} 
                  className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'stroke-current fill-none'}`} 
                  viewBox="0 0 24 24"
                >
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.92 0 1.22.5.64 1.12l-3.71 3.51a1 1 0 00-.25 1.09l1.53 4.71c.3.92-.75 1.65-1.55 1.08L12 16.32l-4.25 2.94c-.8.57-1.85-.16-1.55-1.08l1.53-4.71a1 1 0 00-.25-1.09l-3.71-3.51c-.58-.62-.28-1.12.64-1.12h4.915a1 1 0 00.95-.69l1.519-4.674z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">({product.reviewCount})</span>
          </div>
        </div>

        {/* Quick Add to Cart */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center border rounded-lg">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={decrementQuantity}
              className="px-2"
            >
              -
            </Button>
            <span className="px-3 py-1 text-sm">{quantity}</span>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={incrementQuantity}
              className="px-2"
            >
              +
            </Button>
          </div>
          <Button 
            onClick={handleAddToCart}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            {isAdded ? (
              <span className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                {t('notification.success')}
              </span>
            ) : (
              t('product.add_to_cart')
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;