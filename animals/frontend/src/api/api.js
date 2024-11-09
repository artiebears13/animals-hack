// src/api/api.js

import { uploadFileToServer as mockUploadFile, getFilesFromServer as mockGetFiles } from '../mocks/mocks';

// Экспортируем мок-функции вместо реальных API-запросов
export const uploadFileToServer = mockUploadFile;

/**
 * В дальнейшем, когда будет готов настоящий сервер, вы можете переключиться на реальные API-запросы:
 */
// import axios from 'axios';
//
// export const uploadFileToServer = async (formData) => {
//   console.log("here");
//   const response = await fetch('http://localhost/service/api/v1/upload', {
//     method: 'POST',
//     body: formData,
//     headers: {
//       // 'Content-Type': 'multipart/form-data' не нужно указывать, так как fetch сам определит этот заголовок для FormData
//     },
//   });
//
//   if (!response.ok) {
//     throw new Error('Error uploading file');
//   }
//
//   return response.json();  // Возвращаем данные в формате JSON
// };
//
// export const getFilesFromServer = async () => {
//   const response = await axios.get('/api/files');
//   return response.data;
// };

