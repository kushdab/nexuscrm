# American-spelling alias — app.billing.service and other pre-existing modules import this name.
from app.models.organisation import Organisation as Organization  # noqa: F401

__all__ = ["Organization"]
