import { Issue } from "../../models/Support/Issues.js";

import express from "express";
import IssueStatistics from "../../models/Support/OverView.js";

const router = express.Router();
import mongoose from "mongoose";
import transaction from "../../models/transaction.js";
import brands from "../../models/brands.js";
import contractModel from "../../models/contractModel.js";
import User from '../../models/user.js'
import sendEmail from "../../utils/sendEmail.js";
import withdrawalRequest from "../../models/withdrawalRequest.js";


router.get("/", (req, res) => {
    res.status(200).send({ message: "ok everything is working " });
})

const overViewData = {
    totalQueries: "30",
    totalQueriesPercentage: "1.5",
    pendingQueries: "678",
    pendingPercentage: "1.5",
    resolvedQueries: "240",
    resolvedPercentage: "90.0",
};

const Issuestatistics = {
    Contract: "30",
    Payment: "15",
    Account: "5,678",
    Others: "1.5",
    Pending: "2",
    Resolved: "2",
    Progress: "43"
};




// This Show all the Issues to the Support Service
router.get('/issues', async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = 6; // 6 issues per page
    const startIndex = (page - 1) * limit;

    const searchValue = req.query.search || ''; // Search value
    const filterValue = req.query.filter || ''; // Filter value

    let queryConditions = {};

    if (searchValue) {
        queryConditions.$or = [
            { description: { $regex: searchValue, $options: 'i' } }, // Search in description
            { 'userId.name': { $regex: searchValue, $options: 'i' } }, // Search in populated user's name
            { 'userId.username': { $regex: searchValue, $options: 'i' } } // Search in populated user's username
        ];
    }

    if (filterValue) {
        queryConditions.status = filterValue; // Apply filter based on issue status
    }

    try {
        const totalIssues = await Issue.countDocuments(queryConditions);

        const issues = await Issue.find(queryConditions)
            .skip(startIndex)
            .limit(limit)
            .populate('userId', 'fullName  photo') // Populate userId with name, username, and img
            .exec();

        res.json({
            currentPage: page,
            totalPages: Math.ceil(totalIssues / limit),
            totalIssues: totalIssues,
            data: issues
        });
    } catch (error) {
        console.error('Error fetching issues:', error);
        res.status(500).json({ message: 'Failed to fetch issues' });
    }
});

// router.get('/issues', (req, res) => {
//     const page = parseInt(req.query.page) || 1; // Default to page 1
//     const limit = 6; // 6 issues per page
//     const startIndex = (page - 1) * limit;
//     const endIndex = page * limit;

//     // Get search and filter values from the query parameters
//     const searchValue = req.query.search || ''; // Default to an empty string if not provided
//     const filterValue = req.query.filter || ''; // Default to an empty string if not provided

//     // Filter the issues based on the search and filter values
//     let filteredIssues = issues; // Assuming issues is your data source

//     // Search logic
//     if (searchValue) {
//         filteredIssues = filteredIssues.filter(issue =>
//             users[issue.userid].name.toLowerCase().includes(searchValue.toLowerCase()) ||
//             users[issue.userid].username.toLowerCase().includes(searchValue.toLowerCase()) ||
//             issue.description.toLowerCase().includes(searchValue.toLowerCase())
//         );
//     }
//     console.log(filteredIssues)

//     // Filter logic
//     if (filterValue) {
//         filteredIssues = filteredIssues.filter(issue => issue.status.toLowerCase() === filterValue.toLowerCase());
//     }

//     // Remove duplicates based on issue ID
//     const uniqueIssues = Array.from(new Set(filteredIssues.map(issue => issue._id)))
//         .map(id => filteredIssues.find(issue => issue._id === id));

//     // Paginate the unique results
//     const paginatedResults = filteredIssues.slice(startIndex, endIndex).map(issue => {
//         const user = users[issue.userid];
//         return { ...issue, user };
//     });

//     res.json({
//         currentPage: page,
//         totalPages: Math.ceil(filteredIssues.length / limit),
//         totalIssues: filteredIssues.length,
//         data: paginatedResults
//     });



