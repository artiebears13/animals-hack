// src/contexts/FilesContext.js

import React, {createContext, useCallback, useState} from 'react';
import { uploadFileToServer, downloadFilesFromServer } from '../api/api';

// Создаем контекст
export const FilesContext = createContext();

/**
 * Провайдер для FilesContext.
 * Оборачивает компоненты, которым необходим доступ к файлам.
 */
export const FilesProvider = ({ children }) => {
    const [files, setFiles] = useState([]); // Список загруженных файлов
    const [confidenceLevel, setConfidenceLevel] = useState(0.9); // Список загруженных файлов
    const [responseData, setResponseData] = useState([]); // Список загруженных файлов
    const [loading, setLoading] = useState(false); // Статус загрузки
    const [error, setError] = useState(null); // Ошибка при загрузке
    const [showToast, setShowToast] = useState(false); // Отображение тоста
    const [responseMessage, setResponseMessage] = useState(''); // Сообщение ответа сервера
    const [processedFiles, setProcessedFiles] = useState([]);
    const [sizeThreshold, setSizeThreshold] = useState({width: 128, height: 128});
    const [getResponse, setGetResponse] = useState(false);
    const [jobId, setJobId] = useState("");
    const [stats, setStats] = useState({});

    const setUploadedFiles = useCallback((files) => {
        setFiles(files);
    }, []);

    const downloadResponse = async (uid) => {
        const res = await downloadFilesFromServer(uid);
        return res;
    }

    /**
     * Функция для загрузки файла.
     */
    const uploadFiles = async () => {
        setLoading(true);
        setError(null);
        setShowToast(false);
        setResponseMessage('');


        try {
            const formData = getFormData(files, confidenceLevel);
            const uidObj = await uploadFileToServer(formData);
            const uid = uidObj.uid;
            setJobId(uid);

            const retryDownload = async (uid) => {
                let res = {};
                let attempts = 0;
                const maxAttempts = 200;

                // Повторять запросы, если ответ пустой, пока не превысим максимальное количество попыток
                while (attempts < maxAttempts) {
                    console.log({uid});
                    console.log('type', typeof uid);
                    res = await downloadResponse(uid);  // Загружаем ответ от сервера
                    if (Object.keys(res).length > 0) {
                        // Если данные есть, прекращаем попытки и возвращаем результат
                        break;
                    }

                    attempts += 1;

                    // Тайм-аут перед следующей попыткой
                    await new Promise(resolve => setTimeout(resolve, 500));  // 500 ms
                }

                return res;
            };
            const res = await retryDownload(uid);
            console.log("res", res);
            if (Object.keys(res).length > 0) {
                // Если ответ не пустой, обрабатываем файлы
                console.log("results", res.images);
                processFiles(res.images);
                processStats(res.stats);
                setResponseMessage(`Файл(ы) успешно загружен(ы).`);
                setShowToast(true);
            } else {
                setError('Ошибка: пустой ответ от сервера');
                setShowToast(true);
            }

            processFiles(res.images);
            setResponseMessage(`Файл(ы) успешно загружен(ы).`);
            setShowToast(true);

        } catch (err) {
            console.error('Ошибка при загрузке файла:', err.message);
            setError('Ошибка при загрузке файла');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    const getFormData = (files, confidenceLevel) => {
        const formData = new FormData();
        formData.append('count', files.length);

        files.forEach((file, index) => {
            formData.append(`images`, file.file);
            formData.append(`camera`, file.camera);
            const createdAt = new Date(file.file.lastModified);
            formData.append(`created_at`, createdAt.toISOString());
        });
        formData.append('confidence_level', confidenceLevel);
        formData.append('size_threshold', JSON.stringify(sizeThreshold));

        return formData;
    };


    const processFiles = (images) => {
        setProcessedFiles(() => {
            return images.map(image => {
                const matchingFile = files.find(file => file.file.name === image.filename);

                const updatedBorders = image.border.map(borderObject => ({
                    ...borderObject, // сохраняем все остальные поля
                    animal_name: borderObject.object_class === 1 ? "качественное" : "вспомагательное", // меняем animal_name
                }));

                return {
                    ...image, // сохраняем все остальные свойства из image
                    file: matchingFile ? matchingFile.file : null, // добавляем свойство file с найденным файлом
                    border: updatedBorders, // заменяем border с обновленными значениями
                };
            });
        });
        setGetResponse(true);

    };

    const processStats = (stats) => {
        if (stats && stats !== {}) {
            setStats(stats);
        }
    }




    return (
        <FilesContext.Provider value={{
            files,
            setFiles,
            setJobId,
            setConfidenceLevel,
            confidenceLevel,
            getResponse,
            jobId,
            setGetResponse,
            responseData,
            processedFiles,
            sizeThreshold,
            setSizeThreshold,
            setUploadedFiles,
            uploadFiles,
            loading,
            error,
            setError,
            showToast,
            setShowToast,
            responseMessage,
            stats, setStats
        }}>
            {children}
        </FilesContext.Provider>
    );
};
