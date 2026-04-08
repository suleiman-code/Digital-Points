import axios from 'axios';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').trim();
const isBackendEnabled = API_URL.length > 0;

const STORAGE_KEYS = {
  services: 'dp_services',
  bookings: 'dp_bookings',
  contact: 'dp_contact_messages',
  admin: 'dp_admin_user',
  adminResetToken: 'dp_admin_reset_token',
};

const DEFAULT_ADMIN = {
  email: 'admin@example.com',
  password: 'admin123',
};

const DEFAULT_SERVICES = [
  {
    _id: '1',
    title: 'Elite Home Cleaning',
    description: 'Professional deep cleaning for homes and apartments. We use eco-friendly products and provide fully insured staff.',
    category: 'Cleaning',
    price: 50,
    city: 'New York',
    state: 'NY',
    contact_phone: '+1 555 123 4567',
    contact_email: 'contact@elitecleaning.com',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    serviceDetails: 'Deep cleaning\nKitchen and bathroom cleaning\nFlexible scheduling',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '2',
    title: 'Master Sparky Electrical',
    description: 'Professional electrical services for common household issues. From fixing lights to rewiring projects.',
    category: 'Electrical',
    price: 50,
    city: 'Los Angeles',
    state: 'CA',
    contact_phone: '+1 555 987 6543',
    contact_email: 'info@mastersparky.com',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    serviceDetails: 'Complete inspection\nEmergency repairs\nSafety checks',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '3',
    title: 'Royal Touch Salon',
    description: 'Get a luxury salon experience at home or in-studio. We specialize in creative styling and hair care.',
    category: 'Salon',
    price: 50,
    city: 'Chicago',
    state: 'IL',
    contact_phone: '+1 555 321 0987',
    contact_email: 'appointments@royaltouch.com',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    serviceDetails: 'Hair Styling & Cut\nBridal Makeup\nSkin Treatments',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '4',
    title: 'Precision Plumbing Co.',
    description: 'Leaking tap? Clogged drain? Expert plumbers with precision tools to fix your issues quickly.',
    category: 'Plumbing',
    price: 50,
    city: 'New York',
    state: 'NY',
    contact_phone: '+1 555 444 5555',
    contact_email: 'help@precisionplumbing.com',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    serviceDetails: 'Leak detection\nPipe replacement\nWater pressure adjustment',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '5',
    title: 'A+ Academic Tutors',
    description: 'Personalized tutoring for students of all ages focusing on core subjects like Math and Science.',
    category: 'Tutoring',
    price: 50,
    city: 'Houston',
    state: 'TX',
    contact_phone: '+1 555 222 3333',
    contact_email: 'learn@aplustutors.com',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    serviceDetails: 'One-on-One Tutoring\nExam Preparation\nCustom Study Plans',
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

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      const requestUrl = String(error?.config?.url || '');

      // If token is expired/invalid, clear local auth so UI can force re-login cleanly.
      if (typeof window !== 'undefined' && status === 401 && !requestUrl.includes('/auth/login')) {
        localStorage.removeItem('authToken');
      }

      return Promise.reject(error);
    }
  );
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
  const stored = readStorage<any[] | null>(STORAGE_KEYS.services, null);

  if (!stored || stored.length === 0) {
    writeStorage(STORAGE_KEYS.services, DEFAULT_SERVICES);
    return DEFAULT_SERVICES;
  }

  const existingIds = new Set(stored.map((service: any) => service._id));
  const missingDefaults = DEFAULT_SERVICES.filter((service) => !existingIds.has(service._id));

  if (missingDefaults.length > 0) {
    const merged = [...stored, ...missingDefaults];
    writeStorage(STORAGE_KEYS.services, merged);
    return merged;
  }

  return stored;
};

const setServices = (services: any[]) => writeStorage(STORAGE_KEYS.services, services);

const getBookings = () => readStorage<any[]>(STORAGE_KEYS.bookings, []);
const setBookings = (bookings: any[]) => writeStorage(STORAGE_KEYS.bookings, bookings);

const getAdmin = () => readStorage(STORAGE_KEYS.admin, DEFAULT_ADMIN);

