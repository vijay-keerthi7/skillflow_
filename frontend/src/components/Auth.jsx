import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import bgImage from '../assets/logo1.png'; // Ensure you have an appropriate background image
const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const baseUrl = process.env.REACT_APP_API_URL.endsWith('/') 
            ? process.env.REACT_APP_API_URL.slice(0, -1) 
            : process.env.REACT_APP_API_URL;
        try {
            if (isLogin) {
                const res = await axios.post(`${baseUrl}/auth/login`, {
                    email: formData.email,
                    password: formData.password
                });
                if (res.data.token && res.data.user) {
                    // CHANGED: Keys updated to spark_token and spark_user
                    localStorage.setItem('spark_token', res.data.token);
                    localStorage.setItem('spark_user', JSON.stringify(res.data.user));
                    navigate('/'); 
                }
            } else {
                await axios.post(`${baseUrl}/auth/register`, formData);
                alert("Success! Now Login.");
                setIsLogin(true);
            }
        } catch (error) {
            alert(error.response?.data?.message || "Auth Error");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:5000/api/auth/google";
    }

    return ( 
        <div className="h-[100dvh] w-full bg-[#0b051a] flex items-center justify-center relative overflow-hidden font-sans">
           
            {/* LAYERED GRADIENT BACKGROUND (No Borders) */}
            <div className="absolute inset-0 bg-[#0f021a]">
                {/* Primary Sunset Glow */}
                <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-[#4f00c2] via-[#a100ff] to-[#ff3d77] opacity-50 blur-[100px]"></div>
                
                {/* Intense Accent Blobs */}
                <div className="absolute top-[10%] right-[5%] w-[300px] h-[300px] bg-[#ffec3d] rounded-full blur-[150px] opacity-30"></div>
                <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] bg-[#00f2ff] rounded-full blur-[150px] opacity-25"></div>
            </div>

            {/* BORDERLESS FORM CONTAINER */}
            <div className="w-full max-w-md px-10 py-12 z-10 transition-all">
                
                {/* Branding - Updated to Spark with Mobile-Safe Gradient */}
                <div className="mb-12">
                     <img 
        src={bgImage} 
        alt="Spark Logo" 
        className="w-20 h-20 md:w-20 md:h-20 object-contain mb-4 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]" 
    />
                    <h1 
                      className="font-['Merienda',_serif] font-extrabold tracking-[0.2em] text-5xl uppercase bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 inline-block"
                      style={{
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        color: 'transparent'
                      }}
                    >
                      Spark
                    </h1>
                    <div className="h-1.5 w-24 bg-gradient-to-r from-[#ff3d77] to-transparent mt-3"></div>
                    <p className="text-white/70 text-sm mt-4 font-bold uppercase tracking-[0.3em]">
                        {isLogin ? 'Authentication' : 'Registration'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!isLogin && (
                        <div className="relative border-b border-white/20 focus-within:border-[#00f2ff] transition-colors">
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="FULL NAME"
                                className="w-full bg-transparent py-4 text-white text-[16px] placeholder-white/20 outline-none font-bold tracking-widest"
                            />
                        </div>
                    )}

                    <div className="relative border-b border-white/20 focus-within:border-[#00f2ff] transition-colors">
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="EMAIL ADDRESS"
                            className="w-full bg-transparent py-4 text-white text-[16px] placeholder-white/20 outline-none font-bold tracking-widest"
                        />
                    </div>

                    <div className="relative border-b border-white/20 focus-within:border-[#00f2ff] transition-colors">
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            placeholder="PASSWORD"
                            className="w-full bg-transparent py-4 text-white text-[16px] placeholder-white/20 outline-none font-bold tracking-widest"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-16 bg-white text-[#0f021a] font-black text-xl tracking-widest hover:bg-[#00f2ff] transition-all active:scale-[0.97] flex items-center justify-center"
                    >
                        {loading ? '...' : (isLogin ? 'ENTER' : 'CREATE')}
                    </button>
                </form>

                {/* Social Login - Borderless Button */}
                <div className="mt-10">
                    <button 
                        onClick={handleGoogleLogin} 
                        type="button"
                        className="w-full py-4 text-white/60 font-bold tracking-widest hover:text-white transition-all flex items-center justify-center gap-4 group"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" alt="G" />
                        <span>CONTINUE WITH GOOGLE</span>
                    </button>
                </div>

                {/* Toggle - Text Only */}
                <div className="mt-12 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-white font-black text-sm tracking-[0.2em] border-b-2 border-[#ff3d77] pb-1 hover:text-[#00f2ff] hover:border-[#00f2ff] transition-all"
                    >
                        {isLogin ? 'NEED AN ACCOUNT?' : 'ALREADY REGISTERED?'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;