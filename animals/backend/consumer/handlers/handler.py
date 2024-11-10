import os.path

from sqlalchemy import insert, update

from consumer.handlers.utils import call_triton
from web.api.v1.schemas import JobMessage
from web.logger import logger
from web.models.images import Images
from web.models.jobs_images import JobsImages
from web.storage.db import async_session
from PIL import Image

async def process_images(message: JobMessage) -> None:
    # Собираем данные с сообщения
    image_pathes = message["body"]["data"]["filenames"]
    datetimes = message["body"]["data"]["datetimes"]
    cameras = message["body"]["data"]["cameras"]
    confidence_lvl = message["body"]["data"]["confidence_lvl"]
    image_ids = []

    # Начинаем сессию с бд
    async with async_session() as session:

        # Добавляем записи о картинках в бд
        image_ids = (await session.scalars(
            insert(Images).
            values([
                {"datetime": datetime_, "image_path": image_path, "camera": camera_}
                for image_path, datetime_, camera_ in zip(image_pathes, datetimes, cameras)
            ]).
            returning(Images.id)
        )).all()

        await session.commit()

        # Создаем запись о задаче в связывающей таблице
        await session.execute(insert(JobsImages).values([
            {"job_id": message["uid"], "image_id": image_id, "status": False}
            for image_id in image_ids
        ]))

        await session.commit()

        for index, image_id in enumerate(image_ids):
            # отправка запроса на тритон сервер
            orders = call_triton(os.path.join('/data/raw', image_pathes[index]))

            # постпроцессинг
            for order in orders:
                left, top, right, bottom = order["xyxy"]
                order["xyxy"] = [left, top, right - left, bottom - top]

                logger.info(f'{order["xyxy"]}, {order["conf"]}')

            # Обновляем статус задачи
            await session.execute(
                update(JobsImages).
                where(JobsImages.job_id == message["uid"], JobsImages.image_id == image_id).
                values(status=True)
            )
            # Добавляем результаты работы в таблицу с картинками
            res_borders = [order["xyxy"] for order in orders]
            res_cls = [order["conf"] for order in orders]

            await session.execute(
                update(Images).
                where(Images.id == image_id).
                values(border=res_borders, object_class=res_cls)
            )
            await session.commit()
