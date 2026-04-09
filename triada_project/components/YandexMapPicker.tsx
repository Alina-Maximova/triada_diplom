import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Button, Text, Card, Portal, Modal, ActivityIndicator, TextInput, useTheme, Snackbar } from 'react-native-paper';
import * as Location from 'expo-location';
import { Location as LocationType } from '../types';
import { YandexMapPickerStyles } from '@/styles/YandexMapPickerStyles';

const { width, height } = Dimensions.get('window');

interface YandexMapWebPickerProps {
  visible: boolean;
  onLocationSelect: (location: LocationType) => void;
  onDismiss: () => void;
  initialLocation?: LocationType | null;
}

// HTML шаблон для Яндекс Карт
const mapHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Выбор местоположения</title>
    <script src="https://api-maps.yandex.ru/2.1/?apikey=YOUR_YANDEX_MAPS_API_KEY&lang=ru_RU"></script>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; }
        #map { width: 100%; height: 100%; }
        .balloon { padding: 10px; }
        .balloon-title { font-weight: bold; margin-bottom: 5px; }
        .balloon-address { color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        let map;
        let placemark;
        
        // Инициализация карты
        ymaps.ready(init);
        
        function init() {
            map = new ymaps.Map('map', {
               center: [55.949884, 40.856295],
                zoom: 15,
                controls: ['zoomControl', 'fullscreenControl']
            });
            
            // Обработчик клика по карте
            map.events.add('click', function (e) {
                const coords = e.get('coords');
                updateLocation(coords);
            });
            
            // Функция обновления местоположения
            window.updateLocation = function(coords, address) {
                // Удаляем предыдущую метку
                if (placemark) {
                    map.geoObjects.remove(placemark);
                }
                
                // Если адрес не передан, получаем его по координатам
                if (!address) {
                    ymaps.geocode(coords).then(function (res) {
                        const firstGeoObject = res.geoObjects.get(0);
                        address = firstGeoObject.getAddressLine();
                        
                        createPlacemark(coords, address);
                    });
                } else {
                    createPlacemark(coords, address);
                }
            };
            
            // Функция создания метки
            function createPlacemark(coords, address) {
                placemark = new ymaps.Placemark(coords, {
                    balloonContentHeader: 'Выбранное местоположение',
                    balloonContentBody: address,
                    balloonContentFooter: 'Координаты: ' + coords[0].toFixed(6) + ', ' + coords[1].toFixed(6)
                }, {
                    preset: 'islands#redIcon',
                    draggable: true
                });
                
                // Обработчик перетаскивания метки
                placemark.events.add('dragend', function () {
                    const newCoords = placemark.geometry.getCoordinates();
                    ymaps.geocode(newCoords).then(function (res) {
                        const firstGeoObject = res.geoObjects.get(0);
                        const newAddress = firstGeoObject.getAddressLine();
                        
                        // Обновляем данные
                        placemark.properties.set({
                            balloonContentBody: newAddress,
                            balloonContentFooter: 'Координаты: ' + newCoords[0].toFixed(6) + ', ' + newCoords[1].toFixed(6)
                        });
                        
                        // Отправляем обновленные данные
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'locationSelected',
                            latitude: newCoords[0],
                            longitude: newCoords[1],
                            address: newAddress
                        }));
                    });
                });
                
                map.geoObjects.add(placemark);
                map.setCenter(coords, 15);
                
                // Отправляем данные в React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'locationSelected',
                    latitude: coords[0],
                    longitude: coords[1],
                    address: address
                }));
            }
            
            // Поиск по координатам из React Native
            window.setInitialLocation = function(lat, lon, address) {
                const coords = [lat, lon];
                window.updateLocation(coords, address);
            };
            
            // Поиск по адресу
            window.searchAddress = function(address) {
                ymaps.geocode(address).then(function (res) {
                    const firstGeoObject = res.geoObjects.get(0);
                    if (!firstGeoObject) {
                        // Если адрес не найден, сообщаем об ошибке
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'searchError',
                            message: 'Адрес не найден'
                        }));
                        return;
                    }
                    
                    const coords = firstGeoObject.geometry.getCoordinates();
                    const foundAddress = firstGeoObject.getAddressLine();
                    
                    window.updateLocation(coords, foundAddress);
                    
                }).catch(function (error) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'searchError',
                        message: 'Ошибка поиска адреса'
                    }));
                });
            };
        }
    </script>
