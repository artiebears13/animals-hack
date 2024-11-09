from sqlalchemy import Column, String, Boolean, Integer
from .meta import Base
from sqlalchemy.dialects.postgresql import JSONB

class Jobs(Base):
    __tablename__ = "jobs"

    uid = Column(String, primary_key=True)
    processed_image_id = Column(Integer)
    is_processed = Column(Boolean)
    result = Column(JSONB, nullable=True)
