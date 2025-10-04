import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

const Register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "ALL fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    const newProfile = new Profile({ userId: newUser._id });
    await newProfile.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await User.findByIdAndUpdate(user._id, { token });
    return res.json({ token });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const token = req.body.token;

    const user = await User.findOne({ token });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.profilePicture = req.file.filename;
    await user.save();

    res.status(200).json({ message: "Profile picture uploaded successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

const updateUserProfile = async (req, res) => {

  try {

    const {token, ...newData} = req.body;

    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const {username, email} = newData;

    const existingUser = await User.findOne({ $or: [ { username }, { email } ]});

    if(existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({ message: "Username or Email already in use" });
    }

    Object.assign(user, newData);

    await user.save();
    res.status(200).json({ message: "Profile updated successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });  
  }

}

const getUserAndProfile = async (req, res) => {

  try {

    const { token } = req.query;
    console.log(token);
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile = await Profile.findOne({ userId: user._id }).populate('userId', 'name email username profilePicture');

    res.status(200).json({ user, profile });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }


}

const updateProfileData = async (req, res) => {

  try {
    const { token, ...newProfileData } = req.body;

    const user = await User.findOne({ token });
    const userProfile = await Profile.findOne({ userId: user._id });

    if (!userProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    Object.assign(userProfile, newProfileData);
    await userProfile.save();

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }

}

const getAllUserProfiles = async (req, res) => {

  try {
    const profiles = await Profile.find().populate('userId', 'name email username profilePicture');
    res.status(200).json({ profiles });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }

}

const addMedicineToProfile = async (req, res) => {

  try {
    const { token, medicine } = req.body;

    const user = await User.findOne({ token });
    const userProfile = await Profile.findOne({ userId: user._id });

    if (!userProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    
    userProfile.medicines.push(medicine);
    res.status(200).json( {message : "medicine added successfully."});

  }catch {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

const removeMedicineFromProfile = async (req, res) => {

  try {
    const { token, medicine } = req.body;

    const user = await User.findOne({ token });
    const userProfile = await Profile.findOne({ userId: user._id });

    if (!userProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    
    const meds = userProfile.medicines;
    meds = meds.filter(item => item !== medicine); 
    res.status(200).json( {message : "medicine removed successfully."});

  }catch {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}


export { Register, Login , uploadProfilePicture, updateUserProfile, getUserAndProfile, updateProfileData, getAllUserProfiles };
