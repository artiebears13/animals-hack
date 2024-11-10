import torch
import torchvision
import pandas
import numpy

from tqdm import tqdm, trange
from collections import defaultdict
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.pyplot import imshow

from IPython.display import clear_output

from . import metrics


class Classifier(torch.nn.Module):
    def __init__(self,# detector,
                 classifier: torch.nn.Module,
                 classifier_head: torch.nn.Module,
                 subimage_transform) -> None:
        super().__init__()

        #self.detector = detector
        self.classifier = classifier
        self.classifier_head = classifier_head

        self.subimage_transform = subimage_transform

    def forward(self, subimages: torch.Tensor, bounding_boxes: torch.Tensor) -> torch.Tensor:
        with torch.no_grad():
            subimages = self.subimage_transform(subimages)
            
        classifier_predictions = self.classifier(subimages)
        area = (bounding_boxes[:,2] - bounding_boxes[:,0]) * (bounding_boxes[:,3] - bounding_boxes[:,1])

        return self.classifier_head(classifier_predictions, bounding_boxes, area.detach().unsqueeze(-1))

    def predict(self, dataloader, device) -> numpy.ndarray:
        was_in_training = self.training
        self.eval()

        predictions = []

        with torch.no_grad():
            for batch in tqdm(dataloader):
                subimages, bounding_boxes, targets = batch
    
                subimages = subimages.to(device)
                bounding_boxes = bounding_boxes.to(device)
                targets = targets.to(device)
    
                y_pred = self.forward(subimages, bounding_boxes)
                predictions.append(y_pred.detach().cpu().numpy())

        self.train(self.training)

        predictions = numpy.concatenate(predictions, axis=0)

        return numpy.argmax(predictions, axis=-1), predictions


class ClassifierHead(torch.nn.Module):
    def __init__(self, input_dim: int, inner_dim: int=128, output_dim: int=2) -> None:
        super().__init__()

        self.linear_1 = torch.nn.Linear(input_dim + 5, inner_dim)
        #self.linear_1 = torch.nn.Linear(input_dim, inner_dim)
        self.linear_2 = torch.nn.Linear(inner_dim, output_dim)

        #self.batchnorm_1 = torch.nn.BatchNorm1d(input_dim + 5)
        #self.batchnorm_2 = torch.nn.BatchNorm1d(inner_dim)
        
        self.activation = torch.nn.LeakyReLU()
        self.output_activation = torch.nn.LogSoftmax(dim=-1)

    def forward(self, classifier_outputs: torch.Tensor, bounding_boxes: torch.Tensor, area: torch.Tensor) -> torch.Tensor:
        x = torch.concatenate([classifier_outputs, bounding_boxes, area], dim=-1)
        #x = classifier_outputs
        #x = self.batchnorm_1(x)
        x = self.linear_1(x)
        x = self.activation(x)
        #x = self.batchnorm_2(x)
        x = self.linear_2(x)

        return self.output_activation(x)


