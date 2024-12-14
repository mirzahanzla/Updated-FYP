// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import EngagementGrowth from "./EngagementGrowth";
import Engagement from "./Engagement";
import './Index.css';
import Card from "../../../../../Components/Card/Card";
import CardWithImage from "../../../../../Components/Card/CardWithImage";
import Brands from "./Influencers";
import Spendings from "./Spendings";

const OverView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [followers, setFollowers] = useState(1000);
  const [budgetSpent, setBudgetSpent] = useState({
    currentMonth: 0,
    previousMonth: 0,
    change: 0
  });

  const [blogData, setBlogData] = useState({
    shares: 0,
    likes: 0,
    comments: 0,
    engagement_Rate: 0,
    reach: 0,
    sharesPercent: 0,
    likesPercent: 0,
    commentsPercent: 0,
    engagementChange: 0,
    visistsChange: 0
  });

  const [totals, setTotals] = useState({
    curSixMonComments: 0,
    curSixMonShares: 0,
    curSixMonLikes: 0,
    prevSixMonComments: 0,
    prevSixMonLikes: 0,
    prevSixMonShares: 0
  });
  const [ blogsInfo, setBlogsInfo ] = useState([]);
  const [ brandContracts, setBrandContracts ] = useState([]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const monthsBack = 12;

        // API call to get 12 months data for this user
        const response = await axios.get(`/influencer/blogs?monthsBack=${monthsBack}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        });

        const result = response.data;
        console.log("Data in result : ",result);

        if (result.length > 0) {

          const currentMonth = new Date().toISOString().slice(0, 7); //Current month format

          //Previius month format
          const previousMonth = new Date();
          previousMonth.setMonth(previousMonth.getMonth() - 1);
          const previousMonthStr = previousMonth.toISOString().slice(0, 7);

          // Last Six month date format
          const sixMonthsAgoDate = new Date();
          sixMonthsAgoDate.setMonth(sixMonthsAgoDate.getMonth() - 6);
          const sixMonthsAgoStr = sixMonthsAgoDate.toISOString().slice(0, 7);

          // Sixth month to 12th month date format backwards
          const twelveMonthsAgoDate = new Date();
          twelveMonthsAgoDate.setMonth(twelveMonthsAgoDate.getMonth() - 12);
          const twelveMonthsAgoStr = twelveMonthsAgoDate.toISOString().slice(0, 7);

          const blogs = result.flatMap(item => item.blogs); // Flatten the array of blogs
          setBlogsInfo(blogs);
          console.log("Blogs are []: ", blogs);

          // Initialize date
          let currentMonthBlogs = { likes: 0, shares: 0, comments: 0, visits: 0 };
          let previousMonthBlogs = { likes: 0, shares: 0, comments: 0, visits: 0};
          let allTimeTotals = { curSixMonLikes: 0, curSixMonShares: 0, curSixMonComments: 0, prevSixMonLikes: 0, prevSixMonShares: 0, prevSixMonComments: 0 };

          // Iterate through each blog entry
          blogs.forEach(blog => {
            if (blog.monthlyInteraction) {
              Object.keys(blog.monthlyInteraction).forEach(month => {
                const interactions = blog.monthlyInteraction[month];

                // Get data for the last 6 months
                if (month >= sixMonthsAgoStr && month <= currentMonth) {
                  allTimeTotals.curSixMonLikes += interactions.likes || 0;
                  allTimeTotals.curSixMonShares += interactions.reach.length || 0;
                  allTimeTotals.curSixMonVisits += interactions.visits.length || 0;
                  if (interactions.commentedBy) {
                    Object.keys(interactions.commentedBy).forEach(user => {
                      allTimeTotals.curSixMonComments += interactions.commentedBy[user].length || 0;
                    });
                  }
                }

                // 6th - 12th months data
                if (month >= twelveMonthsAgoStr && month < sixMonthsAgoStr) {
                  allTimeTotals.prevSixMonLikes += interactions.likes || 0;
                  allTimeTotals.prevSixMonShares += interactions.reach.length || 0;
                  allTimeTotals.prevSixMonVisits += interactions.visits,length || 0;
                  if (interactions.commentedBy) {
                    Object.keys(interactions.commentedBy).forEach(user => {
                      allTimeTotals.prevSixMonComments += interactions.commentedBy[user].length || 0;
                    });
                  }
                }

                // Current month data
                if (month === currentMonth) {
                  currentMonthBlogs.likes += interactions.likes || 0;
                  currentMonthBlogs.shares += interactions.reach.length || 0;
                  currentMonthBlogs.visits += interactions.visits.length || 0;
                  if (interactions.commentedBy) {
                    Object.keys(interactions.commentedBy).forEach(user => {
                      currentMonthBlogs.comments += interactions.commentedBy[user].length || 0;
                    });
                  }
                }
                
                // previous month data
                if (month === previousMonthStr) {
                  previousMonthBlogs.likes += interactions.likes || 0;
                  previousMonthBlogs.shares += interactions.reach.length || 0;
                  previousMonthBlogs.visits += interactions.visits.length || 0;
                  if (interactions.commentedBy) {
                    Object.keys(interactions.commentedBy).forEach(user => {
                      previousMonthBlogs.comments += interactions.commentedBy[user].length || 0;
                    });
                  }
                }
              });
            }
          });

          const prevShares = previousMonthBlogs.shares;
          const prevLikes = previousMonthBlogs.likes;
          const prevComments = previousMonthBlogs.comments;
          const prevVisits = previousMonthBlogs.visits;

          const currentShares = currentMonthBlogs.shares;
          const currentLikes = currentMonthBlogs.likes;
          const currentComments = currentMonthBlogs.comments;
          const currentVisits = currentMonthBlogs.visits;

          console.log(`Previous Month - Shares: ${prevShares}, Likes: ${prevLikes}, Comments: ${prevComments}, Visits: ${prevVisits}`);
          console.log(`Current Month - Shares: ${currentShares}, Likes: ${currentLikes}, Comments: ${currentComments}, Visits: ${currentVisits}`);
          console.log(`Last 6 months Totals - Shares: ${allTimeTotals.curSixMonShares}, Likes: ${allTimeTotals.curSixMonLikes}, Comments: ${allTimeTotals.curSixMonComments}`);
          console.log(`Last 6-12 months Totals - Shares: ${allTimeTotals.prevSixMonShares}, Likes: ${allTimeTotals.prevSixMonLikes}, Comments: ${allTimeTotals.prevSixMonComments}`);

          // Processing for Egagement Rate calculations
          let totalEngagements = currentLikes + currentComments;
          const currentEngagementRate = currentShares > 0 ? (totalEngagements / currentShares) : 0;

          totalEngagements = prevComments + prevLikes;
          const prevEngagementRate = prevShares > 0 ? (totalEngagements / prevShares) : 0;

          // Percentage changes compared to previous month
          const sharesChange = calculateChange(prevShares, currentShares);
          const likesChange = calculateChange(prevLikes, currentLikes);
          const commentsChange = calculateChange(prevComments, currentComments);
          const engagementChange = calculateChange(prevEngagementRate, currentEngagementRate);
          const visistsChange = calculateChange(prevVisits, currentVisits);

          setBlogData({
            shares: currentShares,
            likes: currentLikes,
            comments: currentComments,
            engagement_Rate: currentEngagementRate.toFixed(2),
            reach: currentVisits,
            sharesPercent: sharesChange.toFixed(2),
            likesPercent: likesChange.toFixed(2),
            commentsPercent: commentsChange.toFixed(2),
            engagementChange: engagementChange.toFixed(2),
            visistsChange: visistsChange.toFixed(2)
          });

          setTotals({
            curSixMonShares: allTimeTotals.curSixMonShares,
            curSixMonLikes: allTimeTotals.curSixMonLikes,
            curSixMonComments: allTimeTotals.curSixMonComments,
            prevSixMonComments: allTimeTotals.prevSixMonComments,
            prevSixMonLikes: allTimeTotals.prevSixMonLikes,
            prevSixMonShares: allTimeTotals.prevSixMonShares
          });
        }
      } catch (err) {
        setError('Error fetching blogs');
        console.error('Error fetching blogs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
          const response = await axios.get('/Brand/checkDealsWithContracts', {
              headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
          });

          // Check if response data is an array
          const contracts = Array.isArray(response.data.contracts) ? response.data.contracts : [];
          setBrandContracts(contracts);
          let currentMonthEarnings = 0;
          let previousMonthEarnings = 0;

          // Get current month in 'YYYY-MM' format
          const currentMonth = new Date().toISOString().slice(0, 7);

          // Get previous month in 'YYYY-MM' format
          const previousMonth = new Date();
          previousMonth.setMonth(previousMonth.getMonth() - 1);
          const previousMonthStr = previousMonth.toISOString().slice(0, 7);

          contracts.forEach(contract => {
              if (contract.milestones && Array.isArray(contract.milestones)) {
                  contract.milestones.forEach(milestone => {
                      const milestoneMonthYear = milestone.startedDate.slice(0, 7); // Extract 'YYYY-MM' from deadline

                      // Check if the milestone is in the current month
                      if (milestoneMonthYear === currentMonth) {
                          currentMonthEarnings += milestone.budget || 0;
                      }

                      // Check if the milestone is in the previous month
                      if (milestoneMonthYear === previousMonthStr) {
                          previousMonthEarnings += milestone.budget || 0;
                      }
                  });
              }
          });

          // Calculate the percentage change
          const changePercentage = calculateChange(previousMonthEarnings, currentMonthEarnings);

          setBudgetSpent({
              currentMonth: currentMonthEarnings,
              previousMonth: previousMonthEarnings,
              change: changePercentage
          });
          } catch (err) {
              if (err.response && err.response.data && err.response.data.message === "Brand not found") {
                setBrandContracts([]);  // No contracts, but not an error
                setBudgetSpent({
                    currentMonth: 0,
                    previousMonth: 0,
                    change: 0
                });
              }
              if (err.response && err.response.data && err.response.data.message === "No deals found for this brand") {
                setBrandContracts([]);  // No contracts, but not an error
                setBudgetSpent({
                    currentMonth: 0,
                    previousMonth: 0,
                    change: 0
                });
              } else {
                  setError('Error fetching contracts');
                  console.error('Error fetching contracts:', err);
              }
          }
      };

      fetchContracts();
    }, []);

// Function to calculate the percentage change
const calculateChange = (prevValue, currentValue) => {
  if (typeof prevValue !== 'number' || typeof currentValue !== 'number') {
    throw new Error("Both prevValue and currentValue must be numbers.");
  }

  if (prevValue === 0) {
    if (currentValue === 0) {
      return 0;
    }
    return currentValue;
  }

  return ((currentValue - prevValue) / prevValue) * 100;
};

  useEffect(()=>{
    console.log('User data updated:', blogData);
  }, [blogData]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <>
      <OverViewLayout {...blogData } budgetSpent ={budgetSpent} />
      <EngagementGrowth blogs = { blogsInfo } />
      <Engagement {...totals} blogs={blogsInfo} />
      <Brands contracts={brandContracts} />
      <Spendings contracts={brandContracts} budgetSpent={budgetSpent} />
    </>
  );
};

const OverViewLayout = ({ shares, likes, comments, engagement_Rate, reach, budgetSpent, sharesPercent, likesPercent, commentsPercent, engagementChange, visistsChange }) => {
  const getStatus = (percent) => {
    return percent >= 0 ? 1 : 0;
  };

  return (
    <div className="bg-white w-full mt-10 rounded-3xl">
      <div className="px-5 py-3 flex flex-col">
        <p className="lato-bold">OverView</p>
        <div className="mt-6">
          <div className="mt-2 grid xs:grid-cols-2 xs:grid-rows-3  md:grid-cols-3 md:grid-rows-2 gap-y-5">
            <Card
              Heading="Reach"
              totalNumbers={shares}
              Percentage={sharesPercent}
              time="LastMonth"
              Status={getStatus(sharesPercent)}
            />
            <Card
              Heading="Likes"
              totalNumbers={likes}
              Percentage={likesPercent}
              time="LastMonth"
              Status={getStatus(likesPercent)}
            />
            <Card
              Heading="Comments"
              totalNumbers={comments}
              Percentage={commentsPercent}
              time="LastMonth"
              Status={getStatus(commentsPercent)}
            />
            <CardWithImage
              Heading="Visits"
              totalNumbers={reach}
              Percentage={visistsChange}
              time="LastMonth"
              ImageSource="card1.png"
            />
            <Card
              Heading="Engagement Rate"
              totalNumbers={engagement_Rate}
              Percentage={engagementChange}
              time="LastMonth"
              Status={getStatus(engagementChange)}
            />
            <CardWithImage
              Heading="Budget Spent"
              totalNumbers={budgetSpent.currentMonth}
              Percentage={budgetSpent.change}
              time="LastMonth"
              ImageSource="card2.png"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverView;