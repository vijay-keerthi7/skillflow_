import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { usersContext } from '../context/UsersContext';
import ProfileView from './ProfileView'; // Import the UI component

const UserProfile = () => {
  const { id } = useParams();
  const { currentUserId } = useContext(usersContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const currentUser = JSON.parse(localStorage.getItem('spark_user'));
        const myId = currentUser?._id || currentUser?.id;
        
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/users/profile/${id}?myId=${myId}`);
        setProfile(res.data);
        
      } catch (err) {
        console.error("Profile load failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading || !profile) {
    return (
      <div className="flex-1 bg-[#1D546D] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400"></div>
      </div>
    );
  }

  // Use the ProfileView UI and pass the data we fetched
  return (
    <ProfileView 
      user={profile.user} 
      relationship={profile.status} 
      mutuals={{ count: profile.mutualCount }} 
    />
  );
};

export default UserProfile;