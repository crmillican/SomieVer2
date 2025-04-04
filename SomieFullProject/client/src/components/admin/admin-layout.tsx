import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Flag,
  Settings,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Check for admin role in user object or fallback to localStorage
  const userRole = user?.role || localStorage.getItem('somie_user_role');
  const isAdmin = userRole === "admin" || userRole === "super_admin";
  const isSuperAdmin = userRole === "super_admin";

  // If not an admin, redirect to the admin entry page
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
        <p className="text-center mb-6">
          You need administrative privileges to access this area.
        </p>
        <div className="space-y-4 flex flex-col items-center">
          <Link href="/admin/login">
            <Button className="w-full">Go to Admin Login</Button>
          </Link>
          <p className="text-sm text-gray-500">or</p>
          <Link href="/">
            <Button variant="outline">Return to Main Site</Button>
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      current: location === "/admin/dashboard" || location === "/admin",
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
      current: location === "/admin/users",
    },
    {
      name: "Offers",
      href: "/admin/offers",
      icon: <FileCheck className="h-5 w-5" />,
      current: location === "/admin/offers",
    },
    {
      name: "Reports",
      href: "/admin/reports",
      icon: <Flag className="h-5 w-5" />,
      current: location === "/admin/reports",
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
      current: location === "/admin/settings",
      superAdminOnly: true,
    },
    {
      name: "Logs",
      href: "/admin/logs",
      icon: <ClipboardList className="h-5 w-5" />,
      current: location === "/admin/logs",
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 z-40 w-full bg-white dark:bg-gray-800 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          >
            {mobileSidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
          <span className="ml-3 text-lg font-semibold">SOMIE Admin</span>
        </div>
        <div className="flex items-center">
          <span className="text-sm mr-2">
            {user?.username || localStorage.getItem('somie_username')}
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
              {userRole}
            </span>
          </span>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/50 lg:hidden",
          mobileSidebarOpen ? "block" : "hidden"
        )}
        onClick={() => setMobileSidebarOpen(false)}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 transform transition-transform duration-200 ease-in-out lg:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <span className="text-lg font-semibold">SOMIE Admin</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="space-y-1 p-4">
            {filteredNavItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-2 py-2 rounded-md text-sm font-medium group",
                    item.current
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                  {item.current && (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </a>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t mt-auto">
            <Link href="/">
              <a className="flex items-center px-2 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                <LogOut className="h-5 w-5" />
                <span className="ml-3">Exit Admin Panel</span>
              </a>
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden lg:block bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="h-screen flex flex-col sticky top-0">
          <div className="flex items-center justify-between p-4 border-b">
            {sidebarOpen ? (
              <span className="text-lg font-semibold">SOMIE Admin</span>
            ) : (
              <span className="text-lg font-bold mx-auto">SA</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={sidebarOpen ? "" : "mx-auto"}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <nav className="space-y-1 p-4 flex-1">
            {filteredNavItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-2 py-2 rounded-md font-medium group",
                    sidebarOpen ? "text-sm" : "justify-center",
                    item.current
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  {item.icon}
                  {sidebarOpen && <span className="ml-3">{item.name}</span>}
                  {sidebarOpen && item.current && (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </a>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <div className={cn("flex", sidebarOpen ? "items-center" : "flex-col items-center")}>
              {sidebarOpen ? (
                <>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user?.username || localStorage.getItem('somie_username')}</span>
                    <span className="text-xs text-gray-500">{userRole}</span>
                  </div>
                  <Link href="/" className="ml-auto">
                    <Button variant="ghost" size="icon">
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium mb-2">{(user?.username || localStorage.getItem('somie_username') || 'A').charAt(0)}</span>
                  <Link href="/">
                    <Button variant="ghost" size="icon">
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {/* Desktop header */}
        <header className="hidden lg:flex items-center border-b bg-white dark:bg-gray-800 px-6 py-3 h-16">
          <h1 className="text-2xl font-bold">{filteredNavItems.find(item => item.current)?.name || "Admin Panel"}</h1>
          <div className="ml-auto flex items-center space-x-4">
            <span className="text-sm font-medium mr-2">
              Logged in as {user?.username || localStorage.getItem('somie_username')}
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                {userRole}
              </span>
            </span>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-6 pt-20 lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}