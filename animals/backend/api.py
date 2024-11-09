import tritonclient.http as httpclient
import numpy as np
from PIL import Image
import os
import random
from glob import glob
from animals.backend.config import DATA_PATH



url = "localhost:8000"
model_name = "detector"
client = httpclient.InferenceServerClient(url=url)



def prepare_image(image_path):
    image = Image.open(image_path)
    image = image.resize((640, 640))
    image_array = np.array(image).astype(np.float32)

    image_array /= 255.0
    return image_array.transpose(2, 0, 1)[None, ...]


def get_images(k: int = 10):
    images = glob(DATA_PATH / "train_data_minprirodi" / "images" / "*.jpg")
    images = random.sample(images, k=k)
    images = [prepare_image(image) for image in images]

    images_batch = np.concatenate(images, axis=0)

    inputs = [
        httpclient.InferInput(
            "images",
            list(images_batch.shape),
            "FP32",
        )
    ]

    inputs[0].set_data_from_numpy(images_batch)

    results = client.infer(model_name, inputs)

    output = results.as_numpy("output")

    print("Результаты:", output)
