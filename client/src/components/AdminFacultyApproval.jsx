import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/config";
import LoadingSpinner from "./LoadingSpinner";

function AdminFacultyApproval() {
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchFaculty();
    }, []);

    const fetchFaculty = async () => {
        try {
            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const response = await axios.get(
                `${API_BASE_URL}/admin/faculty`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setFaculty(
                response.data.faculty || []
            );

        } catch (error) {
            console.error(
                "Fetch Faculty Error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load faculty."
            );
        } finally {
            setLoading(false);
        }
    };

    const approveFaculty = async (id) => {
        const confirmed =
            window.confirm(
                "Are you sure you want to approve this faculty?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setProcessingId(id);
            setMessage("");
            setError("");

            const token =
                localStorage.getItem("token");

            const response =
                await axios.put(
                    `${API_BASE_URL}/admin/faculty/${id}/approve`,
                    {},
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            setMessage(
                response.data.message ||
                "Faculty approved successfully."
            );

            await fetchFaculty();

        } catch (error) {
            console.error(
                "Approve Faculty Error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to approve faculty."
            );
        } finally {
            setProcessingId(null);
        }
    };

    const rejectFaculty = async (id) => {
        const confirmed =
            window.confirm(
                "Are you sure you want to reject this faculty?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setProcessingId(id);
            setMessage("");
            setError("");

            const token =
                localStorage.getItem("token");

            const response =
                await axios.put(
                    `${API_BASE_URL}/admin/faculty/${id}/reject`,
                    {},
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            setMessage(
                response.data.message ||
                "Faculty rejected successfully."
            );

            await fetchFaculty();

        } catch (error) {
            console.error(
                "Reject Faculty Error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to reject faculty."
            );
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "Active":
                return "status-active";

            case "Inactive":
                return "status-inactive";

            case "Expired":
                return "status-expired";

            case "Rejected":
                return "status-rejected";

            default:
                return "";
        }
    };

    const formatDate = (date) => {
        if (!date) {
            return "N/A";
        }

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };

    const getDaysRemaining = (registeredAt) => {
        if (!registeredAt) {
            return null;
        }

        const registrationDate =
            new Date(registeredAt);

        const expiryDate =
            new Date(registrationDate);

        expiryDate.setDate(
            expiryDate.getDate() + 25
        );

        const now = new Date();

        const difference =
            expiryDate.getTime() -
            now.getTime();

        const days = Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        );

        return days;
    };

    if (loading) {
        return (
            <div className="admin-faculty-approval">

                <div className="admin-loading">
                    <LoadingSpinner text="Loading faculty requests..." />
                </div>

            </div>
        );
    }

    return (
        <div className="admin-faculty-approval">

            {/* HEADER */}
            <div className="admin-page-header">

                <div>
                    <h2>
                        👨‍🏫 Faculty Approval
                    </h2>

                    <p>
                        Review and manage faculty
                        registration requests.
                    </p>
                </div>

                <button
                    className="refresh-button"
                    onClick={fetchFaculty}
                    disabled={loading}
                >
                    🔄 Refresh
                </button>

            </div>


            {/* SUCCESS MESSAGE */}
            {message && (
                <div className="success-message">
                    ✅ {message}
                </div>
            )}


            {/* ERROR MESSAGE */}
            {error && (
                <div className="error-message">
                    ❌ {error}
                </div>
            )}


            {/* STATS */}
            <div className="faculty-stats">

                <div className="faculty-stat-card">

                    <div className="stat-icon">
                        👨‍🏫
                    </div>

                    <div>
                        <span>
                            Total Faculty
                        </span>

                        <strong>
                            {faculty.length}
                        </strong>
                    </div>

                </div>


                <div className="faculty-stat-card">

                    <div className="stat-icon">
                        🟡
                    </div>

                    <div>
                        <span>
                            Pending
                        </span>

                        <strong>
                            {
                                faculty.filter(
                                    (item) =>
                                        item.facultyStatus ===
                                        "Inactive"
                                ).length
                            }
                        </strong>
                    </div>

                </div>


                <div className="faculty-stat-card">

                    <div className="stat-icon">
                        🟢
                    </div>

                    <div>
                        <span>
                            Active
                        </span>

                        <strong>
                            {
                                faculty.filter(
                                    (item) =>
                                        item.facultyStatus ===
                                        "Active"
                                ).length
                            }
                        </strong>
                    </div>

                </div>


                <div className="faculty-stat-card">

                    <div className="stat-icon">
                        ⏰
                    </div>

                    <div>
                        <span>
                            Expired
                        </span>

                        <strong>
                            {
                                faculty.filter(
                                    (item) =>
                                        item.facultyStatus ===
                                        "Expired"
                                ).length
                            }
                        </strong>
                    </div>

                </div>

            </div>


            {/* FACULTY LIST */}
            {faculty.length === 0 ? (

                <div className="empty-faculty">

                    <div className="empty-icon">
                        👨‍🏫
                    </div>

                    <h3>
                        No Faculty Found
                    </h3>

                    <p>
                        There are currently no
                        registered faculty members.
                    </p>

                </div>

            ) : (

                <div className="faculty-table-container">

                    <table className="faculty-table">

                        <thead>

                            <tr>
                                <th>
                                    Faculty
                                </th>

                                <th>
                                    Department
                                </th>

                                <th>
                                    Registration Date
                                </th>

                                <th>
                                    Validity
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Actions
                                </th>
                            </tr>

                        </thead>


                        <tbody>

                            {faculty.map(
                                (item) => {

                                    const daysRemaining =
                                        getDaysRemaining(
                                            item.facultyRegisteredAt
                                        );

                                    const processing =
                                        processingId ===
                                        item._id;

                                    return (
                                        <tr
                                            key={
                                                item._id
                                            }
                                        >

                                            {/* FACULTY */}
                                            <td>

                                                <div className="faculty-info">

                                                    <div className="faculty-avatar">
                                                        {item.name
                                                            ?.charAt(
                                                                0
                                                            )
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {
                                                                item.name
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                item.email
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* DEPARTMENT */}
                                            <td>

                                                <span>
                                                    {
                                                        item.department ||
                                                        "N/A"
                                                    }
                                                </span>

                                            </td>


                                            {/* REGISTRATION */}
                                            <td>

                                                <span>
                                                    {
                                                        formatDate(
                                                            item.facultyRegisteredAt
                                                        )
                                                    }
                                                </span>

                                            </td>


                                            {/* VALIDITY */}
                                            <td>

                                                {item.facultyStatus ===
                                                "Inactive" ? (

                                                    daysRemaining >
                                                    0 ? (
                                                        <span className="validity-active">
                                                            {
                                                                daysRemaining
                                                            }{" "}
                                                            days left
                                                        </span>
                                                    ) : (
                                                        <span className="validity-expired">
                                                            Expired
                                                        </span>
                                                    )

                                                ) : item.facultyStatus ===
                                                  "Active" ? (

                                                    <span className="validity-approved">
                                                        ✓ Approved
                                                    </span>

                                                ) : (

                                                    <span className="validity-expired">
                                                        —
                                                    </span>

                                                )}

                                            </td>


                                            {/* STATUS */}
                                            <td>

                                                <span
                                                    className={`faculty-status ${getStatusClass(
                                                        item.facultyStatus
                                                    )}`}
                                                >
                                                    {item.facultyStatus}
                                                </span>

                                            </td>


                                            {/* ACTIONS */}
                                            <td>

                                                <div className="faculty-actions">

                                                    {item.facultyStatus ===
                                                        "Inactive" && (

                                                        <>
                                                            <button
                                                                className="approve-button"
                                                                onClick={() =>
                                                                    approveFaculty(
                                                                        item._id
                                                                    )
                                                                }
                                                                disabled={
                                                                    processing
                                                                }
                                                            >
                                                                {processing
                                                                    ? <LoadingSpinner text="Processing..." size="small" inline />
                                                                    : "✓ Approve"}
                                                            </button>

                                                            <button
                                                                className="reject-button"
                                                                onClick={() =>
                                                                    rejectFaculty(
                                                                        item._id
                                                                    )
                                                                }
                                                                disabled={
                                                                    processing
                                                                }
                                                            >
                                                                {processing
                                                                    ? <LoadingSpinner text="Processing..." size="small" inline />
                                                                    : "✕ Reject"}
                                                            </button>
                                                        </>

                                                    )}

                                                    {item.facultyStatus ===
                                                        "Active" && (

                                                        <span className="action-completed">
                                                            ✓ Approved
                                                        </span>

                                                    )}

                                                    {item.facultyStatus ===
                                                        "Rejected" && (

                                                        <span className="action-completed rejected-text">
                                                            ✕ Rejected
                                                        </span>

                                                    )}

                                                    {item.facultyStatus ===
                                                        "Expired" && (

                                                        <span className="action-completed expired-text">
                                                            ⏰ Expired
                                                        </span>

                                                    )}

                                                </div>

                                            </td>

                                        </tr>
                                    );
                                }
                            )}

                        </tbody>

                    </table>

                </div>

            )}

        </div>
    );
}

export default AdminFacultyApproval;