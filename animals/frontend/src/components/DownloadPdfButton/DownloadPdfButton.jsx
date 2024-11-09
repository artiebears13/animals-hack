import React, {useContext, useState} from "react";
import {FilesContext} from "../../contexts/FilesContext";
import {getPdfFile} from "../../api/api";
import './DownloadPdfButton.css'
import DownloadIcon from '@mui/icons-material/Download';
export const DownloadPdfButton = () => {
    const { jobId, setError } = useContext(FilesContext);
    const [clicked, setClicked] = useState(false);
    const handleClick = async () => {
        setClicked(true);
        try {
            await getPdfFile(jobId);
        }
        catch (e){
            console.error(e);
            setError("Не удалось скачать изображение");
        }
        // Reset animation after it finishes
        setTimeout(() => setClicked(false), 1000);
    };

    return (
        <button
            className={`btn btn-secondary DownloadPdfButton ${clicked ? 'clicked' : ''}`}
            onClick={handleClick}
            title="Скачать PDF"
        >
            <DownloadIcon />
        </button>
    )
}