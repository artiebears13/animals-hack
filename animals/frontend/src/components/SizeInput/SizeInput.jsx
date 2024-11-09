import {useContext} from "react";
import {FilesContext} from "../../contexts/FilesContext";
import './SizeInput.css';

export const SizeInput = () => {
    const {sizeThreshold, setSizeThreshold} = useContext(FilesContext);

    const setWidth = (e) => {
        setSizeThreshold((prev) => {
            return {
                ...prev,
                width: e.target.value
            }
        });
    }

    const setHeight = (e) => {
        console.log("setHeight");
        setSizeThreshold((prev) => {
            return {
                ...prev,
                height: e.target.value
            }
        });
    }
    return (
        <div className="size-input-container">
            <h3>Минимальный размер объекта: </h3>
            <input
                className="size-input-field"
                type="number"
                value={sizeThreshold.width}
                onChange={setWidth}
            />
            X
            <input
                className="size-input-field"
                type="number"
                value={sizeThreshold.height}
                onChange={setHeight}
            />
            <span> px</span>
        </div>
    )
}