import asyncio
from app.services.llm import get_completion

async def test():
    try:
        print('Calling LLM...')
        long_prompt = "Convert the following text to JSON format with key 'result': " + ("long text " * 500)
        res = await get_completion([{'role':'user', 'content': long_prompt}], response_format={'type': 'json_object'})
        print('Success:', res)
    except Exception as e:
        print('ERROR:', type(e), str(e))

asyncio.run(test())
