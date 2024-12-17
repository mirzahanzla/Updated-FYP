

import jwt from 'jsonwebtoken';
import User from '../models/user.js'; // User model
import Group from '../models/Group.js'; // Group model

export const toggleFollowGroup = async (req, res) => {
    const { groupId } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    try {
      // eslint-disable-next-line no-undef
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
  
      let isFollowing = false;
  
      // Toggle Follow/Unfollow
      if (user.followedGroups.includes(groupId)) {
        user.followedGroups = user.followedGroups.filter((id) => id.toString() !== groupId);
        group.followedBy = group.followedBy.filter((id) => id.toString() !== user._id.toString());
      } else {
        user.followedGroups.push(groupId);
        group.followedBy.push(user._id);
        isFollowing = true;
      }
  
      await user.save();
      await group.save();
  
      return res.status(200).json({
        message: isFollowing ? 'Followed the group successfully' : 'Unfollowed the group successfully',
        groupId,
        isFollowing,
      });
    } catch (error) {
      console.error('Error toggling follow status:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };

  

  export const checkFollowStatus = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    try {
      // eslint-disable-next-line no-undef
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).populate('followedGroups');
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const followedGroups = user.followedGroups.map((group) => ({
        _id: group._id,
        title: group.title,
        isFollowing: true, // Status is always true for followed groups
      }));
  
      return res.status(200).json(followedGroups);
    } catch (error) {
      console.error('Error fetching follow status:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
  








  export const unfollowGroup = async (req, res) => {
    const { groupId } = req.body; // Get groupId from request body
    const token = req.headers.authorization?.split(' ')[1]; // Extract token
  
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    try {
      // Verify token and extract user ID
      // eslint-disable-next-line no-undef
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Find the group to ensure it exists
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
  
      // Remove the groupId from the user's followedGroups list
      user.followedGroups = user.followedGroups.filter(
        (id) => id.toString() !== groupId
      );
  
      // Remove the user's ID from the group's followedBy list
      group.followedBy = group.followedBy.filter(
        (id) => id.toString() !== user._id.toString()
      );
  
      // Save the updated user and group records
      await user.save();
      await group.save();
  
      return res.status(200).json({
        message: 'Successfully unfollowed the group.',
        groupId,
      });
    } catch (error) {
      console.error('Error unfollowing the group:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
  









  // import jwt from 'jsonwebtoken';
  // import User from '../models/user.js'; // User model
  // import Group from '../models/Group.js'; // Group model
  
  // export const toggleFollowGroup = async (req, res) => {
  //     const { groupId } = req.body;
  //     const token = req.headers.authorization?.split(' ')[1];
    
  //     if (!token) {
  //       return res.status(401).json({ message: 'Unauthorized' });
  //     }
    
  //     try {
  //       // eslint-disable-next-line no-undef
  //       const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //       const user = await User.findById(decoded.id);
  //       if (!user) {
  //         return res.status(404).json({ message: 'User not found' });
  //       }
    
  //       const group = await Group.findById(groupId);
  //       if (!group) {
  //         return res.status(404).json({ message: 'Group not found' });
  //       }
    
  //       let isFollowing = false;
  //       let isAlreadyMember = false;
  //        // Check if the user is already a member of the group
  //     if (group.members.includes(user._id)) {
  //       isAlreadyMember = true;
  //     }
    
  
  //     // Toggle Follow/Unfollow
  //     if (isAlreadyMember) {
  //       return res.status(400).json({ message: 'You are already a member of this group.' });
  //     }
  
  
  
  //       // // Toggle Follow/Unfollow
  //       // if (user.followedGroups.includes(groupId)) {
  //       //   user.followedGroups = user.followedGroups.filter((id) => id.toString() !== groupId);
  //       //   group.followedBy = group.followedBy.filter((id) => id.toString() !== user._id.toString());
  //       //     // Remove user from group members if unfollowed
  //       //     group.members = group.members.filter((id) => id.toString() !== user._id.toString());
  //       // } else {
  //       //   user.followedGroups.push(groupId);
  //       //   group.followedBy.push(user._id);
  //       //    // Add user to group members if followed
  //       //    group.members.push(user._id);
  //       //   isFollowing = true;
  //       // }
  
  //       if (user.followedGroups.includes(groupId)) {
  //         // If the user is following the group, add them to the group's members list
  //         group.members.push(user._id);
  //         user.followedGroups.push(groupId); // Mark as followed
    
  //         // Update follow status to true
  //         isFollowing = true;
  //       } else {
  //         // If the user is unfollowing, remove them from the group's members list
  //         user.followedGroups = user.followedGroups.filter((id) => id.toString() !== groupId);
  //         group.followedBy = group.followedBy.filter((id) => id.toString() !== user._id.toString());
  //         group.members = group.members.filter((id) => id.toString() !== user._id.toString()); // Remove user from group members
  //       }
    
  //       await user.save();
  //       await group.save();
    
  //       return res.status(200).json({
  //         message: isFollowing ? 'Followed the group successfully' : 'Unfollowed the group successfully',
  //         groupId,
  //         isFollowing,
  //         isAlreadyMember,
  //       });
  //     } catch (error) {
  //       console.error('Error toggling follow status:', error);
  //       return res.status(500).json({ message: 'Server error' });
  //     }
  //   };
  
    
  
  //   export const checkFollowStatus = async (req, res) => {
  //     const token = req.headers.authorization?.split(' ')[1];
    
  //     if (!token) {
  //       return res.status(401).json({ message: 'Unauthorized' });
  //     }
    
  //     try {
  //       // eslint-disable-next-line no-undef
  //       const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //       const user = await User.findById(decoded.id).populate('followedGroups');
    
  //       if (!user) {
  //         return res.status(404).json({ message: 'User not found' });
  //       }
    
  //       const followedGroups = user.followedGroups.map((group) => ({
  //         _id: group._id,
  //         title: group.title,
  //         isFollowing: true, // Status is always true for followed groups
  //       }));
    
  //       return res.status(200).json(followedGroups);
  //     } catch (error) {
  //       console.error('Error fetching follow status:', error);
  //       return res.status(500).json({ message: 'Server error' });
  //     }
  //   };
    
  
  
  
  
  
  
  
  
  //   export const unfollowGroup = async (req, res) => {
  //     const { groupId } = req.body; // Get groupId from request body
      
  //     const token = req.headers.authorization?.split(' ')[1]; // Extract token
    
  //     if (!token) {
  //       return res.status(401).json({ message: 'Unauthorized' });
  //     }
    
  //     try {
  //       // Verify token and extract user ID
  //       // eslint-disable-next-line no-undef
  //       const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //       const user = await User.findById(decoded.id);
    
  //       if (!user) {
  //         return res.status(404).json({ message: 'User not found' });
  //       }
    
  //       // Find the group to ensure it exists
  //       const group = await Group.findById(groupId);
  //       if (!group) {
  //         return res.status(404).json({ message: 'Group not found' });
  //       }
    
  //       // Remove the groupId from the user's followedGroups list
  //       user.followedGroups = user.followedGroups.filter(
  //         (id) => id.toString() !== groupId
  //       );
    
  //       // Remove the user's ID from the group's followedBy list
  //       group.followedBy = group.followedBy.filter(
  //         (id) => id.toString() !== user._id.toString()
  //       );
    
  //        // Also, remove the user from the group's members if unfollowed
  //        group.members = group.members.filter(
  //         (id) => id.toString() !== user._id.toString()
  //       );
  //       // Save the updated user and group records
  //       await user.save();
  //       await group.save();
    
  //       return res.status(200).json({
  //         message: 'Successfully unfollowed the group.',
  //         groupId,
  //       });
  //     } catch (error) {
  //       console.error('Error unfollowing the group:', error);
  //       return res.status(500).json({ message: 'Server error' });
  //     }
  //   };
    