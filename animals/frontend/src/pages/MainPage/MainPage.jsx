// src/pages/MainPage.js

import React, { useContext, useEffect } from 'react';
import { FilesContext } from '../../contexts/FilesContext';
import ServerErrorToast from "../../components/serverErrorToast/ServerErrorToast";
import ResponseInfo from "../../components/responseInfo/ResponseInfo";
import PhotoPreview from "../../components/photoPreview/PhotoPreview";
import FileUploader from "../../components/FileUploader/FileUploader";

const MainPage = () => {
    const { loading, error, processedFiles } = useContext(FilesContext);


    return (
        <div className="main-page">
            <div className="container mt-4 main-bg">
                <svg xmlns="http://www.w3.org/2000/svg" className="d-none">
                    <symbol id="exclamation-triangle-fill" viewBox="0 0 16 16">
                        <path
                            d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                    </symbol>
                </svg>

                <div className="main-header">
                    <h1>
                        Загрузка изображений <br />
                        <span className="text-warning">AAA IT</span>
                    </h1>
                </div>
                {loading && (
                    <div className="big-center loader"></div>
                )}

                <FileUploader />

                <ResponseInfo />
                {error && <ServerErrorToast />}


            </div>
        </div>
    );
};

export default MainPage;
