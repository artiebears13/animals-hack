import numpy
import pandas

from .data import *


def intersection_over_union_pairwise(boxes_xyxy_1, boxes_xyxy_2):
    x11, y11, x12, y12 = numpy.split(boxes_xyxy_1, 4, axis=1)
    x21, y21, x22, y22 = numpy.split(boxes_xyxy_2, 4, axis=1)
    
    xA = numpy.maximum(x11, numpy.transpose(x21))
    yA = numpy.maximum(y11, numpy.transpose(y21))
    xB = numpy.minimum(x12, numpy.transpose(x22))
    yB = numpy.minimum(y12, numpy.transpose(y22))
    
    intersection_area = numpy.maximum((xB - xA), 0) * numpy.maximum((yB - yA), 0)
    
    boxAArea = (x12 - x11) * (y12 - y11)
    boxBArea = (x22 - x21) * (y22 - y21)

    return intersection_area / (boxAArea + numpy.transpose(boxBArea) - intersection_area)


def intersection_over_union(boxes_xyxy_1, boxes_xyxy_2):
    x11, y11, x12, y12 = numpy.split(boxes_xyxy_1, 4, axis=1)
    x21, y21, x22, y22 = numpy.split(boxes_xyxy_2, 4, axis=1)
    
    xA = numpy.maximum(x11, x21)
    yA = numpy.maximum(y11, y21)
    xB = numpy.minimum(x12, x22)
    yB = numpy.minimum(y12, y22)
    
    intersection_area = numpy.maximum((xB - xA), 0) * numpy.maximum((yB - yA), 0)
    
    boxAArea = (x12 - x11) * (y12 - y11)
    boxBArea = (x22 - x21) * (y22 - y21)
    
    return intersection_area / (boxAArea + boxBArea - intersection_area)


def calculate_metric(annotation_true, annotation_pred, IoU_treshold: float=0.5):
    data = annotation_true.join(annotation_pred, how="cross", lsuffix="_true", rsuffix="_pred")
    data = data[data["Name_true"] == data["Name_pred"]]

    IoU = intersection_over_union(
        ccwh_to_xyxy(series_to_array(data["Bbox_true"])), 
        ccwh_to_xyxy(series_to_array(data["Bbox_pred"]))
    )

    data["IoU"] = IoU
    data = data[data.groupby("Bbox_true")["IoU"].rank(ascending=False) <= 1].reset_index(drop=True)

    data["correct_Bbox"] = data["IoU"] > IoU_treshold
    data["correct_Class"] = data["Class_true"] == data["Class_pred"]

    data["points"] = (2 * data["correct_Bbox"] - 1) + 5 * (2 * data["correct_Class"] * data["correct_Bbox"] - 1)

    metric = data["points"].mean() / 6.0

    return metric, data