export const servicesAPI = {
  getAll: (filters?: any) => (api ? api.get('/services/', { params: filters }) : makeResponse(getServices())),
  getById: (id: string) => {
    if (api) return api.get(`/services/${id}/`);
    const service = getServices().find((item) => item._id === id);
    if (!service) makeApiError('Service not found', 404);
    return makeResponse(service);
  },
  create: (data: any) => {
    if (api) return api.post('/services/', data);

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
    if (api) return api.put(`/services/${id}/`, data);

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
    if (api) return api.delete(`/services/${id}/`);

    const services = getServices();
    const next = services.filter((item) => item._id !== id);
    setServices(next);
    return makeResponse({ success: true });
  },
  addReview: (id: string, data: any) => {
    if (api) return api.post(`/services/${id}/reviews/`, data);
    return makeResponse({ ...data, _id: uid('rev'), createdAt: new Date().toISOString() }, 201);
  },
  getReviews: (id: string) => {
    if (api) return api.get(`/services/${id}/reviews/`);
    return makeResponse([
      {
        _id: 'mock1',
        service_id: id,
        user_name: 'Osman',
        user_email: 'osman@example.com',
        rating: 5,
        comment: "I really hope my career will one day make me prove to United states that I'm going to be a good plumber one day...",
        created_at: new Date('2019-12-16T15:11:00Z').toISOString()
      }
    ]);
  },
  postReview: (id: string, review: any) => {
    if (api) return api.post(`/services/${id}/reviews`, review);
    return makeResponse({
      ...review,
      _id: uid('rev'),
      service_id: id,
      created_at: new Date().toISOString(),
    }, 201);
  },
  uploadImage: async (file: File) => {
    if (!api) throw new Error("Backend not enabled for local uploads");
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/services/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const inquiriesAPI = {
  create: (data: any) => {
    if (api) return api.post('/bookings/', data);

    const newBooking = {
      ...data,
      _id: uid('bkg'),
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    const bookings = [newBooking, ...getBookings()];
    setBookings(bookings);
    return makeResponse(newBooking, 201);
  },
  getAll: () => (api ? api.get('/bookings/') : makeResponse(getBookings())),

  // Used by Admin to update booking status.
  // Backend: PUT /api/bookings/{id}/status?new_status=pending|contacted|completed|cancelled
  updateStatus: (id: string, newStatus: string) => {
    if (api) return api.put(`/bookings/${id}/status/`, null, { params: { new_status: newStatus } });

    const bookings = getBookings();
    const index = bookings.findIndex((item: any) => item._id === id);
    if (index === -1) makeApiError('Booking not found', 404);
    bookings[index] = { ...bookings[index], status: newStatus };
    setBookings(bookings);
    return makeResponse(bookings[index]);
  },

  // Kept as a generic fallback for localStorage mode
  update: (id: string, data: any) => {
    if (api) return api.put(`/bookings/${id}/status/`, null, { params: { new_status: data.status } });

    const bookings = getBookings();
    const index = bookings.findIndex((item: any) => item._id === id);
    if (index === -1) makeApiError('Booking not found', 404);
    const updated = { ...bookings[index], ...data };
    bookings[index] = updated;
    setBookings(bookings);
    return makeResponse(updated);
  },

  delete: (id: string) => {
    if (api) return api.delete(`/bookings/${id}/`);

    const next = getBookings().filter((item: any) => item._id !== id);
    setBookings(next);
    return makeResponse({ success: true });
  },
};

// Backward compatibility for existing admin pages/components.
export const bookingsAPI = inquiriesAPI;

export const contactAPI = {
  send: (data: any) => {
    if (api) return api.post('/contact/', data);

    const messages = readStorage<any[]>(STORAGE_KEYS.contact, []);
    messages.unshift({ ...data, _id: uid('msg'), createdAt: new Date().toISOString() });
    writeStorage(STORAGE_KEYS.contact, messages);
    return makeResponse({ success: true }, 201);
  },
  getAll: () => {
    if (api) return api.get('/contact/');
    return makeResponse(readStorage<any[]>(STORAGE_KEYS.contact, []));
  },
};

export const authAPI = {
  register: (data: any) => {
    if (api) return api.post('/auth/signup/', data);

    const admin = {
      email: data.email || DEFAULT_ADMIN.email,
      password: data.password || DEFAULT_ADMIN.password,
    };
    writeStorage(STORAGE_KEYS.admin, admin);
    return makeResponse({ token: uid('token') }, 201);
  },
  login: (data: any) => {
    if (api) {
      // FastAPI OAuth2PasswordRequestForm expects form-data with 'username' field
      const formData = new URLSearchParams();
      formData.append('username', data.email);
      formData.append('password', data.password);
      return api.post('/auth/login/', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    }

    const admin = getAdmin();
    const isValid = data.email === admin.email && data.password === admin.password;

    if (!isValid) {
      makeApiError('Invalid credentials. Use admin@example.com / admin123', 401);
    }

    return makeResponse({ access_token: uid('token'), token_type: 'bearer' });
  },
  forgotPassword: (data: { email: string }) => {
    if (api) return api.post('/auth/forgot-password', data);

    const admin = getAdmin();
    if (data.email === admin.email) {
      const token = `local-reset-${Date.now()}`;
      localStorage.setItem(STORAGE_KEYS.adminResetToken, token);
      return makeResponse({
        message: 'If this admin account exists, a reset link has been sent.',
        reset_url: `/admin/reset-password?token=${token}`,
      });
    }
    return makeResponse({ message: 'If this admin account exists, a reset link has been sent.' });
  },
  resetPassword: (data: { token: string; new_password: string }) => {
    if (api) return api.post('/auth/reset-password', data);

    const savedToken = localStorage.getItem(STORAGE_KEYS.adminResetToken);
    if (!savedToken || savedToken !== data.token) {
      makeApiError('Invalid or expired reset token', 400);
    }

    const admin = getAdmin();
    writeStorage(STORAGE_KEYS.admin, { ...admin, password: data.new_password });
    localStorage.removeItem(STORAGE_KEYS.adminResetToken);
    return makeResponse({ message: 'Password updated successfully.' });
  },
  me: () => {
    if (api) return api.get('/auth/me');
    const token = isBrowser() ? localStorage.getItem('authToken') : null;
    if (!token) makeApiError('Could not validate credentials', 401);
    return makeResponse({
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
      is_admin: true,
    });
  },
};

export default api;
