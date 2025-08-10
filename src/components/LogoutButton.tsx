import { Button } from "@/components/ui/button";
import { logout } from "@/services/userServices";
import { tokenStorage } from "@/services/api";
import { useDispatch } from "react-redux";
import { logout as logoutAction } from "@/features/user/userSlice";
import { useNavigate } from "react-router-dom";
import { showToast } from "@/services/showToast";

export default function LogoutButton() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onClick = async () => {
    try {
      await logout();
    } finally {
      tokenStorage.clear();
      dispatch(logoutAction());
      showToast("Logout", "Logged out", "success");
      navigate("/login");
    }
  };

  return <Button variant="outline" onClick={onClick}>Logout</Button>;
}
