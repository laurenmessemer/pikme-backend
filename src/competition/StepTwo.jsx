import axios from "axios";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import SubmissionCard from "../components/Cards/SubmissionCard";
import UploadImage from "../components/Cards/UploadImage";
import { useCompetition } from "../context/CompetitionContext";
import { useAuth } from "../context/UseAuth";
import "../styles/competition/StepTwo.css";

const StepTwo = ({ nextStep }) => {
  const { contestId, imageUrl, setImageUrl, imageFile, setImageFile, setMatchType } = useCompetition();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOpponent, setSelectedOpponent] = useState("pick_random");
  const [fileKey, setFileKey] = useState(null); // ✅ State to store file key
  const { user } = useAuth(); // Get user details from context
  const userId = user?.id; // Retrieve the user ID

  useEffect(() => {
    if (!contestId) {
      setError("Contest ID is missing.");
      setLoading(false);
      return;
    }

    const fetchContestDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5004/api/contests/${contestId}`);
        setContest(response.data);
      } catch (err) {
        console.error("❌ Error fetching contest details:", err);
        setError("Failed to load contest details.");
      } finally {
        setLoading(false);
      }
    };

    fetchContestDetails();
  }, [contestId]);

  // ✅ Handle image upload with pre-signed URL
  const handleUpload = async (file) => {
    if (!file) return;
    
    setImageFile(file);
    
    try {
      // ✅ Step 1: Request pre-signed URL from backend
      const response = await axios.get(`http://localhost:5004/api/competition-entry/get-upload-url`, {
        params: { 
          user_id: userId,  // Replace with actual user ID from context
          contest_id: contestId,
          match_type: selectedOpponent,
          fileType: file.type
        },
      });
  
      const { uploadURL, fileKey, pendingEntryId } = response.data;
      console.log("✅ Pre-signed URL received:", uploadURL);
  
      // ✅ Step 2: Upload file to S3
      await axios.put(uploadURL, file, {
        headers: { "Content-Type": file.type },
      });
  
      // ✅ Step 3: Get the final image URL
      const imageUrl = uploadURL.split("?")[0]; // Remove query parameters
      setImageUrl(imageUrl);
      setFileKey(fileKey);
      setMatchType(selectedOpponent);
      console.log("✅ Image uploaded successfully!", imageUrl, "File Key:", fileKey);
  
      // ✅ Step 4: Send the final image URL to the backend
      console.log("📡 Sending Image URL to Backend:", { pendingEntryId, imageUrl });
  
      const updateResponse = await axios.post("http://localhost:5004/api/competition-entry/update-image", {
        pendingEntryId,  // Pass the pending entry ID
        imageUrl,
      });
  
      console.log("✅ Backend response:", updateResponse.data);
  
    } catch (error) {
      console.error("❌ Upload failed:", error);
    }
  };
  
  

  // ✅ Handle submission (moves to StepThree with image data)
  const handleSubmit = () => {
    if (!imageFile) {
      alert("Please upload an image before proceeding.");
      return;
    }
    nextStep({ imageUrl, imageFile, matchType: selectedOpponent, fileKey });
  };

  if (loading) return <p>Loading contest details...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="step-two-container flex">
      <SubmissionCard
        contestId={contest?.id}
        contestTitle={contest?.Theme?.name || "Contest Title"}
        contestDescription={contest?.Theme?.description || "No description available"}
        entryFee={contest?.entry_fee || 0}
        selectedOpponent={selectedOpponent}
        onOpponentSelect={setSelectedOpponent}
        onSubmit={handleSubmit}
      />
      {imageUrl ? (
        <div className="uploaded-image-container">
          <img src={imageUrl} alt="Uploaded Preview" className="uploaded-image" />
        </div>
      ) : (
        <UploadImage onUpload={handleUpload} />
      )}
    </div>
  );
};

StepTwo.propTypes = {
  nextStep: PropTypes.func.isRequired,
};

export default StepTwo;
