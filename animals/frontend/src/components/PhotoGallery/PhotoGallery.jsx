import {useContext, useState, useEffect, useMemo} from "react";
import {FilesContext} from "../../contexts/FilesContext";
import {PhotoBox} from "../PhotoBox/PhotoBox";
import './PhotoGallery.css';
import {useNavigate} from "react-router-dom";

export const PhotoGallery = () => {
    const navigate = useNavigate();
    const {processedFiles} = useContext(FilesContext);

    // Состояния сортировки и фильтрации
    const [sortOption, setSortOption] = useState('name-asc');
    const [classFilter, setClassFilter] = useState('all');
    const [animalsFilter, setAnimalsFilter] = useState(['all']);
    const [cameraFilter, setCameraFilter] = useState(['all']);

    // Состояние для управления видимостью панели фильтров
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Опции для фильтров
    const [animalOptions, setAnimalOptions] = useState(['all']);
    const [cameraOptions, setCameraOptions] = useState(['all']);

    // Извлечение уникальных названий животных
    useEffect(() => {
        const animalNamesSet = new Set();
        processedFiles.forEach(file => {
            file.border.forEach(borderItem => {
                if (borderItem.animal_name) {
                    animalNamesSet.add(borderItem.animal_name);
                }
            });
        });

        const uniqueAnimalNames = ['all', ...Array.from(animalNamesSet).sort()];
        setAnimalOptions(uniqueAnimalNames);
    }, [processedFiles]);

    // Извлечение уникальных названий камер
    useEffect(() => {
        const cameraNamesSet = new Set();
        processedFiles.forEach(file => {
            if (file.camera) {
                cameraNamesSet.add(file.camera);
            }
        });

        const uniqueCameraNames = ['all', ...Array.from(cameraNamesSet).sort()];
        setCameraOptions(uniqueCameraNames);
    }, [processedFiles]);

    // Мемоизированные отфильтрованные и отсортированные фото
    const filteredPhotos = useMemo(() => {
        if (!Array.isArray(processedFiles)) return [];

        // Фильтрация
        const updatedPhotos = processedFiles.map(file => {
            // Фильтрация бордеров по классу и животным
            const filteredBorders = file.border.filter(borderItem => {
                const classMatch = classFilter === 'all' || borderItem.object_class === parseInt(classFilter);
                const animalMatch = animalsFilter.includes('all') || animalsFilter.includes(borderItem.animal_name);
                return classMatch && animalMatch;
            });

            // Проверка фильтра камеры
            const cameraMatch = cameraFilter.includes('all') || cameraFilter.includes(file.camera);

            // Включение файла только если он соответствует фильтру камеры и имеет отфильтрованные бордеры
            if (cameraMatch && filteredBorders.length > 0) {
                return {...file, border: filteredBorders};
            } else {
                return null;
            }
        }).filter(file => file !== null);

        // Сортировка
        return updatedPhotos.sort((a, b) => {
            switch (sortOption) {
                case 'name-asc':
                    return a.filename.toLowerCase().localeCompare(b.filename.toLowerCase());
                case 'name-desc':
                    return b.filename.toLowerCase().localeCompare(a.filename.toLowerCase());
                case 'date-asc':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'date-desc':
                    return new Date(b.created_at) - new Date(a.created_at);
                default:
                    return a.filename.toLowerCase().localeCompare(b.filename.toLowerCase());
            }
        });
    }, [processedFiles, sortOption, classFilter, animalsFilter, cameraFilter]);

    // Обработчики событий
    const handleSortChange = (e) => setSortOption(e.target.value);

    const handleFilterByClass = (selectedClass) => setClassFilter(selectedClass);

    const handleFilterByAnimals = (animalName) => {
        if (animalName === 'all') {
            setAnimalsFilter(['all']);
        } else {
            setAnimalsFilter(prev => {
                if (prev.includes('all')) {
                    return [animalName];
                }
                if (prev.includes(animalName)) {
                    const newFilters = prev.filter(name => name !== animalName);
                    return newFilters.length > 0 ? newFilters : ['all'];
                } else {
                    return [...prev, animalName];
                }
            });
        }
    };

    const handleFilterByCamera = (cameraName) => {
        if (cameraName === 'all') {
            setCameraFilter(['all']);
        } else {
            setCameraFilter(prev => {
                if (prev.includes('all')) {
                    return [cameraName];
                }
                if (prev.includes(cameraName)) {
                    const newFilters = prev.filter(name => name !== cameraName);
                    return newFilters.length > 0 ? newFilters : ['all'];
                } else {
                    return [...prev, cameraName];
                }
            });
        }
    };

    // Вспомогательные функции
    const isAnimalSelected = (animalName) => animalsFilter.includes(animalName);
    const isAllAnimalsSelected = () => animalsFilter.includes('all');

    const isCameraSelected = (cameraName) => cameraFilter.includes(cameraName);
    const isAllCamerasSelected = () => cameraFilter.includes('all');

    // Обработчик открытия/закрытия панели фильтров
    const toggleFilters = () => setFiltersOpen(!filtersOpen);

    return (
        <div className="main-page">
            <h1 className="results-header">Результаты обработки</h1>
            <div className="photo-gallery">
                {/* Элементы управления сортировкой и фильтрацией */}
                <div className="controls">
                    {/* Выпадающий список для сортировки */}
                    <select
                        className="btn class-select sort-button"
                        value={sortOption}
                        onChange={handleSortChange}
                        aria-label="Сортировка"
                    >
                        <option value="name-asc">Сортировать по имени (A-Z)</option>
                        <option value="name-desc">Сортировать по имени (Z-A)</option>
                        <option value="date-asc">Сортировать по дате (старые сначала)</option>
                        <option value="date-desc">Сортировать по дате (новые сначала)</option>
                    </select>

                    {/* Кнопка "Фильтры" */}
                    <button className="btn filter-button" onClick={toggleFilters} aria-label="Открыть фильтры">
                        Фильтры
                    </button>
                </div>

                {/* Панель фильтров */}
                {filtersOpen && (
                    <div className="filters-panel">
                        {/* Фильтр по камерам */}
                        <div className="filter-section">
                            <h3>Камера:</h3>
                            {cameraOptions.map((camera) => (
                                <label key={camera}>
                                    <input
                                        type="checkbox"
                                        checked={isCameraSelected(camera)}
                                        onChange={() => handleFilterByCamera(camera)}
                                        aria-label={camera}
                                    />
                                    {camera}
                                </label>
                            ))}
                        </div>

                        {/* Фильтр по животным */}
                        <div className="filter-section">
                            <h3>Животные:</h3>
                            {animalOptions.map((animal) => (
                                <label key={animal}>
                                    <input
                                        type="checkbox"
                                        checked={isAnimalSelected(animal)}
                                        onChange={() => handleFilterByAnimals(animal)}
                                        aria-label={animal}
                                    />
                                    {animal}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Отображение отфильтрованных фотографий */}
                <div className="photo-gallery-content">
                    {filteredPhotos.length > 0 ? (
                        filteredPhotos.map((photo, index) => (
                            <div className="photo-gallery-item" key={photo.id}>
                                <PhotoBox id={photo.filename} key={photo.id || photo.filename} processedFile={photo}/>
                                <div className="photo-description-container"
                                >
                                    <div className="photo-description-animal">
                                        <div className="photo-description-animal-header">
                                            <div className="photo-description-filename">
                                                <h2><code>{photo.filename}</code></h2>
                                            </div>
                                            <div className="photo-description-created-time">
                                                Дата: {new Date(photo.created_at).toLocaleString('ru-RU', {
                                                hour12: false,
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                            </div>
                                        </div>
                                        <div className="photo-description-animal-body">
                                            {photo.border.length > 1 ?
                                                <>
                                                    <h3>Объекты</h3>

                                                    <div className="photo-description-objects">
                                                        {photo.border.map((border, index) => (
                                                            <div
                                                                key={index}
                                                                className="photo-description-animal-item"
                                                                style={{borderColor: `${border.object_class === 1 ? "blue" : "red"}`}}
                                                            >
                                                                <h2 className="photo-description-animal-item__name">{border.animal_name}</h2>
                                                                <p className="photo-description-animal-item__class">Класс: {`${border.object_class === 1 ? "Пригодный" : "Вспомагательный"}`}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                                :
                                                <>
                                                </>
                                            }
                                        </div>

                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-photos-container">
                            <p className="no-photos">Загрузите фотографии</p>
                            <button className="btn btn-secondary" onClick={() => navigate('/')}>На главную</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
