import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

const VoucherSection = () => {
  const { t } = useTranslation();
  const [vouchers] = useState([
    {
      id: 1,
      code: 'MUAMOT_TANGMOT',
      name: 'Mua 1 tặng 1',
      description: 'Mua bất kỳ bánh mì nào, tặng ngay 1 bánh cùng loại',
      discount: '50%',
      minOrder: '50,000 ₫',
      expiry: '31/01/2024'
    },
    {
      id: 2,
      code: 'TET2024',
      name: 'Ưu đãi Tết',
      description: 'Giảm giá 30% cho đơn hàng từ 200,000 ₫',
      discount: '30%',
      minOrder: '200,000 ₫',
      expiry: '15/02/2024'
    },
    {
      id: 3,
      code: 'THANHLAP',
      name: 'Khuyến mãi khai trương',
      description: 'Giảm 100,000 ₫ cho đơn hàng đầu tiên',
      discount: '100,000 ₫',
      minOrder: '150,000 ₫',
      expiry: '28/02/2024'
    }
  ]);

  const [appliedVoucher, setAppliedVoucher] = useState('');

  const handleApplyVoucher = () => {
    if (appliedVoucher.trim()) {
      alert(`Voucher ${appliedVoucher} đã được áp dụng!`);
      setAppliedVoucher('');
    }
  };

  return (
    <section className="py-12 bg-gradient-to-r from-amber-50 to-orange-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('voucher.apply')}</h2>
          <p className="text-gray-600">{t('voucher.enter_code')} và nhận ưu đãi đặc biệt</p>
        </div>

        {/* Voucher Input Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('voucher.apply')}</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={appliedVoucher}
                onChange={(e) => setAppliedVoucher(e.target.value)}
                placeholder={t('voucher.enter_code')}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <Button 
                onClick={handleApplyVoucher}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                {t('voucher.apply')}
              </Button>
            </div>
          </div>
        </div>

        {/* Available Vouchers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vouchers.map((voucher) => (
            <Card key={voucher.id} className="border-2 border-amber-200 hover:border-amber-400 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{voucher.name}</CardTitle>
                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-sm font-bold">
                    -{voucher.discount}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">{voucher.description}</p>
                <div className="flex justify-between text-sm text-gray-500 mb-4">
                  <span>Đơn tối thiểu: {voucher.minOrder}</span>
                  <span>HSD: {voucher.expiry}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                    {voucher.code}
                  </span>
                  <Button size="sm" variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50">
                    Sao chép
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Special Rewards Banner */}
        <div className="mt-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Chương Trình Thưởng Thân Thiết</h3>
          <p className="mb-4 max-w-2xl mx-auto">
            Tích lũy điểm sau mỗi lần mua sắm và đổi lấy những phần quà hấp dẫn. 
            Càng mua nhiều, càng nhận nhiều ưu đãi!
          </p>
          <Button className="bg-white text-orange-600 hover:bg-gray-100">
            Tham Gia Ngay
          </Button>
        </div>
      </div>
    </section>
  );
};

export default VoucherSection;