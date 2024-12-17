import User from '../models/user.js';

// Controller for searching users by name or username
export const searchUsers = async (req, res) => {
  const { query } = req.query; // 'query' will be passed as a URL parameter

  if (!query || query.trim() === '') {
    return res.status(400).json({ message: 'Search query cannot be empty' });
  }

  try {
    // Case-insensitive search for users by name or username
    const users = await User.find({
      $or: [
        { fullName: { $regex: query, $options: 'i' } }, // Search by full name
        { userName: { $regex: query, $options: 'i' } }  // Search by username
      ]
    });

    // If no users are found, return an empty array with a 200 status
    if (!users || users.length === 0) {
      return res.status(200).json([]); // Send 200 with an empty array
    }

    // Return the list of users found
    return res.status(200).json(users);
  } catch (error) {
    // Log error and return a generic error message
    console.error(`Error occurred while searching for users: ${error}`);
    return res.status(500).json({ message: 'An internal server error occurred' });
  }
};


// import User from '../models/user.js';

// // Search function for users based on query
// export const searchUsers = async (req, res) => {
//   const query = req.query.query;

//   // Perform search using the query parameter (name or username)
//   const users = User(user => 
//     user.name.toLowerCase().includes(query.toLowerCase()) || 
//     user.username.toLowerCase().includes(query.toLowerCase())
//   );

//   if (users.length > 0) {
//     res.json(users);
//   } else {
//     res.status(404).json({ message: 'No users found' });
//   }
// };


