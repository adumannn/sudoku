import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export const dynamic = "force-dynamic";

export default function Signup() {
  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_480px_1fr] items-stretch">
      <div className="relative border-b lg:border-b-0 lg:border-r-2 border-sumi p-12 lg:p-14 flex flex-col justify-between bg-rice">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-vermillion text-bone flex items-center justify-center mincho font-bold text-base">
            箱
          </div>
          <div className="mincho font-semibold text-lg">Hako</div>
        </Link>
        <div className="my-12 lg:my-0">
          <h2 className="h-disp text-[64px] sm:text-[80px] lg:text-[96px]">
            Begin
            <br />
            today.
          </h2>
          <p className="ital text-moss text-[18px] lg:text-[22px] mt-4 leading-[1.4] max-w-[32ch]">
            One box a day. One streak. Nothing else.
          </p>
        </div>
        <p className="mono text-[10px] tracking-[0.22em] text-moss uppercase">
          — hako.app · since february
        </p>
      </div>

      <div className="px-8 lg:px-14 py-16 lg:py-24 flex flex-col justify-center bg-bone border-b lg:border-b-0 lg:border-r-2 border-sumi">
        <AuthForm mode="signup" />
        <p className="text-center text-[13px] text-moss mt-6">
          Have an account?{" "}
          <Link href="/auth/login" className="text-vermillion font-medium">
            Sign in
          </Link>
          .
        </p>
      </div>

      <div className="relative bg-bone p-12 overflow-hidden hidden lg:block">
        <div className="seal-stamp w-[88px] h-[88px] text-[48px] absolute top-12 right-12 -rotate-[7deg]">
          始
        </div>
        <p className="ital text-moss text-[16px] leading-[1.45] absolute bottom-12 left-12 right-12">
          — your first box waits. the seal lands when you finish.
        </p>
      </div>
    </main>
  );
}
