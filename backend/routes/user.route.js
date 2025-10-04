import {Router } from 'express';
import {Register, Login, uploadProfilePicture, updateUserProfile, getUserAndProfile, updateProfileData, getAllUserProfiles} from '../controllers/user.controller.js';

const router = Router();

router.route('/upload-profile-picture').post(uploadProfilePicture);
router.route('/register').post(Register);
router.route('/login').post(Login);
router.route('/user_update').post(updateUserProfile);
router.route('/get_user_and_profile').get(getUserAndProfile);
router.route('/update_profile_data').post(updateProfileData);
router.route('/all_user_profiles').get(getAllUserProfiles);

export default router;