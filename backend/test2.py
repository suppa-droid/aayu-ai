import urllib.request
import json
req = urllib.request.Request('http://localhost:8000/api/v1/eligibility/evaluate-full/8716ca29-d90e-4c4c-807d-6ca51b012443', method='POST')
res = urllib.request.urlopen(req)
with open('out.json', 'w', encoding='utf-8') as f:
    f.write(res.read().decode('utf-8'))
print("Success:", res.status)
