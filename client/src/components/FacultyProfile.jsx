import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL, API_ORIGIN } from "../services/config";
import LoadingSpinner from "./LoadingSpinner";

function FacultyProfile() {
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState({ name: "", department: "", profilePhoto: "" });
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

    useEffect(() => {
        axios.get(`${API_BASE_URL}/user/faculty-profile`, auth())
            .then((response) => {
                const user = response.data.profile || response.data;
                setProfile(user);
                setForm({ name: user.name || "", department: user.department || "", profilePhoto: "" });
            })
            .catch((error) => setMessage(error.response?.data?.message || "Unable to load your profile."))
            .finally(() => setLoading(false));
    }, []);

    const changePhoto = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024) {
            setMessage("Choose a JPG, PNG, or WEBP image smaller than 4 MB.");
            event.target.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setForm((current) => ({ ...current, profilePhoto: reader.result }));
        reader.onerror = () => setMessage("The selected photo could not be read.");
        reader.readAsDataURL(file);
    };

    const save = async (event) => {
        event.preventDefault();
        try {
            setSaving(true); setMessage("");
            const response = await axios.put(`${API_BASE_URL}/user/profile`, form, auth());
            setProfile(response.data.user);
            setForm({ name: response.data.user.name || "", department: response.data.user.department || "", profilePhoto: "" });
            localStorage.setItem("user", JSON.stringify(response.data.user));
            setEditing(false); setMessage("Profile updated successfully.");
        } catch (error) { setMessage(error.response?.data?.message || "Unable to update profile."); }
        finally { setSaving(false); }
    };

    if (loading) return <section className="faculty-profile-page"><div className="admin-loading"><LoadingSpinner text="Loading your profile..." /></div></section>;
    if (!profile) return <section className="faculty-profile-page"><div className="error-message">{message || "Profile unavailable"}</div></section>;
    const photoUrl = form.profilePhoto || (profile.profilePhoto ? (profile.profilePhoto.startsWith("http") ? profile.profilePhoto : `${API_ORIGIN}${profile.profilePhoto}`) : "");

    return <section className="faculty-profile-page">
        {message && <div className="attendance-message">{message}</div>}
        <div className="profile-hero">
            <div className="profile-avatar">{photoUrl ? <img src={photoUrl} alt="Profile" /> : profile.name?.charAt(0).toUpperCase()}</div>
            <div><p className="eyebrow">Faculty account</p><h2>{profile.name}</h2><p>{profile.email}</p></div>
            <button type="button" onClick={() => { setEditing(!editing); setForm({ name: profile.name || "", department: profile.department || "", profilePhoto: "" }); }}>{editing ? "Cancel" : "Edit Profile"}</button>
        </div>
        {editing ? <form className="student-profile-form" onSubmit={save}>
            <div className="profile-editor-photo">{photoUrl ? <img src={photoUrl} alt="Preview" /> : <span>{form.name?.charAt(0).toUpperCase() || "F"}</span>}<label htmlFor="faculty-photo">Change photo<input id="faculty-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={changePhoto} /></label></div>
            <div className="profile-editor-fields"><div className="input-group"><label>Full name</label><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div><div className="input-group"><label>Department</label><input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} required /></div><button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button></div>
        </form> : <div className="profile-details-grid"><div className="profile-detail"><span>Department</span><strong>{profile.department || "Not specified"}</strong></div><div className="profile-detail"><span>Role</span><strong>{profile.role}</strong></div><div className="profile-detail"><span>Account status</span><strong>{profile.facultyStatus || "Active"}</strong></div></div>}
    </section>;
}

export default FacultyProfile;
