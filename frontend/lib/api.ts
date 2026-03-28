import axios from 'axios';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').trim();
const isBackendEnabled = API_URL.length > 0;

const STORAGE_KEYS = {
  services: 'dp_services',
  bookings: 'dp_bookings',
  contact: 'dp_contact_messages',
  admin: 'dp_admin_user',
};

const DEFAULT_ADMIN = {
  email: 'admin@example.com',
  password: 'admin123',
};

const DEFAULT_SERVICES = [
  {
    _id: 'svc-1',
    title: 'House Cleaning',
    description: 'Professional deep cleaning for homes and apartments.',
    category: 'Home Services',
    price: 4500,
    image: '',
    serviceDetails: 'Deep cleaning\nKitchen and bathroom cleaning\nFlexible scheduling',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'svc-2',
    title: 'AC Repair & Maintenance',
    description: 'Reliable AC servicing and gas refill by trained technicians.',
    category: 'Maintenance',
    price: 6000,
    image: '',
    serviceDetails: 'Complete inspection\nGas refill support\nSame-day visit available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'svc-3',
    title: 'Graphic Design',
    description: 'Creative design solutions for logos, social posts, and branding.',
    category: 'Creative',
    price: 12000,
    image: '',
    serviceDetails: 'Logo design\nBrand kit\nUnlimited revisions (basic scope)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const api = isBackendEnabled
  ? axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  : null;

if (api) {
  api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });
}

const isBrowser = () => typeof window !== 'undefined';

const makeResponse = <T>(data: T, status = 200) => Promise.resolve({ data, status });

const makeApiError = (message: string, status = 400) => {
  const error: any = new Error(message);
  error.response = { data: { message }, status };
  throw error;
};

const readStorage = <T>(key: string, fallback: T): T => {
  if (!isBrowser()) return fallback;

  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeStorage = (key: string, value: any) => {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
};

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const getServices = () => {
  const services = readStorage<any[]>(STORAGE_KEYS.services, DEFAULT_SERVICES);
  if (!readStorage(STORAGE_KEYS.services, null)) {
    writeStorage(STORAGE_KEYS.services, services);
  }
  return services;
};

const setServices = (services: any[]) => writeStorage(STORAGE_KEYS.services, services);

const getBookings = () => readStorage<any[]>(STORAGE_KEYS.bookings, []);
const setBookings = (bookings: any[]) => writeStorage(STORAGE_KEYS.bookings, bookings);

const getAdmin = () => readStorage(STORAGE_KEYS.admin, DEFAULT_ADMIN);

export const servicesAPI = {
  getAll: () => (api ? api.get('/services') : makeResponse(getServices())),
  getById: (id: string) => {
    if (api) return api.get(`/services/${id}`);
    const service = getServices().find((item) => item._id === id);
    if (!service) makeApiError('Service not found', 404);
    return makeResponse(service);
  },
  create: (data: any) => {
    if (api) return api.post('/services', data);

    const now = new Date().toISOString();
    const newService = {
      ...data,
      _id: uid('svc'),
      price: Number(data.price) || 0,
      createdAt: now,
      updatedAt: now,
    };
    const services = [newService, ...getServices()];
    setServices(services);
    return makeResponse(newService, 201);
  },
  update: (id: string, data: any) => {
    if (api) return api.put(`/services/${id}`, data);

    const services = getServices();
    const index = services.findIndex((item) => item._id === id);
    if (index === -1) makeApiError('Service not found', 404);

    const updated = {
      ...services[index],
      ...data,
      price: data.price !== undefined ? Number(data.price) || 0 : services[index].price,
      updatedAt: new Date().toISOString(),
    };
    services[index] = updated;
    setServices(services);
    return makeResponse(updated);
  },
  delete: (id: string) => {
    if (api) return api.delete(`/services/${id}`);

    const services = getServices();
    const next = services.filter((item) => item._id !== id);
    setServices(next);
    return makeResponse({ success: true });
  },
};

export const bookingsAPI = {
  create: (data: any) => {
    if (api) return api.post('/bookings', data);

    const newBooking = {
      ...data,
      _id: uid('bkg'),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const bookings = [newBooking, ...getBookings()];
    setBookings(bookings);
    return makeResponse(newBooking, 201);
  },
  getAll: () => (api ? api.get('/bookings') : makeResponse(getBookings())),
  update: (id: string, data: any) => {
    if (api) return api.put(`/bookings/${id}`, data);

    const bookings = getBookings();
    const index = bookings.findIndex((item) => item._id === id);
    if (index === -1) makeApiError('Booking not found', 404);

    const updated = {
      ...bookings[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    bookings[index] = updated;
    setBookings(bookings);
    return makeResponse(updated);
  },
  delete: (id: string) => {
    if (api) return api.delete(`/bookings/${id}`);

    const next = getBookings().filter((item) => item._id !== id);
    setBookings(next);
    return makeResponse({ success: true });
  },
};

export const contactAPI = {
  send: (data: any) => {
    if (api) return api.post('/contact', data);

    const messages = readStorage<any[]>(STORAGE_KEYS.contact, []);
    messages.unshift({ ...data, _id: uid('msg'), createdAt: new Date().toISOString() });
    writeStorage(STORAGE_KEYS.contact, messages);
    return makeResponse({ success: true }, 201);
  },
};

export const authAPI = {
  register: (data: any) => {
    if (api) return api.post('/auth/register', data);

    const admin = {
      email: data.email || DEFAULT_ADMIN.email,
      password: data.password || DEFAULT_ADMIN.password,
    };
    writeStorage(STORAGE_KEYS.admin, admin);
    return makeResponse({ token: uid('token') }, 201);
  },
  login: (data: any) => {
    if (api) return api.post('/auth/login', data);

    const admin = getAdmin();
    const isValid = data.email === admin.email && data.password === admin.password;

    if (!isValid) {
      makeApiError('Invalid credentials. Use admin@example.com / admin123', 401);
    }

    return makeResponse({ token: uid('token') });
  },
};

export default api;
