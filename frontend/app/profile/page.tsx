"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { api } from "../lib/api";
import toast from "react-hot-toast";
import { useState } from "react";
import { AuthGate } from "../components/AuthGate";
import { useAppDispatch } from "../store/hooks";
import { fetchMe, logoutUser } from "../store/authSlice";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

const schema = z.object({
  username: z.string().min(3).max(32).optional(),
  status: z.string().max(120).optional()
});

type FormValues = z.infer<typeof schema>;

export default function ProfilePage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: user?.username ?? "",
      status: user?.status ?? ""
    }
  });

  const onSubmit = async (values: FormValues) => {
    await api.patch("/users/profile", values);
    toast.success("Profile updated");
    dispatch(fetchMe());
  };

  const onAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      await api.post("/users/avatar", { avatarUrl: data.url });
      toast.success("Avatar updated");
      dispatch(fetchMe());
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    const result = await dispatch(logoutUser());
    setLoggingOut(false);

    if (logoutUser.fulfilled.match(result)) {
      toast.success("Signed out");
      router.push("/login");
    } else {
      toast.error("Logout failed");
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-[#eae6df] px-6 py-10">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
          <p className="mt-2 text-sm text-slate-500">Manage your account details.</p>

          <div className="mt-6 flex items-center gap-4">
            <img
              src={user?.avatarUrl ?? "https://i.pravatar.cc/100?img=32"}
              alt={user?.username ?? "User"}
              className="h-16 w-16 rounded-full"
            />
            <label className="cursor-pointer rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">
              {uploading ? "Uploading..." : "Change avatar"}
              <input type="file" className="hidden" onChange={onAvatarChange} />
            </label>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Username</label>
              <input
                {...register("username")}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="yourname"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Status</label>
              <input
                {...register("status")}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Hey there! I am using WhatsApp"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Save changes
            </button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
