import React, {useContext, useEffect} from "react";
import {FilesContext} from "../../contexts/FilesContext";
import './ConfidenceLevelInput.css';

export const ConfidenceLevelInput = () => {
    const {
        confidenceLevel,
        setConfidenceLevel,
    } = useContext(FilesContext);

    useEffect(() => {
        updateSliderBackground();
    }, [confidenceLevel]);

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

    const handleSliderChange = (e) => {
        setConfidenceLevel(parseFloat(e.target.value));
    };

    const handleInputChange = (e) => {
        let value = parseFloat(e.target.value);
        if (value < 0.8) value = 0.8;
        if (value > 0.99) value = 0.99;
        setConfidenceLevel(value);
    };

    return (
        <div className="confidence-level-container" style={{marginTop: '20px'}}>
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
    )
}