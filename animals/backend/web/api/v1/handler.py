import contextlib
from datetime import datetime
from typing import Any
from uuid import uuid4
import pandas as pd
import msgpack
import sqlalchemy
from aio_pika import Message
from aio_pika.abc import DeliveryMode, ExchangeType
from fastapi import Depends
from sqlalchemy import select, insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from fastapi.responses import StreamingResponse
from starlette.responses import JSONResponse, FileResponse
from starlette_context import context
from starlette_context.errors import ContextDoesNotExistError

from consumer.handlers.utils.reports import ImageReportPDF
from consumer.handlers.utils.bbox import BoundingBoxConverter
from web.logger import logger
from web.storage.db import get_db
from web.storage.rabbit import channel_pool

from .router import router
from web.config.settings import settings
from .schemas import *
from ...models.jobs import Jobs
from .schemas import JobMessage
from ...models.jobs_images import JobsImages

TIME_FORMAT: str = '%Y-%m-%dT%H:%M:%S'


@router.post('/upload_image', response_model=UidResponse)
async def upload_link(session: AsyncSession = Depends(get_db), ):
    current_id = str(uuid4())
    db_job = Jobs(uid=current_id)
    session.add(db_job)
    await session.commit()
    msg: JobMessage = {
        "uid": current_id,
        "body":
            {"data":
                 {"filenames": ["/data/logo.png"],
                  "datetimes": [
                      datetime(year=2020, month=1, day=1, hour=12, minute=59, second=1).strftime(TIME_FORMAT)],
                  "confidence_lvl": 0.8
                  }

             }
    }
    await publish_message(msg)

    return JSONResponse({"uid": current_id}, status_code=200)


@router.post("/get-result")
async def get_result(body: UidResponse, session: AsyncSession = Depends(get_db), ):
    uid = body.uid

    jobs_images = (await session.scalars(
            select(JobsImages).
            where(JobsImages.job_id == uid).
            options(joinedload(JobsImages.image))
        )).all()

    result = {"result": [{"status": job.status, "image_id": job.image_id, "border": job.image.border} for job in jobs_images]}
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

@router.post('/get_result_report')
async def get_result(body: ResultRequest, session: AsyncSession = Depends(get_db), ):
    uid = body.uid

    jobs_images = (await session.scalars(
        select(JobsImages).
        where(JobsImages.job_id == uid).
        options(joinedload(JobsImages.image))
    )).all()

    filenames = [job.image.image_path for job in jobs_images]
    borders = [job.image.border for job in jobs_images]
    obj_class = [job.image.object_class for job in jobs_images]

    # взять из бд data[[Name	Bbox	Class]]
    # data = pd.DataFrame({
    #     "Name": filenames,
    #     "Bbox": borders,
    #     "Class": obj_class
    # })

    data = pd.DataFrame({
        "Name": ["/data/logo.png"],
        "Bbox": ["50,50,10,10"],
        "Class": 1
    })
    logger.info(data)
    pdf = ImageReportPDF(f"/data/{uid}_report.pdf", data)
    pdf_file = pdf.generate()
    # Перемещаем курсор в начало буфера
    # pdf_file.seek(0)

    return FileResponse(f"/data/{uid}_report.pdf")
    # Возвращаем PDF как ответ
    # return StreamingResponse(pdf_file, media_type='application/pdf',
    #                          headers={"Content-Disposition": "attachment; filename=generated.pdf"})


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
