import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useNavigate, useParams } from "react-router-dom";

/* ============================================================
   Helper: Role Badge UI
============================================================ */
function getRoleBadge(role) {
  const base = "px-2 py-0.5 rounded-md text-xs text-white";

  const styles = {
    head: "bg-purple-500",
    admin: "bg-red-500",
    advisor: "bg-blue-500",
    member: "bg-gray-500",
  };

  const labels = {
    head: "Head",
    admin: "Admin",
    advisor: "Advisor",
    member: "Member",
  };

  return (
    <span className={`${base} ${styles[role] || styles.member}`}>
      {labels[role] || labels.member}
    </span>
  );
}


export default function OrganizationMembers() {
  const { orgId } = useParams();
  const [members, setMembers] = useState([]);
  const [orgName, setOrgName] = useState("");
  const navigate = useNavigate();

  /* ============================================================
     Load organization name
  ============================================================ */
  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/organizations`)
      .then((res) => {
        const found = res.data.find((o) => o.id === Number(orgId));
        if (found) setOrgName(found.title);
      })
      .catch(() => {});
  }, [orgId]);

  /* ============================================================
     Load members for this organization
  ============================================================ */
useEffect(() => {
  axios
    .get(`http://localhost:5000/api/organizations/${orgId}/members`)
    .then((res) => {
      console.log("MEMBER LIST 👉", res.data);
      setMembers(res.data);
    })
    .catch(() => {});
}, [orgId]);
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      {/* ORG NAME */}
      <h1 className="text-2xl font-bold">
        {orgName ? `${orgName} — Members` : "Organization Members"}
      </h1>

      {members.length === 0 && (
        <p className="text-muted-foreground">No members yet.</p>
      )}

      {members.map((m) => (
        <Card
          key={m.user_id}
          className="cursor-pointer hover:shadow-md transition"
          onClick={() => navigate(`/user/${m.user_id}`)}
        >
          <CardContent className="p-4 flex justify-between items-center">

            {/* LEFT SIDE */}
            <div className="space-y-1">

              <div className="flex items-center gap-3">
                <p className="font-semibold">
                  {m.first_name} {m.last_name}
                </p>

                {/* IMPORTANT: org_role */}
                {getRoleBadge(m.org_role)}
              </div>

              <p className="text-sm text-gray-600">{m.email}</p>
            </div>

            {/* BUTTON */}
            <Button size="sm">View Profile</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
