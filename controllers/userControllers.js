import User from '../models/User.js';
import Message from '../models/Message.js';

export const toggleFollow = async (req, res) => {
    try {
        const { id: targetId } = req.params;
        const { myId } = req.body;
        const io = req.app.get('socketio'); 

        // 1. Database Operations
        const targetUser = await User.findById(targetId);
        const me = await User.findById(myId);
        const isFollowing = me.following.includes(targetId);

        if (isFollowing) {
            await User.findByIdAndUpdate(myId, { $pull: { following: targetId } });
            await User.findByIdAndUpdate(targetId, { $pull: { followers: myId } });
        } else {
            await User.findByIdAndUpdate(myId, { $addToSet: { following: targetId } });
            await User.findByIdAndUpdate(targetId, { $addToSet: { followers: myId } });
        }

        // 2. Fetch Fresh Data
        const updatedTarget = await User.findById(targetId);
        const updatedMe = await User.findById(myId);

        if (io) {
            // GLOBAL BROADCAST 1: Update the Target's counts for EVERYONE
            io.emit("countUpdate", { 
                userId: targetId, 
                followers: updatedTarget.followers.length, 
                following: updatedTarget.following.length 
            });

            // GLOBAL BROADCAST 2: Update Your counts for EVERYONE
            // (Changed this from io.to(myId) to io.emit)
            io.emit("countUpdate", { 
                userId: myId, 
                followers: updatedMe.followers.length, 
                following: updatedMe.following.length 
            });

            // SYNC BUTTON: Only for the person who clicked (Keep this private)
            io.to(myId.toString()).emit("relationshipUpdated", { targetId, isFollowing: !isFollowing });

            // NOTIFICATION: Only for the person who was followed (Keep this private)
            if (!isFollowing) {
                io.to(targetId.toString()).emit("newNotification", {
                    from: me.name,
                    message: "started following you",
                    fromPic: me.profilepic,
                    timestamp: new Date()
                });
            }
        }

        return res.status(200).json({ status: isFollowing ? "none" : "following" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// ... keep getUserProfile and other functions as they were ...

export const getUserProfile = async (req, res) => {
    try {
        const { id } = req.params; 
        const { myId } = req.query;

        const targetUser = await User.findById(id).select("-password");
        const me = await User.findById(myId);

        const myFollowing = me.following.map(fid => fid.toString());
        const targetFollowers = targetUser.followers.map(fid => fid.toString());
        const mutuals = myFollowing.filter(fid => targetFollowers.includes(fid));

        // MESSAGING LOCK: Locked if target is private and doesn't follow me back
        let isChatLocked = false;
        if (targetUser.accountType === 'private') {
            if (!targetUser.following.includes(myId)) isChatLocked = true;
        }

        res.status(200).json({
            user: targetUser,
            isFollowing: myFollowing.includes(id),
            isChatLocked: isChatLocked,
            followersCount: targetUser.followers.length,
            followingCount: targetUser.following.length,
            mutualCount: mutuals.length
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getUserConnections = async (req, res) => {
    try {
        const { id } = req.params;
        const { myId } = req.query;
        const user = await User.findById(id).populate('followers', 'name profilepic email followers following').populate('following', 'name profilepic email followers following');
        const me = await User.findById(myId);
        const myFollowingIds = me.following.map(fid => fid.toString());
        const mutuals = user.followers.filter(f => myFollowingIds.includes(f._id.toString()));

        res.status(200).json({
            userName: user.name,
            followers: user.followers,
            following: user.following,
            mutuals: mutuals
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const suggestedUsers = async (req, res) => {
    try {
        const myId = req.query.myId;
        const me = await User.findById(myId);
        const suggested = await User.find({ _id: { $nin: [myId, ...me.following] } }).limit(10).lean();
        res.status(200).json(suggested);
    } catch (error) { res.status(500).json({ message: error.message }); }
};