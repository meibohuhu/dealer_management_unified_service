import { ReactNode, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Car, UserRound, FileText, LogOut } from "lucide-react";

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

function SidebarItem({ icon, label, href, active = false }: SidebarItemProps) {
  return (
    <Link to={href}>
      <Button
        variant={active ? 'secondary' : 'ghost'}
        className={cn('w-full justify-start gap-2', active ? 'bg-secondary font-medium' : '')}
      >
        {icon}
        {label}
      </Button>
    </Link>
  );
}

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const pathname = window.location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', href: '/dashboard' },
    { icon: <Car className="h-5 w-5" />, label: 'Vehicles', href: '/vehicles' },
    { icon: <UserRound className="h-5 w-5" />, label: 'Customers', href: '/customers' },
    { icon: <FileText className="h-5 w-5" />, label: 'Contracts', href: '/contracts' },
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full gap-6 p-4">
      <div className="flex items-center gap-2 px-2">
        <Car className="h-6 w-6" />
        <span className="font-bold text-lg">Dealership Admin</span>
      </div>
      
      <div className="space-y-1">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={pathname === item.href}
          />
        ))}
      </div>
      
      <div className="mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:inset-y-0 border-r">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navigation */}
        <header className="flex h-14 items-center gap-4 border-b px-4 lg:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
          </Sheet>
          <div className="ml-auto flex items-center gap-2">
            <div className="text-sm text-right hidden sm:block">
              <div className="font-medium">{user?.name || 'User'}</div>
              <div className="text-muted-foreground">{user?.role || 'Role'}</div>
            </div>
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}