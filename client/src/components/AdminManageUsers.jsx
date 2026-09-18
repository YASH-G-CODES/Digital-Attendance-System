import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL, API_ORIGIN } from "../services/config";
import LoadingSpinner from "./LoadingSpinner";

function AdminManageUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");

    const [error, setError] = useState("");

    const getProfilePhotoUrl = (profilePhoto) => {
        if (!profilePhoto) return "";
        return profilePhoto.startsWith("http")
            ? profilePhoto
            : `${API_ORIGIN}${profilePhoto}`;
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const response = await axios.get(
                `${API_BASE_URL}/admin/users`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setUsers(Array.isArray(response.data) ? response.data : (response.data.users || []));

        } catch (error) {
            console.error(
                "Fetch Users Error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load users."
            );
        } finally {
            setLoading(false);
        }
    };


    // ======================================================
    // FILTER USERS
    // ======================================================

    const filteredUsers = users.filter(
        (user) => {

            const searchText =
                search
                    .toLowerCase()
                    .trim();

            const matchesSearch =
                !searchText ||
                user.name
                    ?.toLowerCase()
                    .includes(searchText) ||
                user.email
                    ?.toLowerCase()
                    .includes(searchText) ||
                user.department
                    ?.toLowerCase()
                    .includes(searchText) ||
                user.email
                    ?.toLowerCase()
                    .includes(searchText) ||
                user.role
                    ?.toLowerCase()
                    .includes(searchText) ||
                user.studentId
                    ?.toLowerCase()
                    .includes(searchText) ||
                user.facultyStatus
                    ?.toLowerCase()
                    .includes(searchText) ||
                String(user._id || user.id || "")
                    .toLowerCase()
                    .includes(searchText) ||
                String(user.createdAt || "")
                    .toLowerCase()
                    .includes(searchText);

            const matchesRole =
                roleFilter === "All" ||
                user.role ===
                    roleFilter.toLowerCase();

            return (
                matchesSearch &&
                matchesRole
            );
        }
    );


    // ======================================================
    // STATUS
    // ======================================================

    const getStatus = (user) => {

        if (user.role === "faculty") {
            return (
                user.facultyStatus ||
                "Inactive"
            );
        }

        if (user.role === "admin") {
            return "Active";
        }

        return "Active";
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


    const getRoleClass = (role) => {

        switch (role) {

            case "admin":
                return "role-admin";

            case "faculty":
                return "role-faculty";

            case "student":
                return "role-student";

            default:
                return "";
        }
    };


    const formatRole = (role) => {

        if (!role) {
            return "N/A";
        }

        return (
            role.charAt(0).toUpperCase() +
            role.slice(1)
        );
    };


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
            <div className="admin-users">

                <div className="admin-loading">

                    <LoadingSpinner text="Loading users..." />

                </div>

            </div>
        );
    }


    // ======================================================
    // MAIN UI
    // ======================================================

    return (
        <div className="admin-users">

            {/* HEADER */}

            <div className="admin-page-header">

                <div>

                    <h2>
                        👥 Manage Users
                    </h2>

                    <p>
                        View and manage all registered
                        users in the system.
                    </p>

                </div>


                <button
                    className="refresh-button"
                    onClick={fetchUsers}
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


            {/* STATS */}

            <div className="user-stats">

                <div className="user-stat-card">

                    <div className="stat-icon">
                        👥
                    </div>

                    <div>

                        <span>
                            Total Users
                        </span>

                        <strong>
                            {users.length}
                        </strong>

                    </div>

                </div>


                <div className="user-stat-card">

                    <div className="stat-icon">
                        🎓
                    </div>

                    <div>

                        <span>
                            Students
                        </span>

                        <strong>
                            {
                                users.filter(
                                    (user) =>
                                        user.role ===
                                        "student"
                                ).length
                            }
                        </strong>

                    </div>

                </div>


                <div className="user-stat-card">

                    <div className="stat-icon">
                        👨‍🏫
                    </div>

                    <div>

                        <span>
                            Faculty
                        </span>

                        <strong>
                            {
                                users.filter(
                                    (user) =>
                                        user.role ===
                                        "faculty"
                                ).length
                            }
                        </strong>

                    </div>

                </div>


                <div className="user-stat-card">

                    <div className="stat-icon">
                        🛡️
                    </div>

                    <div>

                        <span>
                            Admins
                        </span>

                        <strong>
                            {
                                users.filter(
                                    (user) =>
                                        user.role ===
                                        "admin"
                                ).length
                            }
                        </strong>

                    </div>

                </div>

            </div>


            {/* FILTER BAR */}

            <div className="user-filter-bar">

                <div className="user-search">

                    <span>
                        🔍
                    </span>

                    <input
                        type="text"
                        placeholder="Search any column: name, role, ID, status..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />

                </div>


                <div className="role-filter">

                    <label>
                        Role
                    </label>

                    <select
                        value={roleFilter}
                        onChange={(e) =>
                            setRoleFilter(
                                e.target.value
                            )
                        }
                    >

                        <option value="All">
                            All Users
                        </option>

                        <option value="Student">
                            Students
                        </option>

                        <option value="Faculty">
                            Faculty
                        </option>

                        <option value="Admin">
                            Admins
                        </option>

                    </select>

                </div>

            </div>


            {/* USER TABLE */}

            {filteredUsers.length === 0 ? (

                <div className="empty-users">

                    <div className="empty-icon">
                        👥
                    </div>

                    <h3>
                        No Users Found
                    </h3>

                    <p>
                        No users match your
                        current search or filter.
                    </p>

                </div>

            ) : (

                <div className="users-table-container">

                    <table className="users-table">

                        <thead>

                            <tr>

                                <th>
                                    User
                                </th>

                                <th>
                                    Role
                                </th>

                                <th>
                                    Department
                                </th>

                                <th>
                                    Student ID
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Joined
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {filteredUsers.map(
                                (user) => {

                                    const status =
                                        getStatus(
                                            user
                                        );

                                    return (
                                        <tr
                                            key={
                                                user._id || user.id
                                            }
                                        >

                                            {/* USER */}

                                            <td>

                                                <div className="user-info">

                                                    <div className="user-avatar">
                                                        {user.profilePhoto ? (
                                                            <img
                                                                src={getProfilePhotoUrl(user.profilePhoto)}
                                                                alt={`${user.name}'s profile`}
                                                            />
                                                        ) : (
                                                            user.name
                                                                ?.charAt(0)
                                                                .toUpperCase()
                                                        )}

                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {
                                                                user.name
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                user.email
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* ROLE */}

                                            <td>

                                                <span
                                                    className={`user-role ${getRoleClass(
                                                        user.role
                                                    )}`}
                                                >
                                                    {formatRole(
                                                        user.role
                                                    )}
                                                </span>

                                            </td>


                                            {/* DEPARTMENT */}

                                            <td>

                                                {user.department ||
                                                    "N/A"}

                                            </td>


                                            {/* STUDENT ID */}

                                            <td>

                                                {user.studentId ||
                                                    "—"}

                                            </td>


                                            {/* STATUS */}

                                            <td>

                                                <span
                                                    className={`faculty-status ${getStatusClass(
                                                        status
                                                    )}`}
                                                >
                                                    {status}
                                                </span>

                                            </td>


                                            {/* DATE */}

                                            <td>

                                                {formatDate(
                                                    user.createdAt
                                                )}

                                            </td>

                                        </tr>
                                    );
                                }
                            )}

                        </tbody>

                    </table>

                </div>

            )}


            {/* RESULT COUNT */}

            <div className="user-result-count">

                Showing{" "}
                <strong>
                    {filteredUsers.length}
                </strong>{" "}
                of{" "}
                <strong>
                    {users.length}
                </strong>{" "}
                users

            </div>

        </div>
    );
}

export default AdminManageUsers;