</body>
</html>
`;

export const YandexMapWebPicker: React.FC<YandexMapWebPickerProps> = ({
  visible,
  onLocationSelect,
  onDismiss,
  initialLocation,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [isLocating, setIsLocating] = useState(false);
  const theme = useTheme();
  const styles = YandexMapPickerStyles(theme); 

  // Инициализация начальной локации
  React.useEffect(() => {
    if (visible && initialLocation && webViewRef.current) {
      const timer = setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          window.setInitialLocation(
            ${initialLocation.latitude},
            ${initialLocation.longitude},
            "${initialLocation.address || ''}"
          );
          true;
        `);
        setSelectedLocation(initialLocation);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, initialLocation]);

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'locationSelected') {
        const location: LocationType = {
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
        };
        setSelectedLocation(location);
      } else if (data.type === 'searchError') {
        setSnackbarMessage(data.message || 'Ошибка поиска адреса');
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSnackbarMessage('Введите адрес для поиска');
      return;
    }
    
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        window.searchAddress("${searchQuery.replace(/"/g, '\\"')}");
        true;
      `);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setIsLocating(true);
      
      // Запрашиваем разрешения
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setSnackbarMessage('Доступ к геолокации запрещен');
        setIsLocating(false);
        return;
      }

      // Получаем текущее местоположение
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 15000,
      });

      const { latitude, longitude } = location.coords;
      
      // Получаем адрес по координатам
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const addressString = address 
        ? `${address.city || ''} ${address.street || ''} ${address.name || ''}`.trim()
        : 'Текущее местоположение';

      // Передаем координаты в WebView
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          window.setInitialLocation(
            ${latitude},
            ${longitude},
            "${addressString}"
          );
          true;
        `);
      }

      setSnackbarMessage('Текущее местоположение найдено');

    } catch (error: any) {
      console.error('Error getting current location:', error);
      setSnackbarMessage('Не удалось определить местоположение: ' + error.message);
    } finally {
      setIsLocating(false);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      handleDismiss();
    } else {
      setSnackbarMessage('Выберите местоположение на карте');
    }
  };

  const handleDismiss = () => {
    setSelectedLocation(null);
    setSearchQuery('');
    setIsLoading(true);
    setIsLocating(false);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.modal}
      >
        <Text variant="headlineSmall" style={styles.title}>
          Выберите местоположение
        </Text>

        {/* Поиск по адресу */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Поиск по адресу..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            mode="outlined"
            right={
              <TextInput.Icon 
                icon="magnify" 
                onPress={handleSearch}
                disabled={!searchQuery.trim()}
              />
            }
            onSubmitEditing={handleSearch}
          />
          <Button
            mode="outlined"
            onPress={handleUseCurrentLocation}
            style={styles.currentLocationButton}
            icon="crosshairs-gps"
            loading={isLocating}
            disabled={isLocating}
          >
            {isLocating ? 'Поиск...' : 'Текущее'}
          </Button>
        </View>

        {/* Карта в WebView */}
        <View style={styles.mapContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Загрузка карты...</Text>
            </View>
          )}
          
          <WebView
            ref={webViewRef}
            source={{ html: mapHTML.replace('YOUR_YANDEX_MAPS_API_KEY', '7f66d4c8-981a-4b98-b4b0-8bef0dae0b1c') }}
            style={styles.webview}
            onMessage={handleWebViewMessage}
            onLoadEnd={() => setIsLoading(false)}
            onError={(error) => {
              console.error('WebView error:', error);
              setIsLoading(false);
              setSnackbarMessage('Ошибка загрузки карты');
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
          />
        </View>

        {/* Информация о выбранной локации */}
        {selectedLocation && (
          <Card style={styles.locationInfo}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.locationTitle}>
                📍 Выбранное местоположение
              </Text>
              {selectedLocation.address && (
                <Text variant="bodyMedium" style={styles.address}>
                  {selectedLocation.address}
                </Text>
              )}
              <Text variant="bodySmall" style={styles.coords}>
                Широта: {selectedLocation.latitude.toFixed(6)}
                {'\n'}
                Долгота: {selectedLocation.longitude.toFixed(6)}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Кнопки действий */}
        <View style={styles.buttons}>
          <Button
            mode="outlined"
            onPress={handleDismiss}
            style={styles.button}
          >
            Отмена
          </Button>
          <Button
            mode="contained"
            onPress={handleConfirm}
            disabled={!selectedLocation}
            style={styles.button}
          >
            Выбрать
          </Button>
        </View>

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
      </Modal>
    </Portal>
  );
};