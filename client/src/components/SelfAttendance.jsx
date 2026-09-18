/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
/* The initial subject request is an intentional one-time data load. */
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/config";
import LoadingSpinner from "./LoadingSpinner";

function SelfAttendance() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [cameraStarted, setCameraStarted] = useState(false);
    const [selfie, setSelfie] = useState(null);
    const [selfieFile, setSelfieFile] = useState(null);
    const [verification, setVerification] = useState(null);
    const [location, setLocation] = useState(null);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [notice, setNotice] = useState(null);

    const authConfig = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        }
    });

    const showNotice = (type, text) => setNotice({ type, text });

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraStarted(false);
    };

    const fetchSubjects = async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/subjects/available`,
                authConfig()
            );
            setSubjects(
                response.data?.subjects ||
                (Array.isArray(response.data) ? response.data : [])
            );
        } catch (error) {
            showNotice(
                "error",
                error.response?.data?.message ||
                    "Unable to load your available subjects."
            );
        } finally {
            setLoadingSubjects(false);
        }
    };

    const startCamera = async () => {
        try {
            stopCamera();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setCameraStarted(true);
            showNotice("info", "Camera is ready. Keep only your face in the frame.");
        } catch {
            showNotice(
                "error",
                "Camera permission was denied or no camera is available."
            );
        }
    };

    const captureSelfie = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!cameraStarted || !video || !canvas || !video.videoWidth) {
            showNotice("error", "Start the camera and wait for its preview before capturing.");
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    showNotice("error", "Could not capture the selfie. Please try again.");
                    return;
                }

                setSelfie(URL.createObjectURL(blob));
                setSelfieFile(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
                setVerification(null);
                stopCamera();
                showNotice("info", "Selfie captured. Verify your face before submitting.");
            },
            "image/jpeg",
            0.9
        );
    };

    const retakeSelfie = async () => {
        if (selfie) {
            URL.revokeObjectURL(selfie);
        }
        setSelfie(null);
        setSelfieFile(null);
        setVerification(null);
        await startCamera();
    };

    const verifyFace = async () => {
        if (!selfieFile) {
            showNotice("error", "Capture a selfie before verifying your face.");
            return;
        }

        try {
            setVerifying(true);
            setVerification(null);
            const formData = new FormData();
            formData.append("selfie", selfieFile);

            const response = await axios.post(
                `${API_BASE_URL}/attendance/verify-selfie`,
                formData,
                authConfig()
            );

            setVerification(response.data);
            showNotice(
                response.data.verified ? "success" : "error",
                response.data.message
            );
        } catch (error) {
            const result = error.response?.data;
            setVerification(result?.faceVerified === false ? result : null);
            showNotice(
                "error",
                result?.message || "Face verification could not be completed."
            );
        } finally {
            setVerifying(false);
        }
    };

    const getLocation = () => {
        if (!navigator.geolocation) {
            showNotice("error", "Geolocation is not supported by this browser.");
            return;
        }

        setGettingLocation(true);
        showNotice("info", "Checking your campus location…");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: Math.round(position.coords.accuracy)
                });
                setGettingLocation(false);
                showNotice("success", "Location captured. It will be checked against the campus boundary.");
            },
            () => {
                setGettingLocation(false);
                showNotice("error", "Location permission was denied or your location is unavailable.");
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const submitAttendance = async () => {
        if (!selectedSubject || !selfieFile || !location) {
            showNotice("error", "Complete subject selection, selfie capture, and location verification first.");
            return;
        }
        if (!verification?.verified) {
            showNotice("error", "Verify the captured selfie before submitting attendance.");
            return;
        }

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append("subjectId", selectedSubject);
            formData.append("latitude", String(location.latitude));
            formData.append("longitude", String(location.longitude));
            formData.append("selfie", selfieFile);

            // The server independently verifies this exact image again. No
            // browser-provided flag can mark attendance as face-verified.
            const response = await axios.post(
                `${API_BASE_URL}/attendance/self`,
                formData,
                authConfig()
            );

            showNotice("success", response.data.message);
            if (selfie) {
                URL.revokeObjectURL(selfie);
            }
            setSelfie(null);
            setSelfieFile(null);
            setVerification(null);
            setLocation(null);
            setSelectedSubject("");
        } catch (error) {
            showNotice(
                "error",
                error.response?.data?.message || "Attendance submission failed."
            );
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
        return () => stopCamera();
    }, []);

    return (
        <main className="self-attendance">
            <header className="self-attendance-header">
                <div className="self-attendance-modern-heading">
                    <div>
                        <p className="eyebrow">Secure daily check-in</p>
                        <h2>Mark your attendance</h2>
                        <p>Verify your subject, selfie and location to securely record today’s attendance.</p>
                    </div>
                    <div className="attendance-security-note">
                        <strong>4</strong>
                        <span>secure<br />checks</span>
                    </div>
                </div>
                <p className="eyebrow">Secure check-in</p>
                <h2>📸 Self Attendance</h2>
                <p>Complete all four checks. Your selfie is verified by the AI service before attendance is accepted.</p>
            </header>

            {notice && (
                <p className={`attendance-message ${notice.type}`} role="status">
                    {notice.text}
                </p>
            )}

            <section className="self-attendance-steps" aria-label="Self attendance steps">
                <span className={selectedSubject ? "complete" : ""}>1. Subject</span>
                <span className={selfieFile ? "complete" : ""}>2. Selfie</span>
                <span className={verification?.verified ? "complete" : ""}>3. Face verified</span>
                <span className={location ? "complete" : ""}>4. Location</span>
            </section>

            <section className="subject-selection">
                <label htmlFor="self-attendance-subject">Select subject</label>
                {loadingSubjects ? (
                    <LoadingSpinner text="Loading available subjects..." size="small" />
                ) : (
                    <select
                        id="self-attendance-subject"
                        value={selectedSubject}
                        onChange={(event) => setSelectedSubject(event.target.value)}
                    >
                        <option value="">— Select a subject —</option>
                        {subjects.map((subject) => (
                            <option key={subject._id} value={subject._id}>
                                {subject.name} ({subject.code}) — {subject.faculty?.name || "Faculty"}
                            </option>
                        ))}
                    </select>
                )}
            </section>

            <section className="camera-stage">
                <div className="camera-stage-heading">
                    <div>
                        <span>Step 2</span>
                        <h3>Face verification camera</h3>
                    </div>
                    <p>{selfie ? "Selfie captured" : cameraStarted ? "Camera is live" : "Camera is off"}</p>
                </div>
                <div className="camera-box">
                    {selfie ? (
                        <img src={selfie} alt="Captured attendance selfie" className="selfie-preview" />
                    ) : (
                        <video ref={videoRef} autoPlay playsInline muted aria-label="Camera preview" />
                    )}
                    {!cameraStarted && !selfie && <p className="camera-placeholder">Open the camera to start your face verification.</p>}
                </div>
            </section>
            <canvas ref={canvasRef} hidden />

            <div className="attendance-actions">
                {!selfie ? (
                    <>
                        <button type="button" onClick={startCamera} disabled={cameraStarted}>Open camera</button>
                        <button type="button" onClick={captureSelfie} disabled={!cameraStarted}>Capture selfie</button>
                    </>
                ) : (
                    <>
                        <button type="button" onClick={retakeSelfie} disabled={verifying || submitting}>Retake selfie</button>
                        <button type="button" onClick={verifyFace} disabled={verifying || submitting}>
                            {verifying ? (
                                <LoadingSpinner text="Verifying..." size="small" inline />
                            ) : "Verify face"}
                        </button>
                    </>
                )}
                {cameraStarted && <button type="button" onClick={stopCamera}>Close camera</button>}
            </div>

            {verification && (
                <section className={`face-verification ${verification.verified ? "verified" : "rejected"}`}>
                    <strong>{verification.verified ? "✓ Face verified" : "Face not verified"}</strong>
                    {typeof verification.similarity === "number" && <span> Similarity: {(verification.similarity * 100).toFixed(2)}%</span>}
                </section>
            )}

            <section className="location-section">
                <h3>Campus location</h3>
                <p>Allow precise location access. The server validates the campus boundary on submission.</p>
                <button type="button" onClick={getLocation} disabled={gettingLocation || submitting}>
                    {gettingLocation ? (
                        <LoadingSpinner text="Checking..." size="small" inline />
                    ) : "📍 Verify campus location"}
                </button>
                {location && <p className="location-success">✓ Location captured (accuracy: approximately {location.accuracy} m).</p>}
            </section>

            <button
                type="button"
                className="submit-attendance"
                onClick={submitAttendance}
                disabled={!selectedSubject || !verification?.verified || !location || submitting}
            >
                {submitting ? (
                    <LoadingSpinner text="Submitting..." size="small" inline />
                ) : "Submit attendance"}
            </button>
        </main>
    );
}

export default SelfAttendance;
