import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import userModel from "../models/userModel.js";

const removeBgImage = async (req, res) => {
  try {
    const { clerkId } = req.body

    const user = await userModel.findOne({ clerkId })
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.creditBalance === 0) {
      return res.json({
        success: false,
        message: "No credit balance",
        creditBalance: user.creditBalance,
      });
    }

    if (!req.file || !req.file.path) {
      return res.status(400).json({
        success: false,
        message: "No image file found in request",
      });
    }

    const imagePath = req.file.path; // ✅ CORRECT

    const imageFile = fs.createReadStream(imagePath);
    const formdata = new FormData();
    formdata.append("image_file", imageFile);

    const {data} = await axios.post(
      "https://clipdrop-api.co/remove-background/v1",
      formdata,
      {
        headers: {
          "x-api-key": process.env.CLIPDROP_API,
          ...formdata.getHeaders(), // ✅ Important for multipart upload
        },
        responseType: "arraybuffer",
      }
    );

    const base64Image = Buffer.from(data, "binary").toString("base64");
    const resultImage = `data:${req.file.minetype};base64,${base64Image}`

    // Decrease credit
    await userModel.findByIdAndUpdate(user._id,{creditBalance: user.creditBalance - 1})

    // ✅ Delete the uploaded file from server to free up space
    // fs.unlink(imagePath, () => {});

    res.json({
      success: true,
      resultImage,
      creditBalance: user.creditBalance - 1,
      message: "Background removed",
    });
  } catch (error) {
    console.error("removeBgImage error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export { removeBgImage };
