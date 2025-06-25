import jwt from 'jsonwebtoken';

const authUser = async (req, res, next) => {
  try {
    const { token } = req.headers;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not Authorized. Login Again.' });
    }

    const token_decode = jwt.decode(token);

    if (!token_decode || !token_decode.clerkId) {
      return res.status(401).json({ success: false, message: 'Invalid Token. Login Again.' });
    }

    // ✅ FIX: ensure req.body exists
    if (!req.body) req.body = {};

    req.body.clerkId = token_decode.clerkId;

    next();
  } catch (error) {
    console.log("authUser Error:", error.message || error);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

export default authUser;
