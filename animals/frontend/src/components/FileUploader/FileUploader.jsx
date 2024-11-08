// src/components/file_uploader/FileUploader.js

import React, { useState, useRef, useContext, useEffect } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { FilesContext } from '../../contexts/FilesContext';
import './FileUploader.css';
import PhotoPreview from "../photoPreview/PhotoPreview";
import {SizeInput} from "../SizeInput/SizeInput";

const FileUploader = () => {
    const {
        files,
        loading,
        error,
        confidenceLevel,
        setConfidenceLevel,
        uploadFiles,
        setUploadedFiles,
    } = useContext(FilesContext);

    const [errorMessage, setErrorMessage] = useState('');

    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null); // Новый реф для папок
    const inputAreaRef = useRef(null); // Новый реф для папок

    const popoverContent = `Допустимые форматы: jpeg, png, gif`;

    useEffect(() => {
        updateSliderBackground();
    }, [confidenceLevel]);

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

    const inputAreaClick = (e) => {
        // // e.preventDefault();
        // console.log(e.target.id);
        // if ((e.target.id ==="import-area")  && inputAreaRef.current) {
        //     console.log("inputAreaClick");
        //     inputAreaRef.current.click();
        // }
    }



    // Обработчик клика для выбора файлов
    const handleFileButtonClick = (e) => {

        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Обработчик клика для выбора папок
    const handleFolderButtonClick = (e) => {
        console.log("folderButtonClick");
        e.stopPropagation(); // Останавливаем всплытие события
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
                await traverseFileTree(item, droppedFiles);
            }
        }

        if (droppedFiles.length > 0) {
            handleFiles(droppedFiles);
        }

        e.dataTransfer.clearData();
    };

    const traverseFileTree = (item, fileList) => {
        return new Promise((resolve) => {
            if (item.isFile) {
                item.file((file) => {
                    fileList.push(file);
                    resolve();
                });
            } else if (item.isDirectory) {
                const dirReader = item.createReader();
                dirReader.readEntries((entries) => {
                    const promises = [];
                    for (let i = 0; i < entries.length; i++) {
                        promises.push(traverseFileTree(entries[i], fileList));
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
            const selectedFiles = Array.from(e.target.files);
            handleFiles(selectedFiles);
        }
    };

    const handleFiles = (selectedFiles) => {
        const validFiles = [];
        const invalidFiles = [];

        selectedFiles.forEach((file) => {
            if (checkFileFormat(file)) {
                validFiles.push(file);
            } else {
                invalidFiles.push(file.name);
            }
        });

        if (invalidFiles.length > 0) {
            setErrorMessage(
                `Неверный формат файла: ${invalidFiles.join(
                    ', '
                )}. Пожалуйста, загрузите изображения в формате JPEG, PNG или GIF.`
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

    // Обработчик изменения ползунка уверенности
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
        if (files.length === 0) {
            setErrorMessage('Пожалуйста, загрузите хотя бы один файл.');
            return;
        }
        uploadFiles();
    };

    // Функция удаления выбранного файла
    const deleteFile = (index) => {
        const updatedFiles = [...files];
        updatedFiles.splice(index, 1);
        setUploadedFiles(updatedFiles);
        setErrorMessage('');
    };

    // Функция рендера поповера
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
            // Устанавливаем градиентный фон: желтый до ползунка, #2c3034 после
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
                    Изображения (JPEG, PNG, GIF)
                </div>
                {/* Скрытый input для файлов */}
                <input
                    id="image-input"
                    type="file"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/jpeg, image/png, image/gif"
                    multiple
                />
                <input
                    id="input-area"
                    type="file"
                    onChange={handleFileChange}
                    ref={inputAreaRef}
                    style={{ display: 'none' }}
                    accept="image/jpeg, image/png, image/gif"
                    multiple
                />
                {/* Скрытый input для папок */}
                <input
                    id="folder-input"
                    type="file"
                    onChange={handleFileChange}
                    ref={folderInputRef}
                    style={{ display: 'none' }}
                    accept="image/jpeg, image/png, image/gif"
                    multiple
                    webkitdirectory="true" // Позволяет выбирать папки
                    directory="" // Для некоторых браузеров
                />
                {/* Добавьте кнопки для выбора файлов и папок */}
                <div style={{ marginTop: '10px' }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={(e) => handleFileButtonClick(e)}
                        style={{ marginRight: '10px' }}
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
                    files.map((file, index) => (
                        <div
                            key={index}
                            className={`uploaded-file__item ${
                                checkFileFormat(file) ? '' : 'wrong'
                            }`}
                        >
                            {checkFileFormat(file) ? (
                                <PhotoPreview file={file}/>
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
                                &times;
                            </button>
                        </div>
                    ))}
            </div>
        </div>
    );

};

export default FileUploader;
