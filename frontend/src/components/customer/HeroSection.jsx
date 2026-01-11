import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';

const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-amber-200 to-orange-200 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-gradient-to-r from-orange-200 to-amber-200 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight">
              Hương vị <span className="text-amber-600">truyền thống</span> <br />
              pha chút <span className="text-orange-600">hiện đại</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-lg">
              {t('welcome')} đến với Bánh Ngọt Pro - nơi hội tụ tinh hoa bánh Việt với công nghệ hiện đại. 
              Từng chiếc bánh là cả tâm huyết của nghệ nhân lành nghề.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-3 text-lg h-auto">
                {t('products')}: Khám Phá Ngay
              </Button>
              <Button variant="outline" className="border-2 border-amber-500 text-amber-600 hover:bg-amber-50 px-8 py-3 text-lg h-auto">
                {t('contact')}: Tư Vấn Miễn Phí
              </Button>
            </div>
          </div>
          
          {/* Image/Visual Content */}
          <div className="relative">
            <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              {/* Placeholder for high-res image */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-orange-200 to-yellow-100 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-amber-300 to-orange-300 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0A2.704 2.704 0 0012 15.75c-.526 0-1.052.15-1.5.454a2.704 2.704 0 01-3 0A2.704 2.704 0 003 15.75c-.526 0-1.052.15-1.5.454a2.704 2.704 0 01-3 0A2.704 2.704 0 000 15.75c-.526 0-1.052.15-1.5.454a2.704 2.704 0 01-3 0A2.704 2.704 0 00-3 15.75c-.526 0-1.052.15-1.5.454a2.704 2.704 0 01-3 0A2.704 2.704 0 00-6 15.75c-.526 0-1.052.15-1.5.454a2.704 2.704 0 01-3 0A2.704 2.704 0 00-9 15.75c-.526 0-1.052.15-1.5.454a2.704 2.704 0 01-3 0A2.704 2.704 0 00-12 15.75c-.526 0-1.052.15-1.5.454a2.704 2.704 0 01-3 0A2.704 2.704 0 00-15 15.75c-.526 0-1.052.15-1.5.454a2.704 2.704 0 01-3 0A2.704 2.704 0 00-18 15.75c-.526 0-1.052.15-1.5.454a2.704 2.704 0 01-3 0A2.704 2.704 0 00-21 15.75c-.526 0-1.052.15-1.5.454a2.704 2.704 0 01-3 0" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-amber-800">Bánh Mì & Bánh Âu Cao Cấp</h3>
                  <p className="text-amber-700 mt-2">Hình ảnh chất lượng cao các loại bánh đặc trưng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;