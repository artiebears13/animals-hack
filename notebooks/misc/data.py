import torch
import torchvision
import pandas
import numpy

from collections import defaultdict

from pathlib import Path
from PIL import Image

from ast import literal_eval


def series_to_array(series) -> numpy.ndarray:
    return numpy.stack(series.apply(lambda x : numpy.array(literal_eval('[' + x + ']'))))


def ccwh_to_xyxy(boxes_ccwh: numpy.ndarray) -> numpy.ndarray:
    boxes_xyxy = numpy.empty_like(boxes_ccwh)
    boxes_xyxy[:,:2] = boxes_ccwh[:,:2] - 0.5 * boxes_ccwh[:,2:]
    boxes_xyxy[:,2:] = boxes_ccwh[:,:2] + 0.5 * boxes_ccwh[:,2:]

    return boxes_xyxy


def xyxy_to_ccwh(boxes_xyxy: numpy.ndarray) -> numpy.ndarray:
    boxes_ccwh = numpy.empty_like(boxes_xyxy)
    boxes_ccwh[:,:2] = 0.5 * (boxes_xyxy[:,2:] + boxes_xyxy[:,:2])
    boxes_ccwh[:,2:] =        boxes_xyxy[:,2:] - boxes_xyxy[:,:2]

    return boxes_ccwh


def denormalize_xyxy(box_xyxy: numpy.ndarray, image_shape: tuple[int]) -> numpy.ndarray:
    return numpy.round(
            box_xyxy * \
            numpy.array(
                [image_shape[2], image_shape[1], image_shape[2], image_shape[1]]
            )
        )


def crop_xyxy(image, denormalized_box_xyxy: numpy.ndarray) -> numpy.ndarray:
    return image[...,int(denormalized_box_xyxy[1]):int(denormalized_box_xyxy[3]),int(denormalized_box_xyxy[0]):int(denormalized_box_xyxy[2])]


def random_bounding_box_xyxy(min_size: float=0.1) -> numpy.ndarray:
    bounding_box = numpy.random.rand(4)
    
    #bounding_box[0], bounding_box[2] = sorted([bounding_box[0], bounding_box[2]])
    #bounding_box[1], bounding_box[3] = sorted([bounding_box[1], bounding_box[3]])

    bounding_box[:2] *= (1.0 - min_size)
    bounding_box[2:]  = bounding_box[2:] * (1.0 - min_size - bounding_box[:2]) + bounding_box[:2] + min_size

    return bounding_box


def detection_results_to_annotations(results):
    annotations_pred = defaultdict(list)

    for result in results:
        if len(result["normalized_coords"]) == 0:
            continue

        xyxy_normalized_coords = numpy.array(result["normalized_coords"])
        ccwh_normalized_coords = xyxy_to_ccwh(xyxy_normalized_coords)
        
        for index in range(len(result["normalized_coords"])):
            annotations_pred["Name"].append(result["img_id"].split('/')[-1])
            annotations_pred["Bbox"].append(str(ccwh_normalized_coords[index].tolist())[1:-1]) # Remove '[' and ']'

            annotations_pred["xyxy_normalized_coords"].append(xyxy_normalized_coords[index])

            annotations_pred["label"].append(result["detections"].class_id[index])
            annotations_pred["confidence"].append(result["detections"].confidence[index])

    return pandas.DataFrame(annotations_pred)


def concatenate_collate_fn(batch):
    transposed = list(zip(*batch))

    return tuple(torch.concatenate(x, axis=0) for x in transposed)


class DetectorDataset(torch.utils.data.Dataset):
    def __init__(self, images_path: Path, annotation: pandas.DataFrame) -> None:

        self.images_path = images_path
        self.annotation = annotation

    def __len__(self) -> int:
        return len(self.annotation)

    def __getitem__(self, index):
        image_name = self.annotation["Name"][index]
        image_path = self.images_path / image_name
        
        image = numpy.array(Image.open(image_path).convert("RGB"))

        return image, image_path


class AnnotationlessDetectorDataset(torch.utils.data.Dataset):
    def __init__(self, images_path: Path) -> None:

        self.images_path = images_path
        self.filenames = [x.name for x in self.images_path.iterdir() if x.is_file()]

    def __len__(self) -> int:
        return len(self.filenames)

    def __getitem__(self, index):
        image_name = self.filenames[index]
        image_path = self.images_path / image_name
        
        image = numpy.array(Image.open(image_path).convert("RGB"))

        return image, image_path


