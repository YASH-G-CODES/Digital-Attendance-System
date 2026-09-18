import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/config";

function ModernAttendanceHistory() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const load = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/attendance/history/${user.id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
            setRecords(response.data?.attendance || response.data?.records || (Array.isArray(response.data) ? response.data : []));
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);
    const present = records.filter((item) => String(item.status).toLowerCase() === "present").length;
    return <section className="modern-history-page"><header className="modern-page-intro"><div><p>ATTENDANCE RECORD</p><h2>Your attendance history</h2><span>Track every attendance submission in one clear view.</span></div><button type="button" onClick={load}>Refresh</button></header><div className="modern-history-stats"><div><span>Total check-ins</span><strong>{records.length}</strong></div><div><span>Present</span><strong>{present}</strong></div><div><span>Attendance rate</span><strong>{records.length ? Math.round((present / records.length) * 100) : 0}%</strong></div></div>{loading ? <p className="modern-history-empty">Loading your records...</p> : records.length === 0 ? <div className="modern-history-empty"><strong>No attendance yet</strong><span>Use Mark Attendance to create your first attendance record.</span></div> : <div className="modern-history-list">{records.map((record) => <article key={record.id} className="modern-history-row"><div className="history-date"><strong>{new Date(record.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}</strong><span>{new Date(record.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div><div><h3>{record.subjectName || "Attendance check-in"}</h3><span>Self attendance</span></div><b className={String(record.status).toLowerCase() === "present" ? "present" : "pending"}>{record.status || "Present"}</b></article>)}</div>}</section>;
}

export default ModernAttendanceHistory;
