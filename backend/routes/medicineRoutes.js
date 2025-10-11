import express from "express";
import mongoose from "mongoose";
import Medicine from "../models/medicineModel.js";
import Adherence from "../models/Adherence.js";
import auth from "../middleware/auth.js"; 

const router = express.Router();

// --- ROUTE FOR ADDING, UPDATING, DELETING MEDICINES ---

// @desc    Add a new medicine
// @route   POST /api/medicines/add
// @access  Private
router.post("/add", auth, async (req, res) => {
    try {
        const { name, dosage, times, email, startDate, endDate } = req.body;

        if (!name || !dosage || !times || !startDate || !endDate) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }
        
        const medicine = new Medicine({
            userId: req.user.id,
            name,
            dosage,
            times,
            email,
            startDate,
            endDate,
        });

        const newMedicine = await medicine.save();
        res.status(201).json(newMedicine);

    } catch (error) {
        console.error("Error in POST /api/medicines/add:", error);
        res.status(500).json({ message: "Error adding medicine" });
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
        console.error("Error in PUT /api/medicines/:id:", error);
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

        // Delete the medicine and all associated adherence records
        await medicine.deleteOne(); 
        await Adherence.deleteMany({ medicineId: req.params.id });
        
        res.json({ message: "Medicine deleted" });

    } catch (err) {
        console.error("Error in DELETE /api/medicines/:id:", err);
        res.status(500).json({ message: "Error deleting medicine" });
    }
});


// --- ROUTE FOR DOSE STATUS UPDATE ---

// @desc    Record or update the status for a specific dose time on a specific day.
// @route   PUT /api/medicines/:id/dose-status
// @access  Private
router.put('/:id/dose-status', auth, async (req, res) => {
    try {
        const { date, time, status } = req.body;
        const medicineId = req.params.id;
        const userId = req.user.id;

        if (!date || !time || !status || !mongoose.Types.ObjectId.isValid(medicineId)) {
            return res.status(400).json({ message: "Missing required fields or invalid medicine ID." });
        }
        if (!['taken', 'missed'].includes(status)) {
            return res.status(400).json({ message: "Invalid status provided." });
        }

        const filter = {
            userId: userId,
            medicineId: medicineId,
            scheduledDate: date, // YYYY-MM-DD
            scheduledTime: time, 
        };

        const update = {
            $set: {
                status: status,
                recordedAt: new Date(),
            }
        };

        const doseRecord = await Adherence.findOneAndUpdate(
            filter,
            update,
            { new: true, upsert: true } // Upsert: Create if it doesn't exist
        );

        res.json({ message: 'Dose status updated successfully.', record: doseRecord });

    } catch (err) {
        console.error("Error in PUT /api/medicines/:id/dose-status:", err.message);
        res.status(500).send('Server Error during dose status update.');
    }
});

// --- ROUTE TO GET MEDICINES WITH DOSE STATUS ---

// @desc    Get all medicines for the logged-in user, joining Adherence status for the selected day
// @route   POST /api/medicines/list
// @access  Private
router.post("/list", auth, async (req, res) => {
    try {
        const { selectedDate } = req.body; 
        const userId = req.user.id;

        // 1. Fetch all medicine schedules for the user
        const medicines = await Medicine.find({ userId: userId }).sort({ createdAt: -1 }).lean();

        if (medicines.length === 0) {
            return res.json([]);
        }

        // 2. Fetch Adherence records relevant to the current view date
        const adherenceRecords = await Adherence.find({ 
            userId: userId,
            scheduledDate: selectedDate 
        }).lean();

        // 3. Map adherence records to a quick lookup object: Key: medicineId_scheduledTime
        const adherenceStatusMap = new Map();
        adherenceRecords.forEach(record => {
            const key = `${record.medicineId.toString()}_${record.scheduledTime}`;
            adherenceStatusMap.set(key, record.status);
        });

        // 4. Inject the adherence status into the medicine object
        const finalMedicines = medicines.map(med => {
            const medObj = { ...med };
            medObj.adherenceStatusMap = {}; 
            
            medObj.times.forEach(time => {
                const key = `${medObj._id.toString()}_${time}`;
                const status = adherenceStatusMap.get(key);
                
                if (status) {
                    // Create the key the frontend uses to look up status for a specific dose
                    const frontEndKey = `${medObj._id.toString()}_${selectedDate}_${time}`;
                    medObj.adherenceStatusMap[frontEndKey] = status;
                }
            });
            
            return medObj;
        });

        res.json(finalMedicines);

    } catch (error) {
        console.error("Error in POST /api/medicines/list:", error);
        res.status(500).json({ message: "Error fetching medicines" });
    }
});

export default router;