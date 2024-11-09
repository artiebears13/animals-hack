from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from .meta import Base


class Images(Base):
    __tablename__ = 'images'

    id = Column(Integer, primary_key=True, autoincrement=True)
    datetime = Column(DateTime)
    image_path = Column(String)
    borders = Column(JSONB, nullable=True)

