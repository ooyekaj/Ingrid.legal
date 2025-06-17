import base64
import requests

# Make the API request
response = requests.post("http://localhost:8000/api/prepareDocket", json={
    "state": "California",
    "county": "Santa Clara",
    "division": "Complex Civil Litigation",
    "judge": "Charles F. Adams",
    "document_type": "Motion for Summary Judgment"
})

# Get the response
data = response.json()
document_base64 = data["document_bytes"]

# Decode and save as .docx file
document_bytes = base64.b64decode(document_base64)
with open("generated_motion.docx", "wb") as f:
    f.write(document_bytes)

print("Document saved as generated_motion.docx")