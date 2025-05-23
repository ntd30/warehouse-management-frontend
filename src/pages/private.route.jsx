import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../components/context/auth.context";
import { getProfileAPI } from "../services/api.service";

const PrivateRoute = ({ children }) => {
    const { user, setUser } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadUserInfo = async () => {
            // Check if access_token exists
            const token = localStorage.getItem('access_token');
            if (!token) {
                setIsLoading(false);
                navigate('/login', { replace: true });
                return;
            }

            try {
                const res = await getProfileAPI();
                if (res?.data) {
                    setUser(res.data);
                } else {
                    // If API returns no data, clear token and redirect
                    localStorage.removeItem('access_token');
                    setUser({});
                    navigate('/login', { replace: true });
                }
            } catch (error) {
                console.error("Error loading user info:", error);
                // Handle error (e.g., invalid token)
                localStorage.removeItem('access_token');
                setUser({});
                navigate('/login', { replace: true });
            } finally {
                setIsLoading(false);
            }
        };

        loadUserInfo();
    }, [setUser, navigate]);

    // While loading, show nothing or a loading spinner
    if (isLoading) {
        return null; // Or replace with a loading spinner component
    }

    // Render children if user is authorized, otherwise return null
    return user?.id && user?.roleName !== "Customer" ? <>{children}</> : null;
};

export default PrivateRoute;