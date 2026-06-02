"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppDispatch } from "../store/hooks";
import { loginUser } from "../store/authSlice";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

const schema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(6)
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values: FormValues) => {
    const result = await dispatch(loginUser(values));
    if (loginUser.fulfilled.match(result)) {
      toast.success("Welcome back!");
      router.push("/");
    } else {
      toast.error("Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eae6df] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Use email or username to continue.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email or username</label>
            <input
              {...register("identifier")}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="you@example.com"
            />
            {errors.identifier ? (
              <p className="mt-1 text-xs text-rose-500">{errors.identifier.message}</p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              {...register("password")}
              type="password"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="••••••••"
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
            ) : null}
            Sign in
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link className="font-semibold text-emerald-600" href="/register">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