router.put('/issues/update', async (req, res) => {
    const { issueId, status, message } = req.body;

    console.log(issueId);
    console.log(status)

    try {
        // Find the current issue
        const issue = await Issue.findById(issueId);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        const prevStatus = issue.status; // Store previous status

        // Update the issue's status and add the message
        issue.status = status;
        issue.messages = message// Assuming messages is an array
        await issue.save();

        // Determine the update for IssueStatistics
        const updateFields = {};

        // Decrement the count of the previous status
        if (prevStatus === 'Pending') {
            updateFields.Pending = -1;
        } else if (prevStatus === 'Resolved') {
            updateFields.Resolved = -1;
        } else if (prevStatus === 'In Review') {
            updateFields.Progress = -1;
        }

        // Increment the count of the new status
        if (status === 'Pending') {
            updateFields.Pending = (updateFields.Pending || 0) + 1;
        } else if (status === 'Resolved') {
            updateFields.Resolved = (updateFields.Resolved || 0) + 1;
        } else if (status === 'In Review') {
            updateFields.Progress = (updateFields.Progress || 0) + 1;
        }

        // Update the IssueStatistics document
        await IssueStatistics.findOneAndUpdate(
            {}, // Add filter if there are multiple IssueStatistics documents
            { $inc: updateFields },
            { upsert: true, new: true }
        );

        res.status(200).json({ message: 'Issue updated successfully', issue });
    } catch (error) {
        console.error('Error updating issue:', error);
        res.status(500).json({ message: 'Failed to update issue' });
    }
});


