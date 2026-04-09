import { useState, useCallback } from 'react';
import { Comment, CreateCommentData } from '@/types';
import { commentsAPI } from '@/services/comment';
import { CacheService } from '@/services/cacheService';
import { SyncQueueService } from '@/services/syncQueueService';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants';

export const useComments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTaskComments = useCallback(async (taskId: number) => {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return;

    try {
      setIsLoading(true);
      const data = await commentsAPI.getTaskComments(taskId);
      setComments(data);
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка загрузки комментариев';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addComment = useCallback(async (data: CreateCommentData): Promise<Comment> => {
    const isConnected = await CacheService.isConnected();
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) throw new Error('Не авторизован');

    if (!isConnected) {
      // Офлайн: временный комментарий
      const tempComment: Comment = {
        id: -Date.now(),
        task_id: data.task_id,
        user_id: -1,
        user_name: 'Вы (офлайн)',
        content: data.content,
        comment_type: data.comment_type || 'general',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setComments(prev => [tempComment, ...prev]);

      await SyncQueueService.addToQueue({
        method: 'POST',
        url: '/comments',
        data: data,
        tempId: tempComment.id,
      });
      return tempComment;
    }

    // Онлайн
    try {
      setIsLoading(true);
      const newComment = await commentsAPI.addComment(data);
      setComments(prev => [newComment, ...prev]);
      return newComment;
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка добавления комментария';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshComments = useCallback((taskId: number) => loadTaskComments(taskId), [loadTaskComments]);

  const clearError = useCallback(() => setError(null), []);

  return {
    comments,
    isLoading,
    error,
    loadTaskComments,
    addComment,
    refreshComments,
    clearError,
  };
};