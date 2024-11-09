import pandas as pd


class BoundingBoxConverter:
    def __init__(self, df: pd.DataFrame, input_format: str):
        self.df = df.copy()
        self.input_format = input_format
        self._supported_formats = ["YOLO", "COCO", "PascalVOC"]

        self._parse_input_format()

    def _parse_input_format(self):
        print(self._supported_formats)
        if self.input_format not in self._supported_formats:
            raise ValueError(f"Unsupported input format. Choose one from {self._supported_formats}.")

        self.df[[
            "x_center", "y_center", "bbox_width", "bbox_height"
        ]] = self.df["Bbox"].str.split(",", expand=True).astype(float)

        self.df["x_min"] = self.df["x_center"] - self.df["bbox_width"] / 2
        self.df["x_max"] = self.df["x_min"] + self.df["bbox_width"]
        self.df["y_min"] = self.df["y_center"] - self.df["bbox_height"] / 2
        self.df["y_max"] = self.df["y_min"] + self.df["bbox_height"]

    def to_yolo(self):
        self.df["YOLO"] = (
            self.df["x_center"].astype(str) + "_" +
            self.df["y_center"].astype(str) + "_" +
            self.df["bbox_width"].astype(str) + "_" +
            self.df["bbox_height"].astype(str)
        )
        return self.df[["YOLO"]]

    def to_coco(self):
        self.df["COCO"] = (
            self.df["x_min"].astype(str) + "_" +
            self.df["y_min"].astype(str) + "_" +
            self.df["bbox_width"].astype(str) + "_" +
            self.df["bbox_height"].astype(str)
        )
        return self.df[["COCO"]]

    def to_pascal_voc(self):
        self.df["PascalVOC"] = (
            self.df["x_min"].astype(str) + "_" +
            self.df["y_min"].astype(str) + "_" +
            self.df["x_max"].astype(str) + "_" +
            self.df["y_max"].astype(str)
        )
        return self.df[["PascalVOC"]]

    def convert(self, target_format: str):
        if target_format == "YOLO":
            return self.to_yolo()
        elif target_format == "COCO":
            return self.to_coco()
        elif target_format == "PascalVOC":
            return self.to_pascal_voc()
        else:
            raise ValueError(f"Unsupported target format. Choose one from {self._supported_formats}.")
