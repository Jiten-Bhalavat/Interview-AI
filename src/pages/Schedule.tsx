import { useState, useEffect } from "react";
import { Calendar, Clock, User, MapPin, DollarSign, ExternalLink, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import UserProfile from "@/components/UserProfile";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";

interface Booking {
  id: string;
  interviewerId: string;
  interviewerName: string;
  interviewerEmail: string;
  clientId: string;
  clientEmail: string;
  clientName: string;
  date: string;
  timeSlot: string;
  rate: number;
  notes: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
  meetingLink: string;
}

const Schedule = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    if (!currentUser) return;

    try {
      const q = query(
        collection(db, "bookings"),
        where("userId", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const bookingsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];

      // Sort by date in memory
      bookingsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setBookings(bookingsData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [currentUser]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const upcomingBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today && booking.status === "scheduled";
  });

  const pastBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate < today || booking.status !== "scheduled";
  });

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">Schedule</h1>
            </div>
            <div className="flex items-center space-x-4">
              <UserProfile size="md" />
            </div>
          </div>
        </nav>

        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Your Interview Schedule 📅</h2>
            <p className="text-muted-foreground">
              Manage your upcoming and past interview sessions
            </p>
          </div>

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-muted rounded-full"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <Card className="text-center p-12">
              <CardContent className="space-y-4">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground" />
                <CardTitle className="text-xl">No Interviews Scheduled</CardTitle>
                <CardDescription className="text-base">
                  Visit the Community page to book interviews with experienced professionals.
                </CardDescription>
                <Button asChild className="mt-4">
                  <a href="/community">Browse Interviewers</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Upcoming Interviews */}
              {upcomingBookings.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Upcoming Interviews ({upcomingBookings.length})
                  </h3>
                  <div className="grid gap-4">
                    {upcomingBookings.map((booking) => (
                      <Card key={booking.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                                  {getInitials(booking.interviewerName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg">{booking.interviewerName}</CardTitle>
                                <CardDescription className="flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  Interviewer
                                </CardDescription>
                              </div>
                            </div>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>{format(new Date(booking.date), 'EEEE, MMM dd, yyyy')}</span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <Clock className="w-4 h-4 mr-2" />
                              <span>{booking.timeSlot}</span>
                            </div>
                            <div className="flex items-center text-green-600">
                              <DollarSign className="w-4 h-4 mr-2" />
                              <span className="font-semibold">${booking.rate}</span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <span>30 minutes</span>
                            </div>
                          </div>

                          {booking.notes && (
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-start space-x-2">
                                <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">Notes:</p>
                                  <p className="text-sm text-muted-foreground">{booking.notes}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.open(`mailto:${booking.interviewerEmail}`, '_blank');
                              }}
                            >
                              Contact
                            </Button>
                            {booking.meetingLink ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  window.open(booking.meetingLink, '_blank');
                                }}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Join Meeting
                              </Button>
                            ) : (
                              <Button size="sm" disabled>
                                Meeting Link Pending
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Interviews */}
              {pastBookings.length > 0 && (
                <div>
                  {upcomingBookings.length > 0 && <Separator className="my-8" />}
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-muted-foreground" />
                    Past Interviews ({pastBookings.length})
                  </h3>
                  <div className="grid gap-4">
                    {pastBookings.map((booking) => (
                      <Card key={booking.id} className="opacity-75">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-br from-gray-600 to-gray-500 text-white font-semibold">
                                  {getInitials(booking.interviewerName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-base">{booking.interviewerName}</CardTitle>
                                <CardDescription>
                                  {format(new Date(booking.date), 'MMM dd, yyyy')} at {booking.timeSlot}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;