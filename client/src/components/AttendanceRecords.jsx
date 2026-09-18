

import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/config";
import LoadingSpinner from "./LoadingSpinner";

function AttendanceRecords() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [processingId, setProcessingId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const [statusFilter, setStatusFilter] = useState("All");
    const [subjectFilter, setSubjectFilter] = useState("All");

    const formatSimilarity = (similarity) =>
        typeof similarity === "number"
            ? `${(similarity * 100).toFixed(2)}%`
            : "Not available";

    // ==============================
    // FETCH ATTENDANCE RECORDS
    // ==============================

    const fetchRecords = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                setMessage("Please login again.");
                setLoading(false);
                return;
            }

            const user = JSON.parse(
                localStorage.getItem("user")
            );

            let url =
                `${API_BASE_URL}/attendance/records`;

            // Student sees only own history
            if (user?.role === "student") {
                url =
                    `${API_BASE_URL}/attendance/history/${user.id}`;
            }

            const response = await axios.get(
                url,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setRecords(
                response.data.attendance ||
                response.data.records ||
                []
            );

            setMessage("");

        } catch (error) {
            console.error(
                "Attendance Records Error:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "Unable to fetch attendance records."
            );

        } finally {
            setLoading(false);
        }
    };

    // ==============================
    // REFRESH
    // ==============================

    const refreshRecords = async () => {
        setMessage("");
        setLoading(true);
        await fetchRecords();
    };

    // ==============================
    // INITIAL LOAD
    // ==============================

    useEffect(() => {
        try {
            const user = JSON.parse(
                localStorage.getItem("user")
            );

            setCurrentUser(user);

        } catch (error) {
            console.error(
                "User parsing error:",
                error
            );
        }

        fetchRecords();
    }, []);

    // ==============================
    // FILTERED RECORDS
    // ==============================

    const filteredRecords = records.filter(
        (record) => {

            const matchesStatus =
                statusFilter === "All" ||
                record.status === statusFilter;

            const recordSubject =
                record.subject?._id ||
                record.subject ||
                "";

            const matchesSubject =
                subjectFilter === "All" ||
                recordSubject === subjectFilter;

            return (
                matchesStatus &&
                matchesSubject
            );
        }
    );

    // ==============================
    // UNIQUE SUBJECTS
    // ==============================

    const uniqueSubjects = [
        ...new Map(
            records.map((record) => [
                record.subject?._id ||
                    record.subject ||
                    "unknown",

                record.subject?.name ||
                    "Unknown Subject"
            ])
        ).entries()
    ];

    // ==============================
    // VALID RECORDS
    // Pending + Rejected should not
    // affect attendance percentage
    // ==============================

    const validRecords = records.filter(
        (record) =>
            record.reviewStatus === "Approved"
    );

    // ==============================
    // OVERALL SUMMARY
    // ==============================

    const totalClasses =
        validRecords.length;

    const presentCount =
        validRecords.filter(
            (record) =>
                record.status === "Present"
        ).length;

    const absentCount =
        validRecords.filter(
            (record) =>
                record.status === "Absent"
        ).length;

    const lateCount =
        validRecords.filter(
            (record) =>
                record.status === "Late"
        ).length;

    const attendancePercentage =
        totalClasses > 0
            ? (
                (
                    presentCount +
                    lateCount
                ) /
                totalClasses
            ) * 100
            : 0;

    // ==============================
    // SUBJECT-WISE ATTENDANCE
    // ==============================

    const subjectAttendance = Object.values(
        validRecords.reduce(
            (subjects, record) => {

                const subjectId =
                    record.subject?._id ||
                    record.subject ||
                    "unknown";

                const subjectName =
                    record.subject?.name ||
                    "Unknown Subject";

                if (!subjects[subjectId]) {
                    subjects[subjectId] = {
                        id: subjectId,
                        name: subjectName,
                        total: 0,
                        present: 0,
                        late: 0,
                        absent: 0
                    };
                }

                subjects[subjectId].total += 1;

                if (
                    record.status ===
                    "Present"
                ) {
                    subjects[
                        subjectId
                    ].present += 1;
                }

                if (
                    record.status ===
                    "Late"
                ) {
                    subjects[
                        subjectId
                    ].late += 1;
                }

                if (
                    record.status ===
                    "Absent"
                ) {
                    subjects[
                        subjectId
                    ].absent += 1;
                }

                return subjects;
            },
            {}
        )
    );

    // ==============================
    // FINALIZE ATTENDANCE
    // ==============================

    const finalizeAttendance = async (
        attendanceId
    ) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to finalize this attendance? Once finalized, it should not be changed."
            );

        if (!confirmed) {
            return;
        }

        try {
            setProcessingId(
                attendanceId
            );

            setMessage("");

            const token =
                localStorage.getItem(
                    "token"
                );

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

            setMessage(
                response.data?.message ||
                "Attendance finalized successfully."
            );

            setRecords(
                (previousRecords) =>
                    previousRecords.map(
                        (record) =>
                            record._id ===
                            attendanceId
                                ? {
                                    ...record,
                                    finalizedAt:
                                        new Date().toISOString()
                                }
                                : record
                    )
            );

        } catch (error) {
            console.error(
                "Finalize Attendance Error:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "Unable to finalize attendance."
            );

        } finally {
            setProcessingId(null);
        }
    };

    // ==============================
    // LOADING
    // ==============================

    if (loading) {
        return (
            <div className="attendance-records">

                <div className="loading">
                    <h2>
                        📊 Attendance Records
                    </h2>

                    <p>
                        <LoadingSpinner text="Loading attendance records..." />
                    </p>
                </div>

            </div>
        );
    }

    // ==============================
    // MAIN UI
    // ==============================

    return (
        <div className="attendance-records">

            {/* HEADER */}
            <div className="page-header">

                <div>
                    <h2>
                        📊 Attendance Records
                    </h2>

                    <p>
                        View, filter and manage
                        attendance records.
                    </p>
                </div>

                <button
                    type="button"
                    className="refresh-btn"
                    onClick={refreshRecords}
                    disabled={loading}
                >
                    🔄 Refresh
                </button>

            </div>

            {/* ==============================
                SUMMARY
            ============================== */}

            <div className="attendance-summary-grid">

                <div className="summary-card">
                    <span>📚</span>

                    <div>
                        <small>
                            Total Classes
                        </small>

                        <strong>
                            {totalClasses}
                        </strong>
                    </div>
                </div>

                <div className="summary-card">
                    <span>✅</span>

                    <div>
                        <small>
                            Present
                        </small>

                        <strong>
                            {presentCount}
                        </strong>
                    </div>
                </div>

                <div className="summary-card">
                    <span>❌</span>

                    <div>
                        <small>
                            Absent
                        </small>

                        <strong>
                            {absentCount}
                        </strong>
                    </div>
                </div>

                <div className="summary-card">
                    <span>⏰</span>

                    <div>
                        <small>
                            Late
                        </small>

                        <strong>
                            {lateCount}
                        </strong>
                    </div>
                </div>

                <div className="summary-card percentage-card">
                    <span>📈</span>

                    <div>
                        <small>
                            Attendance
                        </small>

                        <strong>
                            {attendancePercentage.toFixed(
                                1
                            )}
                            %
                        </strong>
                    </div>
                </div>

            </div>

            {/* ==============================
                FILTERS
            ============================== */}

            <div className="attendance-filters">

                <div className="filter-group">

                    <label htmlFor="status-filter">
                        Attendance Status
                    </label>

                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
                    >
                        <option value="All">
                            All Status
                        </option>

                        <option value="Present">
                            Present
                        </option>

                        <option value="Absent">
                            Absent
                        </option>

                        <option value="Late">
                            Late
                        </option>
                    </select>

                </div>

                <div className="filter-group">

                    <label htmlFor="subject-filter">
                        Subject
                    </label>

                    <select
                        id="subject-filter"
                        value={subjectFilter}
                        onChange={(event) =>
                            setSubjectFilter(
                                event.target.value
                            )
                        }
                    >
                        <option value="All">
                            All Subjects
                        </option>

                        {uniqueSubjects.map(
                            (
                                [
                                    subjectId,
                                    subjectName
                                ]
                            ) => (
                                <option
                                    key={subjectId}
                                    value={subjectId}
                                >
                                    {subjectName}
                                </option>
                            )
                        )}

                    </select>

                </div>

                <button
                    type="button"
                    className="reset-filter-btn"
                    onClick={() => {
                        setStatusFilter("All");
                        setSubjectFilter("All");
                    }}
                >
                    ↺ Reset Filters
                </button>

            </div>

            {/* FILTER COUNT */}

            <p className="filter-result-count">

                Showing{" "}

                <strong>
                    {filteredRecords.length}
                </strong>

                {" "}of{" "}

                <strong>
                    {records.length}
                </strong>

                {" "}attendance records

            </p>

            {/* MESSAGE */}

            {message && (
                <p className="attendance-message">
                    {message}
                </p>
            )}

            {/* ==============================
                SUBJECT-WISE ATTENDANCE
                STUDENT ONLY
            ============================== */}

            {currentUser?.role ===
                "student" &&
                subjectAttendance.length >
                    0 && (

                    <div className="subject-attendance-section">

                        <h3>
                            📚 Subject-wise Attendance
                        </h3>

                        <div className="subject-attendance-grid">

                            {subjectAttendance.map(
                                (subject) => {

                                    const percentage =
                                        subject.total >
                                        0
                                            ? (
                                                (
                                                    subject.present +
                                                    subject.late
                                                ) /
                                                subject.total
                                            ) * 100
                                            : 0;

                                    return (
                                        <div
                                            className="subject-attendance-card"
                                            key={
                                                subject.id
                                            }
                                        >

                                            <div className="subject-attendance-header">

                                                <strong>
                                                    {
                                                        subject.name
                                                    }
                                                </strong>

                                                <span>
                                                    {percentage.toFixed(
                                                        1
                                                    )}
                                                    %
                                                </span>

                                            </div>

                                            <div className="attendance-progress">

                                                <div
                                                    className="attendance-progress-fill"
                                                    style={{
                                                        width:
                                                            `${Math.min(
                                                                percentage,
                                                                100
                                                            )}%`
                                                    }}
                                                />

                                            </div>

                                            <p>
                                                {subject.present +
                                                    subject.late}{" "}
                                                attended out of{" "}
                                                {subject.total}{" "}
                                                classes
                                            </p>

                                        </div>
                                    );
                                }
                            )}

                        </div>

                    </div>
                )}

            {/* ==============================
                RECORDS
            ============================== */}

            <div className="attendance-list">

                {/* NO RECORDS */}

                {records.length === 0 ? (

                    <div className="no-pending">

                        <h3>
                            📭 No Attendance Records
                        </h3>

                        <p>
                            No attendance records
                            are available yet.
                        </p>

                    </div>

                ) : filteredRecords.length ===
                  0 ? (

                    /* NO FILTER MATCH */

                    <div className="no-pending">

                        <h3>
                            🔍 No Matching Records
                        </h3>

                        <p>
                            No attendance records
                            match the selected
                            filters.
                        </p>

                    </div>

                ) : (

                    /* RECORD CARDS */

                    <div className="pending-list">

                        {filteredRecords.map(
                            (record) => (

                                <div
                                    className="pending-card"
                                    key={
                                        record._id
                                    }
                                >

                                    {/* ==================
                                        HEADER
                                    ================== */}

                                    <div className="pending-info">

                                        <h3>
                                            👤{" "}
                                            {record
                                                .student
                                                ?.name ||
                                                "Student"}
                                        </h3>

                                        <p>
                                            <strong>
                                                Student ID:
                                            </strong>{" "}
                                            {record
                                                .student
                                                ?.studentId ||
                                                "N/A"}
                                        </p>

                                        <p>
                                            <strong>
                                                Subject:
                                            </strong>{" "}
                                            {record
                                                .subject
                                                ?.name ||
                                                "N/A"}

                                            {record
                                                .subject
                                                ?.code &&
                                                ` (${record.subject.code})`}
                                        </p>

                                        <p>
                                            <strong>
                                                Faculty:
                                            </strong>{" "}
                                            {record
                                                .faculty
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
                                                ).toLocaleDateString(
                                                    "en-IN",
                                                    {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric"
                                                    }
                                                )
                                                : "N/A"}
                                        </p>

                                        <p>
                                            <strong>
                                                Time:
                                            </strong>{" "}
                                            {record.time ||
                                                "N/A"}
                                        </p>

                                        {/* STATUS */}

                                        <div className="attendance-status-row">

                                            <strong>
                                                Attendance:
                                            </strong>

                                            <span
                                                className={`attendance-badge ${
                                                    record.status?.toLowerCase() ||
                                                    ""
                                                }`}
                                            >

                                                {record.status ===
                                                    "Present" &&
                                                    "🟢 "}

                                                {record.status ===
                                                    "Absent" &&
                                                    "🔴 "}

                                                {record.status ===
                                                    "Late" &&
                                                    "🟡 "}

                                                {record.status ||
                                                    "N/A"}

                                            </span>

                                        </div>

                                        {/* METHOD */}

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

                                        {/* ==================
                                            AI VERIFICATION
                                        ================== */}

                                        {(record.method ===
                                            "Face Recognition" ||
                                            record.attendanceType ===
                                                "Self Attendance") && (

                                            <div className="ai-verification-box">

                                                <strong>
                                                    🤖 AI Face Recognition
                                                </strong>

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

                                        {/* REVIEW STATUS */}

                                        <div className="attendance-status-row">

                                            <strong>
                                                Review:
                                            </strong>

                                            <span
                                                className={`review-badge ${
                                                    record.reviewStatus?.toLowerCase() ||
                                                    "pending"
                                                }`}
                                            >

                                                {record.reviewStatus ===
                                                    "Approved" &&
                                                    "✅ "}

                                                {record.reviewStatus ===
                                                    "Rejected" &&
                                                    "❌ "}

                                                {record.reviewStatus ===
                                                    "Pending" &&
                                                    "⏳ "}

                                                {record.reviewStatus ||
                                                    "Pending"}

                                            </span>

                                        </div>

                                        {/* TEACHER COMMENT */}

                                        {record.teacherComment && (

                                            <p>
                                                <strong>
                                                    Teacher Comment:
                                                </strong>{" "}
                                                {
                                                    record.teacherComment
                                                }
                                            </p>

                                        )}

                                        {/* FINALIZED */}

                                        {record.finalizedAt && (

                                            <div className="finalized-badge">

                                                <span>
                                                    🔒 Attendance Finalized
                                                </span>

                                                <small>
                                                    Finalized on{" "}

                                                    {new Date(
                                                        record.finalizedAt
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </small>

                                            </div>

                                        )}

                                        {/* ==================
                                            FINALIZE BUTTON
                                        ================== */}

                                        {currentUser?.role ===
                                            "faculty" &&
                                            record.reviewStatus ===
                                                "Approved" &&
                                            !record.finalizedAt && (

                                                <button
                                                    type="button"
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
                                                        ? "🔒 Finalizing..."
                                                        : "🔒 Finalize Attendance"}

                                                </button>

                                            )}

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>

        </div>
    );
}

export default AttendanceRecords;