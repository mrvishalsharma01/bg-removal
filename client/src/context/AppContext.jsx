import { createContext, useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const [credit, setCredit] = useState(0); // default credit
  const [image, setImage] = useState(false);
  const [resultImage, setResultImage] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  const { getToken } = useAuth();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  // Load user's current credit from backend
  const loadCreditsData = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.warn("No token from Clerk.");
        return;
      }

      const { data } = await axios.get(backendUrl + "/api/user/credits", {
        headers: { token },
      });

      if (data.success) {
        setCredit(data.credits);
      } else {
        toast.error("Failed to load credits.");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error.message || "Error loading credits"
      );
    }
  };

  // Upload image and remove background
  const removeBg = async (image) => {
    try {
      if (!isSignedIn) {
        return openSignIn();
      }

      if (!image) {
        toast.error("Please upload a valid image.");
        return;
      }

      setImage(image);
      setResultImage(false);
      navigate("/result");

      const token = await getToken();
      const formData = new FormData();
      image && formData.append("image", image)

      const { data } = await axios.post(backendUrl + "/api/image/remove-bg", formData, {
        headers: {
          token
        }
      }
      );

      if (data.success) {
        setResultImage(data.resultImage);
        data.creditBalance && setCredit(data.creditBalance);
      } else {
        toast.error(data.message);
        data.creditBalance && setCredit(data.creditBalance);
        if (data.creditBalance === 0) {
          navigate('/buy');
        }
      }
    } catch (error) {
      //console.log("removeBg error:", error);
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  const value = {
    credit,
    setCredit,
    loadCreditsData,
    backendUrl,
    image,
    setImage,
    removeBg,
    resultImage,
    setResultImage,
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
