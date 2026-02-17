import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

interface LoginRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
}

export default function LoginRequiredDialog({ open, onOpenChange, message }: LoginRequiredDialogProps) {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Login required</DialogTitle>
          <DialogDescription>
            {message || "You need to be logged in to perform this action."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => navigate("/login")}>Go to Login</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
