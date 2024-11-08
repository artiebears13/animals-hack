// ServerErrorToast.js
import React, { useEffect, useContext } from 'react';
import { FilesContext } from '../../contexts/FilesContext'; // Убедитесь, что путь правильный

const ServerErrorToast = () => {
    const { errorCode, errorMessage, setErrorCode, setErrorMessage } = useContext(FilesContext);

    const onClose = (e) => {
        e.stopPropagation(); // Предотвращает всплытие события клика
        setErrorCode(null);
        setErrorMessage(null);
    };

    useEffect(() => {
        if (errorCode) {
            const toastElement = document.querySelector('.custom-toast');
            if (toastElement) {
                // Удаляем класс 'show' перед добавлением, чтобы анимация срабатывала заново
                toastElement.classList.remove('show');
                // Добавляем класс 'show' с задержкой для анимации
                setTimeout(() => {
                    toastElement.classList.add('show');
                }, 100);
            }
        }
    }, [errorCode]);

    if (!errorCode) return null;

    return (
        <div
            className={`custom-toast toast-error`}
            onClick={onClose}
        >
            <button
                className="toast-close-button"
                onClick={onClose}
                aria-label="Закрыть"
                onMouseDown={(e) => e.stopPropagation()} // Предотвращает закрытие тоста при клике на кнопку
            >
                &times;
            </button>
            <div>
                <h4 className="toast-header">Ошибка обработки</h4>
                <p>{errorCode}: {errorMessage}</p>
            </div>
        </div>
    );
};

export default ServerErrorToast;
