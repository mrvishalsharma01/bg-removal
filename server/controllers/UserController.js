// // API controller function to manage clerk user with database
// // httm:localhost:4000/api/user/webhooks

// import { Webhook } from "svix"
// import userModel from "../models/userModel.js"

// const clerkWebhooks = async (req,res)=>{
//        try {
//       //create a svix instance with clerk webhooks scret
//       const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)

//       await whook.verify(JSON.stringify(req.body),{
//         "svix-id":req.headers["svix-id"],
//         "svix-timestamp":req.headers["svix-timestamp"],
//         "svix-signature":req.headers["svix-signature"]
//       })
      
//       const {data,type} = req.body

//       switch (type) {
//         case "user.created":{
//           const userData = {
//             clerkId: data.id,
//             email: data.email_addresses[0].email_address,
//             firstName : data.first_name,
//             lastName : data.last_name,
//             photo : data.image_url
//           }
//           await userModel.create(userData)
//           res.json({})
//           break;
//         }

//         case "user.updated":{

//           const userData = {

//             email: data.email_addresses[0].email_address,
//             firstName : data.first_name,
//             lastName : data.last_name,
//             photo : data.image_url
//           }

//           await userModel.findOneAndUpdate({clerkId:data.id},userData)
//           res.json({})

//           break;
//         }

//         case "user.deleted":{

//           await userModel.findOneAndDelete({clerkId:data.id})
//           res.json({})
//           break;
//         }
          
      
//         default:
//           break;
//       }
      
//       } catch (error) {
//         console.log(error.message)
//         res.json({success:false,message:error.message})
        
//        }
// }

// export {clerkWebhooks}

import { Webhook } from "svix";
import userModel from "../models/userModel.js";

const clerkWebhooks = async (req, res) => {
  try {
    // Create svix instance with Clerk webhook secret
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = req.body;

    console.log("📩 Clerk Webhook Received:", type);

    switch (type) {
      case "user.created": {
        const userData = {
          clerkId: data.id, // ✅ Corrected key
          email: data.email_addresses[0].email_address,
          firstName: data.first_name,
          lastName: data.last_name,
          photo: data.image_url,
        };

        console.log("🆕 Creating User:", userData);

        await userModel.create(userData);
        return res.status(200).json({ success: true });
      }

      case "user.updated": {
        const userData = {
          email: data.email_addresses[0].email_address,
          firstName: data.first_name,
          lastName: data.last_name,
          photo: data.image_url,
        };

        console.log("🔁 Updating User:", userData);

        await userModel.findOneAndUpdate({ clerkId: data.id }, userData);
        return res.status(200).json({ success: true });
      }

      case "user.deleted": {
        console.log("❌ Deleting User with clerkId:", data.id);

        await userModel.findOneAndDelete({ clerkId: data.id });
        return res.status(200).json({ success: true });
      }

      default:
        console.log("ℹ️ Unhandled Clerk Event:", type);
        return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error("❌ Webhook Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export { clerkWebhooks };
