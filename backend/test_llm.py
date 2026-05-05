import asyncio
from app.services.llm import get_completion

async def test():
    try:
        print('Calling LLM...')
        res = await get_completion([{'role':'user', 'content':'hello'}], response_format={'type': 'json_object'})
        print('Success:', res)
    except Exception as e:
        print('ERROR:', type(e), str(e))

asyncio.run(test())
