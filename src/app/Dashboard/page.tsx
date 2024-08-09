import { getServerSession } from "next-auth";
import Profile from "../components/Profile";
import { authConfig } from "@/lib/auth";
import db from "@/app/db";
import { error } from "console";
import { useMediaQuery } from "../api/hooks/useMediaQuery";

const UserBalance = async () => {
  const session = await getServerSession(authConfig);

  const UsersolWallet = await db.solWallet.findFirst({
    where: {
      userId: session?.user?.uid,
    },
    select: {
      publicKey: true,
    },
  });
  if (!UsersolWallet) {
    return;
    {
      error: " No Wallet found";
    }
  }

  return { error: null, UsersolWallet };
};

export default async function () {
  const userwallet = await UserBalance();
  if (userwallet?.error || !userwallet?.UsersolWallet.publicKey) {
    return <>No solana wallet found</>;
  }

  return (
    <div className='flex justify-center align-middle items-center p-10'>
      <Profile publicKey={userwallet.UsersolWallet.publicKey} />
    </div>
  );
}
