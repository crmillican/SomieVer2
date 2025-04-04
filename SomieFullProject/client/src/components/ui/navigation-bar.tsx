import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { LogOut, User, BarChart3, ShoppingBag, Search, Info } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/ui/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function NavigationBar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center">
            <Logo size="sm" />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-1">
            {user && (
              <Link href={user.userType === 'business' ? '/business-dashboard' : '/influencer-dashboard'}>
                <Button 
                  variant={isActive(user.userType === 'business' ? '/business-dashboard' : '/influencer-dashboard') ? "default" : "ghost"} 
                  size="sm" 
                  className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-4"
                >
                  <BarChart3 className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline-flex">Dashboard</span>
                </Button>
              </Link>
            )}
            
            <Link href="/why-somie">
              <Button 
                variant={isActive('/why-somie') ? "default" : "ghost"} 
                size="sm" 
                className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-4"
              >
                <Info className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline-flex">Why SOMIE</span>
              </Button>
            </Link>
            
            {user && (
              <Link href="/marketplace">
                <Button 
                  variant={isActive('/marketplace') ? "default" : "ghost"} 
                  size="sm" 
                  className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-4"
                >
                  <Search className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline-flex">Marketplace</span>
                </Button>
              </Link>
            )}
            
            {user?.userType === 'influencer' && (
              <Link href="/deals">
                <Button 
                  variant={isActive('/deals') ? "default" : "ghost"} 
                  size="sm" 
                  className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-4"
                >
                  <ShoppingBag className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline-flex">My Deals</span>
                </Button>
              </Link>
            )}
            
            {user?.userType === 'business' && (
              <Link href="/offers">
                <Button 
                  variant={isActive('/offers') ? "default" : "ghost"} 
                  size="sm" 
                  className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-4"
                >
                  <ShoppingBag className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline-flex">My Offers</span>
                </Button>
              </Link>
            )}
          </nav>
          
          <div className="flex items-center gap-2">
            {user && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 md:h-9 flex items-center"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline-flex">Logout</span>
              </Button>
            )}
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                    <span className="sr-only">User menu</span>
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.userType === 'business' ? 'Business Account' : 'Influencer Account'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={user.userType === 'business' ? '/business-dashboard' : '/influencer-dashboard'} className="w-full cursor-pointer">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="w-full cursor-pointer">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 cursor-pointer"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}