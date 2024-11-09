// src/contexts/FilesContext.js

import React, {createContext, useCallback, useState} from 'react';
import { uploadFileToServer } from '../api/api';

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
    const [jobId, setJobId] = useState("lsdkjlksdjflksd");

    const setUploadedFiles = useCallback((files) => {
        console.log("setSelectedFiles", files);
        setFiles(files);
    }, []);

    /**
     * Функция для загрузки файла.
     */
    const uploadFiles = async () => {
        setLoading(true);
        console.log("set loading");
        setError(null);
        setShowToast(false);
        setResponseMessage('');


        try {
            const formData = getFormData(files, confidenceLevel);

            console.log("requesting", formData);
            const res = await uploadFileToServer(formData);
            console.log({ res });
            console.log("images", res.images);
            setResponseData(res.images);
            processFiles(res.images);

            // Предполагается, что res.images содержит массив или информацию о загруженных файлах
            setResponseMessage(`Файл(ы) успешно загружен(ы).`);
            setShowToast(true);

        } catch (err) {
            console.error('Ошибка при загрузке файла:', err);
            setError(err);
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    const getFormData = (files, confidenceLevel, sizeThreshold) => {
        const formData = new FormData();
        formData.append('count', files.length);

        files.forEach((file, index) => {
            console.log("data", file.file.lastModified);
            formData.append(`images`, file.file);
            formData.append(`camera`, file.camera);
            formData.append(`created_at`, file.file.lastModified);
        });

        formData.append('confidence_level', confidenceLevel);
        formData.append('size_threshold', JSON.stringify(sizeThreshold));

        return formData;
    };


    const processFiles = (images) => {
        console.log({images, files})
        setProcessedFiles(() => {

            return images.map(image => {
                const matchingFile = files.find(file => file.file.name === image.filename);
                return {
                    ...image, // все свойства из image
                    file: matchingFile.file, // добавляем свойство file с найденным файлом
                };
            });
        });
        setGetResponse(true);

    };




    return (
        <FilesContext.Provider value={{
            files,
            setFiles,
            setConfidenceLevel,
            confidenceLevel,
            getResponse,
            setGetResponse,
            responseData,
            processedFiles,
            sizeThreshold,
            setSizeThreshold,
            setUploadedFiles,
            uploadFiles,
            loading,
            error,
            showToast,
            setShowToast,
            responseMessage
        }}>
            {children}
        </FilesContext.Provider>
    );
};
