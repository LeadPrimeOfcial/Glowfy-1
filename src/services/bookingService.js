
    const initialServices = [
      { id: 'esmaltação', name: 'Esmaltação', duration: 60, price: 30.00, active: true },
      { id: 'manutencao', name: 'Manutenção', duration: 90, price: 90.00, active: true },
      { id: 'manutencao_decoracao', name: 'Manutenção com Decoração', duration: 120, price: 120.00, active: true },
      { id: 'primeira_aplicacao', name: '1ª Aplicação', duration: 120, price: 150.00, active: true },
      { id: 'blindagem_gel', name: 'Blindagem em Gel', duration: 90, price: 70.00, active: true },
    ];

    const initialWorkingHours = {
      monday: { enabled: true, slots: [{ start: "10:00", end: "12:00" }, { start: "13:30", end: "17:30"}] },
      tuesday: { enabled: true, slots: [{ start: "10:00", end: "12:00" }, { start: "13:30", end: "17:30"}] },
      wednesday: { enabled: true, slots: [{ start: "10:00", end: "12:00" }, { start: "13:30", end: "17:30"}] },
      thursday: { enabled: true, slots: [{ start: "10:00", end: "12:00" }, { start: "13:30", end: "17:30"}] },
      friday: { enabled: true, slots: [{ start: "10:00", end: "12:00" }, { start: "13:30", end: "17:30"}] },
      saturday: { enabled: true, slots: [{ start: "08:00", end: "17:30" }] },
      sunday: { enabled: false, slots: [] }
    };
    
    const initialTerms = 
        "-Não é permitido acompanhante, nosso espaço é elaborado só para atendimento pessoal.\n" +
        "-Não é permitido trazer crianças, caso não tenha como vir sem sua criança remarque seu horário para um dia mais propício pois compromete todo o nosso atendimento e Horário!\n" +
        "-É proibido o consumo de bebidas alcoólicas dentro do salão.\n" +
        "-Nossa tolerância para atrasos é de 15 minutos. Após esse prazo, infelizmente, o agendamento será cancelado para não comprometer os próximos atendimentos.\n" +
        "Obs: Por favor pedimos a extrema compreensão em todas as regras para evitar cancelamento de atendimento e situações constrangedoras!";

    const initialPaymentMethods = [
        { id: 'pix', name: 'Pix', active: true },
        { id: 'dinheiro', name: 'Dinheiro', active: true },
        { id: 'credito', name: 'Crédito', active: true },
        { id: 'debito', name: 'Débito', active: true },
    ];

    const getFromStorage = (key, defaultValue) => {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    };
    
    const saveToStorage = (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    };

    // Services
    export const getServices = () => getFromStorage('glowfy_services', initialServices).filter(s => s.active);
    export const getAllServicesAdmin = () => getFromStorage('glowfy_services', initialServices);
    export const saveService = (serviceData) => {
        let services = getFromStorage('glowfy_services', initialServices);
        if (serviceData.id) {
            services = services.map(s => s.id === serviceData.id ? {...s, ...serviceData} : s);
        } else {
            services.push({ ...serviceData, id: `service_${Date.now()}`});
        }
        saveToStorage('glowfy_services', services);
    };
    export const deleteService = (serviceId) => {
        let services = getFromStorage('glowfy_services', initialServices);
        services = services.filter(s => s.id !== serviceId);
        saveToStorage('glowfy_services', services);
    };

    // Working Hours
    export const getWorkingHours = () => getFromStorage('glowfy_working_hours', initialWorkingHours);
    export const saveWorkingHours = (hours) => saveToStorage('glowfy_working_hours', hours);

    // Terms
    export const getTerms = () => getFromStorage('glowfy_terms', initialTerms);
    export const saveTerms = (termsText) => saveToStorage('glowfy_terms', termsText);
    
    // Payment Methods
    export const getPaymentMethods = () => getFromStorage('glowfy_payment_methods', initialPaymentMethods).filter(pm => pm.active);
    export const getAllPaymentMethodsAdmin = () => getFromStorage('glowfy_payment_methods', initialPaymentMethods);
    export const savePaymentMethod = (pmData) => {
        let methods = getFromStorage('glowfy_payment_methods', initialPaymentMethods);
        if (pmData.id) {
            methods = methods.map(pm => pm.id === pmData.id ? {...pm, ...pmData} : pm);
        } else {
            methods.push({ ...pmData, id: `pm_${Date.now()}`});
        }
        saveToStorage('glowfy_payment_methods', methods);
    };
    export const deletePaymentMethod = (pmId) => {
        let methods = getFromStorage('glowfy_payment_methods', initialPaymentMethods);
        methods = methods.filter(pm => pm.id !== pmId);
        saveToStorage('glowfy_payment_methods', methods);
    };

    // Appointments
    export const getAppointments = () => getFromStorage('glowfy_appointments', []);
    export const saveAppointment = (appointment) => {
        const appointments = getAppointments();
        // Check if editing or adding new
        const existingIndex = appointments.findIndex(app => app.id === appointment.id);
        if (existingIndex > -1) {
            appointments[existingIndex] = appointment;
        } else {
            appointments.push(appointment);
        }
        saveToStorage('glowfy_appointments', appointments);
    };
    export const updateAppointmentStatus = (appointmentId, status) => {
        let appointments = getAppointments();
        appointments = appointments.map(app => app.id === appointmentId ? { ...app, status } : app);
        saveToStorage('glowfy_appointments', appointments);
    };
    export const getAppointmentsForClient = (cpf) => {
        const appointments = getAppointments();
        return appointments.filter(app => app.cpf === cpf).sort((a,b) => new Date(b.date) - new Date(a.date));
    };

    // Clients
    export const getClients = () => getFromStorage('glowfy_clients', []);
    export const saveClient = (clientData) => {
        let clients = getClients();
        // Use CPF as ID for simplicity with localStorage, assuming CPF is unique
        const existingIndex = clients.findIndex(c => c.cpf === clientData.cpf);
        if (existingIndex > -1) {
            clients[existingIndex] = { ...clients[existingIndex], ...clientData };
        } else {
            clients.push({ ...clientData }); // Don't add new id if CPF is the id
        }
        saveToStorage('glowfy_clients', clients);
    };
    export const deleteClient = (cpf) => {
        let clients = getClients();
        clients = clients.filter(c => c.cpf !== cpf);
        saveToStorage('glowfy_clients', clients);
    };
    
    // General Settings
    export const getSettings = () => getFromStorage('glowfy_general_settings', { salonName: "Meu Salão Glowfy" });
    export const saveSettings = (settings) => saveToStorage('glowfy_general_settings', settings);

    // Sales
    export const getSales = () => getFromStorage('glowfy_sales', []);
    export const saveSale = (sale) => {
        const sales = getSales();
        sales.push(sale);
        saveToStorage('glowfy_sales', sales);
    };

    // Initialize default data if nothing is in localStorage
    if (!localStorage.getItem('glowfy_services')) {
        saveToStorage('glowfy_services', initialServices);
    }
    if (!localStorage.getItem('glowfy_working_hours')) {
        saveToStorage('glowfy_working_hours', initialWorkingHours);
    }
    if (!localStorage.getItem('glowfy_terms')) {
        saveToStorage('glowfy_terms', initialTerms);
    }
    if (!localStorage.getItem('glowfy_payment_methods')) {
        saveToStorage('glowfy_payment_methods', initialPaymentMethods);
    }
    // No initial appointments, clients, or sales needed