import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from '../ui/navigation-menu';
import LoginSignupModal from './LoginSignupModal';

const Header = ({ cartItemCount = 0 }) => {
  const { t } = useTranslation();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-200 to-orange-300 rounded-full flex items-center justify-center">
              <span className="text-orange-800 font-bold text-lg">BN</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Bánh Ngọt Pro</h1>
          </div>

          {/* Navigation */}
          <NavigationMenu className="hidden md:block">
            <NavigationMenuList className="space-x-8">
              <NavigationMenuItem>
                <NavigationMenuLink href="/" className="text-gray-700 hover:text-amber-600 font-medium transition-colors">
                  {t('products')}
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="/custom-cakes" className="text-gray-700 hover:text-amber-600 font-medium transition-colors">
                  {t('categories')}: Bánh Sinh Nhật
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="/tracking" className="text-gray-700 hover:text-amber-600 font-medium transition-colors">
                  {t('orders')}: Theo Dõi
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="/profile" className="text-gray-700 hover:text-amber-600 font-medium transition-colors">
                  {t('profile')}
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Cart and Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              {cartItemCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
            
            <LoginSignupModal />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex justify-around mt-3 pt-3 border-t border-gray-100">
          <a href="/" className="text-center py-2">
            <div className="w-8 h-8 mx-auto mb-1 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-xs text-gray-600">{t('products')}</span>
          </a>
          <a href="/custom-cakes" className="text-center py-2">
            <div className="w-8 h-8 mx-auto mb-1 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-xs text-gray-600">Bánh Tùy Chỉnh</span>
          </a>
          <a href="/tracking" className="text-center py-2">
            <div className="w-8 h-8 mx-auto mb-1 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xs text-gray-600">Theo Dõi</span>
          </a>
          <a href="/profile" className="text-center py-2">
            <div className="w-8 h-8 mx-auto mb-1 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-xs text-gray-600">{t('profile')}</span>
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;