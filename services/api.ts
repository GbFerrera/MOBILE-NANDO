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
