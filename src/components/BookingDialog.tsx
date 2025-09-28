import { useState } from "react";
import { Calendar, Clock, DollarSign, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, parse } from "date-fns";

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

interface BookingDialogProps {
  interviewer: Interviewer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingSuccess: () => void;
}

const BookingDialog = ({ interviewer, open, onOpenChange, onBookingSuccess }: BookingDialogProps) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleBooking = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to book an interview",
        variant: "destructive"
      });
      return;
    }

    if (!selectedDate || !selectedTimeSlot) {
      toast({
        title: "Error",
        description: "Please select both date and time slot",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        interviewerId: interviewer.userId, // Use the userId of the interviewer for security rules
        interviewerName: interviewer.profile.fullName,
        interviewerEmail: interviewer.profile.companyEmail,
        userId: currentUser.uid, // This should match the field name in Firestore rules
        clientEmail: currentUser.email,
        clientName: currentUser.displayName || "Unknown User",
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        rate: interviewer.interviewerProfile.rate,
        notes: notes,
        status: "scheduled",
        createdAt: new Date().toISOString(),
        meetingLink: "", // Will be generated later
      };

      console.log("Creating booking with data:", bookingData);
      await addDoc(collection(db, "bookings"), bookingData);

      toast({
        title: "Booking Confirmed!",
        description: `Your interview with ${interviewer.profile.fullName} has been scheduled for ${format(new Date(selectedDate), 'MMM dd, yyyy')} at ${selectedTimeSlot}`,
      });

      onOpenChange(false);
      onBookingSuccess();

      // Reset form
      setSelectedDate("");
      setSelectedTimeSlot("");
      setNotes("");
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book Interview</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Interviewer Info */}
          <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
            <Avatar className="w-12 h-12">
              {interviewer.profile.profilePicture && (
                <AvatarImage src={interviewer.profile.profilePicture} alt={interviewer.profile.fullName} />
              )}
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                {getInitials(interviewer.profile.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{interviewer.profile.fullName}</h3>
              <p className="text-sm text-muted-foreground">{interviewer.profile.currentCompany}</p>
              <div className="flex items-center mt-1">
                <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                <span className="text-sm font-medium text-green-600">${interviewer.interviewerProfile.rate}/30min</span>
              </div>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an available date" />
              </SelectTrigger>
              <SelectContent>
                {interviewer.interviewerProfile.availability.dates.map((date) => (
                  <SelectItem key={date} value={date}>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(new Date(date), 'EEEE, MMM dd, yyyy')}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Slot Selection */}
          <div className="space-y-2">
            <Label>Select Time Slot</Label>
            <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a time slot" />
              </SelectTrigger>
              <SelectContent>
                {interviewer.interviewerProfile.availability.timeSlots.map((timeSlot) => (
                  <SelectItem key={timeSlot} value={timeSlot}>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {timeSlot}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              placeholder="Any specific topics or areas you'd like to focus on during the interview..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Booking Summary */}
          {selectedDate && selectedTimeSlot && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg space-y-2">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Booking Summary</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-medium">{format(new Date(selectedDate), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span className="font-medium">{selectedTimeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">30 minutes</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold text-green-600">${interviewer.interviewerProfile.rate}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleBooking} disabled={loading || !selectedDate || !selectedTimeSlot} className="flex-1">
              {loading ? "Booking..." : "Confirm Booking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;