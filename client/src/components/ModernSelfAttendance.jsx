import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/config";

const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

function ModernSelfAttendance() {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [subjects, setSubjects] = useState([]);
    const [subjectId, setSubjectId] = useState("");
    const [cameraOpen, setCameraOpen] = useState(false);
    const [selfie, setSelfie] = useState("");
    const [location, setLocation] = useState(null);
    const [notice, setNotice] = useState("");
    const [saving, setSaving] = useState(false);

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setCameraOpen(false);
    };

    useEffect(() => {
        axios.get(`${API_BASE_URL}/subjects/available`, auth())
            .then((response) => setSubjects(response.data?.subjects || (Array.isArray(response.data) ? response.data : [])))
            .catch(() => setNotice("Subjects could not be loaded. Please refresh the page."));
        return stopCamera;
    }, []);

    const openCamera = async () => {
        try {
            stopCamera();
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setCameraOpen(true);
            setNotice("");
        } catch {
            setNotice("Camera permission is needed to take your attendance selfie.");
        }
    };

    const captureSelfie = () => {
        const video = videoRef.current;
        if (!video?.videoWidth) return setNotice("Wait for the camera preview, then capture your selfie.");
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        setSelfie(canvas.toDataURL("image/jpeg", 0.85));
        stopCamera();
        setNotice("");
    };

    const getLocation = () => {
        if (!navigator.geolocation) return setNotice("Location is not supported by this browser.");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
                setNotice("");
            },
            () => setNotice("Allow location access to complete attendance."),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const submit = async () => {
        const subject = subjects.find((item) => (item._id || item.id) === subjectId);
        if (!subjectId || !selfie || !location) return setNotice("Complete subject, selfie and location before submitting.");
        try {
            setSaving(true);
            const response = await axios.post(`${API_BASE_URL}/attendance/self`, {
                subjectId,
                subjectName: subject?.name || "Subject",
                selfie,
                location
            }, auth());
            setNotice(response.data.message || "Attendance submitted successfully.");
            setSubjectId("");
            setSelfie("");
            setLocation(null);
        } catch (error) {
            setNotice(error.response?.data?.message || "Attendance could not be submitted.");
        } finally {
            setSaving(false);
        }
    };

    const readyCount = [subjectId, selfie, location].filter(Boolean).length;

    return (
        <section className="modern-attendance-page">
            <header className="modern-page-intro">
                <div><p>DAILY CHECK-IN</p><h2>Mark attendance</h2><span>Complete the three quick checks below to record your presence.</span></div>
                <div className="modern-progress"><strong>{readyCount}/3</strong><span>steps complete</span></div>
            </header>
            {notice && <p className="modern-notice">{notice}</p>}
            <div className="modern-attendance-grid">
                <div className="modern-checklist-card">
                    <div className="modern-step"><span>01</span><div><h3>Choose subject</h3><p>Select the class for which you are checking in.</p></div></div>
                    <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
                        <option value="">Select a subject</option>
                        {subjects.map((subject) => <option key={subject._id || subject.id} value={subject._id || subject.id}>{subject.name} · {subject.code}</option>)}
                    </select>
                    <div className="modern-step"><span>02</span><div><h3>Take a selfie</h3><p>Keep your face clearly visible inside the oval frame.</p></div></div>
                    <div className="modern-step"><span>03</span><div><h3>Confirm location</h3><p>Allow location access to verify your check-in.</p></div></div>
                    <button className={`modern-location-button ${location ? "done" : ""}`} type="button" onClick={getLocation}>{location ? "Location confirmed" : "Confirm location"}</button>
                </div>
                <div className="modern-camera-card">
                    <div className="modern-camera-top"><span>SELFIE VERIFICATION</span><b>{selfie ? "Captured" : cameraOpen ? "Camera live" : "Ready"}</b></div>
                    <div className="modern-oval-camera">
                        {selfie ? <img src={selfie} alt="Attendance selfie" /> : <video ref={videoRef} autoPlay playsInline muted />}
                        {!cameraOpen && !selfie && <div className="modern-camera-empty"><strong>Camera ready</strong><span>Your selfie will appear here</span></div>}
                    </div>
                    <div className="modern-camera-actions">
                        {!selfie ? <><button type="button" onClick={openCamera}>{cameraOpen ? "Restart camera" : "Open camera"}</button><button type="button" className="secondary" onClick={captureSelfie} disabled={!cameraOpen}>Capture selfie</button></> : <button type="button" className="secondary" onClick={() => { setSelfie(""); openCamera(); }}>Retake selfie</button>}
                    </div>
                </div>
            </div>
            <button className="modern-submit-button" type="button" onClick={submit} disabled={saving || readyCount !== 3}>{saving ? "Submitting attendance..." : "Submit attendance"}</button>
        </section>
    );
}

export default ModernSelfAttendance;
