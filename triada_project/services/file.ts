import api from './apiClient';
import { FileInfo, UploadFileResponse, UploadMultipleFilesResponse } from '@/types';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, STORAGE_KEYS } from '@/constants';
import { CacheService } from './cacheService';
import { SyncQueueService } from './syncQueueService';

// ========== Вспомогательные функции (без изменений) ==========
const getMimeType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
  };
  return map[ext] || 'application/octet-stream';
};

const createFileFormData = (file: any, entity_type: string, task_id: number, entity_id?: number | null, description?: string): FormData => {
  const formData = new FormData();
  const fileObject: any = {
    uri: file.uri,
    name: file.name || file.fileName || `file-${Date.now()}`,
    type: file.type || file.mimeType || getMimeType(file.name || ''),
  };
  formData.append('file', fileObject);
  formData.append('entity_type', entity_type);
  formData.append('task_id', String(task_id));
  if (entity_id !== undefined && entity_id !== null) {
    formData.append('entity_id', String(entity_id));
  }
  if (description) {
    formData.append('description', description);
  }
  return formData;
};

const createMultipleFilesFormData = (
  files: any[],
  entity_type: string,
  task_id: number,
  entity_id?: number | null,
  descriptions?: string[]
): FormData => {
  const formData = new FormData();
  files.forEach((file, index) => {
    const fileObject: any = {
      uri: file.uri,
      name: file.name || file.fileName || `file-${Date.now()}-${index}`,
      type: file.type || file.mimeType || getMimeType(file.name || ''),
    };
    formData.append('files', fileObject);
  });
  formData.append('entity_type', entity_type);
  formData.append('task_id', String(task_id));
  if (entity_id !== undefined && entity_id !== null) {
    formData.append('entity_id', String(entity_id));
  }
  if (descriptions && descriptions.length > 0) {
    formData.append('descriptions', JSON.stringify(descriptions));
  }
  return formData;
};

// ========== Типы для совместимости ==========
export interface Invoice {
  filename: string;
  path: string;
  originalname?: string;
  mimetype?: string;
  size?: number;
  type?: string;
}

export interface UploadInvoiceResponse {
  success: boolean;
  file: Invoice;
}

export interface DownloadedInvoice {
  uri: string;
  mimeType: string;
  filename: string;
  size?: number;
}

// ========== Единый файловый сервис ==========
export const fileService = {
  // --- Универсальные методы (работают с /files/...) ---
  async uploadFile(
    file: any,
    task_id: number,
    entity_type: string,
    entity_id?: number | null,
    description?: string
  ): Promise<FileInfo> {
    const isConnected = await CacheService.isConnected();
    if (!isConnected) {
      // Офлайн: создаём временный объект и добавляем в очередь
      const tempId = -Date.now();
      const tempFile: FileInfo = {
        id: tempId,
        filename: `temp-${tempId}`,
        originalname: file.name || file.fileName || 'file',
        mimetype: file.type || getMimeType(file.name || ''),
        size: file.size || 0,
        type: 'other',
        entity_type,
        entity_id: entity_id || task_id,
        description: description || undefined,
        created_at: new Date().toISOString(),
        path: '',
      };

      await SyncQueueService.addToQueue({
        method: 'POST',
        url: '/files/upload',
        data: { file, task_id, entity_type, entity_id, description },
        tempId,
      });
      return tempFile;
    }

    // Онлайн: обычная загрузка
    const formData = createFileFormData(file, entity_type, task_id, entity_id, description);
    const response = await api.post<UploadFileResponse>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.file;
  },

  async uploadMultipleFiles(
    files: any[],
    task_id: number,
    entity_type: string,
    entity_id?: number | null,
    descriptions?: string[],
  ): Promise<FileInfo[]> {
    const isConnected = await CacheService.isConnected();
    if (!isConnected) {
      // Офлайн: создаём временные объекты и добавляем в очередь
      const tempFiles: FileInfo[] = [];
      const now = Date.now();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const tempId = -(now + i);
        tempFiles.push({
          id: tempId,
          filename: `temp-${tempId}`,
          originalname: file.name || file.fileName || 'file',
          mimetype: file.type || getMimeType(file.name || ''),
          size: file.size || 0,
          type: 'other',
          entity_type,
          entity_id: entity_id || task_id,
          description: descriptions?.[i] || undefined,
          created_at: new Date().toISOString(),
          path: '',
        });
      }

      await SyncQueueService.addToQueue({
        method: 'POST',
        url: '/files/upload-multiple',
        data: { files, task_id, entity_type, entity_id, descriptions },
        tempId: `batch-${Date.now()}`,
      });
      return tempFiles;
    }

    // Онлайн: обычная загрузка
    const formData = createMultipleFilesFormData(files, entity_type, task_id, entity_id, descriptions);
    const response = await api.post<UploadMultipleFilesResponse>('/files/upload-multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.files;
  },

  async getEntityFiles(entity_type: string, entity_id: number): Promise<FileInfo[]> {
    const response = await api.get<FileInfo[]>(`/files/entity/${entity_type}/${entity_id}`);
    return response.data;
  },

  async getTaskFiles(id: number): Promise<FileInfo[]> {
    const response = await api.get<FileInfo[]>(`/files/task/${id}`);
    return response.data;
  },

  async deleteFile(fileId: number): Promise<void> {
    await api.delete(`/files/${fileId}`);
  },

  getFileUrl(entity_type: string, filename: string): string {
    return `${API_BASE_URL}/files/${entity_type}/${filename}`;
  },

  // --- Специфические методы для накладных (invoice) (без изменений) ---
  async uploadInvoice(file: any): Promise<UploadInvoiceResponse> {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      const formData = new FormData();
      const fileName = file.name || `invoice-${Date.now()}.${file.type === 'application/pdf' ? 'pdf' : 'jpg'}`;
      formData.append('invoice', {
        uri: file.uri,
        name: fileName,
        type: file.type || 'application/pdf',
      } as any);

      const response = await fetch(`${API_BASE_URL}/files/invoices`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка загрузки накладной: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('fileService.uploadInvoice error:', error);
      throw error;
    }
  },

  async addInvoiceToTask(taskId: number, filename: string): Promise<any> {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/invoice`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoice_file_id: filename }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка добавления накладной: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('fileService.addInvoiceToTask error:', error);
      throw error;
    }
  },

  async deleteInvoice(taskId: number): Promise<void> {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/invoice`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка удаления накладной: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('fileService.deleteInvoice error:', error);
      throw error;
    }
  },

  getInvoiceUrl(filename: string): string {
    return `${API_BASE_URL}/files/invoices/${filename}`;
  },
};