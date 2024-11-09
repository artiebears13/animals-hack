
from .meta import Base, DEFAULT_SCHEMA

from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, UniqueConstraint, Boolean, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped, relationship

from .meta import Base

if TYPE_CHECKING:
    from .images import Images


# class CircleUserRole(Base):
#     __tablename__ = "circle_user_role"
#
#     id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
#
#     hola_id: Mapped[str] = mapped_column(String, unique=True)
#     role_hola_id: Mapped[str] = mapped_column(String)
#     circle_hola_id: Mapped[str] = mapped_column(String)
#     user_hola_id: Mapped[str] = mapped_column(String)
#     researches: Mapped[list["Research"]] = relationship(
#         "Research", back_populates="researcher", uselist=True,
#     )


class JobsImages(Base):
    __tablename__ = 'jobs_images'

    __table_args__ = (
        UniqueConstraint('job_id', 'image_id', name='unique_jobs_images'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_id: Mapped[str] = mapped_column(String, ForeignKey(f'{DEFAULT_SCHEMA}.jobs.uid'), nullable=False)
    image_id: Mapped[int] = mapped_column(Integer, ForeignKey(f'{DEFAULT_SCHEMA}.images.id'), nullable=False)
    status: Mapped[bool] = mapped_column(Boolean)
    image: Mapped["Images"] = relationship(
        "Images", back_populates="job_images",
    )
