import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/config";
import LoadingSpinner from "./LoadingSpinner";

function GroupAttendance() {
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const [subjects, setSubjects] = useState([]);
    const [selectedSubjectId, setSelectedSubjectId] =
        useState("");

    const [cameraActive, setCameraActive] =
        useState(false);

    const [capturedImage, setCapturedImage] =
        useState(null);

    const [studentAttendance, setStudentAttendance] =
        useState({});

    const [loadingSubjects, setLoadingSubjects] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

        const [recognizing, setRecognizing] = useState(false);
        const [recognitionResults, setRecognitionResults] = useState([]);
        const [recognitionDone, setRecognitionDone] = useState(false);


    // ======================================================
    // SELECTED SUBJECT
    // ======================================================

    const selectedSubject =
        subjects.find(
            (subject) =>
                subject._id === selectedSubjectId
        );

    const students =
        selectedSubject?.students || [];


    // ======================================================
    // FETCH FACULTY SUBJECTS
    // ======================================================

    useEffect(() => {
        fetchSubjects();

        return () => {
            stopCamera();
        };
    }, []);


    const fetchSubjects = async () => {
        try {
            setLoadingSubjects(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const response =
                await axios.get(
                    `${API_BASE_URL}/subjects/my`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const allSubjects =
                response.data.subjects || [];

            const activeSubjects =
                allSubjects.filter(
                    (subject) =>
                        subject.status === "Active"
                );

            setSubjects(activeSubjects);

        } catch (error) {
            console.error(
                "Fetch Subjects Error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load subjects."
            );
        } finally {
            setLoadingSubjects(false);
        }
    };


    // ======================================================
    // SUBJECT CHANGE
    // ======================================================

    const handleSubjectChange = (event) => {
        const subjectId =
            event.target.value;

        stopCamera();

        setSelectedSubjectId(subjectId);

        setCapturedImage(null);
        setStudentAttendance({});
        setMessage("");
        setError("");

        const subject =
            subjects.find(
                (item) =>
                    item._id === subjectId
            );

        if (!subject) {
            return;
        }

        const initialAttendance = {};

        (subject.students || []).forEach(
            (student) => {
                initialAttendance[
                    student._id
                ] = "Present";
            }
        );

        setStudentAttendance(
            initialAttendance
        );
    };


    // ======================================================
    // CAMERA STREAM ATTACHMENT
    // ======================================================

    useEffect(() => {
        if (!cameraActive) {
            return;
        }

        if (
            !videoRef.current ||
            !streamRef.current
        ) {
            return;
        }

        const video =
            videoRef.current;

        const stream =
            streamRef.current;

        video.srcObject = stream;

        const playVideo = async () => {
            try {
                await video.play();

                console.log(
                    "Camera preview started successfully."
                );

            } catch (error) {
                console.error(
                    "Video Play Error:",
                    error
                );

                setError(
                    "Camera opened but video preview could not start."
                );
            }
        };

        playVideo();

    }, [cameraActive]);


    // ======================================================
    // START CAMERA
    // ======================================================

    const startCamera = async () => {
        try {
            setError("");
            setMessage("");

            if (!selectedSubjectId) {
                setError(
                    "Please select a subject first."
                );
                return;
            }

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {
                setError(
                    "Camera is not supported by this browser."
                );
                return;
            }


            // Stop previous camera
            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach(
                        (track) => {
                            track.stop();
                        }
                    );

                streamRef.current = null;
            }


            // Request camera
            const stream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        video: {
                            facingMode: "user",
                            width: {
                                ideal: 1280
                            },
                            height: {
                                ideal: 720
                            }
                        },
                        audio: false
                    }
                );


            console.log(
                "Camera stream started:",
                stream
            );


            streamRef.current =
                stream;


            // Show camera UI
            setCameraActive(true);

        } catch (error) {
            console.error(
                "Camera Error:",
                error
            );


            if (
                error.name ===
                "NotAllowedError"
            ) {
                setError(
                    "Camera permission was denied. Please allow camera access in Chrome."
                );

            } else if (
                error.name ===
                "NotFoundError"
            ) {
                setError(
                    "No camera was found on this device."
                );

            } else if (
                error.name ===
                "NotReadableError"
            ) {
                setError(
                    "Camera is already being used by another application."
                );

            } else if (
                error.name ===
                "OverconstrainedError"
            ) {
                setError(
                    "Camera does not support the requested settings."
                );

            } else {
                setError(
                    "Unable to access camera. Please check camera permission."
                );
            }
        }
    };


    // ======================================================
    // STOP CAMERA
    // ======================================================

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current
                .getTracks()
                .forEach(
                    (track) => {
                        track.stop();
                    }
                );

            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.srcObject = null;
        }

        setCameraActive(false);
    };


    // ======================================================
    // CAPTURE GROUP PHOTO
    // ======================================================

    const capturePhoto = () => {
        const video =
            videoRef.current;

        if (!video) {
            setError(
                "Camera preview is not available."
            );
            return;
        }

        if (
            !video.videoWidth ||
            !video.videoHeight
        ) {
            setError(
                "Camera is still loading. Please wait a moment and try again."
            );
            return;
        }


        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;


        const context =
            canvas.getContext("2d");

        if (!context) {
            setError(
                "Unable to capture the photo."
            );
            return;
        }


        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );


        const image =
            canvas.toDataURL(
                "image/jpeg",
                0.9
            );


        setCapturedImage(image);

        setMessage(
            "Group photo captured successfully."
        );

        setError("");

        stopCamera();
    };


    // ======================================================
    // RETAKE PHOTO
    // ======================================================

    const retakePhoto = async () => {
        setCapturedImage(null);
        setMessage("");
        setError("");

        await startCamera();
    };


    // ======================================================
    // REMOVE PHOTO
    // ======================================================

    const removePhoto = () => {
        stopCamera();

        setCapturedImage(null);

        setMessage("");
        setError("");
    };

    const recognizeGroupPhoto = async () => {
    if (!selectedSubjectId) {
        setError("Please select a subject first.");
        return;
    }

    if (!capturedImage) {
        setError("Please capture a group photo first.");
        return;
    }

    if (students.length === 0) {
        setError("No students are currently assigned to this subject.");
        return;
    }

    try {
        setRecognizing(true);
        setError("");
        setMessage("");
        setRecognitionResults([]);
        setRecognitionDone(false);

        const token = localStorage.getItem("token");

        const imageResponse = await fetch(capturedImage);
        const imageBlob = await imageResponse.blob();

        const formData = new FormData();

        formData.append(
            "subjectId",
            selectedSubjectId
        );

        formData.append(
            "groupPhoto",
            imageBlob,
            `group-photo-${Date.now()}.jpg`
        );

        const response = await axios.post(
            `${API_BASE_URL}/attendance/recognize-group`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const attendance =
            response.data.attendance || [];

        setRecognitionResults(attendance);

        const updatedAttendance = {
            ...studentAttendance
        };

        students.forEach((student) => {
            const recognizedStudent =
                attendance.find(
                    (item) =>
                        item.studentId === student._id
                );

            if (
                recognizedStudent &&
                recognizedStudent.status === "Present"
            ) {
                updatedAttendance[student._id] = "Present";
            }
        });

        setStudentAttendance(updatedAttendance);

        setRecognitionDone(true);

        if (response.data.recognizedCount > 0) {
            setMessage(
                `${response.data.recognizedCount} student(s) recognized successfully.`
            );
        } else {
            setMessage(
                "No enrolled students were recognized."
            );
        }

    } catch (error) {
        console.error(
            "AI Recognition Error:",
            error
        );

        setError(
            error.response?.data?.message ||
            "Unable to recognize faces in the group photo."
        );

    } finally {
        setRecognizing(false);
    }
};

    // ======================================================
    // CHANGE STUDENT STATUS
    // ======================================================

    const changeStudentStatus = (
        studentId,
        status
    ) => {
        setStudentAttendance(
            (previous) => ({
                ...previous,

                [studentId]:
                    status
            })
        );
    };


    // ======================================================
    // MARK ALL PRESENT
    // ======================================================

    const markAllPresent = () => {
        const updated = {};

        students.forEach(
            (student) => {
                updated[
                    student._id
                ] = "Present";
            }
        );

        setStudentAttendance(
            updated
        );
    };


    // ======================================================
    // MARK ALL ABSENT
    // ======================================================

    const markAllAbsent = () => {
        const updated = {};

        students.forEach(
            (student) => {
                updated[
                    student._id
                ] = "Absent";
            }
        );

        setStudentAttendance(
            updated
        );
    };


    // ======================================================
    // SUBMIT GROUP ATTENDANCE
    // ======================================================

    const submitGroupAttendance = async () => {
     
            if (recognitionDone) {
        setMessage(
            "AI recognition completed. Attendance has already been submitted for review."
        );
        return;
    }

    if (!selectedSubjectId) {
        setError("Please select a subject.");
        return;
    }

    if (!capturedImage) {
        setError("Please capture a group photo first.");
        return;
    }

    if (students.length === 0) {
        setError(
            "No students are currently assigned to this subject."
        );
        return;
    }

    const confirmed = window.confirm(
        "Submit this group attendance for review?"
    );

    if (!confirmed) {
        return;
    }

    try {
        setSubmitting(true);
        setError("");
        setMessage("");

        const token = localStorage.getItem("token");

        // Convert captured base64 image into a Blob
        const imageResponse = await fetch(capturedImage);
        const imageBlob = await imageResponse.blob();

        const results = [];

        let successCount = 0;
        let failedCount = 0;

        // ==========================================
        // SUBMIT EACH STUDENT
        // ==========================================

        for (const student of students) {
            const status =
                studentAttendance[student._id] || "Absent";

            try {
                const formData = new FormData();

                formData.append(
                    "studentId",
                    student._id
                );

                formData.append(
                    "subjectId",
                    selectedSubjectId
                );

                formData.append(
                    "status",
                    status
                );

                formData.append(
                    "method",
                    "Manual"
                );

                // Add group photo
                formData.append(
                    "groupPhoto",
                    imageBlob,
                    `group-photo-${Date.now()}.jpg`
                );

                const response = await axios.post(
                    `${API_BASE_URL}/attendance/mark`,
                    formData,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

                successCount++;

                results.push({
                    student: student.name,
                    success: true,
                    message:
                        response.data.message
                });

            } catch (studentError) {
                failedCount++;

                results.push({
                    student: student.name,
                    success: false,
                    message:
                        studentError.response
                            ?.data
                            ?.message ||
                        "Submission failed"
                });
            }
        }

        console.log(
            "Group Attendance Results:",
            results
        );

        if (
            successCount > 0 &&
            failedCount === 0
        ) {
            setMessage(
                `${successCount} student attendance records submitted successfully.`
            );

        } else if (successCount > 0) {
            setMessage(
                `${successCount} submitted successfully. ${failedCount} could not be submitted.`
            );

        } else {
            setError(
                "Attendance could not be submitted. Check whether attendance already exists for these students today."
            );
        }

    } catch (error) {
        console.error(
            "Group Attendance Error:",
            error
        );

        setError(
            error.response
                ?.data
                ?.message ||
            "Unable to submit group attendance."
        );

    } finally {
        setSubmitting(false);
    }
};

    // ======================================================
    // COUNTS
    // ======================================================

    const presentCount =
        students.filter(
            (student) =>
                studentAttendance[
                    student._id
                ] === "Present"
        ).length;


    const absentCount =
        students.filter(
            (student) =>
                studentAttendance[
                    student._id
                ] === "Absent"
        ).length;


    // ======================================================
    // UI
    // ======================================================

    return (
        <div className="group-attendance">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="attendance-header">

                <h2>
                    📸 Group Photo Attendance
                </h2>

                <p>
                    Select a subject, capture the
                    classroom photo and review
                    student attendance before
                    submitting.
                </p>

            </div>


            {/* ==================================================
                STEP 1 - SUBJECT
            ================================================== */}

            <div className="attendance-section">

                <h3>
                    1. Select Subject
                </h3>


                {loadingSubjects ? (

                    <LoadingSpinner text="Loading subjects..." size="small" />

                ) : subjects.length === 0 ? (

                    <div className="no-pending">

                        <h3>
                            📚 No Active Subjects
                        </h3>

                        <p>
                            Create an active subject
                            before taking group
                            attendance.
                        </p>

                    </div>

                ) : (

                    <select
                        value={
                            selectedSubjectId
                        }
                        onChange={
                            handleSubjectChange
                        }
                    >

                        <option value="">
                            -- Select Subject --
                        </option>


                        {subjects.map(
                            (subject) => (

                                <option
                                    key={
                                        subject._id
                                    }
                                    value={
                                        subject._id
                                    }
                                >
                                    {subject.name} (
                                    {subject.code})
                                </option>

                            )
                        )}

                    </select>
                )}


                {selectedSubject && (

                    <div className="subject-summary">

                        <p>
                            <strong>
                                Subject:
                            </strong>{" "}
                            {
                                selectedSubject.name
                            }
                        </p>


                        <p>
                            <strong>
                                Code:
                            </strong>{" "}
                            {
                                selectedSubject.code
                            }
                        </p>


                        <p>
                            <strong>
                                Department:
                            </strong>{" "}
                            {
                                selectedSubject
                                    .department
                            }
                        </p>


                        <p>
                            <strong>
                                Students:
                            </strong>{" "}
                            {
                                students.length
                            }
                        </p>

                    </div>
                )}

            </div>


            {/* ==================================================
                STEP 2 - CAMERA
            ================================================== */}

            {selectedSubjectId && (

                <div className="attendance-section">

                    <h3>
                        2. Capture Group Photo
                    </h3>


                    {/* ==========================================
                        OPEN CAMERA BUTTON
                    ========================================== */}

                    {!cameraActive &&
                        !capturedImage && (

                            <button
                                className="approve-btn"
                                onClick={
                                    startCamera
                                }
                            >
                                📷 Open Camera
                            </button>
                        )}


                    {/* ==========================================
                        LIVE CAMERA
                    ========================================== */}

                    {cameraActive && (

                        <div
                            className="camera-container"
                            style={{
                                width: "100%",
                                maxWidth: "900px",
                                margin: "20px auto",
                                background: "#000",
                                borderRadius: "16px",
                                overflow: "hidden",
                                padding: "10px"
                            }}
                        >

                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="group-camera"
                                style={{
                                    display: "block",
                                    width: "100%",
                                    minHeight: "360px",
                                    maxHeight: "600px",
                                    objectFit: "cover",
                                    background: "#000",
                                    borderRadius: "10px"
                                }}
                            />


                            <div
                                className="camera-actions"
                                style={{
                                    marginTop: "10px"
                                }}
                            >

                                <button
                                    type="button"
                                    className="approve-btn"
                                    onClick={
                                        capturePhoto
                                    }
                                >
                                    📸 Capture Photo
                                </button>


                                <button
                                    type="button"
                                    className="reject-btn"
                                    onClick={
                                        stopCamera
                                    }
                                >
                                    ✕ Stop Camera
                                </button>

                            </div>

                        </div>
                    )}


                    {/* ==========================================
                        CAPTURED PHOTO
                    ========================================== */}

                    {capturedImage && (

                        <div className="captured-photo">

                            <img
                                src={
                                    capturedImage
                                }
                                alt="Captured classroom group"
                                className="group-photo-preview"
                                style={{
                                    display: "block",
                                    width: "100%",
                                    maxWidth: "900px",
                                    maxHeight: "600px",
                                    objectFit: "cover",
                                    margin: "20px auto",
                                    borderRadius: "16px"
                                }}
                            />


                            <div className="camera-actions">

                                <button
                                    type="button"
                                    className="approve-btn"
                                    onClick={
                                        retakePhoto
                                    }
                                >
                                    🔄 Retake
                                </button>


                                <button
                                    type="button"
                                    className="reject-btn"
                                    onClick={
                                        removePhoto
                                    }
                                >
                                    🗑 Remove
                                </button>

                            </div>

                        </div>
                    )}

                </div>
            )}


            {/* ==================================================
                STEP 3 - STUDENTS
            ================================================== */}

            {selectedSubjectId &&
                capturedImage && (

                <div className="attendance-section">

                    <h3>
                        3. Review Students
                    </h3>


                    {/* FACE RECOGNITION NOTICE */}
<div className="no-pending">
    <h3>🤖 AI Face Recognition</h3>

    <p>
        Capture the classroom photo and run
        AI face recognition to identify
        enrolled students automatically.
    </p>

    <button
        type="button"
        className="approve-btn"
        onClick={recognizeGroupPhoto}
        disabled={recognizing}
    >
        {recognizing ? (
            <LoadingSpinner text="Recognizing..." size="small" inline />
        ) : "🤖 Recognize Faces"}
    </button>
</div>
              {recognitionDone && (
    <div className="attendance-summary">
        <h3>🤖 AI Recognition Results</h3>

        {recognitionResults.length === 0 ? (
            <p>No enrolled students were recognized.</p>
        ) : (
            <div>
                {recognitionResults.map((student) => (
                    <div
                        key={student.studentId}
                        className="student-row"
                    >
                        <div>
                            <strong>
                                {student.studentName}
                            </strong>

                            <p>
                                Similarity:{" "}
                                {(student.similarity * 100).toFixed(2)}%
                            </p>
                        </div>

                        <span>
                            {student.status}
                        </span>
                    </div>
                ))}
            </div>
        )}
    </div>
)}

                    {/* NO STUDENTS */}

                    {students.length === 0 ? (

                        <div className="no-pending">

                            <h3>
                                👥 No Students Assigned
                            </h3>

                            <p>
                                This subject currently
                                has no students in its
                                student list.
                            </p>

                        </div>

                    ) : (

                        <>

                            {/* ==================================
                                ATTENDANCE SUMMARY
                            ================================== */}

                            <div className="attendance-summary">

                                <p>
                                    👥 Total:{" "}
                                    <strong>
                                        {
                                            students.length
                                        }
                                    </strong>
                                </p>


                                <p>
                                    ✅ Present:{" "}
                                    <strong>
                                        {
                                            presentCount
                                        }
                                    </strong>
                                </p>


                                <p>
                                    ❌ Absent:{" "}
                                    <strong>
                                        {
                                            absentCount
                                        }
                                    </strong>
                                </p>

                            </div>


                            {/* ==================================
                                BULK ACTIONS
                            ================================== */}

                            <div className="camera-actions">

                                <button
                                    type="button"
                                    className="approve-btn"
                                    onClick={
                                        markAllPresent
                                    }
                                >
                                    ✓ Mark All Present
                                </button>


                                <button
                                    type="button"
                                    className="reject-btn"
                                    onClick={
                                        markAllAbsent
                                    }
                                >
                                    ✕ Mark All Absent
                                </button>

                            </div>


                            {/* ==================================
                                STUDENT LIST
                            ================================== */}

                            <div className="pending-list">

                                {students.map(
                                    (student) => (

                                    <div
                                        className="pending-card"
                                        key={
                                            student._id
                                        }
                                    >

                                        <div className="pending-info">

                                            <h3>
                                                👤{" "}
                                                {
                                                    student.name
                                                }
                                            </h3>


                                            <p>
                                                <strong>
                                                    Student ID:
                                                </strong>{" "}
                                                {
                                                    student.studentId ||
                                                    "N/A"
                                                }
                                            </p>


                                            <p>
                                                <strong>
                                                    Email:
                                                </strong>{" "}
                                                {
                                                    student.email ||
                                                    "N/A"
                                                }
                                            </p>


                                            <p>
                                                <strong>
                                                    Department:
                                                </strong>{" "}
                                                {
                                                    student.department ||
                                                    "N/A"
                                                }
                                            </p>

                                        </div>


                                        <div className="pending-actions">

                                            <button
                                                type="button"
                                                className="approve-btn"
                                                onClick={() =>
                                                    changeStudentStatus(
                                                        student._id,
                                                        "Present"
                                                    )
                                                }
                                            >
                                                {
                                                    studentAttendance[
                                                        student._id
                                                    ] ===
                                                    "Present"
                                                        ? "✓ Present"
                                                        : "Present"
                                                }
                                            </button>


                                            <button
                                                type="button"
                                                className="reject-btn"
                                                onClick={() =>
                                                    changeStudentStatus(
                                                        student._id,
                                                        "Absent"
                                                    )
                                                }
                                            >
                                                {
                                                    studentAttendance[
                                                        student._id
                                                    ] ===
                                                    "Absent"
                                                        ? "✓ Absent"
                                                        : "Absent"
                                                }
                                            </button>

                                        </div>

                                    </div>

                                ))}
                            </div>


                            {/* ==================================
                                SUBMIT
                            ================================== */}

                            <div className="camera-actions">

                                <button
                                    type="button"
                                    className="approve-btn"
                                    onClick={
                                        submitGroupAttendance
                                    }
                                    disabled={
                                        submitting
                                    }
                                >

                                    {submitting ? (
                                        <LoadingSpinner text="Submitting..." size="small" inline />
                                    ) : "🚀 Submit Group Attendance"}

                                </button>

                            </div>

                        </>
                    )}

                </div>
            )}


            {/* ==================================================
                MESSAGES
            ================================================== */}

            {message && (

                <div className="attendance-message">

                    ✅ {message}

                </div>
            )}


            {error && (

                <div className="attendance-message">

                    ❌ {error}

                </div>
            )}

        </div>
    );
}

export default GroupAttendance;