from sqlalchemy import insert, update

from consumer.handlers.utils import call_triton
from web.api.v1.schemas import JobMessage
from web.logger import logger
from web.models.images import Images
from web.models.jobs_images import JobsImages
from web.storage.db import async_session


async def process_images(message: JobMessage) -> None:
    image_pathes = message["body"]["data"]["filenames"]
    datetimes = message["body"]["data"]["datetimes"]
    cameras = message["body"]["data"]["cameras"]
    confidence_lvl = message["body"]["data"]["confidence_lvl"]
    image_ids = []

    async with async_session() as session:
        image_ids = (await session.scalars(
            insert(Images).
            values([
                {"datetime": datetime_, "image_path": image_path, "camera": camera_}
                for image_path, datetime_, camera_ in zip(image_pathes, datetimes, cameras)
            ]).
            returning(Images.id)
        )).all()

        await session.commit()

        await session.execute(insert(JobsImages).values([
            {"job_id": message["uid"], "image_id": image_id, "status": False}
            for image_id in image_ids
        ]))

        #######################
        # do smth with pictures here
        #######################

        for index, image_id in enumerate(image_ids):
            await session.execute(
                update(JobsImages).
                where(JobsImages.job_id == message["uid"], JobsImages.image_id == image_id).
                values(status=True)
            )

            # orders = await asyncio.to_thread(call_triton, image_pathes[index])
            orders = call_triton(image_pathes[index])
            logger.info(f"{orders=}")
            for order in orders:
                logger.info(f"{order=}")
                left, top, right, bottom = order["xyxy"]
                order["xyxy"] = [left, top, right - left, bottom - top]

            await session.execute(
                update(Images).
                where(Images.id == image_id).
                # values(border=, object_class=orders['cls'])
                values([
                    {"border": order["xyxy"], "object_class": order["cls"]}
                    for order in orders
                ])

            )

        await session.commit()
        # await session.execute(
        #     update(Images).
        #     where(Images.id == example_id).
        #     values(border=[1, 2, 3, 4], object_class=1)
        # )
        # await session.commit()
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
