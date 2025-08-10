import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { showToast } from "@/services/showToast";
import { forgotPassword } from "@/services/userServices";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword({ email });
      showToast("Reset", "If that email exists, we sent reset instructions.", "success");
    } catch (err: any) {
      showToast("Reset", err?.response?.data?.message ?? "Request failed", "error");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center">Forgot Password</h2>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <Button type="submit" className="w-full">Send reset link</Button>
        </form>
      </div>
    </div>
  );
}
