// frontend/src/components/AllUsersPage.jsx
import { useEffect, useState } from "react";
import api from "../api/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function AllUsersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [adminUsers, setAdminUsers] = useState([]);        // flat list for admins
  const [orgGroups, setOrgGroups] = useState([]);          // [{ org, members: [] }]
  const [loading, setLoading] = useState(true);

  const isAdmin =
    user &&
    (user.role === "admin" ||
      user.role_id === 3 ||
      String(user.role_id) === "3");

  useEffect(() => {
    if (!user?.user_id) return;

    const load = async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          // Admin: see everyone (existing /all endpoint)
          const res = await api.get("/all");
          setAdminUsers(res.data || []);
        } else {
          // Student / Faculty: only see users from the same orgs
          // 1) Get all orgs (same endpoint used on OrganizationsPage)
          const orgRes = await api.get("/organizations", {
            params: { user_id: user.user_id },
          });

          const allOrgs = orgRes.data || [];

          // Only orgs this user is a member of
          const myOrgs = allOrgs.filter(
            (o) => Number(o.is_member) === 1
          );

          // 2) For each org, load its members
          const groupPromises = myOrgs.map(async (org) => {
            const membersRes = await api.get(
              `/organizations/${org.id}/members`
            );
            const members = membersRes.data || [];
            return {
              org,
              members,
            };
          });

          const groups = await Promise.all(groupPromises);

          // Sort groups by org title for consistent ordering
          groups.sort((a, b) =>
            a.org.title.localeCompare(b.org.title)
          );

          setOrgGroups(groups);
        }
      } catch (err) {
        console.error("Failed to load users by org:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.user_id, isAdmin]);

  const renderUserRow = (u, keyPrefix = "") => (
    <Link
      key={`${keyPrefix}${u.user_id}`}
      to={`/users/${u.user_id}`}
      className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 transition"
    >
      <Avatar className="h-12 w-12">
        <AvatarFallback className="bg-blue-600 text-white">
          {(u.first_name || "?").charAt(0)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-base truncate">
          {u.first_name} {u.last_name}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {u.email}
        </p>
      </div>

      <Badge variant="secondary" className="capitalize">
        {u.role || u.user_role || "user"}
      </Badge>
    </Link>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <Card>
        <CardHeader>
          <CardTitle>
            {isAdmin ? "All Users" : "Users in Your Organizations"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading && (
            <p className="text-muted-foreground text-sm">
              Loading users…
            </p>
          )}

          {!loading && isAdmin && adminUsers.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No users found.
            </p>
          )}

          {/* Admin view: flat list of everyone */}
          {!loading && isAdmin && adminUsers.length > 0 && (
            <div className="space-y-3">
              {adminUsers.map((u) => renderUserRow(u))}
            </div>
          )}

          {/* Student / Faculty view: grouped by org */}
          {!loading && !isAdmin && orgGroups.length === 0 && (
            <p className="text-muted-foreground text-sm">
              You are not a member of any organizations yet. Join an
              organization to see its members here.
            </p>
          )}

          {!loading &&
            !isAdmin &&
            orgGroups.map(({ org, members }) => (
              <div key={org.id} className="space-y-3">
                <h3 className="text-sm font-semibold">
                  {org.title}
                </h3>
                {members.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No members found for this organization.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {members.map((m) =>
                      renderUserRow(
                        {
                          ...m,
                          role: m.user_role, // from /organizations/:id/members
                        },
                        `org-${org.id}-`
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
