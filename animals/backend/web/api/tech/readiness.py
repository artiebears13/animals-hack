from fastapi.responses import ORJSONResponse

from .router import router


@router.get("/readiness")
def readiness():
    # TODO надо сделать в бд select 1
    return ORJSONResponse({"status": "ok"})
