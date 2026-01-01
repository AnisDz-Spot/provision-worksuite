"use client";
import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Check, X, Clock, Mail } from "lucide-react";
import { useToaster } from "@/components/ui/Toaster";

interface MemberAcceptanceStatusProps {
  projectId: string;
}

type MemberStatus = {
  userId: number;
  userName: string;
  userEmail: string;
  role: string;
  joinedAt: string;
  invitationAcceptedAt: string | null;
  invitedBy: number | null;
  inviterName: string | null;
};

export function MemberAcceptanceStatus({
  projectId,
}: MemberAcceptanceStatusProps) {
  const { show } = useToaster();
  const [members, setMembers] = React.useState<MemberStatus[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchMemberStatus();
  }, [projectId]);

  const fetchMemberStatus = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/member-status`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Failed to fetch member status:", error);
      show("error", "Failed to load member status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (member: MemberStatus) => {
    if (member.invitationAcceptedAt) {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <Check className="w-3 h-3" />
          Accepted
        </Badge>
      );
    }
    return (
      <Badge variant="warning" className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Pending
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Loading member status...</p>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">No members added yet.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Member Invitation Status</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-sm">
                Member
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm">Role</th>
              <th className="text-left py-3 px-4 font-medium text-sm">
                Invited By
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm">
                Joined Date
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm">
                Acceptance Date
              </th>
              <th className="text-left py-3 px-4 font-medium text-sm">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.userId} className="border-b border-border">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-sm">{member.userName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {member.userEmail}
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Badge variant="secondary" className="capitalize">
                    {member.role}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-sm">
                  {member.inviterName || "-"}
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {formatDate(member.joinedAt)}
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {formatDate(member.invitationAcceptedAt)}
                </td>
                <td className="py-3 px-4">{getStatusBadge(member)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
