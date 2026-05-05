import litellm
import asyncio

async def test():
    try:
        response = await litellm.acompletion(
            model="ollama/gemma4",
            messages=[{"role": "user", "content": "Hi"}],
            api_base="http://localhost:11434"
        )
        print("SUCCESS:", response.choices[0].message.content)
    except Exception as e:
        print("ERROR:", str(e))

asyncio.run(test())
