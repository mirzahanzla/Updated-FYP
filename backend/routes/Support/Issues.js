import express from 'express';
import multer from 'multer';
import path from 'path';
import { Issue } from '../../models/Support/Issues.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import IssueStatistics from '../../models/Support/OverView.js';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase.js';
const router = express.Router();


const upload = multer({ storage: multer.memoryStorage() });





router.get('/',(req,res) => { 
    res.status(200).json({ message: 'ok to create issue' });
 })


// Route to handle creating a new issue
router.post('/new', upload.single('attachment'), async (req, res) => {
   
    const logo = req.file;
   
    const logoRef = ref(storage, `Issues/${Date.now()}_${logo.originalname}`);
    await uploadBytes(logoRef, logo.buffer);
    const logoURL = await getDownloadURL(logoRef);
    console.log("Logo url is ")
    console.log(logoURL)

    try {
        const { issue, description, contractLink, userId } = req.body;

        // Create a new issue document
        const newIssue = new Issue({
            userId,
            issue,
            description,
            status: 'Pending', // Set default status
            attachment: req.file ? logoURL : null,
            contractLink,
        });

        // Save the new issue to the database
        await newIssue.save();

        // Determine the field to increment based on the issue type
        const updateFields = { Pending: 1 }; // Increment pending count
        if (issue === 'Contract') {
            updateFields.Contract = 1;
        } else if (issue === 'Payment') {
            updateFields.Payment = 1;
        } else if (issue === 'Account') {
            updateFields.Account = 1;
        } else {
            updateFields.Others = 1;
        }

        // Update the IssueStatistics document
        await IssueStatistics.findOneAndUpdate(
            {}, // You can add a filter here if there are multiple IssueStatistics documents
            { $inc: updateFields },
            { upsert: true, new: true }
        );

        res.status(201).json({ message: 'Issue created successfully', newIssue });
    } catch (error) {
        console.error('Error creating issue:', error);
        res.status(500).json({ message: 'Failed to create issue' });
    }
});
export default  router;
