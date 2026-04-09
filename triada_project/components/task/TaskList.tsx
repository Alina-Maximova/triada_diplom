import React, { useEffect } from 'react';
import { View, FlatList } from 'react-native';
import {
  Text,
  FAB,
  Snackbar,
  ActivityIndicator,
  useTheme,
  Portal,
  Dialog,
  Button,
} from 'react-native-paper';
import { Task } from '@/types';
import { TaskCard } from './TaskCard';
import { TaskListStyles } from '@/styles/task/TaskListStyles';

interface ExtendedTaskListProps {
  tasks: Task[];
  onDeleteTask: (taskId: number) => void;
  onUpdateTaskStatus: (taskId: number, newStatus: string, pauseReason?: string) => void;
  onEditTask: (task: Task) => void;
  onAddTask: () => void;
  onCreateReport: (task: Task) => void;
  onViewReport?: (task: Task) => void;
  onViewComments?: (task: Task) => void;
  onViewTaskDetails?: (task: Task) => void;
  isLoading?: boolean;
}

export const TaskList: React.FC<ExtendedTaskListProps> = ({
  tasks,
  onDeleteTask,
  onUpdateTaskStatus,
  onEditTask,
  onAddTask,
  onCreateReport,
  onViewReport,
  onViewComments,
  onViewTaskDetails,
  isLoading,
}) => {
  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = React.useState(false);
  const [taskToDelete, setTaskToDelete] = React.useState<Task | null>(null);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  
  const theme = useTheme();
  const styles = TaskListStyles(theme);

  const showDeleteDialog = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogVisible(true);
  };

  const hideDeleteDialog = () => {
    setDeleteDialogVisible(false);
    setTaskToDelete(null);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    
    setDeletingId(taskToDelete.id);
    try {
      await onDeleteTask(taskToDelete.id);
      setSnackbarMessage('Задача удалена');
      setSnackbarVisible(true);
      hideDeleteDialog();
    } catch (error) {
      console.error('Error deleting task:', error);
      setSnackbarMessage('Ошибка при удалении задачи');
      setSnackbarVisible(true);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      showDeleteDialog(task);
    }
  };

  const handleAddTask = async () => {
    onAddTask();
  };

  const handleAddReport = async (task: Task) => {
    onCreateReport(task);
  };

  const handleViewReport = async (task: Task) => {
    if (onViewReport) {
      onViewReport(task);
    }
  };

  const handleEditTask = async (task: Task) => {
    await onEditTask(task);
  };

  const handleViewComments = async (task: Task) => {
    if (onViewComments) {
      onViewComments(task);
    }
  };

  const handleViewTaskDetails = async (task: Task) => {
    if (onViewTaskDetails) {
      onViewTaskDetails(task);
    }
  };

  const renderTask = ({ item }: { item: Task }) => (
    <TaskCard
      task={item}
      onEditTask={handleEditTask}
      onAddReport={handleAddReport}
      onViewReport={handleViewReport}
      onDeleteTask={handleDelete}
      onTaskPress={handleViewTaskDetails}
      onViewComments={handleViewComments}
      deletingId={deletingId}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Загрузка задач...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {tasks.length === 0 ? (
        <View style={styles.center}>
          <Text variant="titleLarge" style={styles.emptyText}>
            Нет задач
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            Нажмите + чтобы добавить первую задачу
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddTask}
        color={theme.colors.background}
      />

      {/* Диалоговое окно подтверждения удаления */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={hideDeleteDialog}>
          <Dialog.Icon icon="delete-alert" size={40} color={theme.colors.error} />
          <Dialog.Title style={{ textAlign: 'center' }}>
            Удаление задачи
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 8 }}>
              Вы уверены, что хотите удалить задачу?
            </Text>
            {taskToDelete && (
              <Text 
                variant="bodyLarge" 
                style={{ 
                  textAlign: 'center', 
                  fontWeight: 'bold',
                  color: theme.colors.primary 
                }}
              >
                "{taskToDelete.title}"
              </Text>
            )}
            <Text 
              variant="bodySmall" 
              style={{ 
                textAlign: 'center', 
                marginTop: 8,
                color: theme.colors.error 
              }}
            >
              Это действие нельзя отменить
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'space-around' }}>
            <Button 
              mode="outlined" 
              onPress={hideDeleteDialog}
              style={{ minWidth: 120 }}
            >
              Отмена
            </Button>
            <Button 
              mode="contained" 
              onPress={confirmDelete}
              style={{ minWidth: 120 }}
              buttonColor={theme.colors.error}
              textColor="#FFFFFF"
              loading={deletingId === taskToDelete?.id}
              disabled={deletingId === taskToDelete?.id}
            >
              Удалить
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};