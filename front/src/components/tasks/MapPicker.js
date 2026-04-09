import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  FormGroup,
  Alert,
  Spinner
} from 'reactstrap';

const MapPicker = ({ visible, onSelect, onClose, initialLocation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [mapError, setMapError] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  
  const mapInstanceRef = useRef(null);
  const placemarkRef = useRef(null);

  // Нормализация данных о местоположении
  const normalizeLocation = (location) => {
    if (!location) return null;
    
    // Обрабатываем разные форматы данных
    const lat = location.latitude || location.lat;
    const lng = location.longitude || location.lng || location.lon;
    
    if (lat !== undefined && lng !== undefined) {
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        address: location.address || ''
      };
    }
    
    return null;
  };

  // Инициализация выбранной локации
  useEffect(() => {
    if (visible) {
      const normalizedLocation = normalizeLocation(initialLocation);
      setSelectedLocation(normalizedLocation);
    }
  }, [visible, initialLocation]);

  // Загрузка Яндекс.Карт
  useEffect(() => {
    if (visible) {
      if (!window.ymaps) {
        const script = document.createElement('script');
        script.src = 'https://api-maps.yandex.ru/2.1/?apikey=7f66d4c8-981a-4b98-b4b0-8bef0dae0b1и&lang=ru_RU';
        script.async = true;
        script.onload = () => {
          window.ymaps.ready(() => {
            initMap();
            setMapLoaded(true);
          });
        };
        script.onerror = () => {
          setMapError('Не удалось загрузить карты');
        };
        document.head.appendChild(script);
        
        return () => {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
        };
      } else if (!mapLoaded) {
        window.ymaps.ready(() => {
          initMap();
          setMapLoaded(true);
        });
      }
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
        placemarkRef.current = null;
      }
    };
  }, [visible]);

  // Сброс состояния при закрытии
  useEffect(() => {
    if (!visible) {
      setMapLoaded(false);
      setMapError('');
    }
  }, [visible]);

  const initMap = () => {
    try {
      let center;
      
      // Определяем центр карты
      if (selectedLocation && selectedLocation.latitude !== undefined && selectedLocation.longitude !== undefined) {
        const lat = parseFloat(selectedLocation.latitude);
        const lng = parseFloat(selectedLocation.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          center = [lat, lng];
        } else {
          center = [55.949884, 40.856295];
        }
      } else {
        center = [55.949884, 40.856295];
      }
     
      const map = new window.ymaps.Map('map-container', {
        center: center,
        zoom: 15
      });
      
      mapInstanceRef.current = map;

      // Добавляем элементы управления
      map.controls.remove('geolocationControl');
      map.controls.remove('searchControl');
      map.controls.remove('trafficControl');
      map.controls.remove('typeSelector');
      map.controls.remove('fullscreenControl');
      map.controls.remove('zoomControl');
      map.controls.remove('rulerControl');
      
      map.controls.add('zoomControl', { float: 'right' });
      map.controls.add('geolocationControl', { float: 'left' });

      // Создаем метку если есть начальная локация
      if (selectedLocation && selectedLocation.latitude !== undefined && selectedLocation.longitude !== undefined) {
        const lat = parseFloat(selectedLocation.latitude);
        const lng = parseFloat(selectedLocation.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          const address = selectedLocation.address || 'Выбранное местоположение';
          createPlacemark([lat, lng], address);
        }
      }

      // Обработчик клика по карте
      map.events.add('click', (e) => {
        const coords = e.get('coords');
        geocodeAndCreatePlacemark(coords);
      });

    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Ошибка инициализации карты');
    }
  };

  const createPlacemark = (coords, address) => {
    if (!mapInstanceRef.current) return;

    // Удаляем предыдущую метку
    if (placemarkRef.current) {
      mapInstanceRef.current.geoObjects.remove(placemarkRef.current);
    }

    // Создаем новую метку
    const placemark = new window.ymaps.Placemark(
      coords,
      {
        balloonContent: address || 'Выбранное местоположение',
        iconCaption: address ? address.substring(0, 30) + '...' : 'Местоположение'
      },
      {
        preset: 'islands#redDotIcon',
        draggable: true
      }
    );

    // Обработчик перетаскивания
    placemark.events.add('dragend', () => {
      const newCoords = placemark.geometry.getCoordinates();
      geocodeCoords(newCoords, (address) => {
        placemark.properties.set('balloonContent', address);
        placemark.properties.set('iconCaption', address.substring(0, 30) + '...');
        
        // Обновляем выбранное местоположение
        const newLocation = {
          latitude: newCoords[0],
          longitude: newCoords[1],
          address: address
        };
        setSelectedLocation(newLocation);
      });
    });

    mapInstanceRef.current.geoObjects.add(placemark);
    placemarkRef.current = placemark;
    
    // Центрируем карту на метке
    mapInstanceRef.current.setCenter(coords, 15);
  };

  const geocodeAndCreatePlacemark = (coords) => {
    setIsSearching(true);
    setMapError('');
    
    geocodeCoords(coords, (address) => {
      createPlacemark(coords, address);
      
      const newLocation = {
        latitude: coords[0],
        longitude: coords[1],
        address: address
      };
      
      setSelectedLocation(newLocation);
      setIsSearching(false);
    }, () => {
      // Если не удалось получить адрес, создаем метку без адреса
      createPlacemark(coords, 'Выбранное местоположение');
      
      const newLocation = {
        latitude: coords[0],
        longitude: coords[1],
        address: ''
      };
      
      setSelectedLocation(newLocation);
      setIsSearching(false);
    });
  };

  const geocodeCoords = (coords, onSuccess, onError) => {
    if (!window.ymaps) {
      if (onError) onError();
      return;
    }
    
    window.ymaps.geocode(coords).then(
      (res) => {
        const firstGeoObject = res.geoObjects.get(0);
        if (firstGeoObject) {
          const address = firstGeoObject.getAddressLine();
          onSuccess(address);
        } else {
          if (onError) onError();
        }
      },
      (error) => {
        console.error('Geocoding error:', error);
        if (onError) onError();
      }
    );
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setMapError('Введите адрес для поиска');
      return;
    }
    
    if (!window.ymaps || !mapInstanceRef.current) {
      setMapError('Карта не загружена');
      return;
    }
    
    setIsSearching(true);
    setMapError('');
    
    // Используем старый синтаксис для совместимости
    window.ymaps.geocode(searchQuery, { results: 1 }).then(
      (res) => {
        const firstGeoObject = res.geoObjects.get(0);
        if (firstGeoObject) {
          const coords = firstGeoObject.geometry.getCoordinates();
          const address = firstGeoObject.getAddressLine();
          
          createPlacemark(coords, address);
          
          const newLocation = {
            latitude: coords[0],
            longitude: coords[1],
            address: address
          };
          
          setSelectedLocation(newLocation);
          setIsSearching(false);
        } else {
          setMapError('Адрес не найден. Попробуйте уточнить запрос');
          setIsSearching(false);
        }
      },
      (err) => {
        console.error('Search error:', err);
        setMapError('Ошибка поиска адреса. Проверьте соединение с интернетом');
        setIsSearching(false);
      }
    );
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError('Геолокация не поддерживается вашим браузером');
      return;
    }

    setIsGeolocating(true);
    setMapError('');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = [latitude, longitude];
        
        geocodeAndCreatePlacemark(coords);
        setIsGeolocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Не удалось определить ваше местоположение';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Доступ к геолокации запрещен. Разрешите доступ в настройках браузера';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Информация о местоположении недоступна';
            break;
          case error.TIMEOUT:
            errorMessage = 'Время ожидания истекло';
            break;
        }
        
        setMapError(errorMessage);
        setIsGeolocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelect(selectedLocation);
      onClose();
    } else {
      setMapError('Выберите местоположение на карте');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setMapError('');
  };

  // Безопасный формат координат
  const formatCoordinate = (coord) => {
    if (coord === undefined || coord === null) return '—';
    const num = parseFloat(coord);
    return !isNaN(num) ? num.toFixed(6) : '—';
  };

  return (
    <Modal 
      isOpen={visible} 
      toggle={onClose} 
      size="lg"
      centered
      backdrop="static"
      className="map-picker-modal"
    >
      <ModalHeader toggle={onClose}>
        Выберите местоположение
      </ModalHeader>
      
      <ModalBody>
        <FormGroup>
          <div className="input-group mb-3">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Введите адрес для поиска..."
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              disabled={isSearching || isGeolocating}
            />
            <div className="input-group-append">
              <Button 
                color="primary" 
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isSearching || isGeolocating}
                style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }}
              >
                {isSearching ? <Spinner size="sm" /> : 'Поиск'}
              </Button>
            </div>
          </div>
          
          <div className="d-flex justify-content-between mb-3">
            <Button 
              color="outline-info" 
              onClick={handleUseCurrentLocation}
              disabled={isSearching || isGeolocating}
              size="sm"
            >
              {isGeolocating ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Определение...
                </>
              ) : (
                'Использовать мое местоположение'
              )}
            </Button>
            
            <Button 
              color="outline-secondary" 
              onClick={handleClearSearch}
              disabled={isSearching || isGeolocating}
              size="sm"
            >
              Очистить поиск
            </Button>
          </div>
        </FormGroup>
        
        {mapError && (
          <Alert color="danger" className="mb-3">
            {mapError}
          </Alert>
        )}
        
        {/* Контейнер для карты */}
        <div 
          id="map-container" 
          style={{ 
            width: '100%', 
            height: '400px', 
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            overflow: 'hidden'
          }} 
        />
        
        {!mapLoaded && visible && (
          <div className="text-center py-5">
            <Spinner color="primary" />
            <p className="mt-2">Загрузка карты...</p>
          </div>
        )}
        
        {selectedLocation && (
          <div className="mt-3 p-3 bg-light rounded">
            <h6 className="mb-2">Выбранное местоположение:</h6>
            {selectedLocation.address && (
              <div className="mb-2">
                <strong>Адрес:</strong> {selectedLocation.address}
              </div>
            )}
            <div className="text-muted small">
              <strong>Координаты:</strong> Широта: {formatCoordinate(selectedLocation.latitude)}, 
              Долгота: {formatCoordinate(selectedLocation.longitude)}
            </div>
          </div>
        )}
      </ModalBody>
      
      <ModalFooter>
        <Button 
          color="secondary" 
          onClick={onClose}
          disabled={isSearching || isGeolocating}
        >
          Отмена
        </Button>
        <Button 
          color="primary" 
          onClick={handleConfirm}
          disabled={!selectedLocation || isSearching || isGeolocating}
          style={{ backgroundColor: '#ef8810', borderColor: '#ef8810' }}
        >
          {isSearching || isGeolocating ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Обработка...
            </>
          ) : (
            'Выбрать местоположение'
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default MapPicker;