def train_detector_classifier(
            model: Classifier,
            train_dataloader: torch.utils.data.DataLoader,
            test_dataloader: torch.utils.data.DataLoader,
            optimizer: torch.optim.Optimizer,
            device,
            loss: torch.nn.Module=torch.nn.NLLLoss(),
            positive_transform: torch.nn.Module()=torchvision.transforms.Compose(
                [
                    torchvision.transforms.RandomHorizontalFlip(p=0.5),
                    # torchvision.transforms.RandomRotation(
                    #     20,
                    #     interpolation=torchvision.transforms.InterpolationMode.BILINEAR
                    # ),
                    torchvision.transforms.RandomResizedCrop(
                        size=(232,232),
                        scale=(0.9, 1.0),
                        ratio=(0.9, 1.1),
                        interpolation=torchvision.transforms.InterpolationMode.BICUBIC,
                    ),
                    torchvision.transforms.RandomApply(
                        [
                            torchvision.transforms.ColorJitter(
                                brightness=0.25,
                                contrast=0.25,
                                saturation=0.25,
                                #hue=0.25,
                            )
                        ],
                        p=0.5
                    ),
                    torchvision.transforms.RandomGrayscale(p=0.15),
                    torchvision.transforms.GaussianBlur(kernel_size=(5, 5), sigma=(0.01, 0.5)),
                ]
            ),
            negative_transform: torch.nn.Module()=torchvision.transforms.Compose(
                [
                    torchvision.transforms.RandomHorizontalFlip(p=0.5),
                    torchvision.transforms.RandomRotation(
                        20,
                        interpolation=torchvision.transforms.InterpolationMode.BILINEAR
                    ),
                    torchvision.transforms.RandomResizedCrop(
                        size=(232,232),
                        scale=(0.2, 0.5),
                        ratio=(0.5, 2.0),
                        interpolation=torchvision.transforms.InterpolationMode.BICUBIC,
                    ),
                    torchvision.transforms.RandomApply(
                        [
                            torchvision.transforms.ColorJitter(
                                brightness=0.25,
                                contrast=0.25,
                                saturation=0.25,
                                #hue=0.25,
                            )
                        ],
                        p=0.5
                    ),
                    torchvision.transforms.RandomGrayscale(p=0.15),
                    torchvision.transforms.GaussianBlur(kernel_size=(5, 5), sigma=(0.01, 5.0)),
                ]
            ),
            negative_dataloaders: list[torch.utils.data.DataLoader]=None,
            eval_on_train: bool=False,
            model_path: Path()=None,
            n_epochs: int=100
        ) -> dict:

    history = defaultdict(list)
    loss.weight = torch.tensor([1.0, 3.0], device=device)

    for epoch in range(1, n_epochs+1):
        print(f"Epoch: {epoch}")
        mean_loss_value = 0.0
        n_samles = 0
        
        for batch in tqdm(train_dataloader):
            subimages, bounding_boxes, targets = batch
            optimizer.zero_grad()

            subimages      = subimages.to(device)
            bounding_boxes = bounding_boxes.to(device)
            targets        = targets.to(device)

            subimages      = [positive_transform(subimages), negative_transform(subimages)]
            bounding_boxes = [bounding_boxes, bounding_boxes]
            targets        = [targets, torch.zeros_like(targets)]
            
            for negative_dataloader in negative_dataloaders:
                negative_batch = next(iter(negative_dataloader))
                
                subimages.append(negative_batch[0].to(device))
                bounding_boxes.append(negative_batch[1].to(device))
                targets.append(negative_batch[2].to(device))

            subimages      = torch.concatenate(subimages, axis=0)
            bounding_boxes = torch.concatenate(bounding_boxes, axis=0)
            targets        = torch.concatenate(targets, axis=0)
            
            y_pred = model(subimages, bounding_boxes)

            _loss = loss(y_pred, targets)
            _loss.backward()

            optimizer.step()

            n_samles += subimages.shape[0]
            mean_loss_value += _loss.item()

        history["train_loss"].append(mean_loss_value / n_samles)

        # Train metric
        if eval_on_train:
            train_annotation_true = train_dataloader.dataset.annotation.copy()
            train_annotation_pred = train_annotation_true.copy()
            train_annotation_pred["Class"],  _ = model.predict(train_dataloader, device)
    
            train_metric, _ = metrics.calculate_metric(train_annotation_true, train_annotation_pred)
            history["train_metric"].append(train_metric)

        # Test metric
        test_annotation_true = test_dataloader.dataset.annotation.copy()
        test_annotation_pred = test_annotation_true.copy()
        test_annotation_pred["Class"], _ = model.predict(test_dataloader, device)

        test_metric, _ = metrics.calculate_metric(test_annotation_true, test_annotation_pred)
        history["test_metric"].append(test_metric)

        if model_path:
            model_path.mkdir(parents=True, exist_ok=True)
            torch.save(model, model_path / f"e{epoch}_{history['test_metric'][-1]:.2f}.pt")

        clear_output(True)
        plt.figure(figsize=(18,4))
        for index, (name, values) in enumerate(sorted(history.items())):
            plt.subplot(1, len(history), index + 1)
            plt.title(name)
            plt.plot(range(1, len(values) + 1), values)
            plt.grid()

        plt.show();

    return history