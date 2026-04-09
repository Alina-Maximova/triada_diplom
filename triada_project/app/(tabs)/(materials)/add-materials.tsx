import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import {
  Appbar,
  Text,
  Button,
  TextInput,
  Card,
  useTheme,
  List,
  IconButton,
  Snackbar,
  Portal,
  Dialog,
  ActivityIndicator,
  Menu,
  Chip,
  Surface,
} from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Task, TaskMaterial } from '@/types/index';
import { useMaterials } from '@/hooks/useMaterials';
import { MaterialAddStyles } from '@/styles/material/MaterialAddStyles';
import { AppTheme } from '@/constants/theme';

// Предопределенные единицы измерения
const UNITS = ['шт', 'кг', 'г', 'л', 'м', 'м²', 'м³', 'упак', 'компл', 'рулон', 'лист'];

export default function AddMaterialsPage() {
  const theme = useTheme() as AppTheme;
  const styles = MaterialAddStyles(theme);
  const { task: taskParam } = useLocalSearchParams();
  const task = taskParam ? JSON.parse(taskParam as string) as Task : null;
  
  const { 
    taskMaterials, 
    availableMaterials, 
    isLoading, 
    error, 
    loadTaskMaterials, 
    loadAvailableMaterials,
    createMaterial,
    addMaterialToTask, 
    removeMaterialFromTask,
    updateMaterialQuantity 
  } = useMaterials();
  
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [customMaterialName, setCustomMaterialName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('шт');
  const [note, setNote] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMaterialMenu, setShowMaterialMenu] = useState(false);
  const [quantityEditDialogVisible, setQuantityEditDialogVisible] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<TaskMaterial | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [materialsLoaded, setMaterialsLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (task) {
      loadInitialData();
    }
  }, []);

  const loadInitialData = async () => {
    if (!task) return;
    
    try {
      await loadTaskMaterials(task.id);
      await loadAvailableMaterials();
      setMaterialsLoaded(true);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setSnackbarMessage('Ошибка загрузки данных');
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, [task]);

  const handleAddMaterial = async () => {
    if (!task) return;

    // Валидация
    if (!quantity.trim() || parseFloat(quantity) <= 0) {
      setSnackbarMessage('Введите корректное количество');
      return;
    }

    if (isAddingCustom) {
      if (!customMaterialName.trim()) {
        setSnackbarMessage('Введите название материала');
        return;
      }
      if (!unit) {
        setSnackbarMessage('Выберите единицу измерения');
        return;
      }
    } else {
      if (!selectedMaterialId) {
        setSnackbarMessage('Выберите материал из списка');
        return;
      }
    }

    try {
      const materialData: any = {
        task_id: task.id,
        quantity: parseFloat(quantity),
        note: note.trim() || undefined,
      };

      if (isAddingCustom) {
        materialData.custom_name = customMaterialName.trim();
        materialData.custom_unit = unit;
      } else {
        materialData.material_id = selectedMaterialId;
      }

      await addMaterialToTask(task.id, materialData);
      
      // Сбрасываем форму
      setSelectedMaterialId(null);
      setCustomMaterialName('');
      setQuantity('');
      setUnit('шт');
      setNote('');
      setIsAddingCustom(false);
      setSearchQuery('');
      
      setSnackbarMessage('Материал добавлен к задаче');
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Ошибка добавления материала');
    }
  };

  const handleCreateNewMaterial = async () => {
    if (!customMaterialName.trim() || !unit) {
      setSnackbarMessage('Заполните название и выберите единицу измерения');
      return;
    }

    try {
      const newMaterial = await createMaterial({
        name: customMaterialName.trim(),
        unit: unit,
      });
      
      // Переключаемся на выбор из списка и выбираем новый материал
      setIsAddingCustom(false);
      setSelectedMaterialId(newMaterial.id);
      setCustomMaterialName('');
      
      setSnackbarMessage('Материал добавлен в базу');
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Ошибка создания материала');
    }
  };

  const handleDeleteMaterial = async () => {
    if (materialToDelete === null) return;

    try {
      
      await removeMaterialFromTask( materialToDelete);
      setSnackbarMessage('Материал удален из задачи');
      setDeleteDialogVisible(false);
      setMaterialToDelete(null);
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Ошибка удаления материала');
    }
  };

  const handleUpdateQuantity = async () => {
    if (!materialToEdit || !editQuantity || parseFloat(editQuantity) <= 0) return;

    try {
      await updateMaterialQuantity(materialToEdit.id, parseFloat(editQuantity));
      setSnackbarMessage('Количество обновлено');
      setQuantityEditDialogVisible(false);
      setMaterialToEdit(null);
      setEditQuantity('');
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Ошибка обновления количества');
    }
  };

  const showDeleteDialog = (materialId: number) => {
    setMaterialToDelete(materialId);
    setDeleteDialogVisible(true);
  };

  const showEditQuantityDialog = (material: TaskMaterial) => {
    setMaterialToEdit(material);
    setEditQuantity(material.quantity.toString());
    setQuantityEditDialogVisible(true);
  };

  // Фильтрация материалов по поисковому запросу
  const filteredMaterials = availableMaterials.filter(material =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (material.description && material.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Получаем выбранный материал
  const selectedMaterial = selectedMaterialId 
    ? availableMaterials.find(m => m.id === selectedMaterialId)
    : null;

  const getMaterialName = (material: TaskMaterial) => {
    return material.custom_name || material.material_name || 'Неизвестный материал';
  };

  const getMaterialUnit = (material: TaskMaterial) => {
    return material.custom_unit || material.material_unit || 'ед.';
  };

  // Функция для отображения состояния загрузки материалов
  const renderMaterialsSection = () => {
    if (isLoading && !materialsLoaded) {
      return (
        <Card style={styles.materialsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Материалы на объекте
            </Text>
            <ActivityIndicator style={styles.loader} />
          </Card.Content>
        </Card>
      );
    }

    if (error) {
      return (
        <Card style={styles.materialsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Материалы на объекте
            </Text>
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={24} color={theme.colors.error} />
              <Text variant="bodyMedium" style={styles.errorText}>
                Ошибка загрузки материалов: {error}
              </Text>
              <Button
                mode="outlined"
                onPress={() => task && loadInitialData()}
                style={styles.retryButton}
                compact
              >
                Повторить
              </Button>
            </View>
          </Card.Content>
        </Card>
      );
    }

    if (!taskMaterials || taskMaterials.length === 0) {
      return (
        <Card style={styles.materialsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Материалы на объекте
            </Text>
            <View style={styles.noMaterialsContainer}>
              <MaterialIcons 
                name="inventory-2" 
                size={48} 
                color={theme.colors.onSurfaceVariant} 
              />
              <Text variant="titleMedium" style={styles.noMaterialsTitle}>
                Пока нет материалов на объекте
              </Text>
              <Text variant="bodyMedium" style={styles.noMaterialsText}>
                Добавьте материалы используя форму выше
              </Text>
            </View>
          </Card.Content>
        </Card>
      );
    }

    return (
      <Card style={styles.materialsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Материалы на объекте ({taskMaterials.length})
          </Text>
          {taskMaterials.map((material) => (
            <Surface key={material.id} style={styles.taskMaterialItem} elevation={1}>
              <List.Item
                title={getMaterialName(material)}
                description={
                  <>
                    <Text variant="bodySmall">
                      {material.quantity} {getMaterialUnit(material)}
                    </Text>
                    {material.note && (
                      <Text variant="bodySmall" style={styles.materialNote}>
                        {material.note}
                      </Text>
                    )}
                    {material.custom_name && (
                      <Text variant="bodySmall" style={styles.customMaterialTag}>
                        Кастомный материал
                      </Text>
                    )}
                  </>
                }
                left={props => (
                  <List.Icon {...props} icon="package-variant" />
                )}
                right={props => (
                  <View style={styles.materialActions}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => showEditQuantityDialog(material)}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => showDeleteDialog(material.id)}
                      iconColor={theme.colors.error}
                    />
                  </View>
                )}
              />
            </Surface>
          ))}
        </Card.Content>
      </Card>
    );
  };

  if (!task) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Ошибка" />
        </Appbar.Header>
        <View style={styles.center}>
          <Text variant="bodyLarge">Задача не найдена</Text>
        </View>
      </View>
    );
  }

  // Проверяем что задача в работе
  if (task.status !== 'in_progress') {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Добавление материалов" />
        </Appbar.Header>
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={48} color={theme.colors.error} />
          <Text variant="titleMedium" style={styles.errorText}>
            Материалы можно добавлять только к задачам в работе
          </Text>
          <Text variant="bodyMedium" style={styles.errorSubtext}>
            Текущий статус задачи: {task.status === 'new' ? 'Новая' : 
                                   task.status === 'completed' ? 'Выполнена' : 
                                   task.status === 'paused' ? 'На паузе' : 'Неизвестно'}
          </Text>
          <Button
            mode="contained"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            Вернуться к задаче
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Материалы" subtitle={task.title} />
        <Appbar.Action 
          icon="refresh" 
          onPress={onRefresh}
          disabled={refreshing}
        />
      </Appbar.Header>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Информация о задаче */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Задача
            </Text>
            <Text variant="bodyMedium">{task.title}</Text>
            <Text variant="bodySmall" style={styles.taskInfo}>
              Заказчик: {task.customer}
            </Text>
          </Card.Content>
        </Card>

        {/* Форма добавления материалов */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Добавить материал
            </Text>

            {/* Переключатель режима */}
            <View style={styles.modeToggle}>
              <Button
                mode={!isAddingCustom ? "contained" : "outlined"}
                onPress={() => setIsAddingCustom(false)}
                style={styles.modeButton}
              >
                Выбрать из базы
              </Button>
              <Button
                mode={isAddingCustom ? "contained" : "outlined"}
                onPress={() => setIsAddingCustom(true)}
                style={styles.modeButton}
              >
                Кастомный материал
              </Button>
            </View>

            {!isAddingCustom ? (
              // Выбор материала из базы с выпадающим списком
              <>
                <Menu
                  visible={showMaterialMenu}
                  onDismiss={() => setShowMaterialMenu(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setShowMaterialMenu(true)}
                      style={styles.materialSelectButton}
                      contentStyle={styles.materialSelectContent}
                    >
                      {selectedMaterial ? selectedMaterial.name : 'Выберите материал'}
                    </Button>
                  }
                  style={styles.materialMenu}
                >
                  <ScrollView style={styles.materialMenuScroll}>
                    {/* Поиск в меню */}
                    <View style={styles.menuSearchContainer}>
                      <TextInput
                        placeholder="Поиск материала..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        mode="outlined"
                        style={styles.menuSearchInput}
                        left={<TextInput.Icon icon="magnify" />}
                      />
                    </View>
                    
                    {filteredMaterials.length > 0 ? (
                      filteredMaterials.map((material) => (
                        <Menu.Item
                          key={material.id}
                          title={material.name}
                          description={material.description}
                          trailing={() => (
                            <Chip style={styles.menuChip} textStyle={styles.menuChipText}>
                              {material.unit}
                            </Chip>
                          )}
                          onPress={() => {
                            setSelectedMaterialId(material.id);
                            setShowMaterialMenu(false);
                            setSearchQuery('');
                          }}
                          style={[
                            styles.menuItem,
                            selectedMaterialId === material.id && styles.selectedMenuItem
                          ]}
                        />
                      ))
                    ) : (
                      <View style={styles.menuNoResults}>
                        <MaterialIcons 
                          name="search-off" 
                          size={24} 
                          color={theme.colors.onSurfaceVariant} 
                        />
                        <Text variant="bodyMedium" style={styles.menuNoResultsText}>
                          Материалы не найдены
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </Menu>

                {selectedMaterial && (
                  <Surface style={styles.selectedMaterialInfo} elevation={1}>
                    <View style={styles.selectedMaterialContent}>
                      <View>
                        <Text variant="bodyLarge" style={styles.selectedMaterialName}>
                          {selectedMaterial.name}
                        </Text>
                        {selectedMaterial.description && (
                          <Text variant="bodySmall" style={styles.selectedMaterialDesc}>
                            {selectedMaterial.description}
                          </Text>
                        )}
                      </View>
                      <Chip style={styles.selectedMaterialChip}>
                        {selectedMaterial.unit}
                      </Chip>
                    </View>
                    <Button
                      mode="text"
                      onPress={() => setSelectedMaterialId(null)}
                      style={styles.clearSelectionButton}
                      icon="close"
                      compact
                    >
                      Очистить
                    </Button>
                  </Surface>
                )}
              </>
            ) : (
              // Ввод кастомного материала
              <>
                <TextInput
                  label="Название материала"
                  value={customMaterialName}
                  onChangeText={setCustomMaterialName}
                  style={styles.input}
                  mode="outlined"
                />

                <View style={styles.unitSection}>
                  <Text variant="labelMedium" style={styles.label}>
                    Единица измерения:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.unitChips}>
                      {UNITS.map((unitItem) => (
                        <Chip
                          key={unitItem}
                          selected={unit === unitItem}
                          onPress={() => setUnit(unitItem)}
                          style={styles.unitChip}
                          textStyle={styles.unitChipText}
                        >
                          {unitItem}
                        </Chip>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <Button
                  mode="outlined"
                  onPress={handleCreateNewMaterial}
                  style={styles.addToDbButton}
                  disabled={!customMaterialName.trim() || !unit}
                >
                  Добавить в базу материалов
                </Button>
              </>
            )}

            {/* Общие поля */}
            <View style={styles.quantityContainer}>
              <TextInput
                label="Количество"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                style={styles.quantityInput}
                mode="outlined"
                left={<TextInput.Icon icon="scale" />}
              />
              {selectedMaterial && (
                <Text variant="bodySmall" style={styles.materialUnitHint}>
                  Единица: {selectedMaterial.unit}
                </Text>
              )}
            </View>

            <TextInput
              label="Примечание (необязательно)"
              value={note}
              onChangeText={setNote}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={2}
            />

            <Button
              mode="contained"
              onPress={handleAddMaterial}
              style={styles.addButton}
              disabled={isLoading || (!isAddingCustom && !selectedMaterialId) || 
                       (isAddingCustom && (!customMaterialName.trim() || !unit)) || 
                       !quantity || parseFloat(quantity) <= 0}
              loading={isLoading}
            >
              Добавить к задаче
            </Button>
          </Card.Content>
        </Card>

        {/* Секция с добавленными материалами */}
        {renderMaterialsSection()}

        <View style={styles.spacer} />
      </ScrollView>

      {/* Диалог удаления */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Удаление материала</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Вы уверены, что хотите удалить этот материал из задачи?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Отмена</Button>
            <Button onPress={handleDeleteMaterial} textColor={theme.colors.error}>
              Удалить
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Диалог редактирования количества */}
      <Portal>
        <Dialog 
          visible={quantityEditDialogVisible} 
          onDismiss={() => setQuantityEditDialogVisible(false)}
        >
          <Dialog.Title>Изменение количества</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.editMaterialName}>
              {materialToEdit ? getMaterialName(materialToEdit) : ''}
            </Text>
            <TextInput
              label="Количество"
              value={editQuantity}
              onChangeText={setEditQuantity}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setQuantityEditDialogVisible(false)}>Отмена</Button>
            <Button 
              onPress={handleUpdateQuantity}
              disabled={!editQuantity || parseFloat(editQuantity) <= 0}
            >
              Сохранить
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