# class ClassifierDataset(torch.utils.data.Dataset):
#     def __init__(self, images_path: Path, annotation: pandas.DataFrame,
#                  transform) -> None:
# 
#         self.images_path = images_path
#         self.annotation = annotation
#         self.unique_names = self.annotation["Name"].unique()
#         #self.bounding_boxes = series_to_array(self.annotation["Bbox"])
# 
#         self.load_transform = torchvision.transforms.ToTensor()
#         self.transform = transform
# 
#     def __len__(self) -> int:
#         return len(self.unique_names)
# 
#     def __getitem__(self, index):
#         image_name = self.unique_names[index]
#         image_path = self.images_path / image_name
#         
#         image = self.load_transform(Image.open(image_path))
#         
#         bounding_boxes = ccwh_to_xyxy(series_to_array(self.annotation[self.annotation["Name"] == image_name]["Bbox"]))
#         denormalized_bounding_boxes = numpy.round(bounding_boxes * numpy.array([image.shape[1], image.shape[2], image.shape[1], image.shape[2]]))
# 
#         subimages = []
#         for dbb in denormalized_bounding_boxes:
#             subimages.append(
#                 self.transform(image[:,int(dbb[0]):int(dbb[2]),int(dbb[1]):int(dbb[3])])
#             )
#         subimages = torch.stack(subimages)
# 
#         #print([_.shape for _ in subimages])
#         return subimages, torch.tensor(self.annotation[self.annotation["Name"] == image_name]["Class"].to_numpy())#.unsqueeze(0)


class SimpleClassifierDataset(torch.utils.data.Dataset):
    """
    Main dataset for subimage classification.
    """
    
    def __init__(self, images_path: Path, annotation: pandas.DataFrame,
                 transform, enlarge_delta: float=0.05) -> None:

        self.images_path = images_path
        self.annotation = annotation
        self.bounding_boxes = ccwh_to_xyxy(series_to_array(self.annotation["Bbox"]))

        self.load_transform = torchvision.transforms.ToTensor()
        self.transform = transform

        self.enlarge_delta = enlarge_delta

    def __len__(self) -> int:
        return len(self.annotation)

    def __getitem__(self, index: int) -> tuple[torch.Tensor, torch.Tensor, int]:
        image_name = self.annotation["Name"][index]
        image_path = self.images_path / image_name
        
        image = self.load_transform(Image.open(image_path))
        
        bounding_box = self.bounding_boxes[index]
        enlarged_bounding_box = numpy.clip(bounding_box + self.enlarge_delta * numpy.array([-1, -1, 1, 1]), 0.0, 1.0)
        denormalized_bounding_box = denormalize_xyxy(enlarged_bounding_box, image.shape)

        subimage = self.transform(crop_xyxy(image, denormalized_bounding_box))
        #area = (bounding_box[2] - bounding_box[0]) * (bounding_box[3] - bounding_box[1])

        return torch.clamp(subimage, 0.0, 0.999), torch.tensor(bounding_box, dtype=torch.float32), self.annotation["Class"][index]


class SupplementaryDataset(torch.utils.data.Dataset):
    """
    Supplementary dataset to draw negative pairs from.
    """
    
    def __init__(self, images_path: Path, transform) -> None:
        self.images_path = images_path
        self.filenames = [x.name for x in self.images_path.iterdir() if x.is_file()]

        self.load_transform = torchvision.transforms.ToTensor()
        self.transform = transform

    def __len__(self) -> int:
        return len(self.filenames)

    def __getitem__(self, index: int) -> tuple[torch.Tensor, torch.Tensor, int]:
        image_name = self.filenames[index]
        image_path = self.images_path / image_name

        image = self.load_transform(Image.open(image_path))

        bounding_box = random_bounding_box_xyxy()
        denormalized_bounding_box = denormalize_xyxy(bounding_box, image.shape)

        subimage = self.transform(crop_xyxy(image, denormalized_bounding_box))

        return torch.clamp(subimage, 0.0, 0.999), torch.tensor(bounding_box, dtype=torch.float32), 0