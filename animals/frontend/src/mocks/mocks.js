// src/mocks/mocks.js
import { v4 as uuidv4 } from 'uuid';

/**
 * Генерирует случайное целое число в диапазоне от min до max.
 * @param {number} min - Минимальное значение.
 * @param {number} max - Максимальное значение.
 * @returns {number} - Случайное число.
 */
const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};


const getRandomFloat = (min, max) => Math.random() * (max - min) + min;

// Функция для генерации случайной рамки с нормализованными координатами
const generateRandomBorder = (fileName) => {
    // Генерируем случайные ширину и высоту рамки в диапазоне от 5% до 30% от изображения
    const width = getRandomFloat(0.05, 0.3);
    const height = getRandomFloat(0.05, 0.3);

    return {
        id: uuidv4(),
        animal_name: getRandomInt(0, 1)>0.5 ? "хуй": "пизда", // Замените на актуальное название или сделайте параметром
        // animal_name: "пизд  а", // Замените на актуальное название или сделайте параметром
        object_class: getRandomInt(0, 1),
        // object_class: 1,
        left_up_corner: {
            // Обеспечиваем, что рамка не выйдет за пределы изображения
            x: getRandomFloat(0, 1 - width),
            y: getRandomFloat(0, 1 - height),
            // x: 0.5,
            // y: 0.5,
        },
        width: width,
        height: height,
        // width: 0.2,
        // height: 0.2,
    };
};

/**
 * Симулирует загрузку файла на сервер.
 * @param {FormData} formData - Файл для загрузки.
 * @returns {Promise<Object>} - Возвращает данные загруженного файла.
 */
export const uploadFileToServer = (formData) => {

    // const response = await fetch('/api/v1/upload_images', {
    //     method: 'POST',
    //     body: formData,
    // });
    // const data = await response.json();

    const count = parseInt(formData.get('count'), 10);
    console.log(`Количество файлов: ${count}`);

    const files = [];
    const createdAtArray = [];

    for (let i = 0; i < count; i++) {
        const fileKey = `images[${i}][file]`;
        const createdAtKey = `images[${i}][created_at]`;

        const file = formData.get(fileKey);
        const createdAt = formData.get(createdAtKey);

        if (file) {
            files.push(file);
            if (createdAt) {
                createdAtArray.push(createdAt);
            } else {
                createdAtArray.push(null); // Или задайте значение по умолчанию
            }
        } else {
            console.warn(`Файл для индекса ${i} не найден.`);
        }
    }
    return new Promise((resolve, reject) => {
        // Симулируем задержку сервера (например, 3 секунды)
        setTimeout(() => {
            if (!files || files.length === 0) {
                reject(new Error('Файл не был загружен.'));
                return;
            }
            let response = {};
            let uploadedFiles = [];

            files.forEach((file) => {
                // Генерация случайного количества границ (от 1 до 5) для каждого файла
                const numberOfBorders = getRandomInt(1, 5); // Случайное количество границ от 1 до 5
                // const numberOfBorders = 1; // Случайное количество границ от 1 до 5
                const borders = Array.from({ length: numberOfBorders }, () => generateRandomBorder(file.name));

                uploadedFiles.push({
                    filename: file.name,
                    created_at: file.lastModified,
                    border: borders, // Добавляем массив случайно сгенерированных границ
                });
            });

            // Создаем имитацию ответа сервера с данными файла
            response = {
                error_message: '',
                images: uploadedFiles
            };
            resolve(response);
            console.log("resolved");
        }, 3000); // 3 секунды задержки
    });
};
