from fastapi import FastAPI, UploadFile, File, HTTPException,Form
from pydantic import BaseModel
import cv2
import numpy as np

try:
    from services.face_detector import FaceDetector
    from services.face_recognizer import FaceRecognizer
    MODEL_IMPORT_ERROR = None
except ModuleNotFoundError as error:
    FaceDetector = None
    FaceRecognizer = None
    MODEL_IMPORT_ERROR = str(error)


app = FastAPI(
    title="Face Attendance AI Service",
    version="1.0.0"
)


# Load AI models once when the service starts.  Keeping the API alive when an
# optional local model dependency is absent makes setup problems diagnosable.
detector = FaceDetector() if FaceDetector else None
recognizer = FaceRecognizer() if FaceRecognizer else None


def require_models():
    if detector is None or recognizer is None:
        raise HTTPException(
            status_code=503,
            detail="Face recognition is unavailable. Install the InsightFace dependencies first."
        )


class StudentEmbedding(BaseModel):
    studentId: str
    embedding: list[float]


class RecognitionRequest(BaseModel):
    students: list[StudentEmbedding]


@app.get("/health")
def health_check():
    if MODEL_IMPORT_ERROR:
        return {
            "status": "degraded",
            "message": "Service is running but face models are unavailable.",
            "detail": MODEL_IMPORT_ERROR
        }
    return {"status": "success", "message": "Face Recognition Service is running"}


@app.post("/enroll")
async def enroll_face(file: UploadFile = File(...)):

    require_models()

    # Read uploaded image
    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Image file is empty."
        )

    # Convert image bytes to NumPy array
    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8
    )

    # Convert NumPy array to OpenCV image
    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file."
        )

    # Detect faces
    faces = detector.detect_faces(image)

    # No face
    if len(faces) == 0:
        raise HTTPException(
            status_code=400,
            detail="No face detected in the image."
        )

    # More than one face
    if len(faces) > 1:
        raise HTTPException(
            status_code=400,
            detail=(
                "Multiple faces detected. "
                "Please upload a photo containing only one face."
            )
        )

    # Get 512-dimensional embedding
    embedding = faces[0].embedding

    return {
        "status": "success",
        "message": "Face enrolled successfully.",
        "embedding": embedding.tolist()
    }


@app.post("/recognize")
async def recognize_faces(
    file: UploadFile = File(...),
    students_json: str = Form(..., description="JSON string of enrolled students with their embeddings")
):

    require_models()

    # Validate image
    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Image file is empty."
        )

    # Convert image bytes to NumPy array
    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8
    )

    # Convert to OpenCV image
    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid image file."
        )

    # Parse enrolled students
    import json

    try:
        students_data = json.loads(students_json)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Invalid students data."
        )

    if not students_data:
        raise HTTPException(
            status_code=400,
            detail="No enrolled student embeddings provided."
        )

    # Detect faces in group photo
    faces = detector.detect_faces(image)

    if len(faces) == 0:
        return {
            "status": "success",
            "message": "No faces detected.",
            "matches": []
        }

    matches = []

    # Compare every detected face
    for face_index, face in enumerate(faces):

        detected_embedding = face.embedding

        best_match = None
        best_similarity = -1.0

        for student in students_data:

            student_id = student.get("studentId")
            enrolled_embedding = student.get("embedding")

            if not student_id or not enrolled_embedding:
                continue

            is_match, similarity = recognizer.is_match(
                detected_embedding,
                enrolled_embedding
            )

            if similarity > best_similarity:
                best_similarity = similarity
                best_match = {
                    "studentId": student_id,
                    "similarity": similarity,
                    "match": is_match
                }

        # Add only if a student was compared
        if best_match:
            matches.append({
                "faceIndex": face_index,
                "studentId": best_match["studentId"],
                "similarity": best_match["similarity"],
                "match": best_match["match"]
            })

    return {
        "status": "success",
        "message": "Face recognition completed.",
        "facesDetected": len(faces),
        "matches": matches
    }
