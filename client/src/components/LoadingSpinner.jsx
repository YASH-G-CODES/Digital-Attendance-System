function LoadingSpinner({ text, size = "medium", inline = false }) {
    return (
        <span className={`loading-indicator ${size} ${inline ? "inline" : ""}`} role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true"></span>
            {text && <span className="loading-text">{text}</span>}
        </span>
    );
}

export default LoadingSpinner;
