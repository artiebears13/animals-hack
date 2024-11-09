import contextlib
from typing import Any
from uuid import uuid4

import msgpack
import sqlalchemy
from aio_pika import Message
from aio_pika.abc import DeliveryMode, ExchangeType
from fastapi import Depends, HTTPException, File, Form, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import JSONResponse
from starlette_context import context
from starlette_context.errors import ContextDoesNotExistError
from web.config.settings import settings
from web.logger import logger
from web.storage.db import Jobs, get_db
from web.storage.rabbit import channel_pool
from typing import List, Dict
from pydantic import BaseModel
from pathlib import Path

from .router import router


class ImageData(BaseModel):
    file: UploadFile
    camera: str
    created_at: int

# class FormData(BaseModel):
#     count: int
#     images: List[ImageData]
#     confidence_level: int
#     size_threshold: int

class SizeThreshold(BaseModel):
    width: int
    height: int

UPLOAD_DIR = Path("uploaded_files")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_files(
    confidence_level: str = Form(...),  # Accept confidence level
    size_threshold: str = Form(...),    # Accept size threshold
    images: List[UploadFile] = Form(...),  # Accept files
    camera: List[str] = Form(...),  # Accept cameras info (as list of strings)
    created_at: List[int] = Form(...),  # Accept cameras info (as list of strings)
):
    # Loop through each uploaded file
    for idx, file in enumerate(images):
        camera_info = camera[idx]
        created_at_value = created_at[idx]

        # Read the file content (binary data)
        contents = await file.read()

        # Define the file path where the file will be saved
        file_path = UPLOAD_DIR / f"{file.filename}"

        # Save the file to the defined directory
        with open(file_path, "wb") as f:
            f.write(contents)

        # Process the file and its metadata
        logger.info(f"Processing file: {file.filename}")
        logger.info(f"Camera: {camera_info=}")
        logger.info(f"Camera: {created_at=}")
        logger.info(f"Created at: {created_at_value=}")
        print(f"File saved at: {file_path}")

    return {"message": "Files uploaded and saved successfully!"}


@router.post("/upload_image")
async def upload_link(session: AsyncSession = Depends(get_db),):
    current_id = str(uuid4())
    db_job = Jobs(uid=current_id, is_processed=False)
    session.add(db_job)
    await session.commit()

    await publish_message({"uid": current_id,
                           "body": "TEST"
                           })

    return JSONResponse({"uid": current_id}, status_code=200)


@router.post("/get-result")
async def get_result(body, session: AsyncSession = Depends(get_db),):
    uid = body.uid

    job = await session.scalars(select(Jobs).filter_by(uid=uid))
    try:
        row = job.one()
    except sqlalchemy.exc.NoResultFound:
        raise HTTPException(status_code=400, detail="Wrong uid")

    session.refresh(row) # noqa

    if row.is_processed:
        res = {
            "result": "TEST_RESULT"
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
