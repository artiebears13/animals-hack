import datetime

from consumer.logger import logger
from sqlalchemy import select, insert, update
from web.models.jobs import Jobs
from web.models.images import Images
from web.models.jobs_images import JobsImages
from web.storage.db import async_session
from web.api.v1.schemas import JobMessage


TIME_FORMAT: str = '%Y-%m-%dT%H:%M:%S'


async def process_images(message: JobMessage) -> None:
    image_pathes = message["body"]["data"]["filenames"]
    datetimes = message["body"]["data"]["datetimes"]
    confidence_lvl = message["body"]["data"]["confidence_lvl"]
    image_ids = []
    async with async_session() as session:
        image_ids = (await session.scalars(
            insert(Images).
            values([
                    {"datetime": datetime.datetime.strptime(datetime_, TIME_FORMAT), "image_path": image_path}
                    for image_path, datetime_ in zip(image_pathes, datetimes)
            ]).
            returning(Images.id)
        )).all()

        await session.execute(insert(JobsImages).values([
            {"job_id": message["uid"], "image_id": image_id, "status": False}
            for image_id in image_ids
        ]))

        await session.commit()

        example_id = image_ids[0]
        await session.execute(
            update(JobsImages).
            where(JobsImages.job_id == message["uid"], JobsImages.image_id == example_id).
            values(status=True)
        )

        await session.execute(
            update(Images).
            where(Images.id == example_id).
            values(border=[1, 2, 3, 4], object_class=0.5)
        )
        await session.commit()
        # job_row = await session.execute(select(Jobs).filter_by(uid=message["uid"]))
        # job = job_row.scalar_one()
        # session.refresh(job)
        #
        # await session.commit()
        #
        # row_check_obj = await session.execute(select(Jobs.is_processed).where(Jobs.uid == message["uid"]))
        # row_check = row_check_obj.scalar_one()
        # session.refresh(row_check)

        # logger.info(f"Finish work with queued job; Processed: {row_check}")

