import React from 'react';
    import { Link, Outlet, useLocation } from 'react-router-dom';
    import { Toaster } from '@/components/ui/toaster';
    import { motion, AnimatePresence } from 'framer-motion';

    const ClientLayout = () => {
      const location = useLocation();
      return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-glowfy-secondary/20 via-glowfy-background to-glowfy-accent/10">
          <header className="py-6 px-4 sm:px-6 lg:px-8 bg-glowfy-card shadow-md">
            <div className="container mx-auto flex justify-between items-center">
              <Link to="/" className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-glowfy-primary to-glowfy-accent">
                GLOWFY
              </Link>
              <nav>
                {/* Possible future links like "My Bookings" or "Login" */}
              </nav>
            </div>
          </header>
          <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
          <footer className="py-8 text-center bg-glowfy-card border-t border-glowfy-border">
            <p className="text-sm text-glowfy-muted-foreground">
              &copy; {new Date().getFullYear()} GLOWFY. Todos os direitos reservados.
            </p>
            <p className="text-xs text-glowfy-muted-foreground mt-1">
              Desenvolvido por <a href="https://www.leadprime.com.br" target="_blank" rel="noopener noreferrer" className="text-glowfy-primary hover:underline">
    LeadPrime Softwares
  </a>.
            </p>
          </footer>
          <Toaster />
        </div>
      );
    };

    export default ClientLayout;