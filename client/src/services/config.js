// The production Express service serves the frontend and API from one origin.
// Override this only when running the frontend and API as separate services.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export {
    API_BASE_URL,
    API_ORIGIN
};
