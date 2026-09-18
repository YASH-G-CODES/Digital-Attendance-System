import cv2
from services.face_detector import FaceDetector


image = cv2.imread("test_face.jpg")

if image is None:
    print("ERROR: Image could not be loaded.")
    exit()

print("Image loaded successfully.")
print("Image shape:", image.shape)

detector = FaceDetector()

faces = detector.detect_faces(image)

print("Number of faces detected:", len(faces))

for i, face in enumerate(faces):
    print(f"\nFace {i + 1}")
    print("Bounding box:", face.bbox)

    if face.embedding is not None:
        print("Embedding size:", len(face.embedding))
    else:
        print("Embedding not available.")