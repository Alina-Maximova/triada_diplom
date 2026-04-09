// components/task/StatusChip.tsx
import { AppTheme } from '@/constants/theme';
import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';

interface StatusChipProps {
  status: string;
}

// Функция для расчета адаптивных размеров
const getResponsiveStyles = (screenWidth: number) => {
  // Базовые размеры для reference ширины 375px (iPhone SE)
  const baseWidth = 375;
  const scale = screenWidth / baseWidth;

  return {
    chipHeight: Math.max(28, Math.min(40, 32 * scale)), // Минимум 28, максимум 40
    fontSize: Math.max(10, Math.min(14, 12 * scale)),   // Минимум 10, максимум 14
    lineHeight: Math.max(14, Math.min(18, 16 * scale)), // Минимум 14, максимум 18
  };
};

export const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const theme = useTheme() as AppTheme;
  const { width: screenWidth } = useWindowDimensions();

  const responsiveStyles = getResponsiveStyles(screenWidth);

  const getStatusConfig = (stat: string) => {
    switch (stat) {
      case 'completed':
        return {
          label: 'Выполнено',
          color: theme.colors.status.completed,
          icon: 'check-circle',
          backgroundColor: theme.colors.status.completedContainer
        };
      case 'in_progress':
        return {
          label: 'В работе',
          color: theme.colors.status.inProgress,
          icon: 'progress-clock',
          backgroundColor: theme.colors.status.inProgressContainer
        };

      case 'paused':
        return {
          label: 'На паузе',
          color: theme.colors.status.paused,
          icon: 'pause-circle',
          backgroundColor: theme.colors.status.pausedContainer
        };
      case 'report_added':
        return {
          label: 'Добавлен отчет',
          color: theme.colors.status.reportAdded,
          icon: 'file-document',
          backgroundColor: theme.colors.status.reportAddedContainer
        };
      case 'accepted_by_customer':
        return {
          label: 'Принято заказчиком',
          color: theme.colors.status.accepted,
          icon: 'account-check',
          backgroundColor: theme.colors.status.acceptedContainer
        };
        
      case 'rejected':
      return {
        label: 'Отклонено заказчиком',
        color: theme.colors.status.paused,
        icon: 'account-cancel',
        backgroundColor: theme.colors.status.pausedContainer
      };
      case 'new':
      default:
        return {
          label: 'Новая',
          color: theme.colors.status.new,
          icon: 'clock-outline',
          backgroundColor: theme.colors.status.newContainer
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      mode="outlined"
      icon={config.icon}
      textStyle={[
        styles.chipText,
        {
          color: config.color,
          fontSize: responsiveStyles.fontSize,
          lineHeight: responsiveStyles.lineHeight,
        }
      ]}
      style={[
        styles.statusChip,
        {
          borderColor: config.color,
          backgroundColor: config.backgroundColor,
          height: responsiveStyles.chipHeight,
          minHeight: responsiveStyles.chipHeight,
        }
      ]}
      contentStyle={[
        styles.chipContent,
        {
          height: responsiveStyles.chipHeight,
        }
      ]}
    >
      {config.label}
    </Chip>
  );
};

const styles = StyleSheet.create({
  statusChip: {
    borderWidth: 1,
    justifyContent: 'center',
  },
  chipText: {
    fontWeight: '500',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  chipContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});