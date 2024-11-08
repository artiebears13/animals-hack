from fastapi.responses import ORJSONResponse

from .router import router


@router.get("/liveness")
def liveness():
    return ORJSONResponse({"status": "ok"})
