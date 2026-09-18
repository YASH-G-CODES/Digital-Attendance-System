function SuccessToast({ message }) {
    if (!message) {
        return null;
    }

    return (
        <div className="success-toast" role="status" aria-live="polite">
            <span className="success-toast-icon" aria-hidden="true">
                ✓
            </span>
            <span>{message}</span>
        </div>
    );
}

export default SuccessToast;