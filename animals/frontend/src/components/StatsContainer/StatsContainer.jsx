import React, {useContext, useState} from 'react';
import Modal from 'react-modal';
import './StatsContainer.css'
import {FilesContext} from "../../contexts/FilesContext";

Modal.setAppElement('#root');

export const StatsContainer = ({buttonClassName}) => {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const { stats } = useContext(FilesContext);
    // const stats = {
    //     total_files_upload: 10,
    //     total_class1_files: 3,
    //     total_class0_files: 5,
    //     total_files_without_objects: 2,
    //     average_animals_per_photo: 2.3,
    //     total_bbox_number: 23,
    // };

    const openModal = () => setModalIsOpen(true);
    const closeModal = () => setModalIsOpen(false);

    return (
        <div style={{ textAlign: 'center' }}>
            <button onClick={openModal} className={"btn class-select sort-button"}>Статистика</button>

            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                style={modalStyles}
                contentLabel="Статистика загрузки файлов"
            >
                <h2 style={headerStyle}>Статистика загрузки файлов</h2>
                <table style={tableStyle}>
                    <tbody>
                    <tr>
                        <td style={cellStyle}>Всего загружено файлов:</td>
                        <td style={cellStyle}>{stats.total_files_upload}</td>
                    </tr>
                    <tr>
                        <td style={cellStyle}>Файлов с классом 1:</td>
                        <td style={cellStyle}>{stats.total_class1_files}</td>
                    </tr>
                    <tr>
                        <td style={cellStyle}>Файлов с классом 0:</td>
                        <td style={cellStyle}>{stats.total_class0_files}</td>
                    </tr>
                    <tr>
                        <td style={cellStyle}>Файлы без объектов:</td>
                        <td style={cellStyle}>{stats.total_files_without_objects}</td>
                    </tr>
                    <tr>
                        <td style={cellStyle}>Среднее количество животных на фото:</td>
                        <td style={cellStyle}>{stats.average_animals_per_photo}</td>
                    </tr>
                    <tr>
                        <td style={cellStyle}>Общее количество боксов:</td>
                        <td style={cellStyle}>{stats.total_bbox_number}</td>
                    </tr>
                    </tbody>
                </table>
                <button onClick={closeModal} style={buttonStyle}>Закрыть</button>
            </Modal>
        </div>
    );
};

// Стили для кнопки
const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '20px',
};

// Стили для модального окна и оверлея
const modalStyles = {
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        padding: '20px',
        width: '300px',
        borderRadius: '8px',
        backgroundColor: '#121212',
        color: '#ffffff',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        border: 'none',
    },
};

// Стили для заголовка модального окна
const headerStyle = {
    color: '#ffffff',
    marginBottom: '10px',
    textAlign: 'center',
};

// Стили для таблицы
const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
    color: '#ddd',
};

// Стили для ячеек таблицы
const cellStyle = {
    padding: '2px 16px', // Увеличиваем отступы внутри ячеек для большего расстояния между столбцами
};

export default StatsContainer;
