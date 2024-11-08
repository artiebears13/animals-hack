import {useContext} from "react";
import {FilesContext} from "../../contexts/FilesContext";

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
        setSizeThreshold((prev) => {
            return {
                ...prev,
                height: e.target.value
            }
        });
    }
    return (
        <div>
            <input
                type="number"
                value={sizeThreshold.width}
                onChange={setWidth}
            />
            <span> px</span>
            <input
                type="number"
                value={sizeThreshold.height}
                onChange={setHeight}
            />
            <span> px</span>
        </div>
    )
}