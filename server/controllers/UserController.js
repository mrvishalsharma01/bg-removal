// userController.js
import { Webhook } from 'svix';
import userModel from "../models/userModel.js";

// ✅ Clerk Webhook Handler
const clerkWebhooks = async (req, res) => {
  try {
    // create svix instance with Clerk secret
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // verify webhook
    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"]
    });

    const { data, type } = req.body;

    switch (type) {

      case "user.created": {
        const userData = {
          clerkId: data.id,
          email: data.email_addresses[0].email_address,
          firstName: data.first_name,
          lastName: data.last_name,
          photo: data.image_url,
          creditBalance: 5, // ✅ optional default value on signup
        };
        await userModel.create(userData);
        return res.json({});
      }

      case "user.updated": {
        const updatedUserData = {
          email: data.email_addresses[0].email_address,
          firstName: data.first_name,
          lastName: data.last_name,
          photo: data.image_url,
        };
        await userModel.findOneAndUpdate({ clerkId: data.id }, updatedUserData);
        return res.json({});
      }

      case "user.deleted": {
        await userModel.findOneAndDelete({ clerkId: data.id });
        return res.json({});
      }

      default:
        return res.status(400).json({ message: "Unhandled event type" });
    }

  } catch (error) {
    console.log("Webhook Error:", error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ Get user credits using clerkId (middleware fills it)
const userCredits = async (req, res) => {
  try {
    const { clerkId } = req.body;
    // console.log("clerkId from req.body:", clerkId); 
    const userData = await userModel.findOne({ clerkId });
    // console.log("userData:", userData); 

    res.json({ success: true, credits: userData.creditBalance });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }

};

export { clerkWebhooks, userCredits };
