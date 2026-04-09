// src/utils/mediaHelpers.js

/**
 * Сжатие изображения через canvas
 * @param {File} file – исходный файл
 * @param {number} quality – качество от 0 до 1
 * @returns {Promise<File>} – сжатый файл
 */
export const compressImage = (file, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          URL.revokeObjectURL(url);
          resolve(compressedFile);
        },
        file.type,
        quality
      );
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
};

/**
 * Проверка длительности видео
 * @param {File} file
 * @param {number} maxSeconds – максимальная длительность (сек)
 * @returns {Promise<boolean>}
 */
export const checkVideoDuration = (file, maxSeconds = 60) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('video/')) {
      resolve(true);
      return;
    }
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration <= maxSeconds);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    video.src = url;
  });
};

/**
 * Получение превью видео (первый кадр) в формате dataURL
 * @param {File} file
 * @returns {Promise<string>}
 */
export const getVideoThumbnail = (file) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('video/')) {
      reject('Not a video');
      return;
    }
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const url = URL.createObjectURL(file);
    video.onloadeddata = () => {
      video.currentTime = 0.1;
    };
    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
      URL.revokeObjectURL(url);
      resolve(thumbnail);
    };
    video.onerror = reject;
    video.src = url;
  });
};

/**
 * Дедупликация файлов (по имени, размеру, дате изменения)
 * @param {File[]} newFiles – новые выбранные файлы
 * @param {File[]} existingFiles – уже добавленные файлы
 * @returns {File[]} – уникальные файлы
 */
export const deduplicateFiles = (newFiles, existingFiles) => {
  return newFiles.filter(newFile =>
    !existingFiles.some(existing =>
      existing.name === newFile.name &&
      existing.size === newFile.size &&
      existing.lastModified === newFile.lastModified
    )
  );
};