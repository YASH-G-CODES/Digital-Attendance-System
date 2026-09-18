import { useState } from "react";

import GroupAttendance from "./GroupAttendance";
import PendingAttendance from "./PendingAttendance";
import AttendanceRecords from "./AttendanceRecords";
import Subjects from "./Subjects";
import FinalizeAttendance from "./FinalizeAttendance";
import FacultyProfile from "./FacultyProfile";

function FacultyDashboard({ user, onLogout }) {
    const [showGroupAttendance, setShowGroupAttendance] =
        useState(false);

    const [showPendingAttendance, setShowPendingAttendance] =
        useState(false);

    const [showAttendanceRecords, setShowAttendanceRecords] =
        useState(false);

    const [showSubjects, setShowSubjects] =
        useState(false);

    const [showFinalizeAttendance, setShowFinalizeAttendance] =
        useState(false);

    const [showFacultyProfile, setShowFacultyProfile] =
        useState(false);

    const resetScreens = () => {
        setShowGroupAttendance(false);
        setShowPendingAttendance(false);
        setShowAttendanceRecords(false);
        setShowSubjects(false);
        setShowFinalizeAttendance(false);
        setShowFacultyProfile(false);
    };

    const goHome = () => {
        resetScreens();
    };

    const openGroupAttendance = () => {
        setShowGroupAttendance(true);
        setShowPendingAttendance(false);
        setShowAttendanceRecords(false);
        setShowSubjects(false);
        setShowFinalizeAttendance(false);
    };

    const openPendingAttendance = () => {
        setShowGroupAttendance(false);
        setShowPendingAttendance(true);
        setShowAttendanceRecords(false);
        setShowSubjects(false);
        setShowFinalizeAttendance(false);
    };

    const openAttendanceRecords = () => {
        setShowGroupAttendance(false);
        setShowPendingAttendance(false);
        setShowAttendanceRecords(true);
        setShowSubjects(false);
        setShowFinalizeAttendance(false);
    };

    const openSubjects = () => {
        setShowGroupAttendance(false);
        setShowPendingAttendance(false);
        setShowAttendanceRecords(false);
        setShowSubjects(true);
        setShowFinalizeAttendance(false);
    };

    const openFinalizeAttendance = () => {
        setShowGroupAttendance(false);
        setShowPendingAttendance(false);
        setShowAttendanceRecords(false);
        setShowSubjects(false);
        setShowFinalizeAttendance(true);
        setShowFacultyProfile(false);
    };

    const openFacultyProfile = () => {
        resetScreens();
        setShowFacultyProfile(true);
    };

    /*
     * GROUP ATTENDANCE
     */
    if (showGroupAttendance) {
        return (
            <div className="dashboard-container">

                <div className="dashboard-topbar">

                    <button
                        className="back-btn"
                        onClick={goHome}
                    >
                        ← Back to Dashboard
                    </button>

                    <button
                        className="logout-btn"
                        onClick={onLogout}
                    >
                        Logout
                    </button>

                </div>

                <GroupAttendance />

            </div>
        );
    }

    /*
     * PENDING ATTENDANCE
     */
    if (showPendingAttendance) {
        return (
            <div className="dashboard-container">

                <div className="dashboard-topbar">

                    <button
                        className="back-btn"
                        onClick={goHome}
                    >
                        ← Back to Dashboard
                    </button>

                    <button
                        className="logout-btn"
                        onClick={onLogout}
                    >
                        Logout
                    </button>

                </div>

                <PendingAttendance />

            </div>
        );
    }

    /*
     * ATTENDANCE RECORDS
     */
    if (showAttendanceRecords) {
        return (
            <div className="dashboard-container">

                <div className="dashboard-topbar">

                    <button
                        className="back-btn"
                        onClick={goHome}
                    >
                        ← Back to Dashboard
                    </button>

                    <button
                        className="logout-btn"
                        onClick={onLogout}
                    >
                        Logout
                    </button>

                </div>

                <AttendanceRecords />

            </div>
        );
    }

    /*
     * SUBJECTS
     */
    if (showSubjects) {
        return (
            <div className="dashboard-container">

                <div className="dashboard-topbar">

                    <button
                        className="back-btn"
                        onClick={goHome}
                    >
                        ← Back to Dashboard
                    </button>

                    <button
                        className="logout-btn"
                        onClick={onLogout}
                    >
                        Logout
                    </button>

                </div>

                <Subjects />

            </div>
        );
    }

    /*
     * FINALIZE ATTENDANCE
     */
    if (showFinalizeAttendance) {
        return (
            <div className="dashboard-container">

                <div className="dashboard-topbar">

                    <button
                        className="back-btn"
                        onClick={goHome}
                    >
                        ← Back to Dashboard
                    </button>

                    <button
                        className="logout-btn"
                        onClick={onLogout}
                    >
                        Logout
                    </button>

                </div>

                <FinalizeAttendance />

            </div>
        );
    }

    if (showFacultyProfile) {
        return (
            <div className="dashboard-container">

                <div className="dashboard-topbar">

                    <button
                        className="back-btn"
                        onClick={goHome}
                    >
                        ← Back to Dashboard
                    </button>

                    <button
                        className="logout-btn"
                        onClick={onLogout}
                    >
                        Logout
                    </button>

                </div>

                <FacultyProfile />

            </div>
        );
    }

    /*
     * FACULTY HOME DASHBOARD
     */
    return (
        <div className="dashboard">

            {/* Header */}
            <div className="dashboard-header">

                <div>
                    <h1>
                        👨‍🏫 Faculty Dashboard
                    </h1>

                    <p>
                        Welcome,{" "}
                        <strong>
                            {user?.name || "Faculty"}
                        </strong>
                    </p>

                    <p className="faculty-email">
                        {user?.email || ""}
                    </p>
                </div>

                <button
                    className="logout-btn"
                    onClick={onLogout}
                >
                    Logout
                </button>

            </div>


            {/* Faculty Status */}
            <div className="faculty-status-card">

                <div>
                    <h3>
                        Faculty Account
                    </h3>

                    <p>
                        Manage attendance, subjects
                        and student records.
                    </p>
                </div>

                <span className="status-badge">
                    Faculty
                </span>

            </div>


            {/* Dashboard Cards */}
            <div className="dashboard-grid">

                {/* Group Attendance */}
                <div className="dashboard-card">

                    <div className="card-icon">
                        📸
                    </div>

                    <h2>
                        Group Attendance
                    </h2>

                    <p>
                        Capture a group photo and
                        process attendance for
                        multiple students.
                    </p>

                    <button
                        className="dashboard-btn"
                        onClick={
                            openGroupAttendance
                        }
                    >
                        Take Group Photo
                    </button>

                </div>


                {/* Pending Review */}
                <div className="dashboard-card">

                    <div className="card-icon">
                        ⏳
                    </div>

                    <h2>
                        Pending Review
                    </h2>

                    <p>
                        Review attendance submissions
                        waiting for faculty approval.
                    </p>

                    <button
                        className="dashboard-btn"
                        onClick={
                            openPendingAttendance
                        }
                    >
                        Review Attendance
                    </button>

                </div>


                {/* Attendance Records */}
                <div className="dashboard-card">

                    <div className="card-icon">
                        📊
                    </div>

                    <h2>
                        Attendance Records
                    </h2>

                    <p>
                        View attendance records for
                        your subjects and students.
                    </p>

                    <button
                        className="dashboard-btn"
                        onClick={
                            openAttendanceRecords
                        }
                    >
                        View Records
                    </button>

                </div>


                {/* My Subjects */}
                <div className="dashboard-card">

                    <div className="card-icon">
                        📚
                    </div>

                    <h2>
                        My Subjects
                    </h2>

                    <p>
                        Create and manage your subjects,
                        codes and active status.
                    </p>

                    <button
                        className="dashboard-btn"
                        onClick={
                            openSubjects
                        }
                    >
                        Manage Subjects
                    </button>

                </div>


                {/* Finalize Attendance */}
                <div className="dashboard-card">

                    <div className="card-icon">
                        🔒
                    </div>

                    <h2>
                        Finalize Attendance
                    </h2>

                    <p>
                        Finalize approved attendance
                        records after review.
                    </p>

                    <button
                        className="dashboard-btn"
                        onClick={
                            openFinalizeAttendance
                        }
                    >
                        Finalize Records
                    </button>

                </div>


                {/* Faculty Profile */}
                <div className="dashboard-card">

                    <div className="card-icon">
                        👤
                    </div>

                    <h2>
                        My Profile
                    </h2>

                    <p>
                        View your faculty account
                        information.
                    </p>

                    <button
                        className="dashboard-btn"
                        onClick={openFacultyProfile}
                    >
                        View Profile
                    </button>

                </div>

            </div>


            {/* Footer Information */}
            <div className="dashboard-footer">

                <p>
                    Face Attendance Management System
                </p>

                <p>
                    Faculty Portal
                </p>

            </div>

        </div>
    );
}

export default FacultyDashboard;