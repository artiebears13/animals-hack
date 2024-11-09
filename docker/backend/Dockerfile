FROM python:3.11

WORKDIR /app

COPY poetry.lock pyproject.toml /app/

RUN pip install poetry

RUN poetry config virtualenvs.create false && poetry install

RUN apt-get update && apt-get install ffmpeg libsm6 libxext6  -y

RUN pip install ultralytics

CMD ["python", "animals/backend/api.py"]