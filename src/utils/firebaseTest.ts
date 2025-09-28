import { auth, db } from "@/lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export const testFirebaseConnection = async () => {
  try {
    console.log("Testing Firebase connection...");

    // Check authentication
    const currentUser = auth.currentUser;
    console.log("Current user:", currentUser?.uid, currentUser?.email);

    if (!currentUser) {
      console.error("No authenticated user found!");
      return false;
    }

    // Test reading interviewers collection
    console.log("Testing read operation...");
    const interviewersQuery = await getDocs(collection(db, "interviewers"));
    console.log("Successfully read interviewers collection. Count:", interviewersQuery.size);

    // Test writing to interviewers collection
    console.log("Testing write operation...");
    const testData = {
      userId: currentUser.uid,
      fullName: "Test User",
      contactNumber: "1234567890",
      companyEmail: "test@company.com",
      experience: 5,
      linkedinProfile: "https://linkedin.com/in/test",
      currentCompany: "Test Company",
      rate: 50,
      availability: {
        dates: ["2024-01-01"],
        timeSlots: ["9:00 AM"]
      },
      profilePicture: "",
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "interviewers"), testData);
    console.log("Successfully created test document with ID:", docRef.id);

    return true;
  } catch (error) {
    console.error("Firebase test failed:", error);
    return false;
  }
};

export const testBookingCreation = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("No authenticated user for booking test!");
      return false;
    }

    console.log("Testing booking creation...");
    const testBookingData = {
      interviewerId: "test-interviewer-id",
      interviewerDocId: "test-doc-id",
      interviewerName: "Test Interviewer",
      interviewerEmail: "interviewer@company.com",
      userId: currentUser.uid,
      clientEmail: currentUser.email,
      clientName: currentUser.displayName || "Test Client",
      date: "2024-01-01",
      timeSlot: "9:00 AM",
      rate: 50,
      notes: "Test booking",
      status: "scheduled",
      createdAt: new Date().toISOString(),
      meetingLink: ""
    };

    console.log("Booking data:", testBookingData);
    const docRef = await addDoc(collection(db, "bookings"), testBookingData);
    console.log("Successfully created test booking with ID:", docRef.id);

    return true;
  } catch (error) {
    console.error("Booking test failed:", error);
    return false;
  }
};