// src/components/file_uploader/FileUploader.js

import React, { useState, useRef, useContext, useEffect } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { FilesContext } from '../../contexts/FilesContext';
import './FileUploader.css';
import PhotoPreview from "../photoPreview/PhotoPreview";
import { SizeInput } from "../SizeInput/SizeInput";

const FileUploader = () => {
    const {
        files,
        loading,
        error,
        confidenceLevel,
        setConfidenceLevel,
        uploadFiles,
        setUploadedFiles,
        setJobId,
    } = useContext(FilesContext);

    const [errorMessage, setErrorMessage] = useState('');

    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null); // Новый реф для папок
    const inputAreaRef = useRef(null); // Новый реф для папок

    const popoverContent = `Допустимые форматы: jpeg, png`;

    useEffect(() => {
        updateSliderBackground();
    }, [confidenceLevel]);

    const allowedMimeTypes = ['image/jpeg', 'image/png'];

    const inputAreaClick = (e) => {
    }

    const handleFileButtonClick = (e) => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFolderButtonClick = (e) => {
        e.stopPropagation();
        if (folderInputRef.current) {
            folderInputRef.current.click();
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');

        const items = e.dataTransfer.items;
        const droppedFiles = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i].webkitGetAsEntry();
            if (item) {
                await traverseFileTree(item, '', droppedFiles); // Начальный путь пустой
            }
        }

        if (droppedFiles.length > 0) {
            handleFiles(droppedFiles);
        }

        e.dataTransfer.clearData();
    };

    const traverseFileTree = (item, path, fileList) => {
        return new Promise((resolve) => {
            if (item.isFile) {
                item.file((file) => {
                    fileList.push({
                        file: file,
                        camera: path || 'root',
                    });
                    resolve();
                });
            } else if (item.isDirectory) {
                const dirReader = item.createReader();
                dirReader.readEntries((entries) => {
                    const promises = [];
                    for (let i = 0; i < entries.length; i++) {
                        // Обновляем путь, добавляя текущую папку
                        promises.push(traverseFileTree(entries[i], path ? `${path}/${item.name}` : item.name, fileList));
                    }
                    Promise.all(promises).then(() => resolve());
                });
            } else {
                resolve();
            }
        });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files).map(file => ({
                file: file,
                camera: file.webkitRelativePath.split("/").slice(-2, -1)[0] || "Нет данных",
            }));
            handleFiles(selectedFiles);
            e.target.value = null;
        }
    };

    const handleFiles = (selectedFiles) => {
        const validFiles = [];
        const invalidFiles = [];

        selectedFiles.forEach(({ file, camera }) => {
            if (checkFileFormat(file)) {
                validFiles.push({ file, camera });
            } else {
                invalidFiles.push(file.name);
            }
        });

        if (invalidFiles.length > 0) {
            setErrorMessage(
                `Неверный формат файла: ${invalidFiles.join(
                    ', '
                )}. Пожалуйста, загрузите изображения в формате JPEG или PNG.`
            );
        } else {
            setErrorMessage('');
        }

        if (validFiles.length > 0) {
            setUploadedFiles([...files, ...validFiles]);
        }
    };

    const checkFileFormat = (file) => {
        return allowedMimeTypes.includes(file.type);
    };

    const handleSliderChange = (e) => {
        setConfidenceLevel(parseFloat(e.target.value));
    };

    const handleInputChange = (e) => {
        let value = parseFloat(e.target.value);
        if (value < 0.8) value = 0.8;
        if (value > 0.99) value = 0.99;
        setConfidenceLevel(value);
    };

    const handleUpload = () => {
        setJobId("");
        if (files.length === 0) {
            setErrorMessage('Пожалуйста, загрузите хотя бы один файл.');
            return;
        }
        uploadFiles();
    };

    const deleteFile = (index) => {
        const updatedFiles = [...files];
        updatedFiles.splice(index, 1);
        setUploadedFiles(updatedFiles);
        setErrorMessage('');
    };

    const renderPopover = (title, content) => (
        <Popover id="popover-basic">
            <Popover.Header as="h3">{title}</Popover.Header>
            <Popover.Body>{content}</Popover.Body>
        </Popover>
    );

    const updateSliderBackground = () => {
        const slider = document.querySelector('.confidence-slider');
        if (slider) {
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            const value = parseFloat(slider.value);
            const percentage = ((value - min) / (max - min)) * 100;
            slider.style.background = `linear-gradient(to right, #f4c142 0%, #f4c142 ${percentage}%, #2c3034 ${percentage}%, #2c3034 100%)`;
        }
    };

    return (
        <div>
            <div
                id="import-area"
                onClick={inputAreaClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className="drag-drop-field"
            >
                <i className="fa-regular fa-file-image fa-3x"></i>
                <h3>
                    Перетащите изображения или папку сюда <br />
                    или <span className="text-warning">выберите их вручную</span>
                </h3>
                <div className="drag-drop-field__extensions">
                    Изображения (JPEG, PNG)
                </div>
                {/* Скрытый input для файлов */}
                <input
                    id="image-input"
                    type="file"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/jpeg, image/png"
                    multiple
                />
                <input
                    id="input-area"
                    type="file"
                    onChange={handleFileChange}
                    ref={inputAreaRef}
                    style={{ display: 'none' }}
                    accept="image/jpeg, image/png"
                    multiple
                />
                {/* Скрытый input для папок */}
                <input
                    id="folder-input"
                    type="file"
                    onChange={handleFileChange}
                    ref={folderInputRef}
                    style={{ display: 'none' }}
                    accept="image/jpeg, image/png"
                    multiple
                    webkitdirectory="true"
                    directory=""
                />
                {/* Добавьте кнопки для выбора файлов и папок */}
                <div className="input-file-buttons-container" style={{ marginTop: '10px' }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={(e) => handleFileButtonClick(e)}
                    >
                        Выбрать файлы
                    </button>
                    <button
                        id="input-file"
                        type="button"
                        className="btn btn-secondary"
                        onClick={(e) => handleFolderButtonClick(e)}
                    >
                        Выбрать папку
                    </button>
                </div>
            </div>

            <div className="confidence-level-container" style={{ marginTop: '20px' }}>
                <h3>
                    Настройте уровень <span className="text-warning">уверенности</span> модели
                </h3>
                <div className="confidence-level-controls">
                    <input
                        type="range"
                        min="0.8"
                        max="0.99"
                        step="0.01"
                        value={confidenceLevel}
                        onChange={handleSliderChange}
                        className="confidence-slider"
                        aria-label="Уровень уверенности"
                    />
                    <input
                        type="number"
                        min="0.8"
                        max="0.99"
                        step="0.01"
                        value={confidenceLevel}
                        onChange={handleInputChange}
                        className="confidence-number"
                        aria-label="Уровень уверенности"
                    />
                </div>
            </div>
            <SizeInput />

            <div className="input-control__buttons" style={{ marginTop: '20px' }}>
                <button
                    className="btn btn-primary"
                    onClick={handleUpload}
                    disabled={files.length === 0 || loading}
                >
                    {loading ? 'Загрузка...' : 'Отправить'}
                </button>

                <button
                    className="btn btn-secondary"
                    onClick={() => setUploadedFiles([])}
                    disabled={files.length === 0 || loading}
                >
                    Очистить
                </button>

            </div>

            {errorMessage && (
                <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>
                    {errorMessage}
                </p>
            )}
            {error && (
                <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>
                    Ошибка: {error}
                </p>
            )}

            <div className="uploaded-file__container" style={{ marginTop: '20px' }}>
                {files.length > 0 &&
                    files.map(({ file, camera }, index) => (
                        <div
                            key={index}
                            className={`uploaded-file__item ${
                                checkFileFormat(file) ? '' : 'wrong'
                            }`}
                        >
                            {checkFileFormat(file) ? (
                                <PhotoPreview file={file} camera={camera} />
                            ) : (
                                <OverlayTrigger
                                    trigger={['hover', 'focus']}
                                    placement="top"
                                    overlay={renderPopover('Неверный формат', popoverContent)}
                                >
                                    <span>{file.name}</span>
                                </OverlayTrigger>
                            )}
                            <button
                                className="btn uploaded-file__button"
                                onClick={() => deleteFile(index)}
                            >
                             <span className="times-symbol">&times;</span>
                            </button>
                        </div>
                    ))}
            </div>
        </div>
    );

};

export default FileUploader;
