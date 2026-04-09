import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Tasks', 'Users', 'Reports', 'Invoices', 'Materials', 'TaskMaterials', 'Comments', 'Files'],
  endpoints: (builder) => ({
    // ============= АУТЕНТИФИКАЦИЯ =============
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials
      })
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData
      })
    }),
    addUser: builder.mutation({
      query: (userData) => ({
        url: '/auth/createUser',
        method: 'POST',
        body: userData
      })
    }),

    getUsers: builder.query({
      query: () => '/auth',
      providesTags: ['Users']
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/auth/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users']
    }),

    // ============= ЗАДАЧИ =============
    getTasks: builder.query({
      query: () => '/tasks',
      providesTags: ['Tasks']
    }),

    getTaskById: builder.query({
      query: (id) => `/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: 'Tasks', id }]
    }),

    addTasks: builder.mutation({
      query: (task) => ({
        url: '/tasks',
        method: 'POST',
        body: task
      }),
      invalidatesTags: ['Tasks']
    }),

    updateTask: builder.mutation({
      query: ({ id, data }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Tasks']
    }),

    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tasks']
    }),

    updateTaskStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/tasks/status/${id}`,
        method: 'put',
        body: { status }
      }),
      invalidatesTags: ['Tasks']
    }),

    // ============= МАТЕРИАЛЫ =============
    getMaterials: builder.query({
      query: () => '/materials/available',
      providesTags: ['Materials']
    }),
    addMaterials: builder.mutation({
      query: (material) => ({
        url: '/materials/available',
        method: 'POST',
        body: material
      }),
      invalidatesTags: ['Materials']
    }),
    deleteMaterial: builder.mutation({
      query: (id) => ({
        url: `/materials/available/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Materials']
    }),
    updateMaterial: builder.mutation({
      query: ({ id, data }) => ({
        url: `/materials/available/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Materials']
    }),

    // ============= МАТЕРИАЛЫ ЗАДАЧ =============
    getTaskMaterials: builder.query({
      query: (taskId) => `/materials/${taskId}`,
      providesTags: (result, error, taskId) => [{ type: 'TaskMaterials', id: taskId }],
      transformResponse: (response) => {
        if (response && response.materials) return response.materials;
        return response || [];
      }
    }),
    addMaterialToTask: builder.mutation({
      query: ({ taskId, ...data }) => ({
        url: `/materials/${taskId}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'TaskMaterials', id: taskId },
        'Tasks'
      ],
    }),
    updateTaskMaterialQuantity: builder.mutation({
      query: ({ taskMaterialId, quantity }) => ({
        url: `/materials/quantity/${taskMaterialId}`,
        method: 'put',
        body: { quantity },
      }),
      invalidatesTags: (result, error, { taskMaterialId, taskId }) => [
        { type: 'TaskMaterials', id: taskId },
      ],
    }),
    removeMaterialFromTask: builder.mutation({
      query: (taskMaterialId) => ({
        url: `/materials/${taskMaterialId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { taskMaterialId, taskId }) => [
        { type: 'TaskMaterials', id: taskId },
        'Tasks',
      ],
    }),

    // ============= КОММЕНТАРИИ =============
    getTaskComments: builder.query({
      query: (taskId) => `/comments/task/${taskId}`,
      providesTags: (result, error, taskId) => [{ type: 'Comments', id: taskId }],
    }),
    addComment: builder.mutation({
      query: (data) => ({
        url: '/comments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { task_id }) => [{ type: 'Comments', id: task_id }],
    }),
    deleteComment: builder.mutation({
      query: (id) => ({
        url: `/comments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Comments' }],
    }),

    // ============= ФАЙЛЫ (новая единая система) =============
    // Загрузка одного файла
    uploadFile: builder.mutation({
      query: (formData) => ({
        url: '/files/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Files'],
    }),
    // Загрузка нескольких файлов
    uploadMultipleFiles: builder.mutation({
      query: (formData) => ({
        url: '/files/upload-multiple',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Files'],
    }),
    // Получить все файлы сущности (например, все файлы задачи)
    getEntityFiles: builder.query({
      query: ({ entity_type, entity_id }) => `/files/entity/${entity_type}/${entity_id}`,
      providesTags: (result, error, { entity_type, entity_id }) =>
        [{ type: 'Files', id: `${entity_type}-${entity_id}` }],
    }),
    getTaskFiles: builder.query({
      query: ({ task_id }) => `/files/task/${task_id}`,
      providesTags: (result, error, { entity_type, entity_id }) =>
        [{ type: 'Files', id: `${entity_type}-${entity_id}` }],
    }),
    // Получить информацию о файле по ID
    getFileInfo: builder.query({
      query: (id) => `/files/info/${id}`,
    }),
    // Обновить файл (например, привязать к сущности или изменить описание)
    updateFile: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/files/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Files'],
    }),
    // Удалить файл
    deleteFile: builder.mutation({
      query: (id) => ({
        url: `/files/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Files'],
    }),
    downloadFile: builder.mutation({
      query: ({ entity_type, filename }) => ({
        url: `/files/download/${entity_type}/${filename}`,
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
    }),

    downloadMaterials: builder.mutation({
      query: ({ taskId }) => ({
        url: `/materials/task/${taskId}/export`,
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
    }),
    downloadTaskArchive: builder.mutation({
      query: (taskId) => ({
        url: `/tasks/${taskId}/archive`,
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
    }),



    // ============= ОТЧЕТЫ =============
    getReports: builder.query({
      query: () => '/reports',
      providesTags: ['Reports']
    }),
    downloadReport: builder.mutation({
      query: (id) => ({
        url: `/reports/${id}/download`,
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
      invalidatesTags: ['Reports']
    }),
    deleteReport: builder.mutation({
      query: (id) => ({
        url: `/reports/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reports']
    }),
  })
});

export const {
  // Auth
  useLoginMutation,
  useRegisterMutation,
  useAddUserMutation,
  useGetUsersQuery,
  useDeleteUserMutation,

  // Tasks
  useAddTasksMutation,
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useUpdateTaskStatusMutation,

  // Materials
  useGetMaterialsQuery,
  useAddMaterialsMutation,
  useDeleteMaterialMutation,
  useUpdateMaterialMutation,

  // TaskMaterials
  useGetTaskMaterialsQuery,
  useAddMaterialToTaskMutation,
  useUpdateTaskMaterialQuantityMutation,
  useRemoveMaterialFromTaskMutation,

  // Comments
  useGetTaskCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,

  // Files
  useUploadFileMutation,
  useUploadMultipleFilesMutation,
  useGetEntityFilesQuery,
  useGetFileInfoQuery,
  useUpdateFileMutation,
  useDeleteFileMutation,
  useGetTaskFilesQuery,
  useDownloadFileMutation,
  useDownloadMaterialsMutation,
  useDownloadTaskArchiveMutation,
  // Reports
  useGetReportsQuery,
  useDownloadReportMutation,
  useDeleteReportMutation,
} = apiSlice;