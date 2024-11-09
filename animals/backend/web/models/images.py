from typing import TYPE_CHECKING

from sqlalchemy import Column, String, Integer, DateTime, Float
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, relationship

from .meta import Base


if TYPE_CHECKING:
    from .jobs_images import JobsImages


class Images(Base):
    __tablename__ = 'images'

    id = Column(Integer, primary_key=True, autoincrement=True)
    datetime = Column(DateTime)
    image_path = Column(String)
    border = Column(JSONB, nullable=True)
    object_class = Column(Float, nullable=True)
    job_images: Mapped[list["JobsImages"]] = relationship(
        "JobsImages", back_populates="image", uselist=True,
    )


