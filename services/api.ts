const API_BASE_URL = 'http://localhost:3131';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
}

export interface Service {
  service_id: number;
  service_name: string;
  service_description: string;
  service_price: string;
  service_duration: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  position: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
  photo_url: string;
  has_schedule: boolean;
}

export interface Schedule {
  id: number;
  professional_id: number;
  company_id: number;
  date: string | null;
  day_of_week: string;
  start_time: string | null;
  end_time: string | null;
  lunch_start_time: string | null;
  lunch_end_time: string | null;
  is_day_off: boolean;
  created_at: string;
  updated_at: string;
  is_specific_date?: boolean;
}

export interface ScheduleResponse {
  hasSchedule: boolean;
  schedules: Schedule[];
}

export interface AppointmentClient {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  document: string;
}

export interface AppointmentServiceDetail {
  service_id: number;
  service_name: string;
  quantity: number;
  price: string;
}

export interface Appointment {
  id: number;
  company_id: number;
  professional_id: number;
  client_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  subscription_id: number | null;
  status: string;
  client: AppointmentClient;
  services: AppointmentServiceDetail[];
}

export interface ScheduleWithAppointmentsResponse {
  schedule: Schedule;
  appointments: Appointment[];
}

export interface AppointmentService {
  service_id: number;
  quantity: number;
}

export interface CreateAppointmentData {
  client_id: number;
  professional_id: number;
  appointment_date: string;
  start_time: string;
  end_time?: string;
  status?: 'pending' | 'confirmed' | 'canceled' | 'completed';
  notes?: string;
  services: AppointmentService[];
}

export interface CreateClientData {
  name: string;
  email: string;
  phone_number: string;
  document?: string;
  password: string;
}

export interface ClientPhoto {
  client_id: number;
  name: string;
  photo_url: string;
  description: string | null;
}

export interface PlanService {
  id: number;
  company_id: number;
  name: string;
  description: string;
  price: string;
  duration: number;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: number;
  name: string;
  description: string;
  price: string;
  is_recurring: boolean;
  sessions_limit: number | null;
  sessions_per_week: number;
  company_id: number;
  created_at: string;
  updated_at: string;
  services: PlanService[];
}

export async function makeRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  try {
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const responseData = await response.json();

    if (!response.ok) {
      return {
        error: responseData.message || 'Erro na requisição',
        status: response.status,
      };
    }

    return { data: responseData, status: response.status };
  } catch (error: any) {
    return {
      error: error.message || 'Erro desconhecido',
      status: 500,
    };
  }
}

export async function getServices(): Promise<ApiResponse<Service[]>> {
  return makeRequest<Service[]>('/service', 'GET', undefined, {
    'company_id': '1',
  });
}

export async function getTeamMembers(): Promise<ApiResponse<TeamMember[]>> {
  return makeRequest<TeamMember[]>('/teams', 'GET', undefined, {
    'company_id': '1',
  });
}

export async function getProfessionalSchedule(professionalId: number): Promise<ApiResponse<ScheduleResponse>> {
  return makeRequest<ScheduleResponse>(`/schedules/${professionalId}`, 'GET', undefined, {
    'company_id': '1',
  });
}

export async function getProfessionalScheduleByDate(professionalId: number, date: string): Promise<ApiResponse<ScheduleWithAppointmentsResponse>> {
  return makeRequest<ScheduleWithAppointmentsResponse>(`/schedules/${professionalId}/date/${date}`, 'GET', undefined, {
    'company_id': '1',
  });
}

export async function createAppointment(appointmentData: CreateAppointmentData): Promise<ApiResponse<any>> {
  return makeRequest<any>('/appointments', 'POST', appointmentData, {
    'company_id': '1',
  });
}

export async function createClient(clientData: CreateClientData): Promise<ApiResponse<any>> {
  console.log('createClient chamado com:', clientData);
  const result = await makeRequest<any>('/clients', 'POST', clientData, {
    'company_id': '1',
  });
  console.log('Resposta da API:', result);
  return result;
}

export async function getClientPhotos(): Promise<ApiResponse<ClientPhoto[]>> {
  return makeRequest<ClientPhoto[]>('/client-photos/all', 'GET', undefined, {
    'company_id': '1',
  });
}

export async function getPlans(): Promise<ApiResponse<Plan[]>> {
  return makeRequest<Plan[]>('/plans', 'GET', undefined, {
    'company_id': '1',
  });
}

export async function getClientAppointments(clientId: number): Promise<ApiResponse<Appointment[]>> {
  return makeRequest<Appointment[]>(`/appointments?client_id=${clientId}`, 'GET', undefined, {
    'company_id': '1',
  });
}
