import express from "express";
import Medicine from "../models/medicineModel.js";
import auth from "../middleware/auth.js"; // Assuming your auth middleware is here

const router = express.Router();

// @desc    Add a new medicine
// @route   POST /api/medicines/add
// @access  Private
router.post("/add", auth, async (req, res) => {
    try {
        const { name, dosage, times, email, startDate, endDate } = req.body;

        // Basic validation
        if (!name || !dosage || !times || !startDate || !endDate) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }
        
        const medicine = new Medicine({
            userId: req.user.id, // Set from the 'auth' middleware
            name,
            dosage,
            times,
            email,
            startDate,
            endDate,
        });

        const newMedicine = await medicine.save();
        res.status(201).json(newMedicine); // Return the newly created medicine

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error adding medicine" });
    }
});

// @desc    Get all medicines for the logged-in user
// @route   GET /api/medicines/list (or POST)
// @access  Private
router.post("/list", auth, async (req, res) => {
    try {
        const medicines = await Medicine.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(medicines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching medicines" });
    }
});

// @desc    Update a medicine
// @route   PUT /api/medicines/:id
// @access  Private
router.put("/:id", auth, async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({ message: "Medicine not found" });
        }

        if (medicine.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: "User not authorized" });
        }

        const { name, dosage, times, email, startDate, endDate } = req.body;

        medicine.name = name || medicine.name;
        medicine.dosage = dosage || medicine.dosage;
        medicine.times = times || medicine.times;
        medicine.email = email || medicine.email;
        medicine.startDate = startDate || medicine.startDate;
        medicine.endDate = endDate || medicine.endDate;

        const updatedMedicine = await medicine.save();
        res.json(updatedMedicine);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});


// @desc    Delete a medicine
// @route   DELETE /api/medicines/:id
// @access  Private
router.delete("/:id", auth, async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({ message: "Medicine not found" });
        }
        if (medicine.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized" });
        }

        await medicine.deleteOne(); // Replaced with a Mongoose 7+ compatible method
        res.json({ message: "Medicine deleted" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error deleting medicine" });
    }
});

export default router;