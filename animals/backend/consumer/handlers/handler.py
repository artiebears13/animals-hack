import asyncio
from datetime import datetime

from consumer.logger import logger
from sqlalchemy import select, insert
from web.storage.db import Jobs, Images, async_session
from web.api.v1.schemas import JobMessage

async def process_images(message: JobMessage) -> None:
    image_path = message.body.data.filename
    datetime = message.body.data.datetime
    confidence_lvl = message.body.data.confidence_lvl

    async with async_session() as session:
        logger.info(f"Start work with queued job")
        img = Images(datetime=datetime, image_path=image_path)
        session.add(img)
        session.flush()
        session.refresh(img.id)

        job_row = await session.execute(select(Jobs).filter_by(uid=message["uid"]))
        job = job_row.scalar_one()
        session.refresh(job)
        job.is_processed = True
        job.processed_image_id = img.id

        await session.commit()

        row_check_obj = await session.execute(select(Jobs.is_processed).where(Jobs.uid == message["uid"]))
        row_check = row_check_obj.scalar_one()
        session.refresh(row_check)

        logger.info(f"Finish work with queued job; Processed: {row_check}")

