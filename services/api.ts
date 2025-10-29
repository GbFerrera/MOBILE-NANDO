const API_BASE_URL = 'https://api.linkcallendar.com';

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

export interface TeamServiceDetail {
  team_service_id: number;
  service_id: number;
  service_name: string;
  description: string;
  price: string;
  duration: number;
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
  services: TeamServiceDetail[];
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
  professional_name?: string;
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

export interface LoginData {
  email: string;
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
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  data?: any,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  try {
    console.log(`[API] Fazendo requisição ${method} para ${API_BASE_URL}${endpoint}`);
    if (data) {
      console.log('[API] Dados enviados:', data);
    }
    
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
    console.log(`[API] Status da resposta: ${response.status}`);
    
    // Verificar se a resposta é JSON válido
    const contentType = response.headers.get('content-type');
    console.log('[API] Content-Type da resposta:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('[API] Resposta não é JSON:', textResponse.substring(0, 200));
      return {
        error: `Servidor retornou ${contentType || 'conteúdo inválido'} ao invés de JSON. Verifique se a API está funcionando corretamente.`,
        status: response.status,
      };
    }
    
    const responseData = await response.json();
    console.log('[API] Dados da resposta:', responseData);

    if (!response.ok) {
      console.error('[API] Erro na resposta:', responseData);
      return {
        error: responseData.message || responseData.error || 'Erro na requisição',
        status: response.status,
      };
    }

    return { data: responseData, status: response.status };
  } catch (error: any) {
    console.error('[API] Erro na requisição:', error);
    
    // Verificar se é erro de parsing JSON
    if (error.message && error.message.includes('JSON Parse error')) {
      return {
        error: 'Servidor retornou dados inválidos. A API pode estar fora do ar ou retornando HTML ao invés de JSON.',
        status: 500,
      };
    }
    
    // Verificar se é erro de rede
    if (error.message === 'Network request failed' || error.message.includes('fetch')) {
      return {
        error: 'Não foi possível conectar ao servidor. Verifique se a API está rodando em ' + API_BASE_URL,
        status: 0,
      };
    }
    
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

export async function loginClient(loginData: LoginData): Promise<ApiResponse<any>> {
  console.log('loginClient chamado com:', loginData);
  const result = await makeRequest<any>('/sessions/clients', 'POST', loginData, {
    'company_id': '1',
  });
  console.log('Resposta da API login:', result);
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

export async function updateAppointmentStatus(appointmentId: number, status: 'confirmed' | 'canceled', canceledBy?: 'client'): Promise<ApiResponse<any>> {
  console.log('[updateAppointmentStatus] Iniciando atualização:', {
    appointmentId,
    status,
    canceledBy
  });
  
  // Baseado na análise do backend, a rota correta é PATCH /appointments/{id}/status
  const url = canceledBy ? `/appointments/${appointmentId}/status?canceledBy=${canceledBy}` : `/appointments/${appointmentId}/status`;
  console.log('[updateAppointmentStatus] URL construída:', url);
  
  const result = await makeRequest<any>(url, 'PATCH', { status }, {
    'company_id': '1',
  });
  
  console.log('[updateAppointmentStatus] Resultado:', result);
  return result;
}
