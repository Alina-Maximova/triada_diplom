import React from 'react';
import { View } from 'react-native';
import { Card, Text, IconButton, useTheme, Chip, Menu } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { Task } from '@/types/index';
import { StatusChip } from './StatusChip';
import { TaskListStyles } from '@/styles/task/TaskListStyles';

interface TaskCardProps {
  task: Task & {
    isOverdue?: boolean;
  };
  onEditTask: (task: Task) => void;
  onAddReport: (task: Task) => void;
  onViewReport: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  onTaskPress: (task: Task) => void;
  onViewComments?: (task: Task) => void;
  deletingId: number | null;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEditTask,
  onAddReport,
  onViewReport,
  onDeleteTask,
  onTaskPress,
  onViewComments,
  deletingId,
}) => {
  const theme = useTheme();
  const styles = TaskListStyles(theme);
  const [menuVisible, setMenuVisible] = React.useState(false);

  const handleDelete = () => {
    onDeleteTask(task.id);
    setMenuVisible(false);
  };

  const handleEdit = () => {
    onEditTask(task);
    setMenuVisible(false);
  };

  const handleAddReport = () => {
    onAddReport(task);
    setMenuVisible(false);
  };

  const handleViewReport = () => {
    onViewReport(task);
    setMenuVisible(false);
  };

  const handleViewComments = () => {
    if (onViewComments) {
      onViewComments(task);
    }
    setMenuVisible(false);
  };

  const handlePress = () => {
    onTaskPress(task);
  };

  const openMenu = () => {
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  return (
    <Card style={styles.taskCard} mode="elevated" onPress={handlePress}>
      <Card.Content>
        {/* Первая строка: статусы и кнопка меню */}
        <View style={styles.taskHeader}>
          <View style={styles.statusContainer}>
            <StatusChip status={task.status} />
            {task.isOverdue && (
              <Chip
                mode="outlined"
                textStyle={[
                  styles.chipText,
                  { color: theme.colors.error }
                ]}
                style={[styles.overdueChip, { borderColor: theme.colors.error }]}
                icon="alert"
                contentStyle={styles.chipContent}
              >
                Просрочка
              </Chip>
            )}
            {/* Чип для накладной */}
            {task.invoice_file_id && (
              <Chip
                mode="outlined"
                textStyle={styles.chipText}
                style={[styles.chipContent, { borderColor: theme.colors.primary }]}
                icon="file-document"
                contentStyle={styles.chipContent}
              >
                Накладная
              </Chip>
            )}
          </View>

          <View style={styles.taskActions}>
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={openMenu}
                />
              }
            >
              {/* Пункт меню для просмотра комментариев */}
              <Menu.Item
                leadingIcon="comment-text"
                onPress={handleViewComments}
                title="Комментарии"
              />

              {/* Пункт меню для создания отчета - только для выполненных задач */}
              {task.status === 'completed' && (
                <Menu.Item
                  leadingIcon="file-document"
                  onPress={handleAddReport}
                  title="Создать отчет"
                />
              )}

              {/* Пункт меню для просмотра отчета - для задач со статусом report_added или accepted_by_customer */}
              {(task.status === 'report_added' || task.status === 'accepted_by_customer') && (
                <Menu.Item
                  leadingIcon="file-eye"
                  onPress={handleViewReport}
                  title="Просмотреть отчет"
                />
              )}

              {/* Пункт меню для редактирования - только для статусов: новый, в процессе, на паузе */}
              {(task.status === 'new' || task.status === 'in_progress' || task.status === 'paused') && (
                <Menu.Item
                  leadingIcon="pencil"
                  onPress={handleEdit}
                  title="Редактировать"
                />
              )}

              {/* Пункт меню для удаления */}
              <Menu.Item
                leadingIcon="delete"
                onPress={handleDelete}
                title="Удалить"
                titleStyle={{ color: theme.colors.error }}
                disabled={deletingId === task.id}
              />
            </Menu>
          </View>
        </View>

        {/* Заголовок задачи */}
        <Text variant="titleMedium" style={styles.taskTitle}>
          {task.title}
        </Text>

        {/* Отображение заказчика */}
        {task.customer && (
          <View style={styles.customerContainer}>
            <MaterialIcons name="person" size={16} color={theme.colors.primary} />
            <Text variant="bodySmall" style={styles.customerText}>
              {task.customer}
            </Text>
          </View>
        )}

        {/* Телефон */}
        {task.phone && (
          <View style={styles.phoneContainer}>
            <MaterialIcons name="phone" size={16} color={theme.colors.primary} />
            <Text variant="bodySmall" style={styles.phoneText}>
              {task.phone}
            </Text>
          </View>
        )}

        {/* Адрес */}
        {task.address && (
          <View style={styles.addressContainer}>
            <MaterialIcons name="location-on" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={styles.addressText}>
              {task.address}
            </Text>
          </View>
        )}
        
        {/* Примечание к адресу */}
        {task.addressNote && (
          <View style={styles.addressContainer}>
            <MaterialIcons name="note" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={styles.addressText}>
              {task.addressNote}
            </Text>
          </View>
        )}

        <View style={styles.datesContainer}>
          {/* Дата начала */}
          {task.start_date && (
            <View style={styles.dateItem}>
              <MaterialIcons name="play-arrow" size={14} color={theme.colors.primary} />
              <Text variant="bodySmall" style={styles.dateText}>
                Начало: {new Date(task.start_date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          )}

          {/* Дата окончания */}
          {task.due_date && (
            <View style={styles.dateItem}>
              <MaterialIcons name="flag" size={14} color={theme.colors.error} />
              <Text variant="bodySmall" style={styles.dateText}>
                Окончание: {new Date(task.due_date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};