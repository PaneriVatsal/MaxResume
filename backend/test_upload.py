import urllib.request
import json

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = (
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="file"; filename="test.pdf"\r\n'
    f'Content-Type: application/pdf\r\n\r\n'
    f'%PDF-1.4\r\n%%EOF\r\n'
    f'--{boundary}--\r\n'
).encode('utf-8')

req = urllib.request.Request(
    'http://localhost:8000/api/v1/resumes/upload?session_id=test',
    data=body,
    method='POST',
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)

try:
    response = urllib.request.urlopen(req)
    print("SUCCESS:", response.read().decode())
except Exception as e:
    import urllib.error
    if isinstance(e, urllib.error.HTTPError):
        print("HTTP ERROR:", e.code, e.read().decode())
    else:
        print("ERROR:", str(e))
