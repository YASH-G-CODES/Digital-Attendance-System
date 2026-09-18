import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/config";

function ModernStudentSubjects() {
    const [subjects, setSubjects] = useState([]);
    const [message, setMessage] = useState("");
    const [working, setWorking] = useState("");
    const [editing, setEditing] = useState(false);
    const userId = JSON.parse(localStorage.getItem("user") || "{}").id;
    const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
    const idOf = (subject) => subject._id || subject.id;

    const load = async (clearMessage = true) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/subjects/available`, auth());
            setSubjects(response.data?.subjects || (Array.isArray(response.data) ? response.data : []));
            if (clearMessage) setMessage("");
        } catch (error) { setMessage(error.response?.data?.message || "Unable to load subjects."); }
    };
    useEffect(() => { load(); }, []);

    const joined = (subject) => (subject.students || []).some((item) => (typeof item === "string" ? item : item._id || item.id) === userId);
    const changeEnrollment = async (subject) => {
        const id = idOf(subject);
        const action = joined(subject) ? "leave" : "join";
        try {
            setWorking(id);
            if (action === "join") await axios.post(`${API_BASE_URL}/subjects/${id}/join`, {}, auth());
            else await axios.delete(`${API_BASE_URL}/subjects/${id}/leave`, auth());
            setMessage(action === "join" ? "Subject added to your classes." : "Subject removed from your classes.");
            await load(false);
        } catch (error) { setMessage(error.response?.data?.message || "Unable to update your subjects."); }
        finally { setWorking(""); }
    };

    const mySubjects = subjects.filter(joined);
    const displayedSubjects = editing ? subjects : mySubjects;
    return <section className="modern-subjects-page">
        <header className="modern-page-intro">
            <div><p>MY CLASSES</p><h2>{editing ? "Edit my subjects" : "My subjects"}</h2><span>{editing ? "Add or remove subjects from your own class list." : "Your selected subjects for attendance."}</span></div>
            <div className="subject-page-actions"><button type="button" onClick={() => setEditing(!editing)}>{editing ? "Done Editing" : "Edit My Subjects"}</button><button type="button" onClick={load}>Refresh</button></div>
        </header>
        {message && <p className="modern-notice">{message}</p>}
        {displayedSubjects.length === 0 ? <div className="no-pending"><h3>{editing ? "No subjects available" : "No subjects selected"}</h3><p>{editing ? "Ask your faculty to create a subject." : "Use Edit My Subjects to add subjects."}</p></div> : <div className="modern-subject-grid">
            {displayedSubjects.map((subject) => {
                const id = idOf(subject); const isJoined = joined(subject);
                return <article className="modern-subject-card" key={id}><div className="modern-subject-card-top"><span>{subject.code}</span><b>{isJoined ? "Selected" : "Available"}</b></div><h3>{subject.name}</h3><p>{subject.department} · {subject.faculty?.name || subject.facultyName || "Faculty"}</p><div><span>{(subject.students || []).length} students enrolled</span>{editing && <button type="button" onClick={() => changeEnrollment(subject)} disabled={working === id}>{working === id ? "Please wait..." : isJoined ? "Remove Subject" : "Add Subject"}</button>}</div></article>;
            })}
        </div>}
    </section>;
}

export default ModernStudentSubjects;
