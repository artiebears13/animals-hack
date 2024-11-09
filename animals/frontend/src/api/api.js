// src/api/api.js

import { uploadFileToServer as mockUploadFile, getFilesFromServer as mockGetFiles } from '../mocks/mocks';

// Экспортируем мок-функции вместо реальных API-запросов
export const uploadFileToServer = mockUploadFile;

/**
 * В дальнейшем, когда будет готов настоящий сервер, вы можете переключиться на реальные API-запросы:
 *
 * import axios from 'axios';
 *
 * export const uploadFileToServer = async (file) => {
 *   const formData = new FormData();
 *   formData.append('file', file);
 *
 *   const response = await axios.post('/api/upload', formData, {
 *     headers: {
 *       'Content-Type': 'multipart/form-data',
 *     },
 *   });
 *
 *   return response.data;
 * };
 *
 * export const getFilesFromServer = async () => {
 *   const response = await axios.get('/api/files');
 *   return response.data;
 * };
 */
