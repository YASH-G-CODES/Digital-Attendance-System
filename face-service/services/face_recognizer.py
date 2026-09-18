import numpy as np


class FaceRecognizer:

    def __init__(self, threshold=0.45):
        self.threshold = threshold

    def compare_embeddings(self, embedding1, embedding2):
        """
        Compare two face embeddings using cosine similarity.
        Returns similarity score between -1 and 1.
        """

        embedding1 = np.asarray(embedding1, dtype=np.float32)
        embedding2 = np.asarray(embedding2, dtype=np.float32)

        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        similarity = np.dot(
            embedding1,
            embedding2
        ) / (norm1 * norm2)

        return float(similarity)

    def is_match(self, embedding1, embedding2):
        """
        Check whether two face embeddings belong
        to the same person.
        """

        similarity = self.compare_embeddings(
            embedding1,
            embedding2
        )

        return similarity >= self.threshold, similarity