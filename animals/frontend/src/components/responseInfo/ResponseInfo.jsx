// src/components/responseInfo/ResponseInfo.js

import React, { useContext } from 'react';
import { FilesContext } from '../../contexts/FilesContext';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

const ResponseInfo = () => {
    const { showToast, setShowToast, responseMessage } = useContext(FilesContext);

    const onClose = () => {
        setShowToast(false);
    };

    if (!showToast || !responseMessage) return null;

    return (
        <ToastContainer position="top-end" className="p-3">
            <Toast show={showToast} onClose={onClose} delay={5000} autohide>
                <Toast.Header>
                    <strong className="me-auto">Результат загрузки</strong>
                </Toast.Header>
                <Toast.Body>{responseMessage}</Toast.Body>
            </Toast>
        </ToastContainer>
    );
};

export default ResponseInfo;
