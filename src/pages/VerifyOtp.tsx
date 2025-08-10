import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { showToast } from "@/services/showToast";
import { resendOtp, verifyOtp } from "@/services/userServices";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function VerifyOtp() {
  const [params] = useSearchParams();
  const emailParam = params.get("email") ?? "";
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => setEmail(emailParam), [emailParam]);

  useEffect(() => {
    if (!cooldown) return;
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifyOtp({ email, code });
      showToast("Verify", "Email verified! Please login.", "success");
      navigate("/login");
    } catch (err: any) {
      showToast("Verify", err?.response?.data?.message ?? "Verification failed", "error");
    }
  };

  const onResend = async () => {
    try {
      await resendOtp({ email });
      showToast("OTP", "OTP resent to your email", "success");
      setCooldown(60); 
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Resend failed";
      showToast("OTP", msg, "error");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center">Verify Email</h2>
        <form onSubmit={onVerify} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div className="space-y-2">
            <Label>OTP Code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" required />
          </div>
          <Button type="submit" className="w-full">Verify</Button>
        </form>
        <Button variant="outline" className="w-full mt-2" onClick={onResend} disabled={cooldown > 0}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
        </Button>
      </div>
    </div>
  );
}
