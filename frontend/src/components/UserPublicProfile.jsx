import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "./ui/card";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";   // 🔥 Needed for logged-in user

export default function UserPublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();             // logged-in user
  const [profile, setProfile] = useState(null);
  const [mutualOrgs, setMutualOrgs] = useState([]);

  // Fetch profile info
  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/user/${userId}`)
      .then((res) => setProfile(res.data))
      .catch(() => {});
  }, [userId]);

  // Fetch mutual organizations
  useEffect(() => {
    if (!user?.user_id) return;

    axios
      .get(
        `http://localhost:5000/api/organizations/mutual-orgs/${user.user_id}/${userId}`
      )
      .then((res) => setMutualOrgs(res.data))
      .catch(() => {});
  }, [user?.user_id, userId]);

  if (!profile) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h1 className="text-2xl font-bold">
            {profile.first_name} {profile.last_name}
          </h1>

          <p className="text-gray-700">
            <strong>Email:</strong> {profile.email}
          </p>

          <p className="text-gray-700">
            <strong>Bio:</strong> {profile.bio || "No bio provided"}
          </p>
        </CardContent>
      </Card>

      {/* Mutual Connections */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Mutual Organizations</h2>

          {mutualOrgs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No shared organizations.
            </p>
          ) : (
            <ul className="space-y-2">
              {mutualOrgs.map((org) => (
                <li key={org.id} className="text-gray-700">
                  • {org.title}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
