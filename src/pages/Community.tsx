import { useState, useEffect } from "react";
import { Users, Plus, Calendar, MapPin, Star, DollarSign, Search, SortAsc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserProfile from "@/components/UserProfile";
import Sidebar from "@/components/Sidebar";
import InterviewerRegistrationForm from "@/components/InterviewerRegistrationForm";
import BookingDialog from "@/components/BookingDialog";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { testFirebaseConnection, testBookingCreation } from "@/utils/firebaseTest";

interface Interviewer {
  userId: string;
  profile: {
    fullName: string;
    contactNumber: string;
    companyEmail: string;
    currentCompany: string;
    linkedinProfile: string;
    profilePicture?: string;
  };
  interviewerProfile: {
    experience: number;
    rate: number;
    availability: {
      dates: string[];
      timeSlots: string[];
    };
    isActive: boolean;
    createdAt: string;
  };
}

const Community = () => {
  const { currentUser, userProfile } = useAuth();
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [filteredInterviewers, setFilteredInterviewers] = useState<Interviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [selectedInterviewer, setSelectedInterviewer] = useState<Interviewer | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [editMode, setEditMode] = useState(false);
  const [editingInterviewer, setEditingInterviewer] = useState<Interviewer | null>(null);

  const fetchInterviewers = async () => {
    setLoading(true);
    try {
      console.log("Starting to fetch interviewers from users collection...");

      // Get all users who have an interviewerProfile
      const usersSnapshot = await getDocs(collection(db, "users"));
      const interviewersData: Interviewer[] = [];

      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        if (userData.interviewerProfile && userData.profile) {
          interviewersData.push({
            userId: doc.id,
            profile: userData.profile,
            interviewerProfile: userData.interviewerProfile
          });
        }
      });

      // Sort by createdAt in memory
      interviewersData.sort((a, b) =>
        new Date(b.interviewerProfile.createdAt).getTime() - new Date(a.interviewerProfile.createdAt).getTime()
      );

      console.log("Fetched interviewers:", interviewersData.length);
      setInterviewers(interviewersData);
      setFilteredInterviewers(interviewersData);
    } catch (error) {
      console.error("Error fetching interviewers:", error);
      // Handle the error gracefully
      setInterviewers([]);
      setFilteredInterviewers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviewers();
  }, []);

  // Filter and sort interviewers
  useEffect(() => {
    let filtered = [...interviewers];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(interviewer =>
        interviewer.profile.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        interviewer.profile.currentCompany.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "experience-high":
        filtered.sort((a, b) => b.interviewerProfile.experience - a.interviewerProfile.experience);
        break;
      case "experience-low":
        filtered.sort((a, b) => a.interviewerProfile.experience - b.interviewerProfile.experience);
        break;
      case "rate-high":
        filtered.sort((a, b) => b.interviewerProfile.rate - a.interviewerProfile.rate);
        break;
      case "rate-low":
        filtered.sort((a, b) => a.interviewerProfile.rate - b.interviewerProfile.rate);
        break;
      case "newest":
      default:
        filtered.sort((a, b) =>
          new Date(b.interviewerProfile.createdAt).getTime() - new Date(a.interviewerProfile.createdAt).getTime()
        );
        break;
    }

    setFilteredInterviewers(filtered);
  }, [interviewers, searchQuery, sortBy]);

  const handleRegistrationSuccess = () => {
    setRegistrationOpen(false);
    setEditMode(false);
    setEditingInterviewer(null);
    // Force a refresh of the interviewers list immediately
    console.log("Registration successful, refreshing interviewers list...");
    fetchInterviewers();
  };

  const handleBookInterview = (interviewer: Interviewer) => {
    setSelectedInterviewer(interviewer);
    setBookingOpen(true);
  };

  const handleBookingSuccess = () => {
    setBookingOpen(false);
    setSelectedInterviewer(null);
  };

  const handleEditProfile = (interviewer: Interviewer) => {
    setEditingInterviewer(interviewer);
    setEditMode(true);
    setRegistrationOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">Community</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  console.log("=== Firebase Connection Test ===");
                  await testFirebaseConnection();
                  await testBookingCreation();
                }}
              >
                Test Firebase
              </Button>
              <UserProfile size="md" />
            </div>
          </div>
        </nav>

        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Interview Community 🤝</h2>
                <p className="text-muted-foreground">
                  Connect with experienced professionals who can conduct mock interviews
                </p>
              </div>
              <Dialog open={registrationOpen} onOpenChange={(open) => {
                setRegistrationOpen(open);
                if (!open) {
                  setEditMode(false);
                  setEditingInterviewer(null);
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Become an Interviewer</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="sr-only">
                      {editMode ? "Edit Interviewer Profile" : "Register as an Interviewer"}
                    </DialogTitle>
                  </DialogHeader>
                  <InterviewerRegistrationForm
                    onSuccess={handleRegistrationSuccess}
                    editMode={editMode}
                    existingData={editingInterviewer}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <SortAsc className="w-4 h-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="experience-high">Experience (High to Low)</SelectItem>
                  <SelectItem value="experience-low">Experience (Low to High)</SelectItem>
                  <SelectItem value="rate-high">Rate (High to Low)</SelectItem>
                  <SelectItem value="rate-low">Rate (Low to High)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <Card className="text-center p-12">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full animate-pulse"></div>
                <CardTitle className="text-xl">Loading Interviewers...</CardTitle>
                <CardDescription>
                  Finding available professionals in our community
                </CardDescription>
              </CardContent>
            </Card>
          ) : filteredInterviewers.length === 0 && interviewers.length > 0 ? (
            <Card className="text-center p-12">
              <CardContent className="space-y-4">
                <Search className="w-16 h-16 mx-auto text-muted-foreground" />
                <CardTitle className="text-xl">No Results Found</CardTitle>
                <CardDescription className="text-base">
                  No interviewers match your search criteria. Try adjusting your search or filters.
                </CardDescription>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSortBy("newest");
                  }}
                >
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          ) : interviewers.length === 0 ? (
            <Card className="text-center p-12">
              <CardContent className="space-y-4">
                <Users className="w-16 h-16 mx-auto text-muted-foreground" />
                <CardTitle className="text-xl">No Interviewers Found</CardTitle>
                <CardDescription className="text-base">
                  Be the first to join our community of interviewers and help others prepare for their dream jobs!
                </CardDescription>
                <Dialog open={registrationOpen} onOpenChange={setRegistrationOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Register as Interviewer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="sr-only">Register as an Interviewer</DialogTitle>
                    </DialogHeader>
                    <InterviewerRegistrationForm onSuccess={handleRegistrationSuccess} />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInterviewers.map((interviewer) => (
                <Card key={interviewer.userId} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          {interviewer.profile.profilePicture && (
                            <AvatarImage src={interviewer.profile.profilePicture} alt={interviewer.profile.fullName} />
                          )}
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                            {getInitials(interviewer.profile.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{interviewer.profile.fullName}</CardTitle>
                          <CardDescription className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {interviewer.profile.currentCompany}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {interviewer.interviewerProfile.experience}+ years
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-green-600">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span className="font-semibold">${interviewer.interviewerProfile.rate}/30min</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Available</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          window.open(interviewer.profile.linkedinProfile, '_blank');
                        }}
                        variant="outline"
                      >
                        View Profile
                      </Button>
                      {currentUser && interviewer.userId !== currentUser.uid ? (
                        <Button
                          className="flex-1"
                          onClick={() => handleBookInterview(interviewer)}
                        >
                          Book Interview
                        </Button>
                      ) : (
                        <Button
                          className="flex-1"
                          onClick={() => handleEditProfile(interviewer)}
                          variant="outline"
                        >
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Booking Dialog */}
          {selectedInterviewer && (
            <BookingDialog
              interviewer={selectedInterviewer}
              open={bookingOpen}
              onOpenChange={setBookingOpen}
              onBookingSuccess={handleBookingSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Community;