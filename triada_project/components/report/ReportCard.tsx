import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Card, Text, useTheme, Chip, IconButton, Menu } from 'react-native-paper';
import { Report } from '@/types/index';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ReportStyles } from '@/styles/report/ReportStyles';

interface ReportCardProps {
  report: Report;
  onDelete: (report: Report) => void;
  deletingId?: number | null;
}

export const ReportCard: React.FC<ReportCardProps> = ({ 
  report, 
  onDelete, 
  deletingId 
}) => {
  const theme = useTheme();
  const styles = ReportStyles(theme);
  const [menuVisible, setMenuVisible] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = () => {
    setMenuVisible(false);
    onDelete(report);
  };

  // Переход к полному отчету
  const goToFullReport = () => {
    router.push({
      pathname: '/(tabs)/(reports)/report-detail',
      params: { report: JSON.stringify(report) }
    });
  };

  return (
    <TouchableOpacity onPress={goToFullReport} activeOpacity={0.7}>
      <Card style={styles.reportCard} mode="elevated">
        <Card.Content>
          {/* Первая строка: только дата и действия (справа) */}
          <View style={styles.topRow}>
            <View style={styles.dateContainer}>
              <MaterialIcons 
                name="event" 
                size={16} 
                color={theme.colors.onSurfaceVariant} 
                style={styles.dateIcon}
              />
              <Text variant="bodySmall" style={styles.dateText}>
                {formatDate(report.created_at)}
              </Text>
            </View>
            
            <Menu   
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  style={styles.menuButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    setMenuVisible(true);
                  }}
                />
              }
            >
              <Menu.Item
                leadingIcon="delete"
                onPress={handleDelete}
                title="Удалить"
                titleStyle={{ color: theme.colors.error }}
              />
            </Menu>
          </View>

          {/* Вторая строка: заголовок задачи */}
          <View style={styles.titleContainer}>
            <MaterialIcons 
              name="description" 
              size={20} 
              color={theme.colors.primary} 
              style={styles.reportIcon}
            />
            <Text variant="titleMedium" style={styles.reportTitle} numberOfLines={2}>
              {report.task_title || 'Отчет без названия'}
            </Text>
          </View>

          {/* Третья строка: краткая информация */}
          <View style={styles.previewInfo}>
            {report.customer && (
              <Text variant="bodySmall" style={styles.previewText}>
                Заказчик: {report.customer}
              </Text>
            )}
          </View>

          {/* Четвертая строка: ссылка на полный отчет */}
          <View style={styles.viewReportLink}>
            <Text variant="labelSmall" style={styles.viewReportText}>
              Просмотреть полный отчет
            </Text>
            <MaterialIcons name="chevron-right" size={18} color={theme.colors.primary} />
          </View>

          {/* Индикатор загрузки при удалении */}
          {deletingId === report.id && (
            <View style={styles.deletingOverlay}>
              <Text style={styles.deletingText}>Удаление...</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};