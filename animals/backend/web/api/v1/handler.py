import contextlib
from typing import Any
from uuid import uuid4

import msgpack
import sqlalchemy
from aio_pika import Message
from aio_pika.abc import DeliveryMode, ExchangeType
from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import JSONResponse
from starlette_context import context
from starlette_context.errors import ContextDoesNotExistError
from web.logger import logger
from web.storage.db import get_db
from web.storage.rabbit import channel_pool

from .router import router
from web.config.settings import settings
from .schemas import *


@router.post('/upload_image', response_model=UidResponse)
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
