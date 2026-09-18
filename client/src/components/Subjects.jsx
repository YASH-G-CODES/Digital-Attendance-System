import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/config";
import LoadingSpinner from "./LoadingSpinner";

const emptyForm = { name: "", code: "", department: "" };

function Subjects() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [editingSubject, setEditingSubject] = useState(null);
    const [saving, setSaving] = useState(false);
    const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
    const idOf = (subject) => subject._id || subject.id;

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/subjects/my`, auth());
            setSubjects(response.data.subjects || (Array.isArray(response.data) ? response.data : []));
            setMessage("");
        } catch (error) {
            setMessage(error.response?.data?.message || "Unable to fetch subjects.");
        } finally { setLoading(false); }
    };
    useEffect(() => { fetchSubjects(); }, []);

    const openCreate = () => { setEditingSubject(null); setForm(emptyForm); setMessage(""); };
    const openEdit = (subject) => {
        setEditingSubject(subject);
        setForm({ name: subject.name || "", code: subject.code || "", department: subject.department || "" });
        setMessage("");
    };
    const closeForm = () => { setEditingSubject(null); setForm(emptyForm); };
    const formOpen = editingSubject !== null || Object.values(form).some(Boolean);

    const saveSubject = async (event) => {
        event.preventDefault();
        try {
            setSaving(true);
            const isEditing = Boolean(editingSubject);
            const url = isEditing ? `${API_BASE_URL}/subjects/${idOf(editingSubject)}` : `${API_BASE_URL}/subjects`;
            const payload = isEditing ? { ...form, status: editingSubject.status } : form;
            const response = await axios[isEditing ? "put" : "post"](url, payload, auth());
            setMessage(response.data.message || "Subject saved successfully.");
            closeForm();
            fetchSubjects();
        } catch (error) { setMessage(error.response?.data?.message || "Unable to save subject."); }
        finally { setSaving(false); }
    };
    const deleteSubject = async (subject) => {
        if (!window.confirm(`Delete ${subject.name}? This cannot be undone.`)) return;
        try {
            const response = await axios.delete(`${API_BASE_URL}/subjects/${idOf(subject)}`, auth());
            setSubjects((current) => current.filter((item) => idOf(item) !== idOf(subject)));
            setMessage(response.data.message || "Subject deleted.");
        } catch (error) { setMessage(error.response?.data?.message || "Unable to delete subject."); }
    };

    if (loading) return <div className="attendance-records"><h2>My Subjects</h2><LoadingSpinner text="Loading subjects..." /></div>;
    return <div className="attendance-records">
        <h2>My Subjects</h2>
        {message && <p className="attendance-message">{message}</p>}
        <button type="button" onClick={formOpen ? closeForm : openCreate}>{formOpen ? "Close" : "Create Subject"}</button>
        {formOpen && <form onSubmit={saveSubject} style={{ marginTop: "20px" }}>
            <h3>{editingSubject ? "Edit Subject" : "Create Subject"}</h3>
            <div className="input-group"><label>Subject Name</label><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Data Structures" required /></div>
            <div className="input-group"><label>Subject Code</label><input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="e.g. DSA101" required /></div>
            <div className="input-group"><label>Department</label><input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} placeholder="e.g. CSE" required /></div>
            <button type="submit" disabled={saving}>{saving ? "Saving..." : editingSubject ? "Save Changes" : "Create Subject"}</button>
        </form>}
        {subjects.length === 0 ? <div className="no-pending"><h3>No Subjects Created</h3><p>Create your first subject.</p></div> : <div className="pending-list">
            {subjects.map((subject) => <div className="pending-card" key={idOf(subject)}><div className="pending-info">
                <h3>{subject.name}</h3><p>Code: {subject.code}</p><p>Department: {subject.department}</p><p>Status: {subject.status}</p><p>Students: {subject.students?.length || 0}</p>
                <button type="button" onClick={() => openEdit(subject)} style={{ marginTop: "10px", marginRight: "10px" }}>Edit Subject</button>
                <button type="button" onClick={() => deleteSubject(subject)} style={{ marginTop: "10px" }}>Delete Subject</button>
            </div></div>)}
        </div>}
    </div>;
}

export default Subjects;
