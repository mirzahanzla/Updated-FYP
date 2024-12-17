import express from 'express';
import { searchUsers } from '../controllers/searchUser.js';
import { checkFollowStatus, followUser, unfollowUser } from '../controllers/followers.js';
// import { verifyToken } from '../controllers/authController.js';

const router = express.Router();

router.get('/search', searchUsers);

router.post('/follow', followUser);

// Unfollow a user
router.post('/unfollow', unfollowUser);

// Check if the logged-in user is following the profile user
router.get('/follow-status', checkFollowStatus);
export default router;


