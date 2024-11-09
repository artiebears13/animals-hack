from sqlalchemy import Column, String, Boolean, Integer
from .meta import Base
from sqlalchemy.dialects.postgresql import JSONB


class Jobs(Base):
    __tablename__ = "jobs"

    uid = Column(String, primary_key=True)
