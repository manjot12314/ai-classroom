from typing import List, Optional, Tuple, Dict
import os
import sys
import warnings

import numpy as np

# Suppress the face_recognition_models warning message
# The models package is installed (face_recognition_models 0.3.0), 
# but the library prints a warning anyway during import
warnings.filterwarnings('ignore')

try:
    import cv2
    # Redirect file descriptors to suppress warning from C extensions
    # The face_recognition library prints directly to stderr via C code
    _stderr_fd = sys.stderr.fileno()
    _stdout_fd = sys.stdout.fileno()
    _devnull_fd = os.open(os.devnull, os.O_WRONLY)
    
    # Save original stderr/stdout
    _saved_stderr = os.dup(_stderr_fd)
    _saved_stdout = os.dup(_stdout_fd)
    
    try:
        # Redirect stderr and stdout to /dev/null
        os.dup2(_devnull_fd, _stderr_fd)
        os.dup2(_devnull_fd, _stdout_fd)
        import face_recognition
    finally:
        # Restore original file descriptors
        os.dup2(_saved_stderr, _stderr_fd)
        os.dup2(_saved_stdout, _stdout_fd)
        os.close(_devnull_fd)
        os.close(_saved_stderr)
        os.close(_saved_stdout)
except Exception:  # pragma: no cover - optional deps in some environments
    cv2 = None
    face_recognition = None


def is_available() -> bool:
    return cv2 is not None and face_recognition is not None


def encode_faces(image_bytes: bytes) -> List[List[float]]:
    """
    Return encodings for all detected faces in the frame.
    """
    if not is_available():
        return []
    np_arr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    encodings = face_recognition.face_encodings(image)
    return [enc.tolist() for enc in encodings]


def match_face(
    known_encodings: Dict[int, List[float]],
    target_encoding: List[float],
    tolerance: float = 0.6,
) -> Tuple[Optional[int], float]:
    if not is_available() or not known_encodings:
        return None, 0.0
    ids = list(known_encodings.keys())
    known = [np.array(known_encodings[i]) for i in ids]
    target = np.array(target_encoding)
    distances = face_recognition.face_distance(known, target)
    best_idx = int(np.argmin(distances))
    best_distance = float(distances[best_idx])
    if best_distance <= tolerance:
        return ids[best_idx], 1 - best_distance
    return None, 0.0

