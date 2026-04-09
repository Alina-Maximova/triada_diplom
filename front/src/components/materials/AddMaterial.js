import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Row,
  Col,
  FormGroup,
  Label,
  Input,
  FormText,
  Button,
  Spinner
} from 'reactstrap';
import { toast } from 'react-toastify';
import { useAddMaterialsMutation, useUpdateMaterialMutation } from '../../redux/apiSlice';

const AddMaterial = ({ onMaterialCreated, initialData = null }) => {
  const [addMaterials] = useAddMaterialsMutation();
  const [updateMaterial] = useUpdateMaterialMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue
  } = useForm({
    defaultValues: {
      name: '',
      unit: '',
      description: '',
    },
    mode: 'onChange'
  });

  // Заполняем форму при редактировании
  useEffect(() => {
    if (initialData) {
      setValue('name', initialData.name || '');
      setValue('unit', initialData.unit || '');
      setValue('description', initialData.description || '');
    }
  }, [initialData, setValue]);

  const name = watch('name');
  const unit = watch('unit');
  const description = watch('description');

  const isFormValid = Boolean(
    name?.trim() &&
    unit?.trim() &&
    description?.trim()
  );

  const onSubmit = async (data) => {
    if (!isFormValid) return;

    try {
      setIsSubmitting(true);

      const materialData = {
        name: data.name.trim(),
        unit: data.unit.trim(),
        description: data.description.trim(),
      };

      let result;
      
      if (initialData) {
        // Режим редактирования
        console.log({ 
          id: initialData.id, 
          ...materialData 
        })
        result = await updateMaterial({ 
          id: initialData.id, 
          data:materialData 
        }).unwrap();
        toast.success('Материал успешно обновлен!');
      } else {
        // Режим создания
        result = await addMaterials(materialData).unwrap();
        toast.success('Материал успешно создан!');
      }

      if (result) {
        reset({
          name: '',
          unit: '',
          description: '',
        });
        if (onMaterialCreated) {
          onMaterialCreated();
        }
      }

    } catch (error) {
      console.error('Error saving material:', error);
      const errorMessage = error.data?.error || error.data?.message || 
        (initialData ? 'Не удалось обновить материал' : 'Не удалось создать материал');
      toast.error(`Ошибка: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    if (initialData) {
      // Возвращаем исходные данные при редактировании
      setValue('name', initialData.name || '');
      setValue('unit', initialData.unit || '');
      setValue('description', initialData.description || '');
      toast.info('Изменения сброшены');
    } else {
      // Очищаем форму при создании
      reset({
        name: '',
        unit: '',
        description: '',
      });
      toast.info('Форма очищена');
    }
  };

  const handleCancelEdit = () => {
    reset({
      name: '',
      unit: '',
      description: '',
    });
    if (onMaterialCreated) {
      onMaterialCreated(); // Это сбросит editingMaterial в null
    }
    toast.info('Редактирование отменено');
  };

  return (
    <>
      <div className="add-Material-header">
        <h4>{initialData ? 'Редактировать материал' : 'Добавить новый материал'}</h4>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="Material-form">
        <Row>
          <Col md={12}>
            <FormGroup>
              <Label for="name">
                Название материала <span className="required">*</span>
              </Label>
              <Controller
                name="name"
                control={control}
                rules={{
                  required: 'Название обязательно',
                  minLength: { value: 2, message: 'Минимум 2 символа' }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="text"
                    placeholder="Например: Труба металлическая"
                    invalid={!!errors.name}
                    valid={field.value && !errors.name}
                  />
                )}
              />
              {errors.name && <FormText color="danger">{errors.name.message}</FormText>}
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <FormGroup>
              <Label for="unit">
                Единица измерения <span className="required">*</span>
              </Label>
              <Controller
                name="unit"
                control={control}
                rules={{
                  required: 'Единица измерения обязательна',
                  minLength: { value: 1, message: 'Введите единицу измерения' }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="text"
                    placeholder="Например: шт, м, кг, м²"
                    invalid={!!errors.unit}
                    valid={field.value && !errors.unit}
                  />
                )}
              />
              {errors.unit && <FormText color="danger">{errors.unit.message}</FormText>}
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col md={12}>
            <FormGroup>
              <Label for="description">
                Описание <span className="required">*</span>
              </Label>
              <Controller
                name="description"
                control={control}
                rules={{
                  required: 'Описание обязательно',
                  minLength: { value: 5, message: 'Минимум 5 символов' }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="textarea"
                    rows={3}
                    placeholder="Подробное описание материала"
                    invalid={!!errors.description}
                    valid={field.value && !errors.description}
                  />
                )}
              />
              {errors.description && <FormText color="danger">{errors.description.message}</FormText>}
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col md={12} className="mt-3">
            <div className="d-flex justify-content-end gap-2">
              <Button
                type="button"
                color="secondary"
                onClick={handleResetForm}
                disabled={isSubmitting}
              >
                {initialData ? 'Сбросить' : 'Очистить'}
              </Button>

              {initialData && (
                <Button
                  type="button"
                  color="outline-secondary"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Отменить
                </Button>
              )}

              <Button
                type="submit"
                color="primary"
                disabled={isSubmitting || !isFormValid}
                style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    {initialData ? 'Сохранение...' : 'Создание...'}
                  </>
                ) : (
                  initialData ? 'Сохранить' : 'Создать'
                )}
              </Button>
            </div>
          </Col>
        </Row>
      </form>
    </>
  );
};

export default AddMaterial;