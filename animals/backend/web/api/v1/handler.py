import contextlib
import os
from typing import Any
from uuid import uuid4

import msgpack
import sqlalchemy
from aio_pika import Message
from aio_pika.abc import DeliveryMode, ExchangeType
from fastapi import Depends, UploadFile, Form, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from starlette.responses import JSONResponse
from starlette_context import context
from starlette_context.errors import ContextDoesNotExistError

from web.config.settings import settings
from web.logger import logger
from web.storage.db import get_db
from web.storage.rabbit import channel_pool
from .router import router
from .schemas import *
from .schemas import JobMessage
from ...models.jobs import Jobs
from ...models.jobs_images import JobsImages

ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/gif"]
DIRECTORY = "data/raw"


# перенести в конфиг потом

@router.post("/upload_images",
             responses={
                 400: {"description": "Неверный запрос"},
                 500: {"description": "Ошибка сервера"}
             },
             tags=["API для загрузки фото животных видео на Фронтенд-Сервере"],
             summary="Загрузить несколько изображений животных")
async def upload_images(body: AnimalsImageResponse = Depends(),
                        files: List[UploadFile] = File(...),
                        created_at: List[str] = Form(...),
                        cameras: List[str] = Form(...),
                        session: AsyncSession = Depends(get_db)):
    current_id = str(uuid4())
    db_job = Jobs(uid=current_id)
    session.add(db_job)
    await session.commit()

    os.makedirs(DIRECTORY, exist_ok=True)

    uploaded_files_name = []
    created_at_time = []
    valid_camera = []

    image_info = zip(files, cameras, created_at)
    for index, (file, camera, created_at) in enumerate(image_info):
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            logger.warning(f"Недопустимый тип файла: {file.filename} ({file.content_type})")
        try:
            path = os.path.join(DIRECTORY, f"{current_id}_{index}.jpg")
            # Асинхронно считываем содержимое файла
            with open(path, "wb+") as file_object:
                file_object.write(file.file.read())
            uploaded_files_name.append(f"{current_id}_{index}")
            created_at_time.append(int(created_at))
            valid_camera.append(camera)
        except Exception as e:
            logger.error(f"Ошибка при чтении и сохранении файла {file.filename}: {e}")
            continue

    msg: JobMessage = {
        "uid": current_id,
        "body":
            {"data":
                 {"filenames": uploaded_files_name,
                  "datetimes": created_at_time,
                  "cameras": valid_camera,
                  "confidence_lvl": float(body.confidence_level)
                  }

             }
    }
    await publish_message(msg)

    return JSONResponse({"uid": current_id}, status_code=200)


@router.post("/get_result")
async def get_result(body: UidResponse, session: AsyncSession = Depends(get_db), ):
    uid = body.uid

    jobs_images = (await session.scalars(
        select(JobsImages).
        where(JobsImages.job_id == uid).
        options(joinedload(JobsImages.image))
    )).all()
    for job in jobs_images:
        if not job.status:
            return JSONResponse({}, status_code=200)
    result = {
        # "result": [{"status": job.status, "image_id": job.image_id, "border": job.image.border,
        # "filename": job.image.image_path} for job in jobs_images]}

        "result": [{"filename": "ali.png", "created_at": job.image.datetime, "camera": job.image.camera,
                    # "result": [{"filename": job.image.image_path, "created_at": job.image.datetime, "camera": job.image.camera,
                    "border":
                        [{"id": hash(job.image.image_path),
                          "animal_name": "animal",
                          "object_class": job.image.object_class,
                          "left_up_corner": {"x": job.image.border[0], "y": job.image.border[0]},
                          "width": job.image.border[2],
                          "height": job.image.border[3]
                          }
                         ]
                    } for job in jobs_images]}

    return JSONResponse(result)
    job = await session.scalars(select(Jobs).filter_by(uid=uid))
    try:
        row = job.one()
    except sqlalchemy.exc.NoResultFound:
        raise HTTPException(status_code=400, detail="Wrong uid")

    session.refresh(row)  # noqa

    if row.is_processed:
        processed_images_borders = row.result
        res = {
            "result": processed_images_borders
        }
        return JSONResponse(content=res, status_code=200)
    else:
        return JSONResponse(content={}, status_code=200)


async def publish_message(body: dict[str, Any]) -> None:
    logger.info("Sending message: %s", body)
    async with channel_pool.acquire() as channel:  # type: Channel
        exchange = await channel.declare_exchange(
            settings.EXCHANGE,
            type=ExchangeType.TOPIC,
            durable=True,
        )

        message_info = {
            "body": msgpack.packb(body),
            "delivery_mode": DeliveryMode.PERSISTENT,
        }

        with contextlib.suppress(ContextDoesNotExistError):
            if correlation_id := context.get("X-Correlation-ID"):
                message_info["correlation_id"] = correlation_id

        await exchange.publish(
            Message(**message_info),
            routing_key=settings.QUEUE,
        )
