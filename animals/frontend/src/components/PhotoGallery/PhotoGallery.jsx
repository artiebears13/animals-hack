import { useContext, useState, useEffect } from "react";
import { FilesContext } from "../../contexts/FilesContext";
import { PhotoBox } from "../PhotoBox/PhotoBox";
import './PhotoGallery.css';

export const PhotoGallery = ({ setCurrentPage }) => {
    const { processedFiles } = useContext(FilesContext);

    // Single state for sorting
    const [sortOption, setSortOption] = useState('name-asc'); // 'name-asc', 'name-desc', 'date-asc', 'date-desc'

    // States for filtering
    const [classFilter, setClassFilter] = useState('all'); // 'all', '1', '0'
    const [animalsFilter, setAnimalsFilter] = useState(['all']); // ['all'] or array of animal names

    const [filteredPhotos, setFilteredPhotos] = useState([]);
    const [options, setOptions] = useState(['all']); // Initialize with 'all'

    // Extract unique animal names from processedFiles
    useEffect(() => {
        const animalNamesSet = new Set();
        processedFiles.forEach(file => {
            file.border.forEach(borderItem => {
                if (borderItem.animal_name) {
                    animalNamesSet.add(borderItem.animal_name);
                }
            });
        });

        // Convert Set to sorted array and add 'all' at the beginning
        const uniqueAnimalNames = ['all', ...Array.from(animalNamesSet).sort()];
        setOptions(uniqueAnimalNames);
    }, [processedFiles]);

    // Filtering and sorting photos
    useEffect(() => {
        // Clone processedFiles to avoid mutating original data
        let updatedPhotos = processedFiles.map(file => {
            // Filter the border array for the current photo
            let filteredBorders = file.border.filter(borderItem => {
                // Filter by class
                const classMatch = classFilter === 'all' || borderItem.object_class === parseInt(classFilter);

                // Filter by animals
                const animalMatch = animalsFilter.includes('all') || animalsFilter.includes(borderItem.animal_name);

                // Return true only if both conditions are met
                return classMatch && animalMatch;
            });

            // Return new file object with filtered borders, if any
            return {
                ...file,
                border: filteredBorders
            };
        })
            // Filter out photos that have no borders after filtering
            .filter(file => file.border.length > 0);

        // Apply sorting based on sortOption
        switch (sortOption) {
            case 'name-asc':
                updatedPhotos.sort((a, b) => a.filename.toLowerCase().localeCompare(b.filename.toLowerCase()));
                break;
            case 'name-desc':
                updatedPhotos.sort((a, b) => b.filename.toLowerCase().localeCompare(a.filename.toLowerCase()));
                break;
            case 'date-asc':
                updatedPhotos.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'date-desc':
                updatedPhotos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            default:
                // Default sorting by name ascending
                updatedPhotos.sort((a, b) => a.filename.toLowerCase().localeCompare(b.filename.toLowerCase()));
        }

        setFilteredPhotos(updatedPhotos);
    }, [processedFiles, sortOption, classFilter, animalsFilter]);

    // Handler for sorting selection
    const handleSortChange = (e) => {
        setSortOption(e.target.value);
    };

    // Handlers for filtering
    const handleFilterByClass = (selectedClass) => {
        setClassFilter(selectedClass);
    };

    const handleFilterByAnimals = (animalName) => {
        if (animalName === 'all') {
            setAnimalsFilter(['all']);
        } else {
            setAnimalsFilter(prev => {
                // If 'all' is selected, remove it when another animal is selected
                if (prev.includes('all')) {
                    return [animalName];
                }

                // Toggle the selected animal in the filter
                if (prev.includes(animalName)) {
                    const newFilters = prev.filter(name => name !== animalName);
                    // If no filters are left, revert to 'all'
                    return newFilters.length > 0 ? newFilters : ['all'];
                } else {
                    return [...prev, animalName];
                }
            });
        }
    };

    // Check if a specific animal is selected
    const isAnimalSelected = (animalName) => {
        return animalsFilter.includes(animalName);
    };

    // Check if 'all' is selected
    const isAllSelected = () => {
        return animalsFilter.includes('all');
    };

    return (
        <div className="main-page">
            <div className="photo-gallery">
                {/* Controls for sorting and filtering */}
                <div className="controls">
                    {/* Dropdown for sorting */}
                    <select className="btn class-select" value={sortOption} onChange={handleSortChange}>
                        <option value="name-asc">Сортировать по имени (A-Z)</option>
                        <option value="name-desc">Сортировать по имени (Z-A)</option>
                        <option value="date-asc">Сортировать по дате (старые сначала)</option>
                        <option value="date-desc">Сортировать по дате (новые сначала)</option>
                    </select>

                    {/* Dropdown for filtering by class */}
                    <select className="btn class-select" value={classFilter}
                            onChange={(e) => handleFilterByClass(e.target.value)}>
                        <option value="all">Все классы</option>
                        <option value="1">Хороший (1)</option>
                        <option value="0">Плохой (0)</option>
                    </select>

                    {/* Checkboxes for filtering by animals */}
                    <div className="animal-filters">
                        <label>
                            <input
                                type="checkbox"
                                checked={isAllSelected()}
                                onChange={() => handleFilterByAnimals('all')}
                            />
                            Все животные
                        </label>
                        {options.filter(animal => animal !== 'all').map((animal) => (
                            <label key={animal}>
                                <input
                                    type="checkbox"
                                    checked={isAnimalSelected(animal)}
                                    onChange={() => handleFilterByAnimals(animal)}
                                />
                                {animal}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Display filtered photos */}
                <div className="photo-gallery-content">
                    {filteredPhotos && filteredPhotos.length > 0 ? (
                        filteredPhotos.map((photo, index) => (
                            <PhotoBox key={index} processedFile={photo} />
                        ))
                    ) : (
                        <div className="no-photos-container">
                            <p className="no-photos">Загрузите фотографии</p>
                            <button className="btn btn-secondary" onClick={() => setCurrentPage('main')}>На главную</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
