import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';

if (!CryptoJS.lib.WordArray.random.__overridden) {
  CryptoJS.lib.WordArray.random = (nBytes: number) => {
    const randomBytes = Crypto.getRandomBytes(nBytes);
    return CryptoJS.lib.WordArray.create(randomBytes as any);
  };
  CryptoJS.lib.WordArray.random.__overridden = true;
}

const SECRET_KEY = process.env.REACT_APP_ENCRYPTION_KEY || '30cb38c05fd1519a13daac5b47f58f62';

// Проверка, является ли строка зашифрованной (CryptoJS добавляет префикс "U2FsdGVkX1")
const isEncrypted = (str: string): boolean => {
  return typeof str === 'string' && str.startsWith('U2FsdGVkX1');
};

export const encrypt = (data: string): string => {
  if (!data) return '';
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

export const decrypt = (encryptedData: string): string => {
  if (!encryptedData) return '';
  if (!isEncrypted(encryptedData)) {
    // Если данные не зашифрованы, возвращаем как есть (или можно вернуть пустую строку)
    console.warn('Attempted to decrypt non-encrypted string, returning original');
    return encryptedData;
  }
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const result = bytes.toString(CryptoJS.enc.Utf8);
    if (!result) {
      throw new Error('Empty decryption result');
    }
    return result;
  } catch (error) {
    console.error('Decryption failed:', error);
    // Fallback: возвращаем исходную строку
    return encryptedData;
  }
};