import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MemberProfileView } from "@/components/profiles/member-profile-view";
import { Button } from "@/components/ui/button";
import { getMemberProfile } from "@/lib/profiles/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const member = await getMemberProfile(memberId);
  return {
    title: member ? `${member.full_name} - Profile` : "Member Profile",
  };
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const member = await getMemberProfile(memberId);

  if (!member) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Back link */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/team-roster" className="gap-1.5">
            <ArrowLeft className="size-4" />
            Back to Roster
          </Link>
        </Button>
      </div>

      {/* Member profile */}
      <MemberProfileView member={member} />
    </div>
  );
}
