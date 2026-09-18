import cv2

from services.face_detector import FaceDetector
from services.face_recognizer import FaceRecognizer


# Load both images
image1 = cv2.imread("test_face.jpg")
image2 = cv2.imread("test_face_2.jpg")


if image1 is None:
    print("ERROR: test_face.jpg could not be loaded.")
    exit()

if image2 is None:
    print("ERROR: test_face_2.jpg could not be loaded.")
    exit()


print("Both images loaded successfully.")


# Create detector
detector = FaceDetector()


# Detect faces
faces1 = detector.detect_faces(image1)
faces2 = detector.detect_faces(image2)


print("Faces in image 1:", len(faces1))
print("Faces in image 2:", len(faces2))


if len(faces1) == 0 or len(faces2) == 0:
    print("ERROR: Face not detected in one or both images.")
    exit()


# Get embeddings
embedding1 = faces1[0].embedding
embedding2 = faces2[0].embedding


print("Embedding 1 size:", len(embedding1))
print("Embedding 2 size:", len(embedding2))


# Compare faces
recognizer = FaceRecognizer()

match, similarity = recognizer.is_match(
    embedding1,
    embedding2
)


print("Similarity:", similarity)
print("Match:", match)


if match:
    print("RESULT: SAME PERSON")
else:
    print("RESULT: DIFFERENT PERSON")