from starlette.responses import JSONResponse
from web.api.v2.router import router


@router.post("/check-video-duplicate")
async def tmp_handler():
    return JSONResponse({"res": "Hello world!"})
