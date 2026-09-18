import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/config";
import LoadingSpinner from "./LoadingSpinner";

function StudentSubjects() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const response = await axios.get(
                `${API_BASE_URL}/subjects/available`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setSubjects(
                response.data?.subjects ||
                (Array.isArray(response.data) ? response.data : [])
            );

        } catch (error) {
            console.error(
                "Fetch Subjects Error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load available subjects."
            );
        } finally {
            setLoading(false);
        }
    };

    const getCurrentStudentId = () => {
        const user =
            localStorage.getItem("user");

        if (!user) {
            return null;
        }

        try {
            const parsedUser =
                JSON.parse(user);

            return parsedUser.id;
        } catch (error) {
            console.error(
                "User Parse Error:",
                error
            );

            return null;
        }
    };

    const isJoined = (subject) => {
        const studentId =
            getCurrentStudentId();

        if (!studentId) {
            return false;
        }

        return (
            subject.students || []
        ).some(
            (student) =>
                (typeof student === "string" ? student : student._id) === studentId
        );
    };

    const joinSubject = async (
        subjectId
    ) => {
        try {
            setProcessingId(subjectId);
            setMessage("");
            setError("");

            const token =
                localStorage.getItem("token");

            const response =
                await axios.post(
                    `${API_BASE_URL}/subjects/${subjectId}/join`,
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
                "Subject joined successfully."
            );

            await fetchSubjects();

        } catch (error) {
            console.error(
                "Join Subject Error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to join subject."
            );
        } finally {
            setProcessingId(null);
        }
    };

    const leaveSubject = async (
        subjectId
    ) => {
        const confirmed =
            window.confirm(
                "Are you sure you want to leave this subject?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setProcessingId(subjectId);
            setMessage("");
            setError("");

            const token =
                localStorage.getItem("token");

            const response =
                await axios.delete(
                    `${API_BASE_URL}/subjects/${subjectId}/leave`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            setMessage(
                response.data.message ||
                "You have left the subject successfully."
            );

            await fetchSubjects();

        } catch (error) {
            console.error(
                "Leave Subject Error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to leave subject."
            );
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="student-subjects">
                <div className="subjects-loading">
                    <LoadingSpinner text="Loading available subjects..." />
                </div>
            </div>
        );
    }

    return (
        <div className="student-subjects">

            <div className="subjects-header">
                <div>
                    <h2>
                        📚 Available Subjects
                    </h2>

                    <p>
                        Join subjects to become eligible
                        for attendance.
                    </p>
                </div>

                <button
                    className="refresh-button"
                    onClick={fetchSubjects}
                    disabled={loading}
                >
                    🔄 Refresh
                </button>
            </div>


            {message && (
                <div className="success-message">
                    ✅ {message}
                </div>
            )}


            {error && (
                <div className="error-message">
                    ❌ {error}
                </div>
            )}


            {subjects.length === 0 ? (
                <div className="empty-subjects">
                    <div className="empty-icon">
                        📚
                    </div>

                    <h3>
                        No Active Subjects
                    </h3>

                    <p>
                        There are currently no active
                        subjects available to join.
                    </p>
                </div>
            ) : (
                <div className="subjects-grid">

                    {subjects.map(
                        (subject) => {

                            const joined =
                                isJoined(
                                    subject
                                );

                            const processing =
                                processingId ===
                                subject._id;

                            return (
                                <div
                                    className="subject-card"
                                    key={
                                        subject._id
                                    }
                                >

                                    <div className="subject-card-top">

                                        <div className="subject-icon">
                                            📖
                                        </div>

                                        <span className="subject-status">
                                            {subject.status}
                                        </span>

                                    </div>


                                    <div className="subject-info">

                                        <h3>
                                            {
                                                subject.name
                                            }
                                        </h3>

                                        <div className="subject-code">
                                            {
                                                subject.code
                                            }
                                        </div>

                                        <div className="subject-detail">
                                            <span>
                                                🏢
                                            </span>

                                            <span>
                                                Department:
                                            </span>

                                            <strong>
                                                {
                                                    subject.department
                                                }
                                            </strong>
                                        </div>


                                        <div className="subject-detail">
                                            <span>
                                                👨‍🏫
                                            </span>

                                            <span>
                                                Faculty:
                                            </span>

                                            <strong>
                                                {
                                                    subject
                                                        .faculty
                                                        ?.name ||
                                                    "N/A"
                                                }
                                            </strong>
                                        </div>


                                        <div className="subject-detail">
                                            <span>
                                                👥
                                            </span>

                                            <span>
                                                Students:
                                            </span>

                                            <strong>
                                                {
                                                    (
                                                        subject
                                                            .students ||
                                                        []
                                                    ).length
                                                }
                                            </strong>
                                        </div>

                                    </div>


                                    <div className="subject-action">

                                        {joined ? (
                                            <>
                                                <div className="joined-badge">
                                                    ✅ Joined
                                                </div>

                                                <button
                                                    className="leave-button"
                                                    onClick={() =>
                                                        leaveSubject(
                                                            subject._id
                                                        )
                                                    }
                                                    disabled={
                                                        processing
                                                    }
                                                >
                                                    {processing
                                                        ? "Leaving..."
                                                        : "Leave Subject"}
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className="join-button"
                                                onClick={() =>
                                                    joinSubject(
                                                        subject._id
                                                    )
                                                }
                                                disabled={
                                                    processing
                                                }
                                            >
                                                {processing
                                                    ? "Joining..."
                                                    : "Join Subject"}
                                            </button>
                                        )}

                                    </div>

                                </div>
                            );
                        }
                    )}

                </div>
            )}

        </div>
    );
}

export default StudentSubjects;
