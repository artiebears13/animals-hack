// src/api/api.js

import { uploadFileToServer as mockUploadFile, getFilesFromServer as mockGetFiles } from '../mocks/mocks';

// Экспортируем мок-функции вместо реальных API-запросов
// export const uploadFileToServer = mockUploadFile;

/**
 * В дальнейшем, когда будет готов настоящий сервер, вы можете переключиться на реальные API-запросы:
 */
// import axios from 'axios';

export const uploadFileToServer = async (formData) => {
  console.log("here");
  const response = await fetch('http://localhost/service/api/v1/upload_images', {
    method: 'POST',
    body: formData,
    headers: {
      // 'Content-Type': 'multipart/form-data' не нужно указывать, так как fetch сам определит этот заголовок для FormData
    },
  });

  if (!response.ok) {
    throw new Error('Error uploading file');
  }

  return response.json();  // Возвращаем данные в формате JSON
};

export const downloadFilesFromServer = async (uid) => {
    console.log("here");
    const response = await fetch('http://localhost/service/api/v1/get_result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid }),
    });

    if (!response.ok) {
        throw new Error('Error uploading file');
    }

    return response.json();  // Возвращаем данные в формате JSON
};




export const getPdfFile = async (uid) => {
    const file = await fetch('http://localhost/service/api/v1/get_result_report', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid }),
    });

    if (file.ok) {
        const blob = await file.blob(); // Преобразуем тело в Blob
        const url = window.URL.createObjectURL(blob); // Создаем ссылку на Blob
        const link = document.createElement('a');
        link.href = url;
        link.download = 'result_report.pdf'; // Имя файла
        document.body.appendChild(link);
        link.click(); // Симулируем клик для скачивания файла
        document.body.removeChild(link); // Убираем ссылку после скачивания
    } else {
        console.error('Ошибка при запросе:', file.status);
    }
};


