import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/config";
import LoadingSpinner from "./LoadingSpinner";

function AdminAttendance() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [reviewFilter, setReviewFilter] = useState("All");

    const [error, setError] = useState("");

    const formatSimilarity = (similarity) =>
        typeof similarity === "number"
            ? `${(similarity * 100).toFixed(2)}%`
            : "N/A";

    useEffect(() => {
        fetchAttendance();
    }, []);

    // ======================================================
    // FETCH ATTENDANCE
    // ======================================================

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            setError("");

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

            setRecords(Array.isArray(response.data) ? response.data : (
                response.data.attendance || response.data.records || []
            ));

        } catch (error) {
            console.error(
                "Fetch Attendance Error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load attendance records."
            );
        } finally {
            setLoading(false);
        }
    };


    // ======================================================
    // FILTER RECORDS
    // ======================================================

    const filteredRecords =
        records.filter((record) => {

            const searchText =
                search
                    .toLowerCase()
                    .trim();

            const studentName =
                record.student?.name || record.studentName ||
                "";

            const studentEmail =
                record.student?.email || record.studentEmail ||
                "";

            const subjectName =
                record.subject?.name || record.subjectName ||
                "";

            const subjectCode =
                record.subject?.code || record.subjectCode ||
                "";

            const facultyName =
                record.faculty?.name || record.facultyName ||
                "";

            const matchesSearch =
                !searchText ||
                studentName
                    .toLowerCase()
                    .includes(searchText) ||
                studentEmail
                    .toLowerCase()
                    .includes(searchText) ||
                subjectName
                    .toLowerCase()
                    .includes(searchText) ||
                subjectCode
                    .toLowerCase()
                    .includes(searchText) ||
                facultyName
                    .toLowerCase()
                    .includes(searchText);

            const matchesStatus =
                statusFilter === "All" ||
                record.status ===
                statusFilter;

            const matchesReview =
                reviewFilter === "All" ||
                record.reviewStatus ===
                reviewFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesReview
            );
        });


    // ======================================================
    // STATUS CLASS
    // ======================================================

    const getStatusClass = (status) => {

        switch (status) {

            case "Present":
                return "status-active";

            case "Absent":
                return "status-rejected";

            case "Late":
                return "status-inactive";

            default:
                return "";
        }
    };


    const getReviewClass = (status) => {

        switch (status) {

            case "Approved":
                return "status-active";

            case "Pending":
                return "status-inactive";

            case "Rejected":
                return "status-rejected";

            default:
                return "";
        }
    };


    // ======================================================
    // FORMAT DATE
    // ======================================================

    const formatDate = (date) => {

        if (!date) {
            return "N/A";
        }

        return new Date(
            date
        ).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };


    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {

        return (
            <div className="admin-attendance">

                <div className="admin-loading">

                    <LoadingSpinner text="Loading attendance records..." />

                </div>

            </div>
        );
    }


    // ======================================================
    // MAIN UI
    // ======================================================

    return (
        <div className="admin-attendance">

            {/* HEADER */}

            <div className="admin-page-header">

                <div>

                    <h2>
                        📊 Attendance Management
                    </h2>

                    <p>
                        View and monitor all attendance
                        records across the system.
                    </p>

                </div>


                <button
                    className="refresh-button"
                    onClick={fetchAttendance}
                >
                    🔄 Refresh
                </button>

            </div>


            {/* ERROR */}

            {error && (

                <div className="error-message">
                    ❌ {error}
                </div>

            )}


            {/* ==================================================
                STATISTICS
            ================================================== */}

            <div className="attendance-stats">

                <div className="attendance-stat-card">

                    <div className="stat-icon">
                        📋
                    </div>

                    <div>

                        <span>
                            Total Records
                        </span>

                        <strong>
                            {records.length}
                        </strong>

                    </div>

                </div>


                <div className="attendance-stat-card">

                    <div className="stat-icon">
                        ✅
                    </div>

                    <div>

                        <span>
                            Present
                        </span>

                        <strong>
                            {
                                records.filter(
                                    (record) =>
                                        record.status ===
                                        "Present"
                                ).length
                            }
                        </strong>

                    </div>

                </div>


                <div className="attendance-stat-card">

                    <div className="stat-icon">
                        ❌
                    </div>

                    <div>

                        <span>
                            Absent
                        </span>

                        <strong>
                            {
                                records.filter(
                                    (record) =>
                                        record.status ===
                                        "Absent"
                                ).length
                            }
                        </strong>

                    </div>

                </div>


                <div className="attendance-stat-card">

                    <div className="stat-icon">
                        ⏳
                    </div>

                    <div>

                        <span>
                            Pending Review
                        </span>

                        <strong>
                            {
                                records.filter(
                                    (record) =>
                                        record.reviewStatus ===
                                        "Pending"
                                ).length
                            }
                        </strong>

                    </div>

                </div>

            </div>


            {/* ==================================================
                FILTER BAR
            ================================================== */}

            <div className="attendance-filter-bar">

                {/* SEARCH */}

                <div className="attendance-search">

                    <span>
                        🔍
                    </span>

                    <input
                        type="text"
                        placeholder="Search student, subject or faculty..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />

                </div>


                {/* STATUS */}

                <div className="attendance-filter">

                    <label>
                        Attendance
                    </label>

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value
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


                {/* REVIEW */}

                <div className="attendance-filter">

                    <label>
                        Review
                    </label>

                    <select
                        value={reviewFilter}
                        onChange={(e) =>
                            setReviewFilter(
                                e.target.value
                            )
                        }
                    >

                        <option value="All">
                            All Reviews
                        </option>

                        <option value="Pending">
                            Pending
                        </option>

                        <option value="Approved">
                            Approved
                        </option>

                        <option value="Rejected">
                            Rejected
                        </option>

                    </select>

                </div>

            </div>


            {/* ==================================================
                TABLE
            ================================================== */}
            <div className="filter-result-count">
                Showing{" "}
                <strong>{filteredRecords.length}</strong>{" "}
                of{" "}
                <strong>{records.length}</strong>{" "}
                attendance records
            </div>

            {filteredRecords.length === 0 ? (

                <div className="empty-attendance">

                    <div className="empty-icon">
                        📊
                    </div>

                    <h3>
                        No Attendance Records
                    </h3>

                    <p>
                        No records match your
                        current filters.
                    </p>

                </div>

            ) : (

                <div className="attendance-table-container">

                    <table className="attendance-table">

                        <thead>

                            <tr>

                                <th>
                                    Student
                                </th>

                                <th>
                                    Subject
                                </th>

                                <th>
                                    Faculty
                                </th>

                                <th>
                                    Date
                                </th>

                                <th>
                                    Time
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Method
                                </th>

                                <th>
                                    Attendance Type
                                </th>

                                <th>
                                    AI Verification
                                </th>

                                <th>
                                    Similarity
                                </th>

                                <th>
                                    Location
                                </th>

                                <th>
                                    Review
                                </th>

                                <th>
                                    Finalized
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {filteredRecords.map(
                                (record) => (

                                    <tr
                                        key={
                                            record._id || record.id
                                        }
                                    >

                                        {/* STUDENT */}

                                        <td>

                                            <div className="attendance-user">

                                                <div className="attendance-avatar">

                                                    {record.student?.name
                                                        ?.charAt(
                                                            0
                                                        )
                                                        .toUpperCase() ||
                                                        "?"}

                                                </div>

                                                <div>

                                                    <strong>
                                                        {
                                                            record
                                                                .student
                                                                ?.name ||
                                                            "N/A"
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            record
                                                                .student
                                                                ?.email ||
                                                            ""
                                                        }
                                                    </span>

                                                </div>

                                            </div>

                                        </td>


                                        {/* SUBJECT */}

                                        <td>

                                            <div className="attendance-subject">

                                                <strong>
                                                    {
                                                        record
                                                            .subject
                                                            ?.name ||
                                                        "N/A"
                                                    }
                                                </strong>

                                                <span>
                                                    {
                                                        record
                                                            .subject
                                                            ?.code ||
                                                        ""
                                                    }
                                                </span>

                                            </div>

                                        </td>


                                        {/* FACULTY */}

                                        <td>

                                            {
                                                record
                                                    .faculty
                                                    ?.name ||
                                                "N/A"
                                            }

                                        </td>


                                        {/* DATE */}

                                        <td>

                                            {formatDate(
                                                record.date
                                            )}

                                        </td>


                                        {/* TIME */}

                                        <td>

                                            {
                                                record.time ||
                                                "N/A"
                                            }

                                        </td>


                                        {/* STATUS */}

                                        <td>

                                            <span
                                                className={`faculty-status ${getStatusClass(
                                                    record.status
                                                )}`}
                                            >
                                                {
                                                    record.status ||
                                                    "N/A"
                                                }
                                            </span>

                                        </td>


                                        {/* METHOD */}

                                        <td>

                                            <span>
                                                {
                                                    record.method ||
                                                    "N/A"
                                                }
                                            </span>

                                        </td>

                                        {/* ATTENDANCE TYPE */}

                                        <td>
                                            {record.attendanceType || "N/A"}
                                        </td>

                                        {/* AI VERIFICATION */}

                                        <td>
                                            {record.method === "Face Recognition" ||
                                            record.attendanceType === "Self Attendance"
                                                ? record.faceVerified
                                                    ? "✅ Face Verified"
                                                    : "❌ Face Not Verified"
                                                : "Not applicable"}
                                        </td>

                                        {/* SIMILARITY */}

                                        <td>
                                            {record.method === "Face Recognition" ||
                                            record.attendanceType === "Self Attendance"
                                                ? formatSimilarity(record.faceSimilarity)
                                                : "N/A"}
                                        </td>

                                        {/* LOCATION */}

                                        <td>
                                            {record.locationVerified
                                                ? "✅ Verified"
                                                : "❌ Not Verified"}
                                        </td>


                                        {/* REVIEW */}

                                        <td>

                                            <span
                                                className={`faculty-status ${getReviewClass(
                                                    record.reviewStatus
                                                )}`}
                                            >
                                                {
                                                    record.reviewStatus ||
                                                    "N/A"
                                                }
                                            </span>

                                        </td>


                                        {/* FINALIZED */}

                                        <td>

                                            {record.finalizedAt ? (

                                                <span className="finalized-badge">
                                                    ✓ Finalized
                                                </span>

                                            ) : (

                                                <span className="not-finalized-badge">
                                                    Not Finalized
                                                </span>

                                            )}

                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                </div>

            )}


            {/* RESULT COUNT */}

            <div className="attendance-result-count">

                Showing{" "}
                <strong>
                    {filteredRecords.length}
                </strong>{" "}
                of{" "}
                <strong>
                    {records.length}
                </strong>{" "}
                attendance records

            </div>

        </div>
    );
}

export default AdminAttendance;
