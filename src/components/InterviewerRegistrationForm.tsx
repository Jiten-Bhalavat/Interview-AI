import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, Clock, DollarSign, CheckCircle, X, CalendarDays, MapPin, User, Building, Phone, Mail, LinkedinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM"
];

const formSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
  companyEmail: z.string().email("Invalid email").refine((email) => {
    const domain = email.split('@')[1];
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    return !commonDomains.includes(domain);
  }, "Company email required (no Gmail, Yahoo, etc.)"),
  experience: z.number().min(1, "Experience must be at least 1 year").max(50, "Experience cannot exceed 50 years"),
  linkedinProfile: z.string().url("Invalid LinkedIn URL").refine((url) => {
    return url.includes('linkedin.com');
  }, "Must be a valid LinkedIn profile URL"),
  currentCompany: z.string().min(2, "Company name must be at least 2 characters"),
  rate: z.number().min(10, "Rate must be at least $10").max(500, "Rate cannot exceed $500"),
  profilePicture: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

interface InterviewerRegistrationFormProps {
  onSuccess: () => void;
  editMode?: boolean;
  existingData?: any;
}

const InterviewerRegistrationForm = ({ onSuccess, editMode = false, existingData }: InterviewerRegistrationFormProps) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [existingRegistration, setExistingRegistration] = useState<boolean>(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: existingData?.profile?.fullName || "",
      contactNumber: existingData?.profile?.contactNumber || "",
      companyEmail: existingData?.profile?.companyEmail || "",
      experience: existingData?.interviewerProfile?.experience || 1,
      linkedinProfile: existingData?.profile?.linkedinProfile || "",
      currentCompany: existingData?.profile?.currentCompany || "",
      rate: existingData?.interviewerProfile?.rate || 50,
      profilePicture: existingData?.profile?.profilePicture || ""
    }
  });

  // Load existing data if in edit mode
  useEffect(() => {
    if (editMode && existingData) {
      // Set dates
      if (existingData.interviewerProfile?.availability?.dates) {
        const dates = existingData.interviewerProfile.availability.dates.map((dateStr: string) => new Date(dateStr));
        setSelectedDates(dates);
      }

      // Set time slots
      if (existingData.interviewerProfile?.availability?.timeSlots) {
        setSelectedTimeSlots(existingData.interviewerProfile.availability.timeSlots);
      }

      // Set profile image
      if (existingData.profile?.profilePicture) {
        setProfileImageUrl(existingData.profile.profilePicture);
      }
    }
  }, [editMode, existingData]);

  // Check if user already has a registration (only if not in edit mode)
  useEffect(() => {
    if (editMode) return; // Skip check in edit mode

    const checkExistingRegistration = async () => {
      if (!currentUser) return;

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data()?.interviewerProfile) {
          setExistingRegistration(true);
        }
      } catch (error) {
        console.error("Error checking existing registration:", error);
        // Skip the check if offline, allow registration to proceed
      }
    };

    checkExistingRegistration();
  }, [currentUser, editMode]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const isSelected = selectedDates.some(d => d.toDateString() === date.toDateString());

    if (isSelected) {
      const newDates = selectedDates.filter(d => d.toDateString() !== date.toDateString());
      setSelectedDates(newDates);
    } else {
      const newDates = [...selectedDates, date];
      setSelectedDates(newDates);
    }
  };

  const handleTimeSlotToggle = (timeSlot: string) => {
    const isSelected = selectedTimeSlots.includes(timeSlot);

    if (isSelected) {
      const newSlots = selectedTimeSlots.filter(slot => slot !== timeSlot);
      setSelectedTimeSlots(newSlots);
    } else {
      const newSlots = [...selectedTimeSlots, timeSlot];
      setSelectedTimeSlots(newSlots);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to register as an interviewer",
        variant: "destructive"
      });
      return;
    }

    // Check if user is fully authenticated
    if (!currentUser.uid || !currentUser.email) {
      toast({
        title: "Error",
        description: "Authentication incomplete. Please sign out and sign in again.",
        variant: "destructive"
      });
      return;
    }

    if (selectedDates.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one available date",
        variant: "destructive"
      });
      return;
    }

    if (selectedTimeSlots.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one time slot",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Starting interviewer registration...");

      // Create user profile structure
      const userDocRef = doc(db, "users", currentUser.uid);

      const userProfileData = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: data.fullName,
        profile: {
          fullName: data.fullName,
          contactNumber: data.contactNumber,
          companyEmail: data.companyEmail,
          currentCompany: data.currentCompany,
          linkedinProfile: data.linkedinProfile,
          profilePicture: profileImageUrl || currentUser.photoURL || "",
          lastUpdated: new Date().toISOString()
        },
        interviewerProfile: {
          userId: currentUser.uid,
          experience: data.experience,
          rate: data.rate,
          availability: {
            dates: selectedDates.map(date => format(date, "yyyy-MM-dd")),
            timeSlots: selectedTimeSlots
          },
          isActive: true,
          createdAt: new Date().toISOString()
        }
      };

      console.log("Creating user profile with data:", userProfileData);
      console.log("User authentication state:", {
        uid: currentUser.uid,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified
      });

      await setDoc(userDocRef, userProfileData, { merge: true });

      console.log("Successfully created interviewer profile for user:", currentUser.uid);

      toast({
        title: editMode ? "Profile Updated! 🎉" : "Registration Successful! 🎉",
        description: editMode
          ? "Your interviewer profile has been updated successfully."
          : "You have been registered as an interviewer. You'll now appear in the community.",
      });

      // No delay needed since we're using direct document writes
      onSuccess();
    } catch (error: any) {
      console.error("Error registering interviewer:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      let errorMessage = "Failed to register as interviewer. Please try again.";

      if (error.code === 'permission-denied') {
        errorMessage = "Permission denied. Please ensure you're properly authenticated and try signing out and back in.";
      } else if (error.code === 'invalid-argument') {
        errorMessage = "Invalid data provided. Please check all fields.";
      } else if (error.code === 'unauthenticated') {
        errorMessage = "Authentication required. Please sign out and sign in again.";
      } else if (error.code === 'failed-precondition') {
        errorMessage = "Database operation failed. Please try again in a moment.";
      } else if (error.message) {
        errorMessage = `Registration failed: ${error.message}`;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (existingRegistration && !editMode) {
    return (
      <Card className="max-w-md mx-auto text-center">
        <CardContent className="pt-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Already Registered!</h3>
          <p className="text-muted-foreground mb-4">
            You're already registered as an interviewer in our community.
          </p>
          <Button onClick={onSuccess} className="w-full">
            Back to Community
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <User className="w-6 h-6 mr-3 text-blue-500" />
            {editMode ? "Edit Interviewer Profile" : "Become an Interviewer"}
          </CardTitle>
          <p className="text-muted-foreground">
            {editMode
              ? "Update your interviewer profile information, availability, and rates."
              : "Join our community of experienced professionals and help others prepare for their dream jobs. Share your expertise and earn money by conducting mock interviews."
            }
          </p>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Full Name *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} className="h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        Contact Number *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} className="h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="companyEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Company Email *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@company.com" type="email" {...field} className="h-12" />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">Only company emails allowed (no Gmail, Yahoo, etc.)</p>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Building className="w-5 h-5 mr-2" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Building className="w-4 h-4 mr-2" />
                        Current Company *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Google, Microsoft, etc." {...field} className="h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Years of Experience *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="50"
                          placeholder="5"
                          className="h-12"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="linkedinProfile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <LinkedinIcon className="w-4 h-4 mr-2" />
                      LinkedIn Profile URL *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/yourprofile" {...field} className="h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Rate for 30min Interview (USD) *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="number"
                          min="10"
                          max="500"
                          placeholder="50"
                          className="pl-12 h-12 text-lg font-semibold"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 50)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">Set your rate between $10 - $500 for a 30-minute session</p>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <CalendarDays className="w-5 h-5 mr-2" />
                Availability
              </CardTitle>
              <p className="text-sm text-muted-foreground">Select the dates and times when you're available for interviews</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Selection */}
              <div>
                <Label className="text-base font-medium mb-3 block">Available Dates *</Label>
                <Card className="p-4">
                  <CalendarComponent
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => {
                      if (dates) {
                        setSelectedDates(Array.isArray(dates) ? dates : [dates]);
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border-0"
                  />
                  {selectedDates.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-sm font-medium">Selected Dates ({selectedDates.length}):</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedDates.map((date, index) => (
                          <Badge key={index} variant="secondary" className="px-3 py-1">
                            {format(date, "MMM dd, yyyy")}
                            <X
                              className="w-3 h-3 ml-2 cursor-pointer"
                              onClick={() => handleDateSelect(date)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Time Slots */}
              <div>
                <Label className="text-base font-medium mb-3 block">Available Time Slots *</Label>
                <Card className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {timeSlots.map((timeSlot) => (
                      <div
                        key={timeSlot}
                        className={cn(
                          "flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all",
                          selectedTimeSlots.includes(timeSlot)
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        onClick={() => handleTimeSlotToggle(timeSlot)}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="font-medium">{timeSlot}</span>
                      </div>
                    ))}
                  </div>
                  {selectedTimeSlots.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-sm font-medium">Selected Time Slots ({selectedTimeSlots.length}):</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedTimeSlots.map((slot) => (
                          <Badge key={slot} variant="secondary" className="px-3 py-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {slot}
                            <X
                              className="w-3 h-3 ml-2 cursor-pointer"
                              onClick={() => handleTimeSlotToggle(slot)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold"
                disabled={loading}
                size="lg"
              >
                {loading
                  ? (editMode ? "Updating Profile..." : "Creating Your Profile...")
                  : (editMode ? "Update Profile 🚀" : "Join as Interviewer 🚀")
                }
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                By registering, you agree to conduct professional and helpful interviews
              </p>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default InterviewerRegistrationForm;