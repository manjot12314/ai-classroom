import { Platform } from 'react-native';

// API base URL configuration
// For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator, use localhost
// For web, use localhost
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
  } else if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
  } else {
    // iOS
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
  }
};

const API_BASE_URL = getApiBaseUrl();

export interface PerformanceMetric {
  id: number;
  student_id: number;
  period_start: string;
  period_end: string;
  attendance_rate: number;
  avg_attentiveness: number;
  overall_score: number;
}

export interface Student {
  id: number;
  name: string;
  email: string;
  class_id: number | null;
}

export interface PerformanceResponse extends PerformanceMetric {
  student?: Student;
}

class ApiClient {
  public baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          `Network error: Could not connect to backend at ${url}. Make sure the backend server is running.`
        );
      }
      throw error;
    }
  }

  async getStudentPerformance(studentId: number): Promise<PerformanceResponse> {
    return this.request<PerformanceResponse>(`/api/performance/student/${studentId}`);
  }

  async getClassPerformance(classId: number): Promise<PerformanceResponse[]> {
    return this.request<PerformanceResponse[]>(`/api/performance/class/${classId}`);
  }

  async getStudents(token?: string): Promise<Student[]> {
    return this.request<Student[]>('/api/students/', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}

export const apiClient = new ApiClient();

