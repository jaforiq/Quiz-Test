import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { showToast } from "@/services/showToast";
import { resetPassword } from "@/services/userServices";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const uid = params.get("uid") ?? "";
  const token = params.get("token") ?? "";
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw1 !== pw2) { showToast("Reset", "Passwords do not match", "error"); return; }
    try {
      await resetPassword({ uid, token, newPassword: pw1 });
      showToast("Reset", "Password updated. Please log in.", "success");
      navigate("/login");
    } catch (err: any) {
      showToast("Reset", err?.response?.data?.message ?? "Reset failed", "error");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center">Reset Password</h2>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>New password</Label>
            <Input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Confirm password</Label>
            <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full">Reset</Button>
        </form>
      </div>
    </div>
  );
}
