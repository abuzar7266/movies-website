import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";

interface LoginRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
}

export default function LoginRequiredDialog({ open, onOpenChange, message }: LoginRequiredDialogProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = `${location.pathname}${location.search || ""}`;
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
          <Button onClick={() => navigate(`/login?redirect=${encodeURIComponent(redirect)}`)}>Go to Login</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
