
    import React from 'react';
    import { LayoutDashboard, CalendarDays, Users, Settings, DollarSign, LogOut, ClipboardCheck } from 'lucide-react';

    export const adminNavItems = [
      { title: 'Painel', href: '/admin/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
      { title: 'Agendamentos', href: '/admin/appointments', icon: <CalendarDays className="h-5 w-5" /> },
      { title: 'Clientes', href: '/admin/clients', icon: <Users className="h-5 w-5" /> },
      { title: 'Financeiro', href: '/admin/financials', icon: <DollarSign className="h-5 w-5" /> },
      { title: 'Configurações', href: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
    ];

    export const clientNavItems = [
      { title: 'Agendar Horário', href: '/book', icon: <ClipboardCheck className="h-5 w-5" /> }
    ];
  