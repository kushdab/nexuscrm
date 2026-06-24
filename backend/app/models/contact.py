import uuid
from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
from app.models.base import TimestampMixin


class Contact(Base, TimestampMixin):
    __tablename__ = "contacts"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id     = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=False, index=True)
    first_name = Column(String(100))
    last_name  = Column(String(100))
    email      = Column(String(255), index=True)
    phone      = Column(String(50))
    company    = Column(String(255))
    title      = Column(String(100))
    notes      = Column(Text)
    stage      = Column(String(50), default="lead")
    state      = Column(String(100))
    country    = Column(String(100))
