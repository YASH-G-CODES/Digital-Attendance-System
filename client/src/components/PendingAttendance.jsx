import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL, API_ORIGIN } from "../services/config";
import LoadingSpinner from "./LoadingSpinner";

function PendingAttendance() {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [message, setMessage] = useState("");

    const formatSimilarity = (similarity) =>
        typeof similarity === "number"
            ? `${(similarity * 100).toFixed(2)}%`
            : "Not available";

    const fetchPendingAttendance = async () => {
        try {
            setLoading(true);

            const token =
                localStorage.getItem("token");

            if (!token) {
                setMessage(
                    "Please login again."
                );
                return;
            }

            const response = await axios.get(
                `${API_BASE_URL}/attendance/pending`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setAttendance(
                response.data.attendance || []
            );

            setMessage("");

        } catch (error) {
            console.error(
                "Pending Attendance Error:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "Unable to fetch pending attendance."
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingAttendance();
    }, []);

    const reviewAttendance = async (
        attendanceId,
        decision
    ) => {
        const actionText =
            decision === "Approved"
                ? "approve"
                : "reject";

        const confirmed =
            window.confirm(
                `Are you sure you want to ${actionText} this attendance?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setProcessingId(attendanceId);

            const token =
                localStorage.getItem("token");

            let teacherComment = "";

            if (decision === "Approved") {
                teacherComment = "Attendance approved by faculty.";
            } else {
                teacherComment =
                    window.prompt(
                        "Please enter the reason for rejecting this attendance:"
                    );

                if (teacherComment === null) {
                    return;
                }

                teacherComment = teacherComment.trim();

                if (!teacherComment) {
                    alert("Rejection reason is required.");
                    return;
                }
            }

            const response =
                await axios.put(
                    `${API_BASE_URL}/attendance/review/${attendanceId}`,
                    {
                        decision,
                        teacherComment
                    },
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            alert(
                response.data.message
            );

            // Remove reviewed attendance
            // from pending list immediately.
            setAttendance((previous) =>
                previous.filter(
                    (record) =>
                        record._id !==
                        attendanceId
                )
            );

        } catch (error) {
            console.error(
                "Review Attendance Error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Unable to review attendance."
            );

        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="pending-attendance">

                <h2>
                    ⏳ Pending Attendance
                </h2>

                <p>
                    <LoadingSpinner text="Loading pending attendance..." />
                </p>

            </div>
        );
    }

    return (
        <div className="pending-attendance">

            <h2>
                ⏳ Pending Attendance
            </h2>

            <p>
                Review attendance submissions
                waiting for faculty approval.
            </p>

            {message && (
                <p className="attendance-message">
                    {message}
                </p>
            )}

            {attendance.length === 0 ? (

                <div className="no-pending">

                    <h3>
                        ✅ No Pending Attendance
                    </h3>

                    <p>
                        There are currently no
                        attendance records waiting
                        for review.
                    </p>

                </div>

            ) : (

                <div className="pending-list">

                    {attendance.map(
                        (record) => (

                            <div
                                className="pending-card"
                                key={record._id}
                            >

                                <div className="pending-info">

                                    <h3>
                                        👤{" "}
                                        {record.student?.name ||
                                            "Unknown Student"}
                                    </h3>

                                    <p>
                                        <strong>
                                            Student ID:
                                        </strong>{" "}
                                        {record.student
                                            ?.studentId ||
                                            "N/A"}
                                    </p>

                                    <p>
                                        <strong>
                                            Email:
                                        </strong>{" "}
                                        {record.student
                                            ?.email ||
                                            "N/A"}
                                    </p>

                                    <p>
                                        <strong>
                                            Department:
                                        </strong>{" "}
                                        {record.student
                                            ?.department ||
                                            "N/A"}
                                    </p>

                                    <hr />

                                    <p>
                                        <strong>
                                            Subject:
                                        </strong>{" "}
                                        {record.subject
                                            ?.name ||
                                            "N/A"}

                                        {record.subject
                                            ?.code &&
                                            ` (${record.subject.code})`}
                                    </p>

                                    <p>
                                        <strong>
                                            Faculty:
                                        </strong>{" "}
                                        {record.faculty
                                            ?.name ||
                                            "N/A"}
                                    </p>

                                    <p>
                                        <strong>
                                            Date:
                                        </strong>{" "}
                                        {record.date
                                            ? new Date(
                                                record.date
                                            ).toLocaleDateString()
                                            : "N/A"}
                                    </p>

                                    <p>
                                        <strong>
                                            Time:
                                        </strong>{" "}
                                        {record.time ||
                                            "N/A"}
                                    </p>

                                    <p>
                                        <strong>
                                            Attendance:
                                        </strong>{" "}
                                        {record.status ||
                                            "N/A"}
                                    </p>

                                    <p>
                                        <strong>
                                            Method:
                                        </strong>{" "}
                                        {record.method ||
                                            "N/A"}
                                    </p>

                                    <p>
                                        <strong>
                                            Attendance Type:
                                        </strong>{" "}
                                        {record.attendanceType ||
                                            "N/A"}
                                    </p>

                                    {(record.method === "Face Recognition" ||
                                        record.attendanceType === "Self Attendance") && (
                                        <div className="ai-verification-box">
                                            <strong>🤖 AI Face Recognition</strong>
                                            <span className={record.faceVerified ? "verification-positive" : "verification-negative"}>
                                                {record.faceVerified
                                                    ? "✅ Face Verified"
                                                    : "❌ Face Not Verified"}
                                            </span>
                                            <p>
                                                Similarity: {formatSimilarity(record.faceSimilarity)}
                                            </p>
                                            <p>
                                                Verification method: {record.method || "N/A"}
                                            </p>
                                        </div>
                                    )}

                                    {record.groupPhotoUrl && (
                                        <div className="group-photo-preview">
                                            <strong>📸 Group Photo:</strong>

                                            <img
                                                src={`${API_ORIGIN}${record.groupPhotoUrl}`}
                                                alt="Attendance Group"
                                                style={{
                                                    width: "100%",
                                                    maxWidth: "420px",
                                                    marginTop: "10px",
                                                    borderRadius: "12px",
                                                    display: "block"
                                                }}
                                            />
                                        </div>
                                    )}

                                    <p>
                                        <strong>
                                            Location Verification:
                                        </strong>{" "}
                                        {record.locationVerified
                                            ? "✅ Location Verified"
                                            : "❌ Location Not Verified"}
                                    </p>

                                    {record.latitude !==
                                        null &&
                                        record.latitude !==
                                        undefined &&
                                        record.longitude !==
                                        null &&
                                        record.longitude !==
                                        undefined && (
                                            <p>
                                                <strong>
                                                    Coordinates:
                                                </strong>{" "}
                                                {Number(
                                                    record.latitude
                                                ).toFixed(
                                                    6
                                                )}
                                                ,{" "}
                                                {Number(
                                                    record.longitude
                                                ).toFixed(
                                                    6
                                                )}
                                            </p>
                                        )}

                                    <p>
                                        <strong>
                                            Review:
                                        </strong>{" "}
                                        ⏳ Pending
                                    </p>

                                </div>

                                <div className="pending-actions">

                                    <button
                                        className="approve-btn"
                                        disabled={
                                            processingId ===
                                            record._id
                                        }
                                        onClick={() =>
                                            reviewAttendance(
                                                record._id,
                                                "Approved"
                                            )
                                        }
                                    >
                                        {processingId ===
                                            record._id
                                            ? <LoadingSpinner text="Processing..." size="small" inline />
                                            : "✅ Approve"}
                                    </button>

                                    <button
                                        className="reject-btn"
                                        disabled={
                                            processingId ===
                                            record._id
                                        }
                                        onClick={() =>
                                            reviewAttendance(
                                                record._id,
                                                "Rejected"
                                            )
                                        }
                                    >
                                        {processingId ===
                                            record._id
                                            ? <LoadingSpinner text="Processing..." size="small" inline />
                                            : "❌ Reject"}
                                    </button>

                                </div>

                            </div>

                        )
                    )}

                </div>

            )}

        </div>
    );
}

export default PendingAttendance;