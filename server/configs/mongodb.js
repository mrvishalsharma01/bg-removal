// import mongoose from "mongoose";

// const connectDB = async () => {

//   mongoose.connection.on('connected', ()=>{
//     console.log("Database connected")

//   })
 
//  await mongoose.connect(`${process.env.MONGODB_URI}/bg-removal`)

// }

// export default connectDB

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected successfully");
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err;
  }
};

export default connectDB;
