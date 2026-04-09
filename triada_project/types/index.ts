
export * from '@/services/task';

// Типы
export interface FileInfo {
  id: number;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  type: 'image' | 'video' | 'document' | 'other';
  entity_type: string;
  entity_id: number;
  description?: string;
  uploaded_by?: number;
  created_at: string;
  path: string;
}

export interface Report {
  id: number;
  task_id: number;
  description: string;
  created_at: string;
  updated_at: string;
  task_title?: string;
  task_description?: string;
  customer?: string;
  address?: string;
  phone?: string;
  start_date?: string;
  due_date?: string;
  task_status?: string;
  files: FileInfo[];          // <-- теперь массив файлов, а не media
}

export interface CreateReportData {
  task_id: number;
  description: string;
  // file_ids можно не передавать, так как файлы загружаются отдельно
}


export interface UploadFileResponse {
  success: boolean;
  file: FileInfo;
}

export interface UploadMultipleFilesResponse {
  success: boolean;
  files: FileInfo[];
  count: number;
}
export interface User {
  id: number;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  role_id?: number;
  role_name?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

// Добавляем новые статусы
export interface Task {
  id: number;
  title: string;
  description: string;
  phone: string;
  customer: string;
  startDate: string;
  dueDate: string;
  location?: Location;
  status: 'new' | 'in_progress' | 'paused' | 'completed' | 'accepted' | 'report_added' | 'accepted_by_customer' | "pause-circle"|'rejected';
  pause_reason?: string;
  createdAt: string;
  updatedAt: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  start_date?: string;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
  invoice_file_id: string;
  invoice_file_type: string;
  addressNote: string,
  has_invoice: boolean,
  invoice: {
    filename: string,
    originalname: string,
    type: string,
    size: number
  }

}

// Интерфейс комментария
export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  user_name?: string;
  content: string;
  comment_type: 'general' | 'pause_reason' | 'system';
  created_at: string;
  updated_at: string;
}

export interface CreateCommentData {
  task_id: number;
  content: string;
  comment_type?: 'general' | 'pause_reason' | 'system';
}

// Обновляем пропсы для компонентов
export interface TaskListProps {
  tasks: Task[];
  onToggleTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
  onEditTask: (task: Task) => void;
  onUpdateTaskStatus: (taskId: number, newStatus: string, pauseReason?: string) => void;
  onAddTask: () => void;
  onViewComments: (task: Task) => void;
  isLoading: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  success?: boolean;
  message?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  phone: string;
  customer: string;
  addressNote: string;
  start_date: string;
  due_date: string;
  location: Location;
  media_urls?: []
}

export interface ReportPhoto {
  id: number;
  photo_url: string;
  created_at: string;
}

// Добавляем в существующие типы

export interface AvailableMaterial {
  id: number;
  name: string;
  unit: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskMaterial {
  id: number;
  task_id: number;
  material_id: number | null;
  quantity: number;
  custom_name: string | null;
  custom_unit: string | null;
  note: string | null;
  created_at: string;

  // Joined fields
  material_name?: string;
  material_unit?: string;
  material_description?: string;
}

export interface TaskMaterialsResponse {
  materials: TaskMaterial[];
  available_materials: AvailableMaterial[];
}

export interface AddMaterialRequest {
  task_id: number;
  material_id?: number | null;
  custom_name?: string;
  custom_unit?: string;
  quantity: number;
  note?: string;
}

export interface NewMaterialRequest {
  name: string;
  unit: string;
  description?: string;
}
