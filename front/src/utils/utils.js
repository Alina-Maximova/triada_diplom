export const getStatusColor = (status) => {
  switch (status) {
    case 'new': return 'secondary';
    case 'in_progress': return 'warning';
    case 'completed': return 'success';
    case 'report_added': return 'info';
    case 'accepted_by_customer': return 'primary';
    case 'rejected': return 'danger';
    case 'cancelled': return 'dark';
    default: return 'secondary';
  }
};

export const getStatusText = (status) => {
  switch (status) {
    case 'new': return 'Новая';
    case 'in_progress': return 'В работе';
    case 'completed': return 'Выполнена';
    case 'report_added': return 'Отчет добавлен';
    case 'accepted_by_customer': return 'Принято клиентом';
    case 'rejected': return 'Отклонено';
    case 'cancelled': return 'Отменено';
    default: return status;
  }
};

export const getStatusDescription = (status) => {
  switch (status) {
    case 'in_progress': return 'Начать выполнение';
    case 'completed': return 'Задача выполнена';
    case 'report_added': return 'Отчет добавлен';
    case 'accepted_by_customer': return 'Клиент принял работу';
    case 'rejected': return 'Клиент отклонил работу';
    default: return '';
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return 'Не указана';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

export const getAvailableStatuses = (currentStatus) => {
  switch (currentStatus) {
    case 'new':
      return [{ value: 'in_progress', label: 'В работу', color: 'warning', description: 'Начать выполнение', icon: 'PlayCircleIcon' }];
    case 'in_progress':
      return [{ value: 'completed', label: 'Выполнена', color: 'success', description: 'Задача выполнена', icon: 'CheckCircleIcon' }];
    case 'completed':
      return [];
    case 'report_added':
      return [
        { value: 'accepted_by_customer', label: 'Принять клиентом', color: 'primary', description: 'Клиент принял работу', icon: 'ThumbUpIcon' },
        { value: 'rejected', label: 'Отклонить клиентом', color: 'danger', description: 'Клиент отклонил работу', icon: 'CancelIcon' }
      ];
    case 'rejected':
      return [{ value: 'in_progress', label: 'В работу', color: 'warning', description: 'Вернуть задачу в работу', icon: 'PlayCircleIcon' }];
    default:
      return [];
  }
};