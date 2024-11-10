import {useEffect, useState, useRef, useContext} from "react";
import "./PhotoBox.css";
import {FilesContext} from "../../contexts/FilesContext";

export const PhotoBox = ({ id, processedFile }) => {
    const {confidenceLevel} = useContext(FilesContext);
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

        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        // Загружаем изображение, чтобы получить оригинальные размеры
        const img = new Image();
        img.src = objectUrl;
        img.onload = () => {
            setOriginalWidth(img.naturalWidth);
            setOriginalHeight(img.naturalHeight);
        };

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
                        return null;
                    }

                    const animalName = borderItem.animal_name || "Unknown";

                    // масштабирование
                    const boxStyle = {
                        width: `${borderItem.width * displayedWidth / originalWidth}px`,
                        height: `${borderItem.height * displayedHeight / originalHeight}px`,
                        top: `${borderItem.left_up_corner.y * displayedHeight / originalHeight}px`,
                        left: `${borderItem.left_up_corner.x * displayedWidth / originalWidth}px`,
                        borderColor: `${borderItem.object_class > confidenceLevel ? "blue" : "red"}`
                    };

                    const animalNameStyle = {
                        backgroundColor: `${borderItem.object_class > confidenceLevel ? "blue" : "red"}`,
                    };

                    return (
                        <div
                            id={`${borderItem.id}_image`}
                            key={index}
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
