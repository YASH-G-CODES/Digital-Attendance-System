import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/config";
import LoadingSpinner from "./LoadingSpinner";

const initialSettings = {
    configuration: {
        campus: {},
        faceRecognition: {},
        faculty: {},
        attendance: {}
    },
    systemStatus: {}
};

function SystemSettings() {
    const [settings, setSettings] = useState(initialSettings);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_BASE_URL}/admin/settings`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setSettings(response.data);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Unable to load system settings."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const statusClass = (status) =>
        status === "Operational" || status === "Connected" || status === "Available"
            ? "status-active"
            : "status-rejected";

    if (loading) {
        return (
            <section className="system-settings-page">
                <div className="admin-loading">
                    <LoadingSpinner text="Loading system settings..." />
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="system-settings-page">
                <div className="error-message">{error}</div>
                <button type="button" onClick={fetchSettings}>Retry</button>
            </section>
        );
    }

    const { configuration, systemStatus } = settings;
    const campus = configuration.campus;
    const faceRecognition = configuration.faceRecognition;
    const faculty = configuration.faculty;
    const attendance = configuration.attendance;

    return (
        <section className="system-settings-page">
            <div className="settings-intro">
                <div>
                    <p className="eyebrow">Administration</p>
                    <h2>System Settings</h2>
                    <p>Review operational configuration and service health.</p>
                </div>
                <span className="read-only-badge">Read-only configuration</span>
            </div>

            <div className="settings-status-grid">
                {Object.entries(systemStatus).map(([label, status]) => (
                    <div className="settings-status-card" key={label}>
                        <span>{label.replace(/([A-Z])/g, " $1")}</span>
                        <strong className={statusClass(status)}>{status}</strong>
                    </div>
                ))}
            </div>

            <div className="settings-grid">
                <section className="settings-card">
                    <div className="settings-card-heading">
                        <div>
                            <p className="settings-kicker">Geofence</p>
                            <h3>Campus Settings</h3>
                        </div>
                        <span className="settings-icon">⌖</span>
                    </div>
                    <div className="settings-values">
                        <div><span>Latitude</span><strong>{campus.latitude ?? "Not configured"}</strong></div>
                        <div><span>Longitude</span><strong>{campus.longitude ?? "Not configured"}</strong></div>
                        <div><span>Attendance radius</span><strong>{Number.isFinite(campus.radius) ? `${campus.radius} metres` : "Not configured"}</strong></div>
                    </div>
                    <p className="settings-note">Environment configuration. Changes require a backend restart.</p>
                </section>

                <section className="settings-card">
                    <div className="settings-card-heading">
                        <div>
                            <p className="settings-kicker">AI verification</p>
                            <h3>Face Recognition</h3>
                        </div>
                        <span className="settings-icon">◉</span>
                    </div>
                    <div className="settings-values">
                        <div><span>Similarity threshold</span><strong>{faceRecognition.threshold ?? "Not available"}</strong></div>
                        <div><span>AI service</span><strong className={statusClass(faceRecognition.aiServiceStatus)}>{faceRecognition.aiServiceStatus}</strong></div>
                        <div><span>Face verification</span><strong className={statusClass(faceRecognition.faceVerificationStatus)}>{faceRecognition.faceVerificationStatus}</strong></div>
                    </div>
                    <p className="settings-note">Threshold is defined by the Python recognizer and is not editable here.</p>
                </section>

                <section className="settings-card">
                    <div className="settings-card-heading">
                        <div>
                            <p className="settings-kicker">Account policy</p>
                            <h3>Faculty Settings</h3>
                        </div>
                        <span className="settings-icon">♙</span>
                    </div>
                    <div className="settings-highlight">
                        <strong>{faculty.validityPeriodDays} days</strong>
                        <span>Faculty registration validity period</span>
                    </div>
                    <p className="settings-note">Application policy. Existing faculty approval logic remains unchanged.</p>
                </section>

                <section className="settings-card">
                    <div className="settings-card-heading">
                        <div>
                            <p className="settings-kicker">Workflow policy</p>
                            <h3>Attendance Settings</h3>
                        </div>
                        <span className="settings-icon">✓</span>
                    </div>
                    <div className="settings-values">
                        <div><span>Review workflow</span><strong>{attendance.reviewWorkflow}</strong></div>
                        <div><span>Finalization</span><strong>{attendance.finalizationRule}</strong></div>
                    </div>
                    <p className="settings-note">Application workflow. These rules are enforced by the attendance API.</p>
                </section>
            </div>
        </section>
    );
}

export default SystemSettings;
