import { Comment, CreateCommentData } from '@/types';

import api from './apiClient';




export const commentsAPI = {
  getTaskComments: async (taskId: number): Promise<Comment[]> => {
    try {
      const response = await api.get(`/comments/task/${taskId}`);
      console.log(api)
      return response.data;
    } catch (error: any) {
      const message = error. response?.data?.message || 'Ошибка загрузки комментариев';
      throw new Error(message);
    }
  },   

  addComment: async (data: CreateCommentData): Promise<Comment> => {
    try {
      console.log('Sending comment data:', data);
      const response = await api.post('/comments', data);
      return response.data;
    } catch (error: any) {
      console.log('Error adding comment:', error);
      const message = error.response?.data?.message || 'Ошибка добавления комментария';
      throw new Error(message);
    }
  },


};