// This Show the issue to the user whose login
router.get('/User/issues', async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = 6; // 6 issues per page
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Get search, filter, and userId values from the query parameters
    const searchValue = req.query.search || ''; // Default to an empty string if not provided
    const filterValue = req.query.filter || ''; // Default to an empty string if not provided
    const userId = req.query.userId; // Get userId from query

    if (!userId) {
        return res.status(400).json({ message: 'UserId is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid userId format' });
    }

    try {
        // Build the query for fetching issues
        const query = { userId };

        // If searchValue is provided, modify the query to include search in description
        if (searchValue) {
            query.description = { $regex: searchValue, $options: 'i' }; // Case-insensitive search
        }

        // If filterValue is provided, add status filter
        if (filterValue) {
            query.status = filterValue;
        }

        // Fetch the issues from MongoDB
        const filteredIssues = await Issue.find(query)
            .skip(startIndex)
            .limit(limit)
            .populate('userId', 'fullName photo'); // Populate user details

        // Count total matching issues for pagination
        const totalIssues = await Issue.countDocuments(query);

        res.json({
            currentPage: page,
            totalPages: Math.ceil(totalIssues / limit),
            totalIssues,
            data: filteredIssues,
        });
    } catch (error) {
        console.error('Error fetching issues:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get("/OverView", (req, res) => {
    res.status(200).send(overViewData);
});

router.get("/Statistics/OverView", async (req, res) => {
    try {
        // Assuming there is only one row, you can use `findOne`
        const supportStatistics = await IssueStatistics.findOne();
        // const supportStatistics = Issuestatistics
        // Check if data is available
        if (!supportStatistics) {
            return res.status(404).send({ message: "No data found" });
        }
        const { Contract, Payment, Account, Others, Pending, Resolved } = supportStatistics
        const totalQueries = Contract + Payment + Account + Others


        const data = {
            "totalQueries": totalQueries,
            "totalQueriesPercentage": "1.5",
            "pendingQueries": Pending,
            "pendingPercentage": "1.5",
            "resolvedQueries": Resolved,
            "resolvedPercentage": "90.0",
        }

        // Send the single row
        res.status(200).send(data);
    } catch (error) {
        // Handle any errors that may occur during the query
        res.status(500).send({ error: "An error occurred while fetching the data" });
    }
});

// GET /OverView to send the data of SupportStatistics
router.get("/Statistics", async (req, res) => {
    try {
        // Assuming there is only one row, you can use `findOne`
        const supportStatistics = await IssueStatistics.findOne();
        // const supportStatistics = Issuestatistics  

        // Check if data is available
        if (!supportStatistics) {
            return res.status(404).send({ message: "No data found" });
        }

        // Send the single row
        res.status(200).send(supportStatistics);
    } catch (error) {
        // Handle any errors that may occur during the query
        res.status(500).send({ error: "An error occurred while fetching the data" });
    }
});



// POST route to insert data into IssueStatistics
router.post('/api/issue-statistics', async (req, res) => {
    const { Contract, Payment, Account, Others, Pending, Resolved, Progress } = req.body;

    // Validate the input
    // Add your input validation logic here

    try {
        const newIssueStatistics = new IssueStatistics({
            Contract,
            Payment,
            Account,
            Others,
            Pending,
            Resolved,
            Progress
        });

        const savedData = await newIssueStatistics.save(); // Change this line
        res.status(201).json(savedData);
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});




router.get('/getAllPayment', async (req, res) => {
    try {
        const transactions = await transaction.find()
            .populate({
                path: 'influencerID', // Populate influencer details
                select: 'photo fullName', // Only fetch photo and fullName
            })


        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Failed to retrieve transactions' });
    }
});

router.get('/PaymentApproved/:transactionId/:ContractID', async (req, res) => {
    const { transactionId, ContractID } = req.params;

    try {
        // Update the transaction status to 'Paid'
        const transactionresponse = await transaction.findByIdAndUpdate(
            transactionId,
            { status: 'Paid' },
            { new: true }
        );

        // Find the contract by ContractID
        const transactionContract = await contractModel.findById(ContractID);

        if (!transactionresponse || !transactionContract) {
            return res.status(404).json({ message: 'Transaction or Contract not found' });
        }

        // Get the latest milestone (last one in the array)
        const latestMilestone = transactionContract.milestones[transactionContract.milestones.length - 1];

        // Update the latest milestone's status to 'Accepted'
        latestMilestone.status = 'Accepted';

        // Save the contract with the updated milestone
        await transactionContract.save();

        res.json({ message: 'Transaction and Contract updated successfully', transactionresponse });
    } catch (error) {
        res.status(500).json({ message: 'Error updating transaction or contract', error });
    }
});



router.get('/PaymentRejected/:transactionId/:ContractID', async (req, res) => {

    const { transactionId, ContractID } = req.params;

    try {
        // Update the transaction status to 'Paid'
        const transactionresponse = await transaction.findByIdAndUpdate(
            transactionId,
            { status: 'Rejected' },
            { new: true }
        );
        const transactiondata = await transaction.findById(
            transactionId,
           
        );

        // Find the contract by ContractID
        const transactionContract = await contractModel.findById(ContractID);

        if (!transactionresponse || !transactionContract) {
            return res.status(404).json({ message: 'Transaction or Contract not found' });
        }

        // Get the latest milestone (last one in the array)
        const latestMilestone = transactionContract.milestones[transactionContract.milestones.length - 1];

        // Update the latest milestone's status to 'Accepted'
        latestMilestone.status = 'Payment Pending';

        const brand = await brands.findOne({ 'deals.dealID': transactionContract.dealID }).select('brandID brandImage');
        const userdata = await User.findOne({ "_id":brand.brandID });
        
        console.log("image  is ")
        console.log(transactiondata.transactionImage)
        // Save the contract with the updated milestone
        await transactionContract.save();

        await sendEmail(userdata.email, "Payment Rejection ","Your Payment that you have sent to influencer has been rejected please re-upload that", transactiondata.transactionImage);

        res.json({ message: 'Rejected and Email is Sent', transactionresponse});
    } catch (error) {
        res.status(500).json({ message: 'Error updating transaction or contract', error });
    }

});



router.get('/deal/:dealID', async (req, res) => {
    try {
        const { dealID } = req.params;

        // Find brand that has this dealID in its deals array
        const brand = await brands.findOne({ 'deals.dealID': dealID }).select('brandName brandImage');

        if (!brand) {
            return res.status(404).json({ message: 'Brand not found for this deal' });
        }

        res.status(200).json(brand);
    } catch (error) {
        console.error('Error fetching brand by dealID:', error);
        res.status(500).json({ message: 'Failed to retrieve brand data' });
    }
});


// Route to delete an issue by ID
// Route to delete multiple issues by an array of customerServiceIDs
router.post('/delete', async (req, res) => {
    const { customerServiceIDs } = req.body;
    console.log("Customer Service is ")
    console.log(customerServiceIDs)

    if (!Array.isArray(customerServiceIDs) || customerServiceIDs.length === 0) {
        return res.status(400).json({ message: 'Invalid customerServiceIDs array' });
    }

    try {
        // Delete multiple documents by matching the IDs
        const deletedIssues = await Issue.deleteMany({ _id: { $in: customerServiceIDs } });

        if (deletedIssues.deletedCount === 0) {
            return res.status(404).json({ message: 'No issues found for the provided IDs' });
        }

        res.status(200).json({
            message: 'Issues deleted successfully',
            deletedCount: deletedIssues.deletedCount,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting issues', error: error.message });
    }
});



//////////////////////////////////Influncer Verifu//////////////////////////////////////////////////

router.get('/InfluencerVerify', async (req, res) => {
    try {
      // Find all influencers who are not verified and have uploaded a verification attachment
      const unverifiedInfluencers = await User.find({
        userType: 'influencer',
        verified: false,
        verificationAttachment: { $exists: true, $ne: null }, // checks if there's an attachment
        uploaded: true // ensure 'uploaded' is true as well
      });
  
      // Format the result as [{ influencerData: {}, status: true/false }]
      const formattedResponse = unverifiedInfluencers.map(influencer => ({
        influencerData: influencer,
        status: influencer.verified
      }));
  
      res.status(200).json(formattedResponse);
    } catch (error) {
      console.error('Error fetching unverified influencers:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  



  router.post('/influencerVerifyStatus', async (req, res) => {
    const { influencerId, status } = req.body;
    console.log(req.body)
  
    try {
      // Find the influencer by ID
      const influencer = await User.findById(influencerId);
  
      if (!influencer || influencer.userType !== 'influencer') {
        return res.status(404).json({ message: 'Influencer not found' });
      }
  
      // Update the verified status based on the provided status
      influencer.verified = status;
  
      // Save the updated influencer data
      await influencer.save();
  
      // Prepare email message and attachment content
      const subject = status ? "Verification Accepted" : "Verification Rejected";
      const message = status
        ? "Congratulations! Your verification has been accepted."
        : "Your verification has been rejected. Please re-upload the necessary documents.";
  
      const attachment = influencer.verificationAttachment;
  
      // Send email notification
      await sendEmail(
        influencer.email,
        subject,
        message,
        attachment
      );
  
      res.status(200).json({ message: `Influencer verification ${status ? "approved" : "rejected"} and email sent.` });
    } catch (error) {
      console.error('Error updating influencer verification status:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });


  

// ///////////////////////////// WithDraw payment ///////////////////////////////]


// GET /withdrawRequest - Retrieve all withdrawal requests
router.get('/withdrawRequest', async (req, res) => {
    try {
        const withdrawalRequests = await withdrawalRequest.find()
            .populate('userID', 'fullName email photo') // Adjust fields to populate as needed
            .populate('accountID'); // Populating accountID for related account details
        res.status(200).json(withdrawalRequests);
    } catch (error) {
        console.error('Error retrieving withdrawal requests:', error);
        res.status(500).json({ message: 'Server error' });
    }
});



// POST /withdraw/Review - Review a withdrawal request by ID
router.post('/withdraw/Review', async (req, res) => {
    const { requestId, status } = req.body; // ID and new status from the request body

    try {
        // Find the withdrawal request by ID
        const withdrawalRequestData = await withdrawalRequest.findById(requestId)
            .populate('userID', 'fullName email'); // Populate user details for email

        if (!withdrawalRequestData) {
            return res.status(404).json({ message: 'Withdrawal request not found' });
        }

        // Update the status based on the provided status
        withdrawalRequestData.status = status ? 'approved' : 'rejected';

        // Save the updated withdrawal request
        await withdrawalRequestData.save();

        // Prepare email message content based on status
        const subject = status ? "Withdrawal Request Approved" : "Withdrawal Request Rejected";
        const message = status
            ? "Your withdrawal request has been approved. The funds will be transferred shortly."
            : "Your withdrawal request has been rejected. Please check your account details or contact support.";

        // Send email notification
        await sendEmail(
            withdrawalRequestData.userID.email,
            subject,
            message
        );

        res.status(200).json({ message: `Withdrawal request ${status ? "approved" : "rejected"} and email sent.` });
    } catch (error) {
        console.error('Error reviewing withdrawal request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


export default router