import jwt from "jsonwebtoken";

export default function (req, res, next) {
    // 1. Get the token from the Authorization header
    // The token is typically sent in the format: "Bearer <token>"
    const authHeader = req.header("Authorization");

    // Check if the header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        // Return 401 if the header is missing or improperly formatted
        return res.status(401).json({ msg: "No token, authorization denied." });
    }
    
    // Extract the token (removing "Bearer ")
    const token = authHeader.replace("Bearer ", "");

    // 2. Verify the token
    try {
        // This line checks if the token is valid and not expired
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the user information (e.g., user ID) from the payload to the request
        // The payload usually contains 'user: { id: ... }'
        req.user = decoded.user; 
        
        next();
    } catch (err) {
        // This catches errors like 'TokenExpiredError', 'JsonWebTokenError' (malformed)
        res.status(401).json({ msg: "Token is not valid or has expired." });
    }
}