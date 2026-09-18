import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/config";
import LoadingSpinner from "./LoadingSpinner";

function FinalizeAttendance() {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [message, setMessage] = useState("");

    const formatSimilarity = (similarity) =>
        typeof similarity === "number"
            ? `${(similarity * 100).toFixed(2)}%`
            : "Not available";

    const fetchApprovedAttendance = async () => {
        try {
            setLoading(true);

            const token =
                localStorage.getItem("token");

            const response = await axios.get(
                `${API_BASE_URL}/attendance/records`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const records =
                response.data.attendance || [];

            // Show only approved records
            // which are not finalized yet.
            const approvedRecords =
                records.filter(
                    (record) =>
                        record.reviewStatus ===
                            "Approved" &&
                        !record.finalizedAt
                );

            setAttendance(
                approvedRecords
            );

            setMessage("");

        } catch (error) {
            console.error(
                "Fetch Approved Attendance Error:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "Unable to fetch approved attendance."
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovedAttendance();
    }, []);

    const finalizeAttendance = async (
        attendanceId
    ) => {
        const confirmed =
            window.confirm(
                "Are you sure you want to finalize this attendance? Once finalized, it cannot be finalized again."
            );

        if (!confirmed) {
            return;
        }

        try {
            setProcessingId(attendanceId);

            const token =
                localStorage.getItem("token");

            const response =
                await axios.put(
                    `${API_BASE_URL}/attendance/finalize/${attendanceId}`,
                    {},
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

            // Remove finalized record
            // from this list.
            setAttendance((previous) =>
                previous.filter(
                    (record) =>
                        record._id !==
                        attendanceId
                )
            );

        } catch (error) {
            console.error(
                "Finalize Attendance Error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Unable to finalize attendance."
            );

        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="finalize-attendance">

                <h2>
                    🔒 Finalize Attendance
                </h2>

                <p>
                    <LoadingSpinner text="Loading approved attendance..." />
                </p>

            </div>
        );
    }

    return (
        <div className="finalize-attendance">

            <h2>
                🔒 Finalize Attendance
            </h2>

            <p>
                Review approved attendance
                records and finalize them.
            </p>

            {message && (
                <p className="attendance-message">
                    {message}
                </p>
            )}

            {attendance.length === 0 ? (

                <div className="no-pending">

                    <h3>
                        ✅ No Attendance to Finalize
                    </h3>

                    <p>
                        There are currently no
                        approved attendance records
                        waiting for finalization.
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
                                            Type:
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

                                    <p>
                                        <strong>
                                            Location Verification:
                                        </strong>{" "}
                                        {record.locationVerified
                                            ? "✅ Location Verified"
                                            : "❌ Location Not Verified"}
                                    </p>

                                    <p>
                                        <strong>
                                            Review:
                                        </strong>{" "}
                                        ✅ Approved
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
                                            finalizeAttendance(
                                                record._id
                                            )
                                        }
                                    >
                                        {processingId ===
                                        record._id
                                            ? <LoadingSpinner text="Finalizing..." size="small" inline />
                                            : "🔒 Finalize"}
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

export default FinalizeAttendance;