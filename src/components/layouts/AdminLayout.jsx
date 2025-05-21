import React, { useState } from 'react';
    import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
    import { Menu, LogOut, Moon, Sun, Bell } from 'lucide-react';
    import { adminNavItems } from '@/config/nav';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Toaster } from '@/components/ui/toaster';
    import { useToast } from '@/components/ui/use-toast';
    import { cn } from '@/lib/utils';

    const AdminLayout = () => {
      const [isSidebarOpen, setIsSidebarOpen] = useState(false);
      const [isDarkMode, setIsDarkMode] = useState(false);
      const navigate = useNavigate();
      const location = useLocation();
      const { toast } = useToast();

      const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark', !isDarkMode);
        toast({
          title: "Tema Alterado",
          description: `Tema ${!isDarkMode ? 'Escuro' : 'Claro'} ativado.`,
        });
      };
      
      const handleLogout = () => {
        toast({
          title: "Logout",
          description: "Você foi desconectado com sucesso.",
        });
        localStorage.removeItem('glowfy_token');
        navigate('/login');
      };

      const sidebarVariants = {
        open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
        closed: { x: "-100%", transition: { type: "spring", stiffness: 300, damping: 30 } },
      };
      
      const NavItem = ({ item }) => (
        <NavLink
          to={item.href}
          className={({ isActive }) =>
            cn(
              'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105',
              isActive
                ? 'bg-glowfy-primary text-glowfy-primary-foreground shadow-lg'
                : 'text-glowfy-foreground hover:bg-glowfy-muted hover:text-glowfy-primary'
            )
          }
          onClick={() => setIsSidebarOpen(false)}
        >
          {item.icon}
          <span className="ml-3">{item.title}</span>
        </NavLink>
      );

      return (
        <div className={`flex h-screen bg-glowfy-background ${isDarkMode ? 'dark' : ''}`}>
          <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          </AnimatePresence>
          <motion.div
            variants={sidebarVariants}
            initial="closed"
            animate={isSidebarOpen ? "open" : "closed"}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-glowfy-card border-r border-glowfy-border p-4 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:block"
          >
            <div className="flex items-center justify-between mb-8">
              <Link to="/admin/dashboard" className="text-2xl font-bold text-glowfy-primary">
                GLOWFY
              </Link>
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
                <Menu className="h-6 w-6 text-glowfy-primary" />
              </Button>
            </div>
            <nav className="space-y-2">
              {adminNavItems.map((item) => (
                <NavItem key={item.title} item={item} />
              ))}
            </nav>
            <div className="absolute bottom-4 left-4 right-4">
              <Button variant="ghost" className="w-full justify-start text-glowfy-foreground hover:bg-glowfy-muted hover:text-glowfy-primary" onClick={handleLogout}>
                <LogOut className="h-5 w-5 mr-3" />
                Sair
              </Button>
            </div>
          </motion.div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex items-center justify-between h-16 px-6 bg-glowfy-card border-b border-glowfy-border shadow-sm">
              <Button variant="ghost" size="icon" className="md:hidden text-glowfy-primary" onClick={() => setIsSidebarOpen(true)}>
                <Menu className="h-6 w-6" />
              </Button>
              <div className="flex-1 md:ml-0">
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="text-glowfy-primary">
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
                <Button variant="ghost" size="icon" className="text-glowfy-primary">
                  <Bell className="h-5 w-5" />
                </Button>
                <div className="flex items-center">
                   <img  className="h-8 w-8 rounded-full object-cover" alt="Avatar do usuário" src="https://images.unsplash.com/photo-1639493115941-b269818abfcd" />
                  <span className="ml-2 text-sm font-medium text-glowfy-foreground hidden md:block">Admin</span>
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
          <Toaster />
        </div>
      );
    };

    export default AdminLayout;