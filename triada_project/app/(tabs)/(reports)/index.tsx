import React, { useState, useMemo } from 'react';
import { View, FlatList } from 'react-native';
import { Appbar, Searchbar, Snackbar, Button, useTheme, Text, ActivityIndicator, Dialog, Portal } from 'react-native-paper';
import { useReports } from '@/hooks/useReports';
import { useAuth } from '@/hooks/useAuth';
import { Report } from '@/types/index';
import { ReportStyles } from '@/styles/report/ReportStyles';
import { useRouter, useFocusEffect } from 'expo-router';
import { NotificationService } from '@/services/notifications';
import { ReportCard } from '@/components/report/ReportCard';
import { useTasks } from '@/hooks/useTasks';

export default function ReportsScreen() {
  const { user, logout } = useAuth();
  const { 
    reports, 
    isLoading, 
    loadReports, 
    deleteReport 
  } = useReports();
  const { 
    refreshTasks
  } = useTasks();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);

  const theme = useTheme();
  const styles = ReportStyles(theme);

  // Обновляем данные при фокусе на экране
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 ReportsScreen: Обновление данных при фокусе');
      loadReports();
    }, [])
  );

  const allReportsSorted = useMemo(() => {
    const filtered = reports.filter(report =>
      report.task_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  }, [reports, searchQuery]);

  const showDeleteDialog = (report: Report) => {
    setReportToDelete(report);
    setDeleteDialogVisible(true);
  };

  const hideDeleteDialog = () => {
    setDeleteDialogVisible(false);
    setReportToDelete(null);
  };

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;
    
    try {
      setDeletingReportId(reportToDelete.id);
      await deleteReport(reportToDelete.id);
      setSnackbarMessage('Отчет удален');
      hideDeleteDialog();
      
      // Обновляем задачи после удаления отчета
      await refreshTasks();
      
    } catch (error: any) {
      setSnackbarMessage('Ошибка при удалении отчета: ' + error.message);
    } finally {
      setDeletingReportId(null);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      console.log('🧹 Очистка всех уведомлений перед выходом...');
      await NotificationService.cancelAllReminders();

      await logout();
      router.replace('/(auth)');

    } catch (error: any) {
      console.log('Logout error:', error);
      setSnackbarMessage('Ошибка при выходе: ' + error.message);
      setIsLoggingOut(false);
    }
  };

  const renderReportItem = ({ item }: { item: Report }) => (
    <ReportCard
      report={item}
      onDelete={showDeleteDialog}
      deletingId={deletingReportId}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.center}>
      <Text style={styles.emptyText}>
        {searchQuery 
          ? 'Отчеты по вашему запросу не найдены' 
          : 'Нет отчетов'
        }
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery
          ? 'Попробуйте изменить поисковый запрос'
          : 'Отчеты появятся здесь после выполнения задач'
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content
          title={`Все отчеты (${allReportsSorted.length})`}
        />
        <Appbar.Action
          icon="logout"
          onPress={handleLogout}
          disabled={isLoggingOut}
        />
      </Appbar.Header>

      <Searchbar
        placeholder="Поиск отчета по задаче, заказчику или описанию..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.search}
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>
            Загрузка отчетов...
          </Text>
        </View>
      ) : allReportsSorted.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={allReportsSorted}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={loadReports}
        />
      )}

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={hideDeleteDialog}>
          <Dialog.Icon icon="delete-alert" size={40} color={theme.colors.error} />
          <Dialog.Title style={{ textAlign: 'center' }}>
            Удаление отчета
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 8 }}>
              Вы уверены, что хотите удалить отчет по задаче?
            </Text>
            {reportToDelete && (
              <Text 
                variant="bodyLarge" 
                style={{ 
                  textAlign: 'center', 
                  fontWeight: 'bold',
                  color: theme.colors.primary 
                }}
              >
                "{reportToDelete.task_title}"
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
              onPress={handleDeleteReport}
              style={{ minWidth: 120 }}
              buttonColor={theme.colors.error}
              textColor="#FFFFFF"
              loading={deletingReportId === reportToDelete?.id}
              disabled={deletingReportId === reportToDelete?.id}
            >
              Удалить
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage('')}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarMessage(''),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}