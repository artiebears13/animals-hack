// src/components/photoPreview/PhotoPreview.js
import './PhotoPreview.css';
import React, { useEffect, useState } from 'react';

const PhotoPreview = ({ file }) => {
    const [preview, setPreview] = useState("");

    useEffect(() => {
        if (!file) {
            setPreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    if (!file) return null;

    return (
        <div className="photo-preview-container" style={{ marginTop: '20px' }}

        >
            <img
                className="photo-preview-img"
                src={preview}
                alt={file.name}
            />


        </div>
    );
};

export default PhotoPreview;
