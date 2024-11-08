// src/mocks/mocks.js

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

    console.log("mock uploadFileToServer", formData);
    const files = formData.getAll('images');
    return new Promise((resolve, reject) => {
        // Симулируем задержку сервера (например, 1 секунду)
        setTimeout(() => {
            if (!files) {
                reject(new Error('Файл не был загружен.'));
                return;
            }
            let response = {}
            let uploadedFiles = [];
            files.forEach((file) => {
                uploadedFiles = [
                    ...uploadedFiles,
                    {
                        filename: file.name,
                        created_at: file.lastModified,
                        object_class: 1,
                        border: [
                            {
                                animal_name: file.name,
                                left_up_corner: {
                                    x: 100,
                                    y: 100,

                                },
                                width: 200,
                                height: 100,
                            }
                        ]

                    }

                ]
            })
            // Создаем имитацию ответа сервера с данными файла

            response = {
                error_message: '',
                images: uploadedFiles
            }
            resolve(response);
            console.log("resolved")
        }, 3000); // 1 секунда задержки
    });
};
