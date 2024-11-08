
from consumer.logger import logger
from sqlalchemy import select
from web.storage.db import Jobs, async_session


async def search_duplicate(message: dict) -> None:
    text = message["body"]

    async with async_session() as session:
        logger.info("Start work with queued job")
        row = await session.execute(select(Jobs).filter_by(uid=message["uid"]))
        job = row.scalar_one()
        session.refresh(job)
        job.is_processed = True # сюда результат работы

        await session.commit()
        row_check_obj = await session.execute(select(Jobs.is_processed).where(Jobs.uid == message["uid"]))
        row_check = row_check_obj.scalar_one()
        session.refresh(row_check)

        logger.info(f"Finish work with queued job; Processed: {row_check}")

