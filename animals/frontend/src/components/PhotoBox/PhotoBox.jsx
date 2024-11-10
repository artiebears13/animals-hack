import { useEffect, useState, useRef } from "react";
import "./PhotoBox.css";

export const PhotoBox = ({ id, processedFile }) => {
    const file = processedFile.file;
    const [preview, setPreview] = useState("");
    const [originalWidth, setOriginalWidth] = useState(0);
    const [originalHeight, setOriginalHeight] = useState(0);
    const [displayedWidth, setDisplayedWidth] = useState(0);
    const [displayedHeight, setDisplayedHeight] = useState(0);
    const imgRef = useRef(null);

    useEffect(() => {
        if (!file) {
            setPreview(null);
            return;
        }

        // Создаем временный URL для файла
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        // Загружаем изображение, чтобы получить оригинальные размеры
        const img = new Image();
        img.src = objectUrl;
        img.onload = () => {
            setOriginalWidth(img.naturalWidth);
            setOriginalHeight(img.naturalHeight);
        };

        // Освобождаем память при размонтировании компонента
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    // Обработчик загрузки изображения для получения отображаемых размеров
    const handleImageLoad = (e) => {
        setDisplayedWidth(e.target.width);
        setDisplayedHeight(e.target.height);
    };

    return (
        <div className="photoBox-container">
            <img
                id={id}
                className="photoBox-image"
                src={preview}
                alt={file.name}
                onLoad={handleImageLoad}
                ref={imgRef}
            />
            {processedFile.border && Array.isArray(processedFile.border) && processedFile.border.length > 0 && (
                processedFile.border.map((borderItem, index) => {
                    // Проверка наличия необходимых свойств
                    if (
                        !borderItem.left_up_corner ||
                        typeof borderItem.width !== "number" ||
                        typeof borderItem.height !== "number" ||
                        typeof borderItem.left_up_corner.x !== "number" ||
                        typeof borderItem.left_up_corner.y !== "number"
                    ) {
                        // Пропустить этот элемент, если данные некорректны
                        return null;
                    }

                    const animalName = borderItem.animal_name || "Unknown";

                    // Применяем масштабирование к относительным координатам и размерам границы
                    const boxStyle = {
                        width: `${borderItem.width * displayedWidth / originalWidth}px`,
                        height: `${borderItem.height * displayedHeight / originalHeight}px`,
                        top: `${borderItem.left_up_corner.y * displayedHeight / originalHeight}px`,
                        left: `${borderItem.left_up_corner.x * displayedWidth / originalWidth}px`,
                        borderColor: `${borderItem.object_class === 1 ? "blue" : "red"}`
                    };

                    // Стиль для названия объекта
                    const animalNameStyle = {
                        backgroundColor: `${borderItem.object_class === 1 ? "blue" : "red"}`,
                        // Дополнительные стили можно добавить здесь
                    };

                    return (
                        <div
                            id={`${borderItem.id}_image`}
                            key={index} // Используйте уникальный идентификатор, если доступен
                            className="photoBox-box"
                            style={boxStyle}
                        >
                            <div  className="photoBox-label" style={animalNameStyle}>
                                {animalName}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};
