import mongoose from "mongoose";

const dashboardSchema = new mongoose.Schema({
    profileId : { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
})

const Dashboard = mongoose.model("Dashboard", dashboardSchema);

export default Dashboard;