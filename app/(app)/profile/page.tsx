import { format } from "date-fns";
import { AvatarUpload } from "@/components/profiles/avatar-upload";
import { NotificationPreferences } from "@/components/profiles/notification-preferences";
import { PositionPreferences } from "@/components/profiles/position-preferences";
import { ProfileForm } from "@/components/profiles/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserRole } from "@/lib/auth/roles";
import { getOwnPositionSkills, getOwnProfile } from "@/lib/profiles/queries";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { memberId } = await getUserRole(supabase);
  const [profile, positionSkills] = await Promise.all([
    getOwnProfile(),
    getOwnPositionSkills(),
  ]);

  if (!profile || !memberId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          Unable to load profile. Please try again later.
        </p>
      </div>
    );
  }

  const profileData = profile.member_profiles;
  const joinDate = profileData?.joined_serving_at ?? profile.created_at ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">{profile.full_name}</p>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="notifications">Notification Settings</TabsTrigger>
          <TabsTrigger value="positions">Positions & Skills</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <div className="grid gap-6 md:grid-cols-[240px_1fr]">
            <AvatarUpload
              currentAvatarUrl={profileData?.avatar_url ?? null}
              memberId={memberId}
              fullName={profile.full_name}
            />
            <ProfileForm
              initialData={{
                full_name: profile.full_name,
                email: profile.email,
                phone: profile.phone ?? "",
                emergency_contact_name:
                  profile.emergency_contact_name ?? "",
                emergency_contact_phone:
                  profile.emergency_contact_phone ?? "",
                birthdate: profile.birthdate ?? "",
              }}
              memberId={memberId}
            />
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationPreferences
            initialPreferences={{
              notify_email: profileData?.notify_email ?? true,
              notify_assignment_changes:
                profileData?.notify_assignment_changes ?? true,
              reminder_days_before: profileData?.reminder_days_before ?? 2,
            }}
          />
        </TabsContent>

        <TabsContent value="positions" className="mt-6">
          <PositionPreferences positions={positionSkills} />
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Joined Serving
                </p>
                <p className="text-sm">
                  {joinDate
                    ? format(new Date(joinDate), "MMMM d, yyyy")
                    : "Not recorded"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Email
                </p>
                <p className="text-sm">{profile.email}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
