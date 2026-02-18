import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const LoginSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        // 1. Extract data from the URL query string
        const token = searchParams.get('token');
        const userDataString = searchParams.get('user');

        if (token && userDataString) {
            try {
                // 2. Save token to localStorage
                localStorage.setItem('spark_token', token);
                
                // 3. Save user object to localStorage
                // It's already stringified from the backend, so we store it directly
                localStorage.setItem('spark_user', userDataString);

                // 4. Redirect to the main chat app
                navigate('/', { replace: true });
                
                // 5. Optional: Refresh to ensure Context/State catches the new data
                window.location.reload();
            } catch (error) {
                console.error("Error parsing Google user data:", error);
                navigate('/auth');
            }
        } else {
            // If something went wrong and params are missing
            navigate('/auth');
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen w-full bg-[#1D546D] flex items-center justify-center text-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400 mb-4 mx-auto"></div>
                <h2 className="text-xl font-semibold">Authenticating with Google...</h2>
                <p className="text-white/50 text-sm mt-2">Please wait a moment.</p>
            </div>
        </div>
    );
};

export default LoginSuccess;