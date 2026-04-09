import React from 'react';
import {
  Dialog,
  Text,
  Button,
  Portal,
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';

interface DeleteConfirmationDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  itemName: string;
  itemType: string;
}

export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  visible,
  onDismiss,
  onConfirm,
  isLoading,
  itemName,
  itemType,
}) => {
  const theme = useTheme();

  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Icon icon="delete-alert" size={40} color={theme.colors.error} />
      <Dialog.Title style={{ textAlign: 'center' }}>
        Удаление {itemType}
      </Dialog.Title>
      <Dialog.Content>
        <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 8 }}>
          Вы уверены, что хотите удалить {itemType}?
        </Text>
        <Text 
          variant="bodyLarge" 
          style={{ 
            textAlign: 'center', 
            fontWeight: 'bold',
            color: theme.colors.primary 
          }}
        >
          "{itemName}"
        </Text>
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
          onPress={onDismiss}
          style={{ minWidth: 120 }}
          disabled={isLoading}
        >
          Отмена
        </Button>
        <Button 
          mode="contained" 
          onPress={onConfirm}
          style={{ minWidth: 120 }}
          buttonColor={theme.colors.error}
          textColor="#FFFFFF"
          loading={isLoading}
          disabled={isLoading}
        >
          Удалить
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};