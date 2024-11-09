import matplotlib.pyplot as plt
import tritonclient.grpc as grpcclient
from PIL import Image
from ultralytics import YOLO
import torch
import numpy as np



url = "http://triton:8002/detector"
model_name = "detector"
client = grpcclient.InferenceServerClient(url=url)
CONF_THRESHOLD = 0.4
IOU_THRESHOLD = 0.5
MODEL = YOLO(url, task="detect")


def postprocess(output: torch.Tensor, conf_threshold: float, iou_threshold: float) -> list:
    batch_size = output.shape[0]
    final_boxes = []

    for i in range(batch_size):
        boxes = output[i]  # [7, 8400]
        xc, yc, w, h, conf, cls_conf, cls_id = boxes[:7]  # Extracting coordinates and confidences
        boxes = boxes.permute(1, 0)  # [8400, 7]

        # Convert xc, yc, w, h to x1, y1, x2, y2 format
        boxes[:, 0] = boxes[:, 0] - boxes[:, 2] / 2  # x1
        boxes[:, 1] = boxes[:, 1] - boxes[:, 3] / 2  # y1
        boxes[:, 2] = boxes[:, 0] + boxes[:, 2]  # x2
        boxes[:, 3] = boxes[:, 1] + boxes[:, 3]  # y2

        # Apply confidence threshold
        conf_mask = boxes[:, 4] > conf_threshold
        boxes = boxes[conf_mask]

        # Apply Non-Maximum Suppression (NMS)
        keep_boxes = []
        while len(boxes) > 0:
            max_conf_idx = torch.argmax(boxes[:, 4])
            best_box = boxes[max_conf_idx]
            keep_boxes.append(best_box)
            boxes = torch.cat([boxes[:max_conf_idx], boxes[max_conf_idx + 1:]])
            ious = calculate_iou(best_box[:4], boxes[:, :4])
            boxes = boxes[ious < iou_threshold]

        final_boxes.append(torch.stack(keep_boxes))

    return final_boxes


def calculate_iou(box1: torch.Tensor, boxes: torch.Tensor) -> torch.Tensor:
    # Calculate intersection
    x1 = torch.max(box1[0], boxes[:, 0])
    y1 = torch.max(box1[1], boxes[:, 1])
    x2 = torch.min(box1[2], boxes[:, 2])
    y2 = torch.min(box1[3], boxes[:, 3])

    intersection = (x2 - x1).clamp(0) * (y2 - y1).clamp(0)

    # Calculate union
    box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
    boxes_area = (boxes[:, 2] - boxes[:, 0]) * (boxes[:, 3] - boxes[:, 1])
    union = box1_area + boxes_area - intersection

    return intersection / union


def prepare_image(image_path):
    image = Image.open(image_path)
    size = image.size
    image = image.resize((640, 640))
    image_array = np.array(image).astype(np.float32)

    image_array /= 255.0
    image_array = image_array.transpose(2, 0, 1)
    image_array = image_array[None, :]
    return image_array, size


def call_triton(image_path: str = f"cat.jpg") -> list[dict]:
    image: np.ndarray = plt.imread(image_path)  # (h, w, c)
    images = MODEL(image)
    output = []
    for image in images:
        for box in image.boxes:
            output.append({
                "xyxy": box.xyxy.flatten().tolist(),
                "conf": float(box.conf),
                "cls": int(box.cls),
            })
    print(output)
    return output


if __name__ == "__main__":
    call